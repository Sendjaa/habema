import { NextResponse } from 'next/server'
import { revokeAdminDeviceTrust } from '@/lib/admin-trust'

/**
 * Cabut penanda perangkat terpercaya. Dipanggil saat admin keluar, supaya
 * "login tanpa OTP" tidak bertahan lebih lama dari sesi yang mengizinkannya —
 * terutama di perangkat bersama atau warnet.
 */
export async function DELETE() {
  try {
    await revokeAdminDeviceTrust()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[auth/admin-trust] DELETE gagal:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
