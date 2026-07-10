import crypto from 'crypto'

// Midtrans Configuration
const isProduction = process.env.MIDTRANS_PRODUCTION === 'true'
const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
const serverKey = process.env.MIDTRANS_SERVER_KEY || ''

// Dynamic import to avoid module resolution issues
let coreApi: any = null
let snapApi: any = null

async function initializeMidtrans() {
  try {
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
    
    return true
  } catch (error) {
    console.error('Failed to initialize Midtrans library')
    return false
  }
}

/**
 * Verifikasi signature_key dari notifikasi Midtrans.
 * signature_key = sha512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(params: {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
}): boolean {
  if (!serverKey) return false
  const expected = crypto
    .createHash('sha512')
    .update(params.order_id + params.status_code + params.gross_amount + serverKey)
    .digest('hex')
  // Bandingkan dengan timing-safe compare
  const a = Buffer.from(expected)
  const b = Buffer.from(params.signature_key || '')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export const isMidtransConfigured = (): boolean => !!clientKey && !!serverKey

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
    // Initialize Midtrans if not already done
    if (!snapApi) {
      const initialized = await initializeMidtrans()
      if (!initialized) {
        throw new Error('Failed to initialize Midtrans library')
      }
    }

    const snapTransaction = await snapApi.createTransaction(transactionData)

    return {
      success: true,
      token: snapTransaction.token,
      redirect_url: snapTransaction.redirect_url,
    }
  } catch (error) {
    console.error('Midtrans transaction error:', error instanceof Error ? error.message : 'Unknown error')
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
