"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert("Cek email kamu untuk verifikasi!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else window.location.reload();
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">{isRegister ? "Daftar Akun" : "Login Member"}</h2>
      <form onSubmit={handleAuth} className="space-y-4">
        <input 
          type="email" placeholder="Email" 
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded" required
        />
        <input 
          type="password" placeholder="Password" 
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded" required
        />
        <button className="w-full bg-blue-600 text-white py-2 rounded">
          {isRegister ? "Daftar" : "Masuk"}
        </button>
      </form>
      <button 
        onClick={() => setIsRegister(!isRegister)}
        className="mt-4 text-sm text-blue-500 underline"
      >
        {isRegister ? "Sudah punya akun? Login" : "Belum punya akun? Daftar"}
      </button>
    </div>
  );
}