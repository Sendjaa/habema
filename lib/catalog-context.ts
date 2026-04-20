import { EquipmentCategory, Equipment } from './types'
import { supabase } from './supabaseClient'

// Interface untuk inventory tetap sama, tapi idealnya nanti diambil dari tabel equipment_inventory
export interface InventoryStatus {
  totalUnits: number
  availableUnits: number
  reservedUnits: number
  unavailableUnits: number
  nextAvailableDate?: Date
}

export function getInventoryStatus(
  equipmentId: string,
  pickupDate?: Date,
  returnDate?: Date
): InventoryStatus {
  const totalUnits = Math.floor(Math.random() * 10) + 3
  const unavailableUnits = Math.floor(Math.random() * 3)
  const availableUnits = totalUnits - unavailableUnits

  return {
    totalUnits,
    availableUnits,
    reservedUnits: unavailableUnits > 0 ? unavailableUnits - 1 : 0,
    unavailableUnits,
    nextAvailableDate: unavailableUnits > 0 ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : undefined,
  }
}

// PERBAIKAN: Gunakan category_id (UUID) bukannya string category
export async function getEquipmentByCategory(categoryId: string): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('category_id', categoryId)

  if (error) {
    console.error('Error fetching equipment by category:', error.message)
    return []
  }
  
  return (data as Equipment[]) || []
}

export async function searchEquipment(query: string): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)

  if (error) {
    console.error('Error searching equipment:', error.message)
    return []
  }

  return (data as Equipment[]) || []
}

// PERBAIKAN: Ganti dailyPrice menjadi price_per_night
export function filterEquipmentByPrice(
  equipment: Equipment[],
  minPrice: number,
  maxPrice: number
): Equipment[] {
  return equipment.filter(
    (eq) => eq.price_per_night >= minPrice && eq.price_per_night <= maxPrice
  )
}

export function sortEquipment(
  equipment: Equipment[],
  sortBy: 'name' | 'price-low' | 'price-high' | 'rating'
): Equipment[] {
  const sorted = [...equipment]
  switch (sortBy) {
    case 'price-low':
      return sorted.sort((a, b) => a.price_per_night - b.price_per_night)
    case 'price-high':
      return sorted.sort((a, b) => b.price_per_night - a.price_per_night)
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'rating':
    default:
      return sorted
  }
}

// PERBAIKAN: Gunakan UUID yang kita buat tadi di file CSV sebagai value
export function getCategories() {
  return [
    { value: '550e8400-e29b-41d4-a716-446655441001', label: 'Tenda' },
    { value: '550e8400-e29b-41d4-a716-446655441002', label: 'Tas Punggung' },
    { value: '550e8400-e29b-41d4-a716-446655441003', label: 'Sleeping Bag' },
    { value: '550e8400-e29b-41d4-a716-446655441004', label: 'Peralatan Masak' },
    { value: '550e8400-e29b-41d4-a716-446655441005', label: 'Climbing Gear' },
    { value: '550e8400-e29b-41d4-a716-446655441006', label: 'Penerangan' },
    { value: '550e8400-e29b-41d4-a716-446655441007', label: 'Safety' },
  ]
}

export type { Equipment }