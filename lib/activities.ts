export type ActivitySection = 'packages' | 'gear' | 'products'

export const defaultActivitySections: ActivitySection[] = ['gear', 'products', 'packages']

export type Activity = {
  slug: string
  label: string
  blurb: string
  image?: string
  sections?: ActivitySection[]
  displayOrder: number
}

export const activities: Activity[] = [
  {
    slug: 'camping-keluarga',
    label: 'Camping Keluarga',
    blurb: 'Tenda besar, kompor, perlengkapan anak',
    displayOrder: 1,
  },
  {
    slug: 'pendakian',
    label: 'Pendakian',
    blurb: 'Carrier, jaket windbreaker, sleeping bag',
    displayOrder: 2,
  },
  {
    slug: 'private-camp',
    label: 'Private Camp',
    blurb: 'Setup ringkas untuk rombongan kecil',
    displayOrder: 3,
  },
  {
    slug: 'campervan',
    label: 'Campervan',
    blurb: 'Alat ringan untuk perjalanan darat',
    displayOrder: 4,
  },
  {
    slug: 'trail-running',
    label: 'Trail Running',
    blurb: 'Hydropack, vest, headlamp',
    displayOrder: 5,
  },
  {
    slug: 'open-trip',
    label: 'Open Trip',
    blurb: 'Peralatan standar mengikuti setiap keberangkatan',
    sections: ['packages', 'gear'],
    displayOrder: 6,
  },
]

export const activitySlugs = activities.map((a) => a.slug) as [string, ...string[]]

export const fallbackActivityImage = '/images/background_catalog_shop.jpeg'

const bySlug = new Map(activities.map((a) => [a.slug, a]))

export function activityLabel(slug: string): string {
  return bySlug.get(slug)?.label ?? slug
}

export function getActivity(slug: string): Activity | undefined {
  return bySlug.get(slug)
}

export function parseActivityParam(value: string | string[] | undefined): string[] {
  const list = Array.isArray(value) ? value : value ? [value] : []
  return list.filter((v) => bySlug.has(v))
}
