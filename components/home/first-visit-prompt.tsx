'use client'

import { useEffect, useState } from 'react'
import { LoginModal } from '@/components/auth/login-modal'
import { useAuth } from '@/hooks/useAuth'

const DISMISS_KEY = 'habema-first-visit-dismissed'

/**
 * Sekali per tab: onAuthStateChange juga fires saat token direfresh, dan
 * tanpa penanda ini efeknya jalan lagi dan memunculkan ulang prompt yang
 * baru saja ditutup orang itu.
 */
export function FirstVisitPrompt() {
  const { user, loading } = useAuth()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (loading || user) return
    if (sessionStorage.getItem(DISMISS_KEY)) return
    const timer = setTimeout(() => setShow(true), 1500)
    return () => clearTimeout(timer)
  }, [user, loading])

  return (
    <LoginModal
      open={show}
      onOpenChange={(open) => {
        setShow(open)
        if (!open) sessionStorage.setItem(DISMISS_KEY, '1')
      }}
    />
  )
}
