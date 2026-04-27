'use client'

import { useEffect } from 'react'

export function CssLoader() {
  useEffect(() => {
    // Load CSS asynchronously after initial render
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = '/globals.css'
    link.media = 'print'
    link.onload = () => {
      link.media = 'all'
    }
    document.head.appendChild(link)
  }, [])

  return null
}
