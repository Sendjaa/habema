// components/providers/google-oauth-provider.tsx
'use client'

import { GoogleOAuthProvider } from '@react-oauth/google'
import { ReactNode } from 'react'

interface GoogleOAuthProviderWrapperProps {
  children: ReactNode
  clientId: string
}

export function GoogleOAuthProviderWrapper({
  children,
  clientId,
}: GoogleOAuthProviderWrapperProps) {
  if (!clientId) {
    console.error('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID tidak ditemukan!')
    return <>{children}</>
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  )
}