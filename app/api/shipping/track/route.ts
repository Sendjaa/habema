import { NextRequest, NextResponse } from 'next/server'
import { trackShipment } from '@/lib/rajaongkir'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { awb, courier, lastPhoneNumber } = body

    if (!awb || !courier) {
      return NextResponse.json(
        { success: false, error: 'awb dan courier wajib diisi' },
        { status: 400 }
      )
    }

    const result = await trackShipment(awb, courier, lastPhoneNumber)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('[Shipping Track]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal melacak pengiriman' },
      { status: 500 }
    )
  }
}
