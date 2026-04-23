"use client";
import { useState } from "react";
// Sebaiknya pakai client yang sudah kamu buat di lib agar konsisten
import { supabase } from "@/lib/supabaseClient"; 
import { useRouter } from "next/navigation";

export default function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Awal
    if (!email || !password) {
      alert("Email dan Password harus diisi!");
      return;
    }

    if (password.length < 6) {
      alert("Password minimal 6 karakter!");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        // --- PROSES DAFTAR ---
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            // URL ini harus didaftarkan di dashboard Supabase > Auth > Redirect URLs
            emailRedirectTo: `${window.location.origin}/booking`,
          },
        });

        if (error) {
          alert(`Gagal Daftar: ${error.message}`);
        } else {
          alert("Pendaftaran berhasil! Silakan cek inbox email kamu untuk konfirmasi.");
          setIsRegister(false); // Pindahkan ke mode login setelah daftar
        }
      } else {
        // --- PROSES LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          alert(`Gagal Login: ${error.message}`);
        } else {
          // Gunakan replace agar user tidak bisa 'Back' ke halaman login lagi
          router.replace("/booking");
        }
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-xl max-w-sm mx-auto border border-slate-100">
      <h2 className="text-2xl font-black mb-6 text-slate-800">
        {isRegister ? "Buat Akun" : "Selamat Datang"}
      </h2>
      
      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Email</label>
          <input
            type="email"
            placeholder="nama@email.com"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            required
          />
        </div>
        
        <div>
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
            loading ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
          }`}
        >
          {loading ? "Memproses..." : isRegister ? "Daftar Sekarang" : "Masuk"}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 font-bold hover:underline"
          >
            {isRegister ? "Login" : "Daftar"}
          </button>
        </p>
      </div>
    </div>
  );
}