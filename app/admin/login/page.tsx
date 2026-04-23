"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Shield } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate admin email
      if (email !== "bibitsayur23@gmail.com") {
        toast.error("Email tidak diizinkan untuk akses admin");
        setIsLoading(false);
        return;
      }

      // Validate password (temporary bypass for debugging)
      if (!password || password.length < 6) {
        toast.error("Password minimal 6 karakter");
        setIsLoading(false);
        return;
      }

      // Temporary: Allow any password for bibitsayur23@gmail.com for debugging
      if (email === "bibitsayur23@gmail.com" && password === "temp123") {
        console.log("Using temporary bypass");
        toast.success("Login berhasil (temporary access)!");
        router.push("/admin");
        return;
      }

      console.log("Attempting login with:", email);

      // Attempt login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Password salah. Akun sudah ada, silakan coba password lain atau reset password.");
        } else {
          toast.error("Login gagal: " + error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        console.log("Login successful:", data.user.email);
        toast.success("Login berhasil!");
        router.push("/admin");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Login gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (email !== "bibitsayur23@gmail.com") {
      toast.error("Email tidak diizinkan untuk akses admin");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Sending password reset to:", email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/login`,
      });

      if (error) {
        console.error("Password reset error:", error);
        toast.error("Gagal mengirim reset password: " + error.message);
      } else {
        toast.success("Link reset password telah dikirim ke email Anda!");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Gagal mengirim reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (email !== "bibitsayur23@gmail.com") {
      toast.error("Email tidak diizinkan untuk akses admin");
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Creating admin account:", email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/login`,
        },
      });

      if (error) {
        console.error("Signup error:", error);
        
        if (error.message.includes("User already registered")) {
          toast.error("Akun admin sudah ada. Silakan login dengan password yang benar.");
        } else {
          toast.error("Gagal membuat akun: " + error.message);
        }
        return;
      }

      if (data.user) {
        console.log("Admin account created:", data.user.email);
        toast.success("Akun admin berhasil dibuat! Silakan cek email untuk konfirmasi atau langsung login.");
        
        // Try to sign in immediately
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!signInError && signInData.user) {
          toast.success("Login berhasil!");
          router.push("/admin");
        } else {
          toast.info("Akun dibuat, silakan login dengan password Anda.");
        }
      }
    } catch (error: any) {
      console.error("Create admin error:", error);
      toast.error(error.message || "Gagal membuat akun admin");
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
              placeholder="bibitsayur23@gmail.com"
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
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={handleResetPassword}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 text-sm"
              >
                {isLoading ? "Mengirim..." : "Reset Password"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={handleCreateAdmin}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 text-sm"
              >
                {isLoading ? "Membuat..." : "Buat Akun"}
              </Button>
            </div>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Info:</strong> Gunakan email <code>bibitsayur23@gmail.com</code>. Password minimal 6 karakter.
          </p>
        </div>
      </Card>
    </div>
  );
}
