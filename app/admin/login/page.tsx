"use client"

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/lib/supabaseClient';
import { createServerSupabaseClient } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { DEV_LOCAL_AUTH } from '@/lib/dev-local-auth';
import { Turnstile } from "@marsidev/react-turnstile";
import OtpVerifyStep from "@/components/auth/otp-verify-step";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
const GENERIC_LOGIN_ERROR = "Kredensial tidak valid";
const isPasswordTooShort = (password: string) => password.length < 8;
const isPasswordTooLong = (password: string) => password.length > 72;
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const isAdminEmail = (email: string) =>
  ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email.trim().toLowerCase());

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ── OTP & Turnstile state ──
  const [turnstileToken, setTurnstileToken] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!supabase) {
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { data: profile, error } = await supabase
            .from('users')
            .select('is_vendor')
            .eq('id', session.user.id)
            .single();

          if (!error && profile?.is_vendor) {
            router.push("/admin");
          }
        }
      } catch {
        // ignore - stale session will be cleaned up by middleware
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error(GENERIC_LOGIN_ERROR);
      }

      if (!isValidEmail(email)) {
        toast.error(GENERIC_LOGIN_ERROR);
        setIsLoading(false);
        return;
      }

      if (isPasswordTooShort(password)) {
        toast.error(GENERIC_LOGIN_ERROR);
        setIsLoading(false);
        return;
      }
      if (isPasswordTooLong(password)) {
        toast.error(GENERIC_LOGIN_ERROR);
        setIsLoading(false);
        return;
      }

      if (!DEV_LOCAL_AUTH && !turnstileToken) {
        toast.error("Harap selesaikan verifikasi keamanan (Turnstile)!");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, turnstileToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(GENERIC_LOGIN_ERROR);
      }

      if (data.success && data.session) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        toast.success("Login berhasil");
        router.push("/admin");
        return;
      }

      setOtpStep(true);
      setOtpError(null);
      setTurnstileToken("");
      const code = typeof data.devOtp === 'string' ? data.devOtp : null;
      setDevOtp(code);
      toast.success(code
        ? "Email OTP gagal terkirim, kode ditampilkan di halaman ini (dev)"
        : "Kode OTP telah dikirim ke email admin");
    } catch (error: any) {
      toast.error(GENERIC_LOGIN_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = useCallback(async (otp: string) => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      if (!supabase) {
        throw new Error("Verifikasi gagal");
      }

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp, type: "login", password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Verifikasi gagal");
      }

      let sessionUser: any = null;

      if (data.passwordless && data.session) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionError) {
          throw new Error("Verifikasi gagal");
        }
        sessionUser = sessionData.user;
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          throw new Error("Verifikasi gagal");
        }
        sessionUser = signInData.user;
      }

      if (sessionUser) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('is_vendor')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (profileError && (profileError.code === 'PGRST116' || profileError.code === '42501')) {
          const { error: createError } = await supabase
            .from('users')
            .insert([{
              id: sessionUser.id,
              email: sessionUser.email!,
              is_vendor: true,
              full_name: sessionUser.user_metadata?.full_name || 'Admin',
            }])
            .select('is_vendor')
            .single();

          if (createError) {
            toast.error("Terjadi kesalahan. Silakan coba lagi.");
            await supabase.auth.signOut();
            return;
          }

          toast.success("Login berhasil!");
          router.push("/admin");
          return;
        }

          if (profileError && profileError.code !== 'PGRST116') {
            toast.error("Terjadi kesalahan. Silakan coba lagi.");
            await supabase.auth.signOut();
            return;
          }

        if (!profile?.is_vendor) {
          toast.error("Kredensial tidak valid");
          await supabase.auth.signOut();
          return;
        }

        toast.success("Login berhasil!");
        router.push("/admin");
      }
    } catch (err: any) {
      setOtpError("Verifikasi gagal");
    } finally {
      setOtpLoading(false);
    }
  }, [email, password, router]);

  const handleResendOtp = useCallback(async () => {
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, turnstileToken: "", type: "login" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error("Gagal mengirim ulang kode. Coba lagi.");
      }
      const code = typeof data.devOtp === 'string' ? data.devOtp : null;
      toast.success(code
        ? "Email OTP gagal terkirim, kode ditampilkan di halaman ini (dev)"
        : "Kode OTP telah dikirim ulang");
      setDevOtp(code);
    } catch (err: any) {
      setOtpError("Gagal mengirim ulang kode. Coba lagi.");
    }
  }, [email, password]);

  const handleOtpBack = () => {
    setOtpStep(false);
    setOtpError(null);
    setDevOtp(null);
  };

  const handleResetPassword = async () => {
    if (!isAdminEmail(email)) {
      toast.error(GENERIC_LOGIN_ERROR);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        toast.error("Terjadi kesalahan. Silakan coba lagi.");
        return;
      }

      toast.success("Jika email tersebut terdaftar, link reset password telah dikirim.");
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  if (otpStep) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Image src="/images/logo_habema_orange.svg" alt="Habema Logo" width={32} height={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Verifikasi OTP</h1>
            <p className="text-slate-600 mt-2">Masukkan kode OTP yang dikirim ke email admin</p>
          </div>
          <OtpVerifyStep
            email={email.trim()}
            type="login"
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            onBack={handleOtpBack}
            loading={otpLoading}
            error={otpError}
            devCode={devOtp}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Image src="/images/logo_habema_orange.svg" alt="Habema Logo" width={50} height={50} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
          <p className="text-slate-600 mt-2">Masuk ke dashboard admin</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email Admin
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@admin.com"
              className="w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>  

          {/* Turnstile */}
          {DEV_LOCAL_AUTH ? (
            <p className="text-center text-[11px] text-amber-600">
              Dev lokal (shim auth): Turnstile dilewati, kode OTP ditulis ke terminal.
            </p>
          ) : (
            <div className="flex justify-center">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                options={{ size: 'normal' }}
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken("")}
                onError={() => setTurnstileToken("")}
              />
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isLoading ? "Memproses..." : DEV_LOCAL_AUTH ? "Lanjut" : "Kirim OTP"}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={handleResetPassword}
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 text-sm"
            >
              {isLoading ? "Mengirim..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}