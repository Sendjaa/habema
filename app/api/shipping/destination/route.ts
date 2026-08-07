import { NextRequest, NextResponse } from 'next/server'
import { searchDestination } from '@/lib/rajaongkir'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get('q')

    if (!keyword || keyword.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Minimal 2 karakter untuk pencarian' },
        { status: 400 }
      )
    }

    const destinations = await searchDestination(keyword)

    return NextResponse.json({
      success: true,
      data: destinations,
    })
  } catch (error: any) {
    console.error('[Shipping Destination Search]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mencari lokasi' },
      { status: 500 }
    )
  }
}
