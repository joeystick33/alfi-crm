'use client'

/**
 * TabFinancementsPro - Financements professionnels (connecté API)
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Landmark, Plus, Euro, Calendar, Car, Building2, CreditCard, Edit, Trash2, AlertCircle, TrendingUp, Loader2 } from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'

// Types alignés avec Prisma TypeFinancementPro
const TYPES_FINANCEMENTS = [
  { value: 'PRET_PROFESSIONNEL', label: 'Prêt professionnel', icon: Euro, color: 'bg-green-100 text-green-600' },
  { value: 'CREDIT_BAIL_MOBILIER', label: 'Crédit-bail mobilier', icon: Car, color: 'bg-blue-100 text-blue-600' },
  { value: 'CREDIT_BAIL_IMMOBILIER', label: 'Crédit-bail immobilier', icon: Building2, color: 'bg-amber-100 text-amber-600' },
  { value: 'LEASING', label: 'Leasing', icon: Car, color: 'bg-cyan-100 text-cyan-600' },
  { value: 'AFFACTURAGE', label: 'Affacturage', icon: CreditCard, color: 'bg-purple-100 text-purple-600' },
  { value: 'ESCOMPTE', label: 'Escompte', icon: CreditCard, color: 'bg-indigo-100 text-indigo-600' },
  { value: 'DAILLY', label: 'Cession Dailly', icon: CreditCard, color: 'bg-violet-100 text-violet-600' },
  { value: 'DECOUVERT_PRO', label: 'Découvert professionnel', icon: TrendingUp, color: 'bg-gray-100 text-gray-600' },
  { value: 'PRET_HONNEUR', label: 'Prêt d\'honneur', icon: Euro, color: 'bg-emerald-100 text-emerald-600' },
  { value: 'CROWDFUNDING', label: 'Crowdfunding', icon: Euro, color: 'bg-pink-100 text-pink-600' },
  { value: 'AUTRE', label: 'Autre', icon: Euro, color: 'bg-gray-100 text-gray-600' },
]

interface FinancementPro {
  id: string
  type: string
  libelle: string
  organisme?: string | null
  numeroContrat?: string | null
  montantInitial: number
  capitalRestantDu: number
  tauxInteret?: number | null
  mensualite?: number | null
  dateDebut?: string | null
  dateFin?: string | null
  dureeInitialeMois?: number | null
  garanties?: any
  objet?: string | null
  notes?: string | null
}

interface TabFinancementsProProps {
  clientId: string
  client: ClientDetail
  wealthSummary?: WealthSummary
}

export function TabFinancementsPro({ clientId, client }: TabFinancementsProProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<FinancementPro | null>(null)
  const [formData, setFormData] = useState({
    type: 'PRET_PROFESSIONNEL', organisme: '', montantInitial: '', capitalRestantDu: '', tauxInteret: '', dateDebut: '', dateFin: '', mensualite: '', objet: '', notes: '',
  })

  // Fetch depuis l'API
  const { data, isLoading } = useQuery({
    queryKey: ['financements-pro', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/advisor/clients/${clientId}/financements-pro`)
      if (!res.ok) throw new Error('Erreur chargement')
      const json = await res.json()
      return json.data?.financementsPro || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/financements-pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      })
      if (!res.ok) throw new Error('Erreur création')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financements-pro', clientId] })
      toast({ title: 'Financement ajouté' })
      closeDialog()
    },
    onError: () => toast({ title: 'Erreur lors de l\'ajout', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/financements-pro/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur mise à jour')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financements-pro', clientId] })
      toast({ title: 'Financement modifié' })
      closeDialog()
    },
    onError: () => toast({ title: 'Erreur lors de la modification', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/financements-pro/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erreur suppression')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financements-pro', clientId] })
      toast({ title: 'Financement supprimé' })
    },
    onError: () => toast({ title: 'Erreur lors de la suppression', variant: 'destructive' }),
  })

  const financements: FinancementPro[] = data || []

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '-'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  const closeDialog = () => {
    setFormData({ type: 'PRET_PROFESSIONNEL', organisme: '', montantInitial: '', capitalRestantDu: '', tauxInteret: '', dateDebut: '', dateFin: '', mensualite: '', objet: '', notes: '' })
    setShowAddDialog(false)
    setEditingItem(null)
  }

  const openEdit = (item: FinancementPro) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      organisme: item.organisme || '',
      montantInitial: item.montantInitial?.toString() || '',
      capitalRestantDu: item.capitalRestantDu?.toString() || '',
      tauxInteret: item.tauxInteret?.toString() || '',
      dateDebut: item.dateDebut ? new Date(item.dateDebut).toISOString().split('T')[0] : '',
      dateFin: item.dateFin ? new Date(item.dateFin).toISOString().split('T')[0] : '',
      mensualite: item.mensualite?.toString() || '',
      objet: item.objet || '',
      notes: item.notes || '',
    })
  }

  const handleSubmit = () => {
    if (!formData.organisme) {
      toast({ title: 'Erreur', description: 'Organisme obligatoire', variant: 'destructive' })
      return
    }
    const payload = {
      type: formData.type,
      libelle: `${TYPES_FINANCEMENTS.find(t => t.value === formData.type)?.label || formData.type}`,
      organisme: formData.organisme,
      montantInitial: formData.montantInitial ? Number(formData.montantInitial) : 0,
      capitalRestantDu: formData.capitalRestantDu ? Number(formData.capitalRestantDu) : 0,
      tauxInteret: formData.tauxInteret ? Number(formData.tauxInteret) : null,
      mensualite: formData.mensualite ? Number(formData.mensualite) : null,
      dateDebut: formData.dateDebut || null,
      dateFin: formData.dateFin || null,
      objet: formData.objet || null,
      notes: formData.notes || null,
    }
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const getTypeInfo = (type: string) => TYPES_FINANCEMENTS.find(t => t.value === type) || TYPES_FINANCEMENTS[1]

  const totalCapitalRestant = financements.reduce((sum, f) => sum + Number(f.capitalRestantDu || 0), 0)
  const totalMensualites = financements.reduce((sum, f) => sum + Number(f.mensualite || 0), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Landmark className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Financements Pro</h2>
            <p className="text-sm text-gray-500">RC Pro, Prêts, Crédit-bail, Affacturage</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Encours crédit</span>
              <Euro className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalCapitalRestant)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Charges mensuelles</span>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalMensualites)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Financements</span>
              <Landmark className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{financements.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste */}
      {financements.length > 0 ? (
        <div className="space-y-4">
          {financements.map(fin => {
            const typeInfo = getTypeInfo(fin.type)
            const Icon = typeInfo.icon
            return (
              <Card key={fin.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${typeInfo.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{typeInfo.label}</h3>
                          <Badge variant="outline">{fin.organisme}</Badge>
                        </div>
                        {fin.objet && <p className="text-sm text-gray-600 mb-2">{fin.objet}</p>}
                        <div className="grid gap-4 md:grid-cols-4 mt-2">
                          {fin.montantInitial > 0 && (
                            <div>
                              <p className="text-xs text-gray-500">Montant initial</p>
                              <p className="text-sm font-medium">{formatCurrency(Number(fin.montantInitial))}</p>
                            </div>
                          )}
                          {fin.capitalRestantDu > 0 && (
                            <div>
                              <p className="text-xs text-gray-500">Capital restant</p>
                              <p className="text-sm font-medium text-amber-600">{formatCurrency(Number(fin.capitalRestantDu))}</p>
                            </div>
                          )}
                          {fin.mensualite && (
                            <div>
                              <p className="text-xs text-gray-500">Mensualité</p>
                              <p className="text-sm font-medium">{formatCurrency(Number(fin.mensualite))}</p>
                            </div>
                          )}
                          {fin.tauxInteret && (
                            <div>
                              <p className="text-xs text-gray-500">Taux</p>
                              <p className="text-sm font-medium">{fin.tauxInteret}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(fin)}><Edit className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(fin.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-6 pb-6 text-center">
            <Landmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun financement enregistré</h3>
            <Button onClick={() => setShowAddDialog(true)}><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      {financements.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Aucun financement enregistré</p>
                <p className="text-sm text-gray-600">Ajoutez les prêts professionnels, crédits-bail et autres financements de l'entreprise.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Ajout/Édition */}
      <Dialog open={showAddDialog || !!editingItem} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? 'Modifier le financement' : 'Ajouter un financement'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Type *</label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES_FINANCEMENTS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Organisme *</label>
              <Input value={formData.organisme} onChange={(e) => setFormData({ ...formData, organisme: e.target.value })} placeholder="Banque, assureur..." />
            </div>
            <div>
              <label className="text-sm font-medium">Objet</label>
              <Input value={formData.objet} onChange={(e) => setFormData({ ...formData, objet: e.target.value })} placeholder="Description du financement" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date début *</label>
                <Input type="date" value={formData.dateDebut} onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Date fin</label>
                <Input type="date" value={formData.dateFin} onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Montant initial (€)</label>
                <Input type="number" value={formData.montantInitial} onChange={(e) => setFormData({ ...formData, montantInitial: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Taux (%)</label>
                <Input type="number" step="0.01" value={formData.tauxInteret} onChange={(e) => setFormData({ ...formData, tauxInteret: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Mensualité (€)</label>
                <Input type="number" value={formData.mensualite} onChange={(e) => setFormData({ ...formData, mensualite: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Capital restant (€)</label>
                <Input type="number" value={formData.capitalRestantDu} onChange={(e) => setFormData({ ...formData, capitalRestantDu: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annuler</Button>
            <Button onClick={handleSubmit}>{editingItem ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TabFinancementsPro
