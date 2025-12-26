'use client'
 

import * as React from 'react'
import { useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/app/_common/components/ui/Modal'
import { Button } from '@/app/_common/components/ui/Button'


import { FileText, FileSpreadsheet, FileDown, AlertCircle } from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export interface ExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  exportType: 'clients' | 'patrimoine' | 'documents' | 'simulations'
  onExport: (format: ExportFormat) => Promise<void>
  filters?: Record<string, any>
}

const FORMAT_OPTIONS = [
  {
    value: 'csv' as ExportFormat,
    label: 'CSV',
    description: 'Fichier texte séparé par des virgules',
    icon: FileText,
  },
  {
    value: 'xlsx' as ExportFormat,
    label: 'Excel',
    description: 'Fichier Microsoft Excel',
    icon: FileSpreadsheet,
  },
  {
    value: 'pdf' as ExportFormat,
    label: 'PDF',
    description: 'Document PDF formaté',
    icon: FileDown,
  },
]

/**
 * Modal d'export avec sélection de format
 * Gère l'export CSV, Excel et PDF avec téléchargement automatique
 */
export function ExportModal({
  open,
  onOpenChange,
  title = 'Exporter les données',
  description = 'Sélectionnez le format d\'export souhaité',
  exportType,
  onExport,
  filters,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv')
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setError(null)
    setIsExporting(true)

    try {
      await onExport(selectedFormat)
      // Fermer le modal après succès
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erreur export:', err)
      setError(err.message || 'Erreur lors de l\'export')
    } finally {
      setIsExporting(false)
    }
  }

  const selectedOption = FORMAT_OPTIONS.find((opt: any) => opt.value === selectedFormat)

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-[500px]">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <ModalDescription>{description}</ModalDescription>
        </ModalHeader>

        <div className="space-y-6 py-4">
          {/* Sélection du format */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Format d'export
            </label>
            <div className="grid grid-cols-3 gap-3">
              {FORMAT_OPTIONS.map((option: any) => {
                const Icon = option.icon
                const isSelected = selectedFormat === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedFormat(option.value)}
                    className={cn(
                      'flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all',
                      'hover:border-primary/50 hover:bg-accent/50',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-8 w-8 mb-2',
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
            {selectedOption && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedOption.description}
              </p>
            )}
          </div>

          {/* Informations sur les filtres appliqués */}
          {filters && Object.keys(filters).length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium text-foreground mb-2">
                Filtres appliqués :
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                {Object.entries(filters).map(([key, value]) => (
                  <li key={key}>
                    <span className="font-medium">{key}:</span> {String(value)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Erreur d'export</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            loading={isExporting}
            disabled={isExporting}
          >
            {isExporting ? 'Export en cours...' : 'Exporter'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
