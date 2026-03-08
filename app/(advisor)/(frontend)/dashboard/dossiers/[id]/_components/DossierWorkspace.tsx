'use client'

import { useState } from 'react'
import { Button } from '@/app/_common/components/ui/Button'
import { cn } from '@/lib/utils'
import { 
  FileSearch, Calculator, FileText, CheckCircle2, Archive,
  Download, Send, Loader2, ChevronRight
} from 'lucide-react'
import { ClientDataSnapshot } from './ClientDataSnapshot'
import { SimulateurPanel } from './SimulateurPanel'
import { PreconisationEditor } from './PreconisationEditor'
import { DocumentPreview } from './DocumentPreview'
import { useToast } from '@/app/_common/hooks/use-toast'

interface DossierWorkspaceProps {
  dossier: {
    id: string
    reference: string
    nom: string
    categorie: string
    type: string
    etapeActuelle: string
    clientDataSnapshot: Record<string, unknown> | null
    client: {
      id: string
      firstName: string
      lastName: string
      email?: string
      phone?: string
      mobile?: string
      clientType?: string
    } | null
    simulations: Array<{
      id: string
      simulateurType: string
      nom: string
      parametres: Record<string, unknown>
      resultats: Record<string, unknown>
      selectionne: boolean
    }>
    preconisations: Array<{
      id: string
      titre: string
      description: string
      statut: string
      ordre: number
    }>
    documentsGeneres: Array<{
      id: string
      type: string
      nom: string
      url: string
      createdAt: string
      version?: number
    }>
  }
  onEtapeChange: (etape: string) => void
  onRefresh: () => void
}

const ETAPES = [
  { id: 'COLLECTE', label: 'Collecte', icon: FileSearch, description: 'Import des données client', shortDesc: 'Données' },
  { id: 'ANALYSE', label: 'Analyse', icon: Calculator, description: 'Simulations et étude patrimoniale', shortDesc: 'Simulations' },
  { id: 'PRECONISATION', label: 'Préconisations', icon: FileText, description: 'Recommandations personnalisées', shortDesc: 'Recommandations' },
  { id: 'VALIDATION', label: 'Validation', icon: CheckCircle2, description: 'Génération et validation du rapport', shortDesc: 'Rapport' },
  { id: 'CLOTURE', label: 'Clôture', icon: Archive, description: 'Dossier finalisé et archivé', shortDesc: 'Finalisé' },
]

export function DossierWorkspace({ dossier, onEtapeChange, onRefresh }: DossierWorkspaceProps) {
  const { toast } = useToast()
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const currentEtapeIndex = ETAPES.findIndex(e => e.id === dossier.etapeActuelle)
  const progressPercent = Math.round(((currentEtapeIndex + 1) / ETAPES.length) * 100)

  const handleNextEtape = () => {
    if (currentEtapeIndex < ETAPES.length - 1) {
      onEtapeChange(ETAPES[currentEtapeIndex + 1].id)
    }
  }

  const handlePrevEtape = () => {
    if (currentEtapeIndex > 0) {
      onEtapeChange(ETAPES[currentEtapeIndex - 1].id)
    }
  }

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true)
    try {
      const response = await fetch(`/api/advisor/dossiers/${dossier.id}/generate-pdf-html`, {
        method: 'POST',
      })
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Bilan_${dossier.client?.lastName || 'Client'}_${dossier.reference}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
        toast({ title: 'PDF téléchargé', variant: 'success' })
        onRefresh()
      }
    } catch {
      toast({ title: 'Erreur génération PDF', variant: 'destructive' })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleSendToClient = async () => {
    setIsSending(true)
    try {
      await fetch(`/api/advisor/dossiers/${dossier.id}/send-to-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      toast({ title: 'Document envoyé au client', variant: 'success' })
    } catch {
      toast({ title: 'Erreur envoi', variant: 'destructive' })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ═══ Stepper horizontal premium ═══ */}
      <div className="relative rounded-xl border bg-card overflow-hidden">
        {/* Progress bar background */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            {ETAPES.map((etape, index) => {
              const Icon = etape.icon
              const isActive = etape.id === dossier.etapeActuelle
              const isCompleted = index < currentEtapeIndex
              const isDisabled = index > currentEtapeIndex + 1
              const isClickable = !isDisabled && !isActive

              return (
                <div key={etape.id} className="flex items-center flex-1 last:flex-none">
                  {/* Step */}
                  <button
                    onClick={() => isClickable && onEtapeChange(etape.id)}
                    disabled={isDisabled}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative',
                      isActive && 'bg-primary/10',
                      isClickable && 'hover:bg-muted cursor-pointer',
                      isDisabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    {/* Step circle */}
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 border-2',
                      isActive && 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25',
                      isCompleted && !isActive && 'bg-emerald-500 border-emerald-500 text-white',
                      !isActive && !isCompleted && 'bg-muted border-muted-foreground/20 text-muted-foreground'
                    )}>
                      {isCompleted && !isActive ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>

                    {/* Label */}
                    <div className="hidden md:block min-w-0">
                      <div className={cn(
                        'font-semibold text-sm',
                        isActive && 'text-primary',
                        isCompleted && !isActive && 'text-emerald-700',
                        !isActive && !isCompleted && 'text-muted-foreground'
                      )}>
                        {etape.label}
                      </div>
                      <div className={cn(
                        'text-[11px] leading-tight',
                        isActive ? 'text-primary/70' : 'text-muted-foreground/60'
                      )}>
                        {etape.shortDesc}
                      </div>
                    </div>
                  </button>

                  {/* Connector line */}
                  {index < ETAPES.length - 1 && (
                    <div className="flex-1 flex items-center justify-center px-1">
                      <div className={cn(
                        'h-0.5 w-full rounded-full transition-colors duration-300',
                        index < currentEtapeIndex ? 'bg-emerald-400' : 'bg-muted-foreground/15'
                      )}>
                        {index === currentEtapeIndex && (
                          <div className="h-full w-1/2 bg-gradient-to-r from-primary to-primary/30 rounded-full" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══ Quick actions bar ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            Étape {currentEtapeIndex + 1}/{ETAPES.length}
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{ETAPES[currentEtapeIndex]?.description}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className="gap-2"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendToClient}
            disabled={isSending}
            className="gap-2"
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Envoyer
          </Button>
        </div>
      </div>

      {/* ═══ Contenu principal ═══ */}
      <div className="min-w-0">
        {dossier.etapeActuelle === 'COLLECTE' && (
          <ClientDataSnapshot
            dossier={dossier}
            onSnapshotCreated={onRefresh}
            onNext={handleNextEtape}
          />
        )}

        {dossier.etapeActuelle === 'ANALYSE' && (
          <SimulateurPanel
            dossier={dossier}
            onSimulationSaved={onRefresh}
            onNext={handleNextEtape}
            onPrev={handlePrevEtape}
          />
        )}

        {dossier.etapeActuelle === 'PRECONISATION' && (
          <PreconisationEditor
            dossier={dossier}
            onSave={onRefresh}
            onNext={handleNextEtape}
            onPrev={handlePrevEtape}
          />
        )}

        {dossier.etapeActuelle === 'VALIDATION' && (
          <DocumentPreview
            dossier={dossier}
            mode="validation"
            onNext={handleNextEtape}
            onPrev={handlePrevEtape}
          />
        )}

        {dossier.etapeActuelle === 'CLOTURE' && (
          <DocumentPreview
            dossier={dossier}
            mode="cloture"
            onPrev={handlePrevEtape}
          />
        )}
      </div>
    </div>
  )
}
