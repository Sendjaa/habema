import { NextRequest, NextResponse } from 'next/server'
import { createMidtransTransaction, generateOrderId, formatItemsForMidtrans } from '@/lib/midtrans'

// Debug environment variables
const isProduction = process.env.MIDTRANS_PRODUCTION === 'true'
const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
const serverKey = process.env.MIDTRANS_SERVER_KEY

console.log('Midtrans Config Debug:', {
  isProduction,
  hasClientKey: !!clientKey,
  hasServerKey: !!serverKey,
  clientKeyPrefix: clientKey ? clientKey.substring(0, 10) + '...' : 'none',
  serverKeyPrefix: serverKey ? serverKey.substring(0, 10) + '...' : 'none'
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customerDetails, totalPrice } = body

    // Check if Midtrans is configured - Add fallback for development
    if (!clientKey || !serverKey) {
      console.error('CRITICAL: Midtrans credentials not configured!')
      console.error('Missing environment variables:', {
        clientKey: !!clientKey,
        serverKey: !!serverKey,
        isProduction,
        envFile: '.env.local exists?'
      })
      
      // For development, provide a mock response
      if (!isProduction) {
        console.log('Development mode: Providing mock Midtrans response')
        return NextResponse.json({
          success: true,
          orderId: generateOrderId(),
          token: 'mock-token-' + Date.now(),
          redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/finish`,
          mock: true,
          message: 'Development mode - using mock payment'
        })
      }
      
      return NextResponse.json(
        { 
          error: 'Payment system not properly configured. Please contact administrator.',
          details: 'Midtrans credentials missing',
          isProduction,
          setupRequired: 'Please configure NEXT_PUBLIC_MIDTRANS_CLIENT_KEY and MIDTRANS_SERVER_KEY in .env.local'
        },
        { status: 500 }
      )
    }

    // Validate required fields
    if (!items || !customerDetails || !totalPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Creating transaction with data:', {
      itemsCount: items.length,
      totalPrice,
      customerEmail: customerDetails.email
    })

    // Generate unique order ID
    const orderId = generateOrderId()
    console.log('Generated Order ID:', orderId)

    // Format items for Midtrans
    const formattedItems = formatItemsForMidtrans(items)
    console.log('Formatted items:', formattedItems)

    // Create transaction data
    const transactionData = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalPrice,
      },
      item_details: formattedItems,
      customer_details: {
        first_name: customerDetails.firstName || 'Customer',
        last_name: customerDetails.lastName || '',
        email: customerDetails.email || 'customer@example.com',
        phone: customerDetails.phone || '',
      },
      enabled_payments: [
        'credit_card',
        'gopay',
        'shopeepay',
        'bank_transfer',
        'echannel',
        'bca_klikbca',
        'bca_klikpay',
        'bri_epay',
        'cimb_clicks',
        'danamon_online',
        'other_va',
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/finish`,
        error: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/error`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/pending`,
      },
    }

    console.log('Transaction data prepared, calling Midtrans...')
    console.log('Full transaction data:', JSON.stringify(transactionData, null, 2))

    // Create transaction with Midtrans
    const result = await createMidtransTransaction(transactionData)
    console.log('Midtrans result:', result)
    console.log('Token generated:', result.token ? 'YES' : 'NO')
    console.log('Redirect URL:', result.redirect_url)

    if (result.success) {
      return NextResponse.json({
        success: true,
        orderId,
        token: result.token,
        redirect_url: result.redirect_url,
      })
    } else {
      console.error('Midtrans transaction failed:', result.error)
      
      // CRITICAL: No fallback to mock mode - fail fast in production
      return NextResponse.json(
        { 
          error: 'Payment processing failed. Please try again or contact support.',
          details: result.error,
          orderId,
          isProduction
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API Error:', error)
    
    // Ensure we always return JSON
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
