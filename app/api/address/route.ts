import { NextRequest, NextResponse } from 'next/server'

// API publik emsifa untuk wilayah Indonesia
// https://github.com/emsifa/api-wilayah-indonesia
const EMSIFA_BASE = 'https://emsifa.github.io/api-wilayah-indonesia/api'

// Static fallback provinces (34 provinsi)
const staticProvinces = [
  { id: "11", name: "ACEH" }, { id: "12", name: "SUMATERA UTARA" }, { id: "13", name: "SUMATERA BARAT" },
  { id: "14", name: "RIAU" }, { id: "15", name: "JAMBI" }, { id: "16", name: "SUMATERA SELATAN" },
  { id: "17", name: "BENGKULU" }, { id: "18", name: "LAMPUNG" }, { id: "19", name: "KEPULAUAN BANGKA BELITUNG" },
  { id: "21", name: "KEPULAUAN RIAU" }, { id: "31", name: "DKI JAKARTA" }, { id: "32", name: "JAWA BARAT" },
  { id: "33", name: "JAWA TENGAH" }, { id: "34", name: "DI YOGYAKARTA" }, { id: "35", name: "JAWA TIMUR" },
  { id: "36", name: "BANTEN" }, { id: "51", name: "BALI" }, { id: "52", name: "NUSA TENGGARA BARAT" },
  { id: "53", name: "NUSA TENGGARA TIMUR" }, { id: "61", name: "KALIMANTAN BARAT" },
  { id: "62", name: "KALIMANTAN TENGAH" }, { id: "63", name: "KALIMANTAN SELATAN" },
  { id: "64", name: "KALIMANTAN TIMUR" }, { id: "65", name: "KALIMANTAN UTARA" },
  { id: "71", name: "SULAWESI UTARA" }, { id: "72", name: "SULAWESI TENGAH" },
  { id: "73", name: "SULAWESI SELATAN" }, { id: "74", name: "SULAWESI TENGGARA" },
  { id: "75", name: "GORONTALO" }, { id: "76", name: "SULAWESI BARAT" },
  { id: "81", name: "MALUKU" }, { id: "82", name: "MALUKU UTARA" },
  { id: "91", name: "PAPUA BARAT" }, { id: "92", name: "PAPUA BARAT DAYA" },
  { id: "93", name: "PAPUA SELATAN" }, { id: "94", name: "PAPUA" },
  { id: "95", name: "PAPUA TENGAH" }, { id: "96", name: "PAPUA PEGUNUNGAN" },
]

// Static fallback regencies per province code (sample: DKI Jakarta 31)
const staticRegencies: Record<string, { id: string, name: string }[]> = {
  "31": [
    { id: "3101", name: "KEPULAUAN SERIBU" }, { id: "3171", name: "JAKARTA PUSAT" },
    { id: "3172", name: "JAKARTA UTARA" }, { id: "3173", name: "JAKARTA BARAT" },
    { id: "3174", name: "JAKARTA SELATAN" }, { id: "3175", name: "JAKARTA TIMUR" },
  ],
}

// Static fallback districts per regency code (sample: Kepulauan Seribu 3101)
const staticDistricts: Record<string, { id: string, name: string }[]> = {
  "3101": [
    { id: "3101010", name: "KEPULAUAN SERIBU SELATAN" },
    { id: "3101020", name: "KEPULAUAN SERIBU UTARA" },
  ],
}

// Static fallback villages per district code (sample: Kepulauan Seribu Selatan 3101010)
const staticVillages: Record<string, { id: string, name: string }[]> = {
  "3101010": [
    { id: "3101010001", name: "PULAU TIDUNG" },
    { id: "3101010002", name: "PULAU PARI" },
    { id: "3101010003", name: "PULAU UNTUNG JAWA" },
  ],
}

// In-memory cache (per instance)
const memoryCache = {
  province: null as any[] | null,
  regency: {} as Record<string, any[]>,
  district: {} as Record<string, any[]>,
  village: {} as Record<string, any[]>,
}

