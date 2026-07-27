"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Shield } from "lucide-react";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
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
      // Validate admin email
      if (ADMIN_EMAIL && email !== ADMIN_EMAIL) {
        toast.error("Email tidak diizinkan untuk akses admin");
        setIsLoading(false);
        return;
      }

      // Validate password
      if (!password || password.length < 6) {
        toast.error("Password minimal 6 karakter");
        setIsLoading(false);
        return;
      }

      // Attempt login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email atau password salah.");
        } else {
          toast.error("Login gagal: " + error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Check if user is admin (using is_vendor as admin flag)
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('is_vendor')
          .eq('id', data.user.id)
          .maybeSingle();

        // Jika belum ada record users (PGRST116) atau permission denied,
        // coba auto-create dengan is_vendor=true
        if (profileError && (profileError.code === 'PGRST116' || profileError.code === '42501')) {
          const { error: createError } = await supabase
            .from('users')
            .insert([{
              id: data.user.id,
              email: data.user.email!,
              is_vendor: true,
              full_name: data.user.user_metadata?.full_name || 'Admin',
            }])
            .select('is_vendor')
            .single();

          if (createError) {
            toast.error("Gagal membuat profil admin: " + createError.message);
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }

          toast.success("Login berhasil!");
          router.push("/admin");
          return;
        }

        if (profileError && profileError.code !== 'PGRST116') {
          toast.error("Gagal verifikasi akses: " + profileError.message);
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        if (!profile?.is_vendor) {
          toast.error("Akses ditolak. Hanya admin yang bisa masuk.");
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }

        toast.success("Login berhasil!");
        router.push("/admin");
      }
    } catch (error: any) {
      toast.error(error.message || "Login gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (ADMIN_EMAIL && email !== ADMIN_EMAIL) {
      toast.error("Email tidak diizinkan untuk akses admin");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/login`,
      });

      if (error) {
        toast.error("Gagal mengirim reset password: " + error.message);
      } else {
        toast.success("Link reset password telah dikirim ke email Anda!");
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
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
                required
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

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isLoading ? "Masuk..." : "Masuk"}
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