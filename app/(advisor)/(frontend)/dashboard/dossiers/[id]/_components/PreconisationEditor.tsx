'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { 
  FileText, ChevronRight, ChevronLeft, Plus, Trash2, GripVertical,
  Edit2, Loader2, CheckCircle, XCircle, Clock, Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'

interface PreconisationEditorProps {
  dossier: {
    id: string
    categorie: string
    type: string
    preconisations: Array<{
      id: string
      titre: string
      description: string
      argumentaire?: string
      montant?: number
      statut: string
      ordre: number
    }>
  }
  onSave: () => void
  onNext: () => void
  onPrev: () => void
}

const STATUT_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  PROPOSEE: { icon: Clock, color: 'text-amber-600' },
  ACCEPTEE: { icon: CheckCircle, color: 'text-green-600' },
  REFUSEE: { icon: XCircle, color: 'text-red-600' },
  EN_COURS: { icon: Clock, color: 'text-blue-600' },
  REALISEE: { icon: CheckCircle, color: 'text-emerald-600' },
}

export function PreconisationEditor({ dossier, onSave, onNext, onPrev }: PreconisationEditorProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingPreco, setEditingPreco] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    argumentaire: '',
    montant: '',
  })

  const resetForm = () => {
    setFormData({ titre: '', description: '', argumentaire: '', montant: '' })
    setEditingPreco(null)
  }

  const openEditDialog = (preco: typeof dossier.preconisations[0]) => {
    setFormData({
      titre: preco.titre,
      description: preco.description,
      argumentaire: preco.argumentaire || '',
      montant: preco.montant?.toString() || '',
    })
    setEditingPreco(preco.id)
    setShowDialog(true)
  }

  const handleSavePreconisation = async () => {
    if (!formData.titre || !formData.description) {
      toast({ title: 'Champs requis', description: 'Titre et description obligatoires', variant: 'destructive' })
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        titre: formData.titre,
        description: formData.description,
        argumentaire: formData.argumentaire || null,
        montant: formData.montant ? parseFloat(formData.montant) : null,
        ordre: dossier.preconisations.length,
      }

      if (editingPreco) {
        await fetch(`/api/advisor/dossiers/${dossier.id}/preconisations/${editingPreco}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        toast({ title: 'Préconisation modifiée', variant: 'success' })
      } else {
        await fetch(`/api/advisor/dossiers/${dossier.id}/preconisations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        toast({ title: 'Préconisation ajoutée', variant: 'success' })
      }

      setShowDialog(false)
      resetForm()
      onSave()
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePreconisation = async (id: string) => {
    try {
      await fetch(`/api/advisor/dossiers/${dossier.id}/preconisations/${id}`, {
        method: 'DELETE'
      })
      toast({ title: 'Préconisation supprimée', variant: 'success' })
      onSave()
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const handleGenerateAI = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/advisor/dossiers/${dossier.id}/preconisations/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (response.ok) {
        const json = await response.json()
        const data = json.data || json
        toast({
          title: 'Préconisations générées',
          description: `${data.generated} préconisation(s) ajoutée(s) basées sur le profil client`,
          variant: 'success',
        })
        onSave()
      } else {
        const err = await response.json().catch(() => ({}))
        toast({ title: 'Erreur', description: err.message || 'Impossible de générer les préconisations', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la génération', variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleContinue = async () => {
    setIsLoading(true)
    try {
      await fetch(`/api/advisor/dossiers/${dossier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapeActuelle: 'VALIDATION' })
      })
      onNext()
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  const getPrioriteConfig = (preco: typeof dossier.preconisations[0]) => {
    const p = (preco as any).priorite
    if (p === 1) return { label: 'Haute', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', border: 'border-l-red-500' }
    if (p === 2) return { label: 'Moyenne', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', border: 'border-l-amber-500' }
    if (p === 3) return { label: 'Basse', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', border: 'border-l-blue-500' }
    return { label: '', color: '', dot: 'bg-slate-400', border: 'border-l-slate-300' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Préconisations
                  {dossier.preconisations.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({dossier.preconisations.length})
                    </span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">Recommandations personnalisées pour le client</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Générer par IA
              </Button>
              <Button onClick={() => { resetForm(); setShowDialog(true) }} className="gap-2">
                <Plus className="w-4 h-4" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Préconisations list */}
      {dossier.preconisations.length === 0 ? (
        <div className="rounded-xl border bg-card">
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-amber-400" />
            </div>
            <p className="font-medium text-muted-foreground">Aucune préconisation</p>
            <p className="text-sm text-muted-foreground/60 mt-1 max-w-md mx-auto">
              Cliquez sur « Générer par IA » pour obtenir des recommandations automatiques basées sur le profil et le patrimoine du client
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {dossier.preconisations
            .sort((a, b) => a.ordre - b.ordre)
            .map((preco, index) => {
              const statusConfig = STATUT_ICONS[preco.statut] || STATUT_ICONS.PROPOSEE
              const StatusIcon = statusConfig.icon
              const prioriteConfig = getPrioriteConfig(preco)

              return (
                <div
                  key={preco.id}
                  className={cn(
                    'relative overflow-hidden rounded-xl border bg-card border-l-4 transition-all hover:shadow-md',
                    prioriteConfig.border
                  )}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Numéro */}
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                        {index + 1}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h4 className="font-semibold text-base">{preco.titre}</h4>
                          <span className={cn(
                            'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border',
                            statusConfig.color === 'text-amber-600' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            statusConfig.color === 'text-green-600' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            statusConfig.color === 'text-red-600' ? 'bg-red-50 text-red-700 border-red-200' :
                            statusConfig.color === 'text-blue-600' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {preco.statut.replace(/_/g, ' ')}
                          </span>
                          {prioriteConfig.label && (
                            <span className={cn(
                              'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border',
                              prioriteConfig.color
                            )}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', prioriteConfig.dot)} />
                              Priorité {prioriteConfig.label.toLowerCase()}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {preco.description}
                        </p>

                        {preco.argumentaire && (
                          <div className="mt-2 p-2.5 rounded-lg bg-muted/50 border border-muted">
                            <p className="text-xs text-muted-foreground italic leading-relaxed">
                              {preco.argumentaire}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Montant */}
                      {preco.montant && (
                        <div className="text-right shrink-0">
                          <div className="text-lg font-bold text-primary">
                            {formatCurrency(preco.montant)}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">estimé</div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditDialog(preco)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/40 hover:text-destructive"
                          onClick={() => handleDeletePreconisation(preco.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Retour
        </Button>
        <Button onClick={handleContinue} disabled={isLoading} size="lg" className="gap-2 px-6">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Continuer vers la validation
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Dialog ajout/édition */}
      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) { resetForm(); setShowDialog(false) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPreco ? 'Modifier la préconisation' : 'Nouvelle préconisation'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Titre *</Label>
              <Input
                value={formData.titre}
                onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                placeholder="Ex: Ouverture PER pour optimisation fiscale"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez la préconisation en détail..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Argumentaire</Label>
              <Textarea
                value={formData.argumentaire}
                onChange={(e) => setFormData(prev => ({ ...prev, argumentaire: e.target.value }))}
                placeholder="Justification et avantages pour le client..."
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Montant estimé (€)</Label>
              <Input
                type="number"
                value={formData.montant}
                onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                placeholder="Ex: 50000"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowDialog(false) }}>
              Annuler
            </Button>
            <Button onClick={handleSavePreconisation} disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPreco ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
