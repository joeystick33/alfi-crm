'use client'

import { useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, CheckCircle2 } from 'lucide-react'

/**
 * Bandeau affiché en haut d'un simulateur quand il est ouvert depuis un dossier.
 * Fournit un bouton "Enregistrer dans le dossier" + "Retour au dossier".
 * 
 * Usage dans n'importe quel simulateur :
 *   <DossierSimulationBanner
 *     simulateurType="SUCCESSION"
 *     getSimulationData={() => ({ nom: "...", parametres: {...}, resultats: {...} })}
 *   />
 */

interface DossierSimulationBannerProps {
  simulateurType: string
  getSimulationData: () => {
    nom: string
    parametres: Record<string, unknown>
    resultats: Record<string, unknown>
  } | null
}

export function DossierSimulationBanner({ simulateurType, getSimulationData }: DossierSimulationBannerProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dossierId = searchParams.get('dossierId')
  const returnUrl = searchParams.get('returnUrl')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    if (!dossierId) return
    const data = getSimulationData()
    if (!data) return

    setSaving(true)
    try {
      const response = await fetch(`/api/advisor/dossiers/${dossierId}/simulations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulateurType,
          nom: data.nom,
          parametres: data.parametres,
          resultats: data.resultats,
          selectionne: true,
        }),
      })
      if (response.ok) setSaved(true)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }, [dossierId, simulateurType, getSimulationData])

  if (!dossierId) return null

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between gap-4 shadow-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {returnUrl && (
          <button
            onClick={() => router.push(returnUrl)}
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dossier
          </button>
        )}
        <span className="text-white/60">|</span>
        <span className="text-sm font-medium">Simulation liée au dossier</span>
      </div>
      <div>
        {saved ? (
          <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Enregistré dans le dossier
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-white text-blue-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement...' : 'Enregistrer dans le dossier'}
          </button>
        )}
      </div>
    </div>
  )
}
