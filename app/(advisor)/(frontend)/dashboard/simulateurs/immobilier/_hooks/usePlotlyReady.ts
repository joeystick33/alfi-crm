'use client'

import { useCallback, useEffect, useState } from 'react'

export function usePlotlyReady() {
  const [plotlyReady, setPlotlyReady] = useState(false)

  useEffect(() => {
    if (plotlyReady) return
    if (typeof window === 'undefined') return

    // Import dynamique depuis npm — pas de CDN, pas de violation CSP
    import('plotly.js-dist-min').then((Plotly) => {
      ;(window as unknown as Record<string, unknown>).Plotly = Plotly.default ?? Plotly
      setPlotlyReady(true)
    }).catch(() => {
      console.error('[usePlotlyReady] Impossible de charger plotly.js-dist-min')
    })
  }, [plotlyReady])

  // Kept for API compatibility with pages that pass it to <Script onLoad>
  const handlePlotlyLoad = useCallback(() => setPlotlyReady(true), [])

  return { plotlyReady, handlePlotlyLoad }
}
