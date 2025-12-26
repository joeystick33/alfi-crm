'use client'

import { useState } from 'react'
import { ExportFormat } from '@/app/(advisor)/(frontend)/components/exports/ExportModal'

export interface UseExportOptions {
  exportType: 'clients' | 'patrimoine' | 'documents' | 'simulations'
  clientId?: string
  filters?: Record<string, unknown>
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
    } catch (err: unknown) {
      console.error('Erreur export:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'export'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      throw err
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * Génère un fichier Excel avec la bibliothèque xlsx
   */
  const generateExcel = async (data: Record<string, unknown>[], filename: string) => {
    try {
      const XLSX = await import('xlsx')
      
      // Créer un workbook et une worksheet
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Données')
      
      // Ajuster la largeur des colonnes
      const maxWidth = 50
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.min(maxWidth, Math.max(key.length, ...data.map(row => String(row[key] || '').length)))
      }))
      worksheet['!cols'] = colWidths
      
      // Générer le fichier Excel
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      // Télécharger
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erreur export Excel:', err)
      // Fallback sur CSV en cas d'erreur
      console.warn('Fallback sur export CSV')
      const csvData = convertToCSV(data)
      downloadFile(csvData, filename.replace('.xlsx', '.csv'), 'text/csv; charset=utf-8')
    }
  }



  /**
   * Convertit des données en CSV simple (fallback)
   */
  const convertToCSV = (data: Record<string, unknown>[]): string => {
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
