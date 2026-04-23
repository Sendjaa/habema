"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // Pastikan path shadcn sesuai
import { Mail } from "lucide-react"; // Opsional: Untuk ikon

export default function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fungsi Login/Register Email
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert("Isi semua field!");
    if (password.length < 6) return alert("Password minimal 6 karakter!");

    setLoading(true);
    try {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/booking` },
        });
        if (error) throw error;
        alert("Cek email kamu untuk konfirmasi!");
        setIsRegister(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.replace("/booking");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi OAuth Google
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/booking`,
      },
    });
    if (error) alert(error.message);
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-xl max-w-sm mx-auto border border-slate-100">
      {/* HEADER DINAMIS */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800">
          {isRegister ? "Buat Akun Baru" : "Masuk ke Habema"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {isRegister 
            ? "Lengkapi data untuk mulai menyewa alat." 
            : "Gunakan akun yang sudah terdaftar."}
        </p>
      </div>

      {/* FORM UTAMA */}
      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Email Address</label>
          <input
            type="email"
            placeholder="fito@example.com"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            required
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            required
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
            loading ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700 shadow-md"
          }`}
        >
          {loading ? "Sabar ya..." : isRegister ? "Daftar Akun" : "Masuk Sekarang"}
        </button>
      </form>

      {/* PEMBATAS (OR) */}
      <div className="relative my-6 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-slate-100"></span>
        <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Atau lewat
        </span>
      </div>

      {/* OAUTH GOOGLE */}
      <button
        onClick={handleGoogleLogin}
        className="w-full py-3 border border-slate-200 rounded-xl flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-slate-50 transition-all"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
        Lanjut dengan Google
      </button>

      {/* SWITCHER MODE */}
      <div className="mt-8 pt-6 border-t border-slate-50 text-center">
        <p className="text-sm text-slate-500">
          {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 font-bold hover:underline"
          >
            {isRegister ? "Login di sini" : "Daftar Akun"}
          </button>
        </p>
      </div>
    </div>
  );
}