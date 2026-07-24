'use client'

import { useEffect, useState } from 'react'
import { LoginModal } from '@/components/auth/login-modal'
import { useAuth } from '@/hooks/useAuth'

export function FirstVisitPrompt() {
  const { user, loading } = useAuth()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (loading) return
    if (user) return
    const timer = setTimeout(() => setShow(true), 1500)
    return () => clearTimeout(timer)
  }, [user, loading])

  return (
    <LoginModal
      open={show}
      onOpenChange={setShow}
    />
  )
}
