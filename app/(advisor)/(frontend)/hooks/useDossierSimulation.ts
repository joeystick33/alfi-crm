'use client'

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Hook pour gérer le lien simulateur ↔ dossier.
 * 
 * Quand un simulateur est ouvert depuis un dossier, l'URL contient:
 *   ?dossierId=xxx&returnUrl=/dashboard/dossiers/xxx
 * 
 * Ce hook fournit:
 *   - dossierId: l'ID du dossier source (ou null)
 *   - returnUrl: l'URL de retour vers le dossier
 *   - saveSimulationToDossier(): sauvegarde les résultats dans DossierSimulation
 *   - isFromDossier: boolean
 */

export interface SaveSimulationParams {
  simulateurType: string
  nom: string
  parametres: Record<string, unknown>
  resultats: Record<string, unknown>
  selectionne?: boolean
}

export function useDossierSimulation() {
  const searchParams = useSearchParams()

  const dossierId = useMemo(() => searchParams.get('dossierId'), [searchParams])
  const returnUrl = useMemo(() => searchParams.get('returnUrl'), [searchParams])
  const isFromDossier = !!dossierId

  const saveSimulationToDossier = useCallback(async (params: SaveSimulationParams): Promise<boolean> => {
    if (!dossierId) return false

    try {
      const response = await fetch(`/api/advisor/dossiers/${dossierId}/simulations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulateurType: params.simulateurType,
          nom: params.nom,
          parametres: params.parametres,
          resultats: params.resultats,
          selectionne: params.selectionne ?? true,
        }),
      })

      return response.ok
    } catch {
      return false
    }
  }, [dossierId])

  return {
    dossierId,
    returnUrl,
    isFromDossier,
    saveSimulationToDossier,
  }
}
