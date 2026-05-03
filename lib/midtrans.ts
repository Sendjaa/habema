import { NextRequest } from 'next/server'

// Midtrans Configuration
const isProduction = process.env.MIDTRANS_PRODUCTION === 'true'
const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
const serverKey = process.env.MIDTRANS_SERVER_KEY || ''

// Dynamic import to avoid module resolution issues
let coreApi: any = null
let snapApi: any = null

async function initializeMidtrans() {
  try {
    console.log('Initializing Midtrans with config:', {
      isProduction,
      hasServerKey: !!serverKey,
      hasClientKey: !!clientKey,
      serverKeyLength: serverKey?.length,
      clientKeyLength: clientKey?.length
    })

    const MidtransClient = await import('midtrans-client')
    
    // Create Core API instance for server-side
    coreApi = new MidtransClient.CoreApi({
      isProduction,
      serverKey,
      clientKey,
    })

    // Create Snap API instance for redirect payment
    snapApi = new MidtransClient.Snap({
      isProduction,
      serverKey,
      clientKey,
    })
    
    console.log('Midtrans initialized successfully')
    return true
  } catch (error) {
    console.error('Failed to initialize Midtrans:', error)
    console.error('Initialization error details:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      config: { isProduction, hasServerKey: !!serverKey, hasClientKey: !!clientKey }
    })
    return false
  }
}

export interface MidtransTransactionDetails {
  order_id: string
  gross_amount: number
}

export interface MidtransItemDetails {
  id: string
  name: string
  price: number
  quantity: number
  category?: string
}

export interface MidtransCustomerDetails {
  first_name: string
  last_name?: string
  email: string
  phone?: string
}

export interface MidtransTransactionRequest {
  transaction_details: MidtransTransactionDetails
  item_details: MidtransItemDetails[]
  customer_details: MidtransCustomerDetails
  enabled_payments?: string[]
  callbacks?: {
    finish: string
    error?: string
    pending?: string
  }
}

export async function createMidtransTransaction(
  transactionData: MidtransTransactionRequest
) {
  try {
    console.log('Creating Midtrans transaction with data:', {
      orderId: transactionData.transaction_details.order_id,
      amount: transactionData.transaction_details.gross_amount,
      customerEmail: transactionData.customer_details.email,
      itemCount: transactionData.item_details.length
    })

    // Initialize Midtrans if not already done
    if (!snapApi) {
      const initialized = await initializeMidtrans()
      if (!initialized) {
        throw new Error('Failed to initialize Midtrans library')
      }
    }

    const snapTransaction = await snapApi.createTransaction(transactionData)
    console.log('Midtrans transaction created successfully:', {
      token: snapTransaction.token ? 'Generated' : 'Missing',
      redirectUrl: snapTransaction.redirect_url ? 'Generated' : 'Missing'
    })
    
    return {
      success: true,
      token: snapTransaction.token,
      redirect_url: snapTransaction.redirect_url,
    }
  } catch (error) {
    console.error('Midtrans transaction error:', error)
    console.error('Transaction error details:', {
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      transactionData: {
        orderId: transactionData.transaction_details.order_id,
        amount: transactionData.transaction_details.gross_amount
      }
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function checkTransactionStatus(orderId: string) {
  try {
    // Initialize Midtrans if not already done
    if (!coreApi) {
      const initialized = await initializeMidtrans()
      if (!initialized) {
        throw new Error('Failed to initialize Midtrans library')
      }
    }

    // Try different method names for transaction status
    let status: any
    try {
      status = await coreApi.transactionStatus(orderId)
    } catch {
      try {
        status = await coreApi.transaction.status(orderId)
      } catch {
        status = await (coreApi as any).getTransactionStatus(orderId)
      }
    }
    
    return {
      success: true,
      status: status.transaction_status,
      fraud_status: status.fraud_status,
    }
  } catch (error) {
    console.error('Midtrans status check error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Helper function to format items for Midtrans
export function formatItemsForMidtrans(items: any[]): MidtransItemDetails[] {
  return items.map((item, index) => ({
    id: item.id || `item-${index}`,
    name: item.name || 'Unknown Item',
    price: item.price || 0,
    quantity: item.quantity || 1,
    category: item.category || 'Equipment',
  }))
}

// Helper function to generate unique order ID
export function generateOrderId(prefix = 'HBM'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}
