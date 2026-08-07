const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY || ''
const RAJAONGKIR_BASE_URL = 'https://rajaongkir.komerce.id/api/v1'

export interface RajaOngkirDestination {
  id: number
  label: string
  province_name: string
  city_name: string
  district_name: string
  subdistrict_name: string
  zip_code: string
}

export interface RajaOngkirCourierCost {
  name: string
  code: string
  service: string
  description: string
  cost: number
  etd: string
}

export interface ShippingOption {
  courierCode: string
  courierName: string
  service: string
  description: string
  cost: number
  etd: string
}

export interface TrackingManifest {
  manifest_code: string
  manifest_description: string
  manifest_date: string
  manifest_time: string
  city_name: string
}

export interface TrackingResult {
  delivered: boolean
  summary: {
    courier_code: string
    courier_name: string
    waybill_number: string
    service_code: string
    waybill_date: string
    shipper_name: string
    receiver_name: string
    origin: string
    destination: string
    status: string
  }
  details: {
    waybill_number: string
    weight: string
    origin: string
    destination: string
  }
  delivery_status: {
    status: string
    pod_receiver: string
    pod_date: string
    pod_time: string
  }
  manifest: TrackingManifest[]
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${RAJAONGKIR_BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      key: RAJAONGKIR_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options?.headers,
    },
  })

  const data = await res.json()

  if (!res.ok || data.meta?.status === 'error') {
    throw new Error(data.meta?.message || `Raja Ongkir API error: ${res.status}`)
  }

  return data
}

export async function searchDestination(keyword: string): Promise<RajaOngkirDestination[]> {
  if (!RAJAONGKIR_API_KEY) {
    throw new Error('RAJAONGKIR_API_KEY belum dikonfigurasi')
  }

  const params = new URLSearchParams({
    search: keyword,
    limit: '10',
    offset: '0',
  })

  const result = await apiFetch<{ meta: any; data: RajaOngkirDestination[] }>(
    `/destination/domestic-destination?${params.toString()}`,
    { method: 'GET' }
  )

  return result.data || []
}

export async function calculateShippingCost(
  originId: number,
  destinationId: number,
  weight: number,
  couriers: string[] = ['jne', 'jnt', 'sicepat']
): Promise<ShippingOption[]> {
  if (!RAJAONGKIR_API_KEY) {
    throw new Error('RAJAONGKIR_API_KEY belum dikonfigurasi')
  }

  const params = new URLSearchParams()
  params.append('origin', String(originId))
  params.append('destination', String(destinationId))
  params.append('weight', String(weight))
  params.append('courier', couriers.join(':'))
  params.append('price', 'lowest')

  const result = await apiFetch<{ meta: any; data: RajaOngkirCourierCost[] }>(
    '/calculate/domestic-cost',
    {
      method: 'POST',
      body: params.toString(),
    }
  )

  return (result.data || []).map((item) => ({
    courierCode: item.code,
    courierName: item.name,
    service: item.service,
    description: item.description,
    cost: item.cost,
    etd: item.etd,
  }))
}

export async function trackShipment(
  awb: string,
  courier: string,
  lastPhoneNumber?: string
): Promise<TrackingResult> {
  if (!RAJAONGKIR_API_KEY) {
    throw new Error('RAJAONGKIR_API_KEY belum dikonfigurasi')
  }

  const params = new URLSearchParams()
  params.append('awb', awb)
  params.append('courier', courier)
  if (lastPhoneNumber) {
    params.append('last_phone_number', lastPhoneNumber)
  }

  const result = await apiFetch<{ meta: any; data: TrackingResult }>(
    `/track/waybill?${params.toString()}`,
    { method: 'POST' }
  )

  return result.data
}

export const COURIER_OPTIONS = [
  { code: 'jne', name: 'JNE', services: ['OKE', 'Reguler', 'Yes'] },
  { code: 'jnt', name: 'J&T Express', services: ['EZ', 'Reguler'] },
  { code: 'sicepat', name: 'SiCepat', services: ['Reguler', 'Best', 'Gokil'] },
  { code: 'tiki', name: 'TIKI', services: ['Reguler', 'ONS', 'JNE'] },
  { code: 'pos', name: 'POS Indonesia', services: ['Kilat', 'Reguler', 'Pos Instan'] },
  { code: 'anteraja', name: 'AnterAja', services: ['Reguler', 'Same Day'] },
] as const
