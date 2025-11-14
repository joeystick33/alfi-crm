'use client'

import { useState } from 'react'
import { ExportFormat } from '@/components/exports/ExportModal'

export interface UseExportOptions {
  exportType: 'clients' | 'patrimoine' | 'documents' | 'simulations'
  clientId?: string
  filters?: Record<string, any>
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Hook pour gérer les exports avec téléchargement automatique
 */
export function useExport({
  exportType,
  clientId,
  filters = {},
  onSuccess,
  onError,
}: UseExportOptions) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Télécharge un fichier depuis une URL ou un Blob
   */
  const downloadFile = (data: Blob | string, filename: string, mimeType: string) => {
    const blob = typeof data === 'string' ? new Blob([data], { type: mimeType }) : data
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * Construit l'URL de l'API d'export avec les paramètres
   */
  const buildExportUrl = (format: ExportFormat): string => {
    const params = new URLSearchParams()

    // Pour PDF, utiliser les routes spécifiques
    if (format === 'pdf') {
      // Ajouter clientId si nécessaire
      if (clientId) {
        params.set('clientId', clientId)
      }
      
      // Ajouter locale (français par défaut)
      params.set('locale', 'fr')

      return `/api/exports/pdf/${exportType}?${params.toString()}`
    }

    // Pour CSV et Excel, utiliser les routes existantes
    params.set('format', format)

    // Ajouter clientId si nécessaire
    if (clientId) {
      params.set('clientId', clientId)
    }

    // Ajouter les filtres
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value))
      }
    })

    return `/api/exports/${exportType}?${params.toString()}`
  }

  /**
   * Exécute l'export et télécharge le fichier
   */
  const executeExport = async (format: ExportFormat) => {
    setError(null)
    setIsExporting(true)

    try {
      const url = buildExportUrl(format)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`)
      }

      // Pour CSV, télécharger directement
      if (format === 'csv') {
        const csvText = await response.text()
        const filename =
          response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
          `export_${exportType}_${new Date().toISOString().split('T')[0]}.csv`

        downloadFile(csvText, filename, 'text/csv; charset=utf-8')
      } else if (format === 'pdf') {
        // Pour PDF, télécharger le blob directement
        const pdfBlob = await response.blob()
        const filename =
          response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
          `export_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`

        downloadFile(pdfBlob, filename, 'application/pdf')
      } else {
        // Pour Excel, récupérer les données JSON
        const data = await response.json()
        await generateExcel(data.data, data.filename)
      }

      onSuccess?.()
    } catch (err: any) {
      console.error('Erreur export:', err)
      setError(err.message || 'Erreur lors de l\'export')
      onError?.(err)
      throw err
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * Génère un fichier Excel (placeholder - nécessite xlsx library)
   */
  const generateExcel = async (data: any, filename: string) => {
    // TODO: Implémenter avec la bibliothèque xlsx
    // Pour l'instant, fallback sur CSV
    console.warn('Export Excel non encore implémenté, utilisation de CSV')
    const csvData = convertToCSV(data)
    downloadFile(csvData, filename.replace('.xlsx', '.csv'), 'text/csv; charset=utf-8')
  }



  /**
   * Convertit des données en CSV simple (fallback)
   */
  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(';'),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header]
          const escaped = String(value ?? '').replace(/"/g, '""')
          return `"${escaped}"`
        }).join(';')
      ),
    ]

    return csvRows.join('\n')
  }

  return {
    executeExport,
    isExporting,
    error,
  }
}
