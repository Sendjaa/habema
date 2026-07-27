'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading }
}
