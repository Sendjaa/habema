"use client";

// Optimized fetch utility with caching, retry, and deduplication
interface FetchOptions extends RequestInit {
  retryCount?: number;
  retryDelay?: number;
  cacheTime?: number;
  dedupe?: boolean;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

class OptimizedFetch {
  private static instance: OptimizedFetch;
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();
  
  private constructor() {
    // Clean expired cache entries periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanExpiredCache(), 60000); // Clean every minute
    }
  }

  public static getInstance(): OptimizedFetch {
    if (!OptimizedFetch.instance) {
      OptimizedFetch.instance = new OptimizedFetch();
    }
    return OptimizedFetch.instance;
  }

  private generateCacheKey(url: string, options?: FetchOptions): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const cacheTime = 5 * 60 * 1000; // 5 minutes default
      if (now - entry.timestamp > cacheTime) {
        this.cache.delete(key);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(
    url: string, 
    options: FetchOptions = {}, 
    retryCount = 0
  ): Promise<Response> {
    const maxRetries = options.retryCount ?? 3;
    const retryDelay = options.retryDelay ?? 1000;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Retry on 5xx errors or network errors
      if (!response.ok && response.status >= 500 && retryCount < maxRetries) {
        await this.sleep(retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this.fetchWithRetry(url, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      if (retryCount < maxRetries) {
        await this.sleep(retryDelay * Math.pow(2, retryCount));
        return this.fetchWithRetry(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  public async fetch<T = any>(
    url: string, 
    options: FetchOptions = {}
  ): Promise<T> {
    const {
      cacheTime = 5 * 60 * 1000, // 5 minutes default
      dedupe = true,
      ...fetchOptions
    } = options;

    const cacheKey = this.generateCacheKey(url, fetchOptions);

    // Check cache first for GET requests
    if (!fetchOptions.method || fetchOptions.method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < cacheTime) {
        return cached.data;
      }
    }

    // Deduplicate identical requests
    if (dedupe) {
      const pending = this.pendingRequests.get(cacheKey);
      if (pending) {
        return pending;
      }
    }

    // Create new request promise
    const requestPromise = this.fetchWithRetry(url, fetchOptions)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache successful GET requests
        if (!fetchOptions.method || fetchOptions.method === 'GET') {
          this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
          });
        }
        
        return data;
      })
      .finally(() => {
        // Clean up pending request
        this.pendingRequests.delete(cacheKey);
      });

    // Store pending request for deduplication
    if (dedupe) {
      this.pendingRequests.set(cacheKey, requestPromise);
    }

    return requestPromise;
  }

  // Prefetch data for better UX
  public async prefetch(url: string, options: FetchOptions = {}): Promise<void> {
    // Prefetch bersifat best-effort: kegagalan tidak boleh menjadi unhandled
    // promise rejection (yang di dev memunculkan overlay Runtime Error).
    const run = () => {
      this.fetch(url, { ...options, cacheTime: 10 * 60 * 1000 }).catch((err) => {
        console.warn(`[optimizedFetch] Prefetch gagal untuk ${url}:`, err);
      });
    };

    // Use requestIdleCallback for non-critical prefetching
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(run);
    } else {
      setTimeout(run, 100);
    }
  }

  // Invalidate cache
  public invalidateCache(url?: string): void {
    if (url) {
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.includes(url)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  // Get cache stats
  public getCacheStats(): { size: number; pendingRequests: number } {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

// Export singleton instance
export const optimizedFetch = OptimizedFetch.getInstance();

// Convenience methods
export const api = {
  get: <T = any>(url: string, options?: Omit<FetchOptions, 'method'>) => 
    optimizedFetch.fetch<T>(url, { ...options, method: 'GET' }),
    
  post: <T = any>(url: string, data?: any, options?: Omit<FetchOptions, 'method' | 'body'>) => 
    optimizedFetch.fetch<T>(url, { 
      ...options, 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  put: <T = any>(url: string, data?: any, options?: Omit<FetchOptions, 'method' | 'body'>) => 
    optimizedFetch.fetch<T>(url, { 
      ...options, 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }),
    
  delete: <T = any>(url: string, options?: Omit<FetchOptions, 'method'>) => 
    optimizedFetch.fetch<T>(url, { ...options, method: 'DELETE' }),
    
  prefetch: (url: string, options?: FetchOptions) => 
    optimizedFetch.prefetch(url, options),
    
  invalidate: (url?: string) => 
    optimizedFetch.invalidateCache(url),
};

// React hook for optimized fetching
import { useState, useEffect, useCallback } from 'react';

export function useOptimizedFetch<T = any>(
  url: string | null,
  options: FetchOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const result = await optimizedFetch.fetch<T>(url, options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
