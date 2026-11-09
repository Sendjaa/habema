"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { User, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function NavbarUserControlInner() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
        }

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          if (mounted) {
            setUser(session?.user ?? null);
            setIsLoading(false);
          }
        });

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Loading state - tampilkan skeleton yang sama dengan login button
  if (isLoading) {
    return (
      <Button 
        variant="outline" 
        className="hidden sm:flex ms-3 border-forest text-forest hover:bg-forest-soft hover:text-forest rounded-xl font-bold opacity-90" 
        disabled
      >
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        <span className="opacity-0">Masuk</span>
      </Button>
    );
  }

  // Jika sudah login, tampilkan icon Profile
  if (user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="hidden sm:flex text-forest/70"
        asChild
      >
        <Link href="/account">
          <User className="w-22px h-22px" />
        </Link>
      </Button>
    );
  }

  // Default: belum login
  return (
    <Button 
      variant="outline" 
      className="hidden sm:flex ms-3 border-forest text-forest hover:bg-forest-soft hover:text-forest rounded-xl font-bold" 
      asChild
    >
      <Link href="/login">Masuk</Link>
    </Button>
  );
}

export function NavbarUserControl() {
  return (
    <Suspense 
      fallback={
        <Button 
          variant="outline" 
          className="hidden sm:flex ms-3 border-forest text-forest hover:bg-forest-soft hover:text-forest rounded-xl font-bold opacity-90" 
          disabled
        >
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span className="opacity-0">Masuk</span>
        </Button>
      }
    >
      <NavbarUserControlInner />
    </Suspense>
  );
}