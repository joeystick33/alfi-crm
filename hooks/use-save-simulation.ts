'use client'

import { useState } from 'react'
import { apiCall } from '@/lib/api-client'
import { SimulationType } from '@prisma/client'

interface SaveSimulationParams {
  clientId: string
  type: SimulationType
  name: string
  description?: string
  parameters: any
  results: any
  recommendations?: any
  feasibilityScore?: number
  sharedWithClient?: boolean
}

export function useSaveSimulation() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveSimulation = async (params: SaveSimulationParams) => {
    try {
      setSaving(true)
      setError(null)

      const simulation = await apiCall('/api/simulations', {
        method: 'POST',
        body: JSON.stringify(params),
      })

      return simulation
    } catch (err: any) {
      console.error('Error saving simulation:', err)
      setError(err.message || 'Erreur lors de la sauvegarde de la simulation')
      throw err
    } finally {
      setSaving(false)
    }
  }

  return {
    saveSimulation,
    saving,
    error,
  }
}