// In-memory cache TTL (5 menit)
const CACHE_TTL = 5 * 60 * 1000
const cacheTimestamps: Record<string, number> = {}

function isCacheValid(key: string): boolean {
  const timestamp = cacheTimestamps[key]
  if (!timestamp) return false
  return Date.now() - timestamp < CACHE_TTL
}

function setCache(key: string, data: any) {
  const cacheKey = key
  if (key === 'province') {
    memoryCache.province = data
  } else if (key.startsWith('regency:')) {
    memoryCache.regency[cacheKey] = data
  } else if (key.startsWith('district:')) {
    memoryCache.district[cacheKey] = data
  } else if (key.startsWith('village:')) {
    memoryCache.village[cacheKey] = data
  }
  cacheTimestamps[key] = Date.now()
}

function getCache(key: string) {
  if (!isCacheValid(key)) return null
  if (key === 'province') return memoryCache.province
  if (key.startsWith('regency:')) return memoryCache.regency[key]
  if (key.startsWith('district:')) return memoryCache.district[key]
  if (key.startsWith('village:')) return memoryCache.village[key]
  return null
}

// Fetch dari emsifa API dengan timeout dan retry
async function fetchFromEmsifa(endpoint: string): Promise<any | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`${EMSIFA_BASE}/${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Habema-App/1.0',
        },
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!res.ok) {
        console.warn(`[Address API] HTTP ${res.status} for ${endpoint}`)
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
          continue
        }
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      return Array.isArray(data) ? data : null
    } catch (error) {
      if (attempt === 2) {
        console.error(`Gagal fetch ${endpoint} after retries:`, error)
        return null
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    } finally {
      clearTimeout(timeout)
    }
  }
  return null
}

// Fungsi ambil data dengan cache
async function fetchWithCache(key: string, fetchFn: () => Promise<any>, fallback?: any): Promise<any> {
  const cached = getCache(key)
  if (cached) return cached

  try {
    const data = await fetchFn()
    if (data && data.length > 0) {
      setCache(key, data)
      return data
    }
  } catch (error) {
    console.warn(`[Address API] Fetch error for ${key}:`, error)
  }

  if (fallback) {
    setCache(key, fallback)
    return fallback
  }
  return []
}

// Fungsi ambil provinsi
async function fetchProvinces(): Promise<any[]> {
  return fetchWithCache('province', () => fetchFromEmsifa('provinces.json'), staticProvinces)
}

// Fungsi untuk regency (kabupaten/kota)
async function fetchRegencies(provinceCode: string): Promise<any[]> {
  const key = `regency:${provinceCode}`
  const staticData = staticRegencies[provinceCode]
  return fetchWithCache(key, () => fetchFromEmsifa(`regencies/${provinceCode}.json`), staticData)
}

// Fungsi untuk district (kecamatan)
async function fetchDistricts(regencyCode: string): Promise<any[]> {
  const key = `district:${regencyCode}`
  const staticData = staticDistricts[regencyCode]
  return fetchWithCache(key, () => fetchFromEmsifa(`districts/${regencyCode}.json`), staticData)
}

// Fungsi untuk village (kelurahan/desa)
async function fetchVillages(districtCode: string): Promise<any[]> {
  const key = `village:${districtCode}`
  const staticData = staticVillages[districtCode]
  return fetchWithCache(key, () => fetchFromEmsifa(`villages/${districtCode}.json`), staticData)
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const parentCode = searchParams.get('parent_code')

  try {
    if (type === 'province') {
      const data = await fetchProvinces()
      return NextResponse.json({ success: true, data })
    }

    if (type === 'regency' && parentCode) {
      const data = await fetchRegencies(parentCode)
      return NextResponse.json({ success: true, data })
    }

    if (type === 'district' && parentCode) {
      const data = await fetchDistricts(parentCode)
      return NextResponse.json({ success: true, data })
    }

    if (type === 'village' && parentCode) {
      const data = await fetchVillages(parentCode)
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json(
      { success: false, error: 'Parameter tidak valid. Gunakan type=province|regency|district|village' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[Address API] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat data wilayah' },
      { status: 500 }
    )
  }
}
