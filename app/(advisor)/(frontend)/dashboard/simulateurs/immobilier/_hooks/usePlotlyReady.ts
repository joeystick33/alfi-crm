'use client'

import { useCallback, useEffect, useState } from 'react'

// Helper pour accéder à Plotly sur window de manière type-safe
function getPlotly(): unknown {
  if (typeof window === 'undefined') return undefined
  return (window as unknown as Record<string, unknown>).Plotly
}

export function usePlotlyReady() {
  const [plotlyReady, setPlotlyReady] = useState(false)

  useEffect(() => {
    if (plotlyReady) return
    if (typeof window === 'undefined') return

    if (getPlotly()) {
      setPlotlyReady(true)
      return
    }

    const intervalId = window.setInterval(() => {
      if (getPlotly()) {
        setPlotlyReady(true)
        window.clearInterval(intervalId)
      }
    }, 100)

    return () => window.clearInterval(intervalId)
  }, [plotlyReady])

  const handlePlotlyLoad = useCallback(() => setPlotlyReady(true), [])

  return { plotlyReady, handlePlotlyLoad }
}
