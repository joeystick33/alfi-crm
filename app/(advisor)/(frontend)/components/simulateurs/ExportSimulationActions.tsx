'use client'

import { useState, useCallback } from 'react'
import { FileDown, Save, Loader2 } from 'lucide-react'

interface ExportSimulationActionsProps {
  /** Titre du simulateur (ex: "Jeanbrun", "LMNP") */
  simulateurTitre: string
  /** Type de simulation pour l'API (ex: "IMMOBILIER_JEANBRUN") */
  simulationType: string
  /** Paramètres d'entrée de la simulation (affichés dans le PDF) */
  parametres: Array<{ label: string; valeur: string | number; unite?: string }>
  /** Résultats clés de la simulation */
  resultats: Array<{ label: string; valeur: string | number; unite?: string; important?: boolean }>
  /** Échéancier optionnel (tableau de projection) */
  echeancier?: Array<Record<string, any>>
  /** Alertes / avertissements */
  avertissements?: string[]
  /** Notes libres */
  notes?: string
  /** ID du client (pour sauvegarde dans le dossier) */
  clientId?: string
  /** Nom complet du client */
  clientNom?: string
  /** Prénom du client */
  clientPrenom?: string
}

/**
 * Composant réutilisable pour exporter les résultats d'une simulation en PDF
 * et/ou les sauvegarder dans le dossier du client.
 * 
 * Usage dans n'importe quel simulateur :
 * <ExportSimulationActions
 *   simulateurTitre="Jeanbrun"
 *   simulationType="IMMOBILIER_JEANBRUN"
 *   parametres={[{ label: 'Prix acquisition', valeur: 250000, unite: '€' }]}
 *   resultats={[{ label: 'Rendement net', valeur: '4.2%', important: true }]}
 *   clientId={selectedClientId}
 * />
 */
export function ExportSimulationActions({
  simulateurTitre,
  simulationType,
  parametres,
  resultats,
  echeancier,
  avertissements,
  notes,
  clientId,
  clientNom,
  clientPrenom,
}: ExportSimulationActionsProps) {
  const [exportingPdf, setExportingPdf] = useState(false)
  const [savingToFolder, setSavingToFolder] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buildSimulationPayload = useCallback(() => ({
    type: 'SIMULATION' as const,
    id: `sim-${simulationType}-${Date.now()}`,
    simulationData: {
      reference: `SIM-${simulationType}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
      date: new Date().toISOString(),
      type: 'INVESTISSEMENT' as const,
      titre: `Simulation ${simulateurTitre}`,
      client: {
        nom: clientNom || 'Client',
        prenom: clientPrenom || '',
      },
      parametres,
      resultats,
      echeancier: echeancier?.slice(0, 30).map((row, i) => ({
        periode: `Année ${i + 1}`,
        ...row,
      })),
      avertissements,
      notes: notes || `Simulation ${simulateurTitre} générée le ${new Date().toLocaleDateString('fr-FR')}`,
    },
  }), [simulateurTitre, simulationType, parametres, resultats, echeancier, avertissements, notes, clientNom, clientPrenom])

  // Export PDF direct (téléchargement)
  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true)
    setError(null)
    try {
      const payload = buildSimulationPayload()
      const response = await fetch('/api/advisor/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Erreur ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `simulation_${simulationType.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export PDF')
    } finally {
      setExportingPdf(false)
    }
  }, [buildSimulationPayload, simulationType])

  // Sauvegarder dans le dossier du client
  const handleSaveToFolder = useCallback(async () => {
    if (!clientId) {
      setError('Sélectionnez un client pour sauvegarder dans son dossier')
      return
    }
    setSavingToFolder(true)
    setError(null)
    try {
      // 1. Générer le PDF
      const payload = buildSimulationPayload()
      const pdfResponse = await fetch('/api/advisor/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!pdfResponse.ok) throw new Error('Erreur génération PDF')

      const pdfBlob = await pdfResponse.blob()

      // 2. Upload dans le dossier client
      const formData = new FormData()
      formData.append('file', pdfBlob, `simulation_${simulationType.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`)
      formData.append('category', 'SIMULATION')
      formData.append('description', `Simulation ${simulateurTitre} du ${new Date().toLocaleDateString('fr-FR')}`)

      const uploadResponse = await fetch(`/api/advisor/clients/${clientId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json().catch(() => ({}))
        throw new Error(errData.error || 'Erreur lors de la sauvegarde')
      }

      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSavingToFolder(false)
    }
  }, [clientId, buildSimulationPayload, simulationType, simulateurTitre])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {/* Bouton Export PDF */}
        <button
          onClick={handleExportPdf}
          disabled={exportingPdf}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {exportingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {exportingPdf ? 'Export en cours...' : 'Exporter PDF'}
        </button>

        {/* Bouton Sauvegarder dans dossier client */}
        <button
          onClick={handleSaveToFolder}
          disabled={savingToFolder || !clientId}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={!clientId ? 'Sélectionnez un client pour sauvegarder' : undefined}
        >
          {savingToFolder ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {savingToFolder ? 'Sauvegarde...' : savedSuccess ? '✓ Sauvegardé !' : 'Sauvegarder dans le dossier'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
      {!clientId && (
        <p className="text-xs text-gray-400">Associez un client pour activer la sauvegarde dans son dossier.</p>
      )}
    </div>
  )
}
