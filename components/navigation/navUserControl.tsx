"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavbarUserControl() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. Cek sesi saat ini
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getSession();

    // 2. Listen perubahan auth (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Jika belum login, tampilkan tombol Login
  if (!user) {
    return (
      <Button 
        variant="outline" 
        className="hidden sm:flex ms-3 border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl font-bold" 
        asChild
      >
        <Link href="/login">Masuk</Link>
      </Button>
    );
  }

  // Jika sudah login, tampilkan icon Profile (tombol asli kamu)
  return (
    <Button
      variant="ghost"
      size="icon"
      className="hidden sm:flex text-emerald-900/70"
      asChild
    >
      <Link href="/account">
        <User className="w-[22px] h-[22px]" />
      </Link>
    </Button>
  );
}