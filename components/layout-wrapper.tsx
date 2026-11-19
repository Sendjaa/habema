"use client"

import { usePathname, useRouter } from 'next/navigation'
import { Header } from './navigation/header'
import { Footer } from './navigation/footer'
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useEffect, useState } from "react"

export function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Check if current page is admin page
  const isAdminPage = pathname?.startsWith('/admin')
  const isLoginPage = pathname === '/admin/login'
  
  // Admin auth state
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const client = supabase;
        if (!client) {
          if (!isLoginPage) {
            router.push("/admin/login");
          } else {
            setIsAdmin(false);
          }
          return;
        }

        const { data: { session } } = await client.auth.getSession();

        if (!session) {
          if (!isLoginPage) {
            router.push("/admin/login");
          } else {
            setIsAdmin(false);
          }
          return;
        }

        const { data: profile, error } = await client
          .from('users')
          .select('is_vendor')
          .eq('id', session.user.id)
          .single();

        if (error || !profile?.is_vendor) {
          await client.auth.signOut();
          if (!isLoginPage) {
            router.push("/admin/login");
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(true);
        }
      } catch {
        if (mounted && !isLoginPage) {
          router.push("/admin/login");
        }
      }
    };

    if (isAdminPage && !isLoginPage) {
      checkAdmin();
    } else if (isLoginPage) {
      setIsAdmin(false);
    }
  }, [pathname, isLoginPage, router]);

  if (!mounted) {
    return <div className="min-h-screen">{children}</div>
  }

  // Admin routes (including login) never show the public header/footer
  if (isAdminPage) {
    return (
      <div className="min-h-screen">
        {isLoginPage ? (
          children
        ) : isAdmin === null ? (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          </div>
        ) : isAdmin === false ? null : children}
      </div>
    )
  }

  // Show header and footer for client pages
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}