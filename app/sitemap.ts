import { MetadataRoute } from 'next'
import { activities } from '@/lib/activities'

// Halaman kegiatan: satu slug per entri di lib/activities.ts, jadi daftar ini
// ikut saat kegiatannya berubah tanpa perlu query database.
const activityPages: MetadataRoute.Sitemap = activities.map((a) => ({
  url: `https://habema.biz.id/kegiatan/${a.slug}`,
  lastModified: new Date(),
  changeFrequency: 'weekly',
  priority: 0.8,
}))

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://habema.biz.id/',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...activityPages,
    {
      url: 'https://habema.biz.id/catalog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://habema.biz.id/catalog_rental',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://habema.biz.id/bundles',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://habema.biz.id/packages',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://habema.biz.id/opentrip',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://habema.biz.id/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://habema.biz.id/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://habema.biz.id/faq',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://habema.biz.id/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]
}
