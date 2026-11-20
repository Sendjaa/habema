// OpenTrip Types - Database types for Open Trip system (ot_ prefix tables)

// Trip Category
export interface OtTripCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Trip
export interface OtTrip {
  id: string
  title: string
  slug: string
  description: string
  short_description: string | null
  destination: string
  destination_region: string | null
  pickup_location: string | null
  dropoff_location: string | null
  base_price: number
  discount_price: number
  tax_amount: number
  final_price: number
  currency: string
  duration_days: number
  duration_nights: number
  min_participants: number
  max_participants: number
  current_participants: number
  departure_date: string
  return_date: string
  departure_time: string | null
  return_time: string | null
  status: OtTripStatus
  featured: boolean
  priority: number
  category_id: string | null
  featured_image: string | null
  gallery_images: string[]
  itinerary: string | null
  highlights: string | null
  inclusions: string | null
  exclusions: string | null
  what_to_bring: string | null
  important_notes: string | null
  cancellation_policy: string | null
  refund_policy: string | null
  faq: OtTripFaqItem[]
  min_age: number | null
  max_age: number | null
  difficulty_level: OtDifficultyLevel | null
  fitness_required: boolean
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  created_by: string
  created_at: string
  updated_at: string
  published_at: string | null
  archived_at: string | null
  category?: OtTripCategory
  images?: OtTripImage[]
}

export type OtTripStatus = 'draft' | 'published' | 'archived' | 'full' | 'cancelled'
export type OtDifficultyLevel = 'easy' | 'moderate' | 'hard' | 'extreme'

export interface OtTripFaqItem {
  question: string
  answer: string
}

export interface OtTripImage {
  id: string
  trip_id: string
  image_url: string
  alt_text: string | null
  sort_order: number
  is_featured: boolean
  created_at: string
}

export interface OtTripWithRelations extends OtTrip {
  category?: OtTripCategory
  images: OtTripImage[]
  available_slots: number
  is_full: boolean
}

