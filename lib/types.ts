// ============ Equipment Types ============
export type EquipmentCategory = 
  | 'tents'
  | 'sleeping-bags'
  | 'backpacks'
  | 'cooking'
  | 'climbing'
  | 'lighting'
  | 'accessories'

export type MountainDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface Equipment {
  category_id: string
  category: any
  price_per_night: number
  id: string
  name: string
  equipment_category? : {name: string}; // Tambahan untuk join dengan kategori
  description: string
  price: number
  dailyPrice: number
  image: string
  capacity?: string
  weight?: string
  condition?: 'excellent' | 'good' | 'fair'
  recommended_mountains?: MountainDifficulty[]
  tags?: string[]
}

export interface EquipmentInventory extends Equipment {
  totalUnits: number
  availableUnits: number
  lastMaintenanceDate?: string
  nextMaintenanceDate?: string
  serialNumbers?: string[]
}

// ============ Bundle Types ============
export interface Bundle {
  id: string
  name: string
  description: string
  icon: string
  discount: number // percentage
  items: {
    equipmentId: string
    quantity: number
  }[]
  originalPrice: number
  bundlePrice: number
  category: 'beginner' | 'experienced' | 'professional'
}

// ============ Booking Types ============
export interface BookingItem {
  equipmentId: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export type BookingStatus = 
  | 'pending'
  | 'confirmed'
  | 'ready-for-pickup'
  | 'rented-out'
  | 'returned'
  | 'completed'
  | 'cancelled'

export interface Booking {
  id: string
  userId: string
  items: BookingItem[]
  pickupDate: Date
  returnDate: Date
  totalDays: number
  subtotal: number
  depositAmount: number
  totalPrice: number
  status: BookingStatus
  createdAt: Date
  updatedAt: Date
  notes?: string
}

// ============ User Types ============
export type UserRole = 'customer' | 'vendor' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  phone: string
  role: UserRole
  idVerified: boolean
  identityDocument?: {
    type: 'ktp' | 'sim'
    number: string
    uploadedAt: Date
  }
  createdAt: Date
}

// ============ Rental Condition Types ============
export interface RentalCondition {
  id: string
  equipment: string
  checklist: {
    item: string
    critical: boolean
  }[]
  damageReport?: {
    description: string
    photos?: string[]
    estimatedRepairCost?: number
  }
  approvedBy: string
  approvedAt: Date
}

// ============ Deposit Types ============
export type DepositStatus = 'held' | 'released' | 'forfeited'

export interface Deposit {
  id: string
  bookingId: string
  amount: number
  status: DepositStatus
  heldAt: Date
  releasedAt?: Date
  reason?: string
}

// ============ Notification Types ============
export type NotificationType = 
  | 'booking_confirmed'
  | 'pickup_reminder'
  | 'return_reminder'
  | 'return_completed'
  | 'deposit_released'
  | 'damage_report'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: Date
}
