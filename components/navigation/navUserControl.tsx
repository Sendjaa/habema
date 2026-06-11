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
        // 1. Cek sesi saat ini dengan retry
        let session = null;
        for (let i = 0; i < 3; i++) {
          const result = await supabase.auth.getSession();
          session = result.data.session;
          console.log(`[Navbar] Attempt ${i + 1}: Session found?`, !!session, session?.user?.email);
          
          if (session) break;
          if (i < 2) await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
          console.log('[Navbar] Final auth state:', session?.user ? 'logged in' : 'not logged in');
        }

        // 2. Listen perubahan auth (login/logout)
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('[Navbar] Auth state changed:', event, session?.user?.email);
          if (mounted) {
            setUser(session?.user ?? null);
            setIsLoading(false);
          }
        });

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[Navbar] Auth initialization error:', error);
        if (mounted) {
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
        className="hidden sm:flex ms-3 border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl font-bold opacity-90" 
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
        className="hidden sm:flex text-emerald-900/70"
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
      className="hidden sm:flex ms-3 border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl font-bold" 
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
          className="hidden sm:flex ms-3 border-emerald-600 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl font-bold opacity-90" 
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