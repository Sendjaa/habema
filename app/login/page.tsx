"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false); // State untuk switch mode
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      router.push("/booking");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/booking`,
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Pendaftaran berhasil! Silakan cek email kamu untuk konfirmasi.");
      setIsRegister(false); // Balikkan ke mode login
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/booking`,
      },
    });

    if (error) alert(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="p-8 w-full max-w-md shadow-xl border-none rounded-2xl bg-white">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
          {isRegister ? "Buat Akun Baru" : "Selamat Datang Kembali"}
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          {isRegister 
            ? "Daftar sekarang untuk mulai mengelola penyewaan kamu." 
            : "Login untuk akses fitur pembayaran lengkap."}
        </p>

        {/* Form deteksi mode Login atau Register */}
        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">
              Email
            </label>
            <input
              type="email"
              className="w-full h-12 px-4 rounded-xl border border-slate-200 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="nama@email.com"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">
              Password
            </label>
            <input
              type="password"
              className="w-full h-12 px-4 rounded-xl border border-slate-200 mt-1 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            className="w-full h-12 bg-slate-900 text-white font-bold rounded-xl mt-4 hover:bg-slate-800 transition-colors"
            disabled={loading}
          >
            {loading ? "Memproses..." : isRegister ? "Daftar Sekarang" : "Masuk"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200"></span>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">
              Atau lanjut dengan
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-12 border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
          onClick={signInWithGoogle}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            className="w-5 h-5"
            alt="Google"
          />
          Google
        </Button>

        {/* Link untuk switch antara Login dan Register */}
        <p className="text-center mt-8 text-sm text-slate-500">
          {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="font-bold text-emerald-600 hover:underline"
          >
            {isRegister ? "Login di sini" : "Daftar sekarang"}
          </button>
        </p>
      </Card>
    </div>
  );
}