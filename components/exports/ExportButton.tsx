'use client'

import * as React from 'react'
import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, FileDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import { ExportModal, ExportFormat } from './ExportModal'
import { useExport } from '@/hooks/use-export'
import { cn } from '@/lib/utils'

export interface ExportButtonProps {
  /**
   * Type de données à exporter
   */
  exportType: 'clients' | 'patrimoine' | 'documents' | 'simulations'
  
  /**
   * ID du client (requis pour patrimoine, documents, simulations)
   */
  clientId?: string
  
  /**
   * Filtres à appliquer à l'export
   */
  filters?: Record<string, any>
  
  /**
   * Texte du bouton
   */
  label?: string
  
  /**
   * Variante du bouton
   */
  variant?: 'default' | 'outline' | 'ghost' | 'primary'
  
  /**
   * Taille du bouton
   */
  size?: 'sm' | 'md' | 'lg'
  
  /**
   * Classes CSS additionnelles
   */
  className?: string
  
  /**
   * Afficher le menu déroulant pour choisir le format
   */
  showDropdown?: boolean
  
  /**
   * Format par défaut si pas de dropdown
   */
  defaultFormat?: ExportFormat
  
  /**
   * Callback après succès
   */
  onSuccess?: () => void
  
  /**
   * Callback en cas d'erreur
   */
  onError?: (error: Error) => void
}

const FORMAT_ICONS = {
  csv: FileText,
  xlsx: FileSpreadsheet,
  pdf: FileDown,
}

/**
 * Bouton d'export avec support multi-format
 * Peut afficher un menu déroulant ou un modal selon la configuration
 */
export function ExportButton({
  exportType,
  clientId,
  filters,
  label = 'Exporter',
  variant = 'outline',
  size = 'md',
  className,
  showDropdown = true,
  defaultFormat = 'csv',
  onSuccess,
  onError,
}: ExportButtonProps) {
  const [showModal, setShowModal] = useState(false)
  
  const { executeExport, isExporting, error } = useExport({
    exportType,
    clientId,
    filters,
    onSuccess,
    onError,
  })

  const handleExport = async (format: ExportFormat) => {
    try {
      await executeExport(format)
    } catch (err) {
      // L'erreur est déjà gérée par le hook
      console.error('Export error:', err)
    }
  }

  // Si pas de dropdown, bouton simple avec format par défaut
  if (!showDropdown) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(defaultFormat)}
        disabled={isExporting}
        loading={isExporting}
        className={cn('gap-2', className)}
      >
        <Download className="h-4 w-4" />
        {isExporting ? 'Export en cours...' : label}
      </Button>
    )
  }

  // Avec dropdown pour choisir le format
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isExporting}
            loading={isExporting}
            className={cn('gap-2', className)}
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Export en cours...' : label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleExport('csv')}>
            <FileText className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">CSV</span>
              <span className="text-xs text-muted-foreground">
                Fichier texte
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleExport('xlsx')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">Excel</span>
              <span className="text-xs text-muted-foreground">
                Fichier .xlsx
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleExport('pdf')}>
            <FileDown className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span className="font-medium">PDF</span>
              <span className="text-xs text-muted-foreground">
                Document formaté
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Afficher les erreurs */}
      {error && (
        <div className="mt-2 text-sm text-destructive">
          {error}
        </div>
      )}
    </>
  )
}

/**
 * Bouton d'export avec modal pour plus d'options
 */
export function ExportButtonWithModal({
  exportType,
  clientId,
  filters,
  label = 'Exporter',
  variant = 'outline',
  size = 'md',
  className,
  onSuccess,
  onError,
}: ExportButtonProps) {
  const [showModal, setShowModal] = useState(false)
  
  const { executeExport } = useExport({
    exportType,
    clientId,
    filters,
    onSuccess: () => {
      onSuccess?.()
      setShowModal(false)
    },
    onError,
  })

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowModal(true)}
        className={cn('gap-2', className)}
      >
        <Download className="h-4 w-4" />
        {label}
      </Button>

      <ExportModal
        open={showModal}
        onOpenChange={setShowModal}
        exportType={exportType}
        onExport={executeExport}
        filters={filters}
      />
    </>
  )
}
