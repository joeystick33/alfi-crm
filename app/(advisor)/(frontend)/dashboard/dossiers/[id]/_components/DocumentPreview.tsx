'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { 
  FileText, ChevronLeft, Download, Send, Eye, CheckCircle, Loader2,
  FileCheck, Calendar, ExternalLink, RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'

interface DocumentPreviewProps {
  dossier: {
    id: string
    reference: string
    nom: string
    categorie: string
    type: string
    clientDataSnapshot: Record<string, unknown> | null
    client: {
      id: string
      firstName: string
      lastName: string
    } | null
    simulations: Array<{
      id: string
      simulateurType: string
      nom: string
      selectionne: boolean
    }>
    preconisations: Array<{
      id: string
      titre: string
      description: string
      statut: string
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
  mode: 'validation' | 'cloture'
  onNext?: () => void
  onPrev: () => void
}

export function DocumentPreview({ dossier, mode, onNext, onPrev }: DocumentPreviewProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  const latestDocument = dossier.documentsGeneres
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

  const simulationsSelectionnees = dossier.simulations.filter(s => s.selectionne)

  const handleGeneratePdf = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/advisor/dossiers/${dossier.id}/generate-pdf-html`, {
        method: 'POST',
      })

      if (response.ok) {
        // Télécharger le PDF
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Bilan_Patrimonial_${dossier.client?.lastName || 'Client'}_${dossier.reference}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
        
        toast({ title: 'PDF généré', description: 'Le document a été téléchargé', variant: 'success' })
      } else {
        throw new Error('Erreur génération')
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de générer le PDF', variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = useCallback(async () => {
    setIsLoadingPreview(true)
    try {
      const response = await fetch(`/api/advisor/dossiers/${dossier.id}/generate-pdf-html`)
      if (response.ok) {
        const html = await response.text()
        setPreviewHtml(html)
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de charger la prévisualisation', variant: 'destructive' })
    } finally {
      setIsLoadingPreview(false)
    }
  }, [dossier.id, toast])

  const openPreviewInNewTab = () => {
    const newWindow = window.open('', '_blank')
    if (newWindow && previewHtml) {
      newWindow.document.write(previewHtml)
      newWindow.document.close()
    }
  }

  const handleSendToClient = async () => {
    if (!latestDocument) return

    setIsSending(true)
    try {
      await fetch(`/api/advisor/dossiers/${dossier.id}/send-to-client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: latestDocument.id })
      })
      toast({ title: 'Document envoyé', description: 'Le client a reçu le document par email', variant: 'success' })
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible d\'envoyer le document', variant: 'destructive' })
    } finally {
      setIsSending(false)
    }
  }

  const handleValidate = async () => {
    setIsValidating(true)
    try {
      await fetch(`/api/advisor/dossiers/${dossier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapeActuelle: 'CLOTURE', status: 'VALIDE' })
      })
      toast({ title: 'Dossier validé', variant: 'success' })
      if (onNext) onNext()
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setIsValidating(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
          mode === 'cloture' ? 'from-emerald-500 to-teal-500' : 'from-violet-500 to-purple-500'
        )} />
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                mode === 'cloture' ? 'bg-emerald-100' : 'bg-violet-100'
              )}>
                <FileCheck className={cn('w-5 h-5', mode === 'cloture' ? 'text-emerald-600' : 'text-violet-600')} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {mode === 'validation' ? 'Validation du bilan' : 'Dossier clôturé'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {mode === 'validation' 
                    ? 'Vérifiez le contenu, prévisualisez et générez le document final' 
                    : 'Le dossier est finalisé et archivé'}
                </p>
              </div>
            </div>

            {/* Stats résumé */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center px-3">
                <div className="text-xl font-bold text-primary">{simulationsSelectionnees.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Simulations</div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center px-3">
                <div className="text-xl font-bold text-primary">{dossier.preconisations.length}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Préconisations</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu inclus */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-sm">Simulations incluses</h4>
          </div>
          {simulationsSelectionnees.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 italic">Aucune simulation sélectionnée</p>
          ) : (
            <div className="space-y-1.5">
              {simulationsSelectionnees.map(sim => (
                <div key={sim.id} className="flex items-center gap-2 text-sm py-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">{sim.nom}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <h4 className="font-semibold text-sm">Préconisations</h4>
          </div>
          {dossier.preconisations.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 italic">Aucune préconisation</p>
          ) : (
            <div className="space-y-1.5">
              {dossier.preconisations.map((preco, i) => (
                <div key={preco.id} className="flex items-center gap-2 text-sm py-1">
                  <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {i + 1}
                  </span>
                  <span className="truncate">{preco.titre}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prévisualisation et Génération PDF */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h4 className="font-semibold">Bilan Patrimonial</h4>
              <p className="text-xs text-muted-foreground">Rapport professionnel complet</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview} disabled={isLoadingPreview} className="gap-2">
              {isLoadingPreview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
              Prévisualiser
            </Button>
            <Button size="sm" onClick={handleGeneratePdf} disabled={isGenerating} className="gap-2">
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Télécharger PDF
            </Button>
          </div>
        </div>

        {previewHtml ? (
          <div>
            <div className="flex items-center justify-between px-5 py-2 bg-muted/30 border-b">
              <p className="text-xs text-muted-foreground">Aperçu du document</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={openPreviewInNewTab} className="h-7 text-xs gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Plein écran
                </Button>
                <Button variant="ghost" size="sm" onClick={handlePreview} className="h-7 text-xs gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Rafraîchir
                </Button>
              </div>
            </div>
            <div className="bg-slate-100 p-4">
              <div className="mx-auto max-w-4xl shadow-xl rounded-lg overflow-hidden bg-white" style={{ height: '650px' }}>
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full"
                  title="Aperçu du document"
                  style={{ border: 'none' }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-muted-foreground/20" />
            </div>
            <p className="font-medium text-muted-foreground">Aucun aperçu</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              Cliquez sur « Prévisualiser » pour voir le rapport
            </p>
          </div>
        )}
      </div>

      {/* Historique des documents */}
      {dossier.documentsGeneres.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Historique des documents
          </h4>
          <div className="space-y-2">
            {dossier.documentsGeneres
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((doc, index) => (
                <div
                  key={doc.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-colors',
                    index === 0 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30 hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    index === 0 ? 'bg-primary/10' : 'bg-red-50'
                  )}>
                    <FileText className={cn('w-4 h-4', index === 0 ? 'text-primary' : 'text-red-500')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm flex items-center gap-2">
                      <span className="truncate">{doc.nom}</span>
                      {index === 0 && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium shrink-0">
                          Dernier
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(doc.createdAt)}
                      {doc.version && <> — v{doc.version}</>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-3 h-3" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                      <a href={doc.url} download>
                        <Download className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Retour
        </Button>
        <div className="flex gap-3">
          {latestDocument && (
            <Button variant="outline" onClick={handleSendToClient} disabled={isSending} className="gap-2">
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Envoyer au client
            </Button>
          )}
          {mode === 'validation' && (
            <Button onClick={handleValidate} disabled={isValidating} size="lg" className="gap-2 px-6 bg-emerald-600 hover:bg-emerald-700">
              {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Valider et clôturer
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
