import { redirect } from 'next/navigation'
import ResetPasswordForm from './reset-password-form'

export const dynamic = 'force-dynamic'

type AuthPageProps = {
  searchParams: Promise<{
    ref?: string
    code?: string
    token_hash?: string
    type?: string
  }>
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { ref, code, token_hash, type } = await searchParams
  const isRecovery = type === 'recovery' && Boolean(code || token_hash)

  // Link referral (/auth?ref=...) harus membuka alur pendaftaran,
  // bukan halaman reset password.
  if (ref && !isRecovery) {
    redirect(`/register?ref=${encodeURIComponent(ref)}`)
  }

  return <ResetPasswordForm />
}