export interface OtTripCategory {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface OtTripFilters {
  category?: string
  status?: OtTripStatus
  featured?: boolean
  search?: string
  min_price?: number
  max_price?: number
  min_duration?: number
  max_duration?: number
  departure_after?: string
  departure_before?: string
  page?: number
  limit?: number
  sort?: 'price_asc' | 'price_desc' | 'departure_asc' | 'departure_desc' | 'popularity'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Booking Types
export interface OtBooking {
  id: string
  user_id: string
  trip_id: string
  booking_code: string
  total_participants: number
  adult_count: number
  child_count: number
  infant_count: number
  subtotal_price: number
  tax_amount: number
  discount_amount: number
  total_price: number
  currency: string
  booking_status: OtBookingStatus
  payment_status: OtPaymentStatus
  special_requests: string | null
  participant_details: OtParticipantDetail[]
  contact_person_name: string | null
  contact_person_email: string | null
  contact_person_phone: string | null
  booking_date: string
  confirmed_at: string | null
  cancelled_at: string | null
  cancelled_reason: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  trip?: {
    id: string
    title: string
    slug: string
    featured_image: string | null
    final_price: number
    departure_date: string
    return_date: string
    destination: string
  }
  user?: {
    id: string
    email: string
    full_name: string
    phone: string | null
  }
  payment?: OtPayment
}

export type OtBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded' | 'expired'
export type OtPaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'failed'

export interface OtParticipantDetail {
  name: string
  email: string
  phone: string
  id_type: 'ktp' | 'sim' | 'passport' | 'npwp'
  id_number: string
  date_of_birth?: string
  gender?: 'male' | 'female'
  special_needs?: string
}

// Payment Types
export interface OtPayment {
  id: string
  booking_id: string
  payment_method: OtPaymentMethod
  payment_provider: string | null
  transaction_id: string | null
  external_transaction_id: string | null
  amount: number
  fee_amount: number
  net_amount: number
  currency: string
  status: OtPaymentStatusType
  gateway_response: Record<string, unknown> | null
  failure_reason: string | null
  metadata: Record<string, unknown>
  idempotency_key: string | null
  initiated_at: string
  processed_at: string | null
  completed_at: string | null
  failed_at: string | null
  refunded_at: string | null
  created_at: string
  updated_at: string
}

export type OtPaymentMethod = 
  | 'credit_card' 
  | 'debit_card' 
  | 'bank_transfer' 
  | 'e_wallet' 
  | 'cash' 
  | 'midtrans' 
  | 'gopay' 
  | 'ovo' 
  | 'dana' 
  | 'shopeepay' 
  | 'qris'

export type OtPaymentStatusType = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'refunded' 
  | 'cancelled' 
  | 'expired'

// Review Types
export interface OtTripReview {
  id: string
  trip_id: string
  user_id: string
  booking_id: string | null
  rating: number
  title: string | null
  content: string
  pros: string | null
  cons: string | null
  images: string[]
  is_verified: boolean
  is_featured: boolean
  is_approved: boolean
  admin_response: string | null
  admin_response_at: string | null
  admin_response_by: string | null
  helpful_count: number
  not_helpful_count: number
  created_at: string
  updated_at: string
}

export interface OtTripFavorite {
  id: string
  user_id: string
  trip_id: string
  created_at: string
}

// API Request/Response Types
export interface CreateOtTripRequest {
  title: string
  destination: string
  description: string
  short_description?: string
  destination_region?: string
  pickup_location?: string
  dropoff_location?: string
  base_price: number
  discount_price?: number
  tax_amount?: number
  duration_days: number
  duration_nights?: number
  min_participants?: number
  max_participants: number
  departure_date: string
  return_date: string
  departure_time?: string
  return_time?: string
  category_id?: string
  featured_image?: string
  gallery_images?: string[]
  itinerary?: string
  highlights?: string
  inclusions?: string
  exclusions?: string
  what_to_bring?: string
  important_notes?: string
  cancellation_policy?: string
  refund_policy?: string
  faq?: { question: string; answer: string }[]
  min_age?: number
  max_age?: number
  difficulty_level?: 'easy' | 'moderate' | 'hard' | 'extreme'
  fitness_required?: boolean
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
}

export interface UpdateOtTripRequest extends Partial<CreateOtTripRequest> {
  status?: 'draft' | 'published' | 'archived' | 'full' | 'cancelled'
  featured?: boolean
  priority?: number
}

export interface CreateOtBookingRequest {
  trip_id: string
  total_participants: number
  adult_count?: number
  child_count?: number
  infant_count?: number
  special_requests?: string
  participant_details?: {
    name: string
    email: string
    phone: string
    id_type: 'ktp' | 'sim' | 'passport' | 'npwp'
    id_number: string
    date_of_birth?: string
    gender?: 'male' | 'female'
    special_needs?: string
  }[]
  contact_person_name?: string
  contact_person_email?: string
  contact_person_phone?: string
}

export interface UpdateOtBookingRequest {
  booking_status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded' | 'expired'
  payment_status?: 'pending' | 'partial' | 'paid' | 'refunded' | 'failed'
  special_requests?: string
  cancelled_reason?: string
}

export interface CreateOtPaymentRequest {
  booking_id: string
  payment_method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'e_wallet' | 'cash' | 'midtrans' | 'gopay' | 'ovo' | 'dana' | 'shopeepay' | 'qris'
  payment_provider?: string
  amount: number
  fee_amount?: number
  idempotency_key?: string
  metadata?: Record<string, unknown>
}

export interface OtPaymentCallbackRequest {
  transaction_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired'
  external_transaction_id?: string
  gateway_response?: Record<string, unknown>
  failure_reason?: string
  metadata?: Record<string, unknown>
}

export interface OtTripSearchParams {
  category?: string
  status?: 'draft' | 'published' | 'archived' | 'full' | 'cancelled'
  featured?: boolean
  search?: string
  min_price?: number
  max_price?: number
  min_duration?: number
  max_duration?: number
  departure_after?: string
  departure_before?: string
  page?: number
  limit?: number
  sort?: 'price_asc' | 'price_desc' | 'departure_asc' | 'departure_desc' | 'popularity'
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedApiResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Re-export admin types for convenience
export type { AdminGuardResult, AdminSession } from './admin-auth'