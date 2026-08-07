import { NextRequest, NextResponse } from 'next/server'
import { calculateShippingCost } from '@/lib/rajaongkir'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { originId, destinationId, weight, couriers } = body

    if (!originId || !destinationId || !weight) {
      return NextResponse.json(
        {
          success: false,
          error: 'originId, destinationId, dan weight wajib diisi',
        },
        { status: 400 }
      )
    }

    const options = await calculateShippingCost(
      Number(originId),
      Number(destinationId),
      Number(weight),
      couriers
    )

    return NextResponse.json({
      success: true,
      data: options,
    })
  } catch (error: any) {
    console.error('[Shipping Cost]', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghitung ongkir' },
      { status: 500 }
    )
  }
}
