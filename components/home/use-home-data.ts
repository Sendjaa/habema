'use client'

import { useOptimizedFetch } from '@/lib/optimized-fetch'
import type { HomePayload } from '@/lib/home-data'

/**
 * Tiga section homepage membaca payload yang sama. useOptimizedFetch men-dedupe
 * permintaan identik, jadi semuanya tetap satu request.
 */
export function useHomeData() {
  const { data, loading, error } = useOptimizedFetch<{
    success: boolean
    data: HomePayload
  }>('/api/home', {
    cacheTime: 5 * 60 * 1000,
    retryCount: 2,
    dedupe: true,
  })

  return { home: data?.data ?? null, loading, error }
}
