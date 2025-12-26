'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  Plus, Trash2, Edit, TrendingUp, Wallet, PiggyBank, Landmark, Euro, Building, AlertCircle, CircleDollarSign, Loader2,
  CheckCircle, Clock
} from 'lucide-react'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'

interface PatrimoineFinancierPro {
  id: string
  type: string
  libelle: string
  etablissement?: string | null
  numeroContrat?: string | null
  montantInvesti: number
  valeurActuelle: number
  dateOuverture?: string | null
  dateEcheance?: string | null
  tauxRendement?: number | null
  plusValueLatente?: number | null
  disponible: boolean
  preavisSortie?: number | null
  regimeFiscal?: string | null
  notes?: string | null
}

const TYPES_PLACEMENTS = [
  { value: 'CONTRAT_CAPITALISATION', label: 'Contrat de capitalisation', icon: Landmark, color: 'bg-indigo-100 text-indigo-700' },
  { value: 'COMPTE_TITRES', label: 'Compte-titres', icon: TrendingUp, color: 'bg-blue-100 text-blue-700' },
  { value: 'COMPTE_A_TERME', label: 'Compte à terme', icon: Clock, color: 'bg-green-100 text-green-700' },
  { value: 'OPCVM', label: 'OPCVM (SICAV/FCP)', icon: PiggyBank, color: 'bg-purple-100 text-purple-700' },
  { value: 'OBLIGATIONS', label: 'Obligations', icon: CircleDollarSign, color: 'bg-amber-100 text-amber-700' },
  { value: 'ACTIONS', label: 'Actions', icon: TrendingUp, color: 'bg-red-100 text-red-700' },
  { value: 'TRESORERIE_REMUNEREE', label: 'Trésorerie rémunérée', icon: Wallet, color: 'bg-emerald-100 text-emerald-700' },
  { value: 'FCPR_FPCI', label: 'Private equity (FCPR/FPCI)', icon: Building, color: 'bg-slate-100 text-slate-700' },
  { value: 'SCPI_OPCI', label: 'Pierre-papier (SCPI/OPCI)', icon: Building, color: 'bg-orange-100 text-orange-700' },
  { value: 'CRYPTO_ACTIFS', label: 'Crypto-actifs', icon: CircleDollarSign, color: 'bg-yellow-100 text-yellow-700' },
  { value: 'AUTRE', label: 'Autre', icon: Wallet, color: 'bg-gray-100 text-gray-700' },
]

interface TabPatrimoineFinancierProProps {
  clientId: string
  client: ClientDetail
  wealthSummary?: WealthSummary
}

export function TabPatrimoineFinancierPro({ clientId, client }: TabPatrimoineFinancierProProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<PatrimoineFinancierPro | null>(null)
  const [formData, setFormData] = useState({
    type: 'CONTRAT_CAPITALISATION', libelle: '', etablissement: '', numeroContrat: '',
    montantInvesti: '', valeurActuelle: '', dateOuverture: '', dateEcheance: '',
    tauxRendement: '', disponible: 'true', preavisSortie: '', regimeFiscal: '', notes: '',
  })

  // Fetch depuis l'API
  const { data, isLoading } = useQuery({
    queryKey: ['patrimoine-financier-pro', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/advisor/clients/${clientId}/patrimoine-financier-pro`)
      if (!res.ok) throw new Error('Erreur chargement')
      const json = await res.json()
      return json.data?.patrimoineFinancierPro || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/patrimoine-financier-pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      })
      if (!res.ok) throw new Error('Erreur création')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimoine-financier-pro', clientId] })
      toast({ title: 'Placement ajouté' })
      closeDialog()
    },
    onError: () => toast({ title: 'Erreur lors de l\'ajout', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/patrimoine-financier-pro/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur mise à jour')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimoine-financier-pro', clientId] })
      toast({ title: 'Placement modifié' })
      closeDialog()
    },
    onError: () => toast({ title: 'Erreur lors de la modification', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/patrimoine-financier-pro/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erreur suppression')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimoine-financier-pro', clientId] })
      toast({ title: 'Placement supprimé' })
    },
    onError: () => toast({ title: 'Erreur lors de la suppression', variant: 'destructive' }),
  })

  const placements: PatrimoineFinancierPro[] = data || []

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '-'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  const formatPercent = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '-'
    return `${(value * 100).toFixed(2)}%`
  }

  const closeDialog = () => {
    setFormData({
      type: 'CONTRAT_CAPITALISATION', libelle: '', etablissement: '', numeroContrat: '',
      montantInvesti: '', valeurActuelle: '', dateOuverture: '', dateEcheance: '',
      tauxRendement: '', disponible: 'true', preavisSortie: '', regimeFiscal: '', notes: '',
    })
    setShowAddDialog(false)
    setEditingItem(null)
  }

  const openEdit = (item: PatrimoineFinancierPro) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      libelle: item.libelle || '',
      etablissement: item.etablissement || '',
      numeroContrat: item.numeroContrat || '',
      montantInvesti: item.montantInvesti?.toString() || '',
      valeurActuelle: item.valeurActuelle?.toString() || '',
      dateOuverture: item.dateOuverture ? new Date(item.dateOuverture).toISOString().split('T')[0] : '',
      dateEcheance: item.dateEcheance ? new Date(item.dateEcheance).toISOString().split('T')[0] : '',
      tauxRendement: item.tauxRendement?.toString() || '',
      disponible: item.disponible ? 'true' : 'false',
      preavisSortie: item.preavisSortie?.toString() || '',
      regimeFiscal: item.regimeFiscal || '',
      notes: item.notes || '',
    })
  }

  const handleSubmit = () => {
    if (!formData.libelle) {
      toast({ title: 'Erreur', description: 'Libellé obligatoire', variant: 'destructive' })
      return
    }
    const payload = {
      type: formData.type,
      libelle: formData.libelle,
      etablissement: formData.etablissement || null,
      numeroContrat: formData.numeroContrat || null,
      montantInvesti: formData.montantInvesti ? Number(formData.montantInvesti) : 0,
      valeurActuelle: formData.valeurActuelle ? Number(formData.valeurActuelle) : 0,
      dateOuverture: formData.dateOuverture || null,
      dateEcheance: formData.dateEcheance || null,
      tauxRendement: formData.tauxRendement ? Number(formData.tauxRendement) / 100 : null,
      disponible: formData.disponible === 'true',
      preavisSortie: formData.preavisSortie ? Number(formData.preavisSortie) : null,
      regimeFiscal: formData.regimeFiscal || null,
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

  const getTypeInfo = (type: string) => TYPES_PLACEMENTS.find(t => t.value === type) || TYPES_PLACEMENTS[10]

  // KPIs
  const totalInvesti = placements.reduce((sum, p) => sum + Number(p.montantInvesti || 0), 0)
  const totalValeurActuelle = placements.reduce((sum, p) => sum + Number(p.valeurActuelle || 0), 0)
  const totalPlusValue = totalValeurActuelle - totalInvesti
  const rendementGlobal = totalInvesti > 0 ? (totalPlusValue / totalInvesti * 100) : 0
  const totalDisponible = placements.filter(p => p.disponible).reduce((sum, p) => sum + Number(p.valeurActuelle || 0), 0)

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
          <div className="p-2 bg-indigo-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Patrimoine Financier Pro</h2>
            <p className="text-sm text-gray-500">Placements de trésorerie et investissements</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un placement
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Total investi</span>
              <Wallet className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalInvesti)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Valeur actuelle</span>
              <Euro className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValeurActuelle)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Plus-value latente</span>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <p className={`text-2xl font-bold ${totalPlusValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPlusValue >= 0 ? '+' : ''}{formatCurrency(totalPlusValue)}
            </p>
            <p className={`text-sm ${rendementGlobal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {rendementGlobal >= 0 ? '+' : ''}{rendementGlobal.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Disponible</span>
              <CheckCircle className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalDisponible)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste */}
      {placements.length > 0 ? (
        <div className="space-y-4">
          {placements.map(placement => {
            const typeInfo = getTypeInfo(placement.type)
            const Icon = typeInfo.icon
            const plusValue = Number(placement.valeurActuelle) - Number(placement.montantInvesti)
            const rendement = Number(placement.montantInvesti) > 0 
              ? (plusValue / Number(placement.montantInvesti) * 100) 
              : 0
            return (
              <Card key={placement.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${typeInfo.color.split(' ')[0]}`}>
                        <Icon className={`w-5 h-5 ${typeInfo.color.split(' ')[1]}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{placement.libelle}</h3>
                          <Badge variant="secondary" className={typeInfo.color}>{typeInfo.label}</Badge>
                          {placement.disponible ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">Disponible</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700">Bloqué</Badge>
                          )}
                        </div>
                        {placement.etablissement && (
                          <p className="text-sm text-gray-500 mb-2">{placement.etablissement}</p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-gray-500">Montant investi</p>
                            <p className="text-sm font-medium">{formatCurrency(Number(placement.montantInvesti))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Valeur actuelle</p>
                            <p className="text-sm font-medium text-green-600">{formatCurrency(Number(placement.valeurActuelle))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Plus-value</p>
                            <p className={`text-sm font-medium ${plusValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {plusValue >= 0 ? '+' : ''}{formatCurrency(plusValue)} ({rendement >= 0 ? '+' : ''}{rendement.toFixed(1)}%)
                            </p>
                          </div>
                          {placement.tauxRendement && (
                            <div>
                              <p className="text-xs text-gray-500">Taux rendement</p>
                              <p className="text-sm font-medium">{formatPercent(placement.tauxRendement)}</p>
                            </div>
                          )}
                          {placement.dateEcheance && (
                            <div>
                              <p className="text-xs text-gray-500">Échéance</p>
                              <p className="text-sm font-medium">{new Date(placement.dateEcheance).toLocaleDateString('fr-FR')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(placement)}><Edit className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(placement.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
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
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun placement enregistré</h3>
            <p className="text-gray-500 mb-4">
              La trésorerie de l'entreprise peut être optimisée via des placements adaptés.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un placement
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Suggestions si peu de placements */}
      {placements.length > 0 && placements.length < 3 && (
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-medium text-indigo-800">Optimisation de trésorerie</p>
                <p className="text-sm text-gray-600">
                  Diversifier les placements permet de réduire le risque et d'optimiser le rendement. 
                  Pensez aux contrats de capitalisation (fiscalité avantageuse IS) ou aux comptes à terme pour la trésorerie court terme.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Ajout/Édition */}
      <Dialog open={showAddDialog || !!editingItem} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingItem ? 'Modifier le placement' : 'Ajouter un placement'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type de placement *</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES_PLACEMENTS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Disponibilité</label>
                <Select value={formData.disponible} onValueChange={(v) => setFormData({ ...formData, disponible: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Disponible immédiatement</SelectItem>
                    <SelectItem value="false">Bloqué / Non disponible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Libellé *</label>
              <Input value={formData.libelle} onChange={(e) => setFormData({ ...formData, libelle: e.target.value })} placeholder="Ex: Contrat Capi AXA, CAT BNP 12 mois..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Établissement</label>
                <Input value={formData.etablissement} onChange={(e) => setFormData({ ...formData, etablissement: e.target.value })} placeholder="Banque, assureur..." />
              </div>
              <div>
                <label className="text-sm font-medium">N° contrat</label>
                <Input value={formData.numeroContrat} onChange={(e) => setFormData({ ...formData, numeroContrat: e.target.value })} placeholder="Référence" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Montant investi (€) *</label>
                <Input type="number" value={formData.montantInvesti} onChange={(e) => setFormData({ ...formData, montantInvesti: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Valeur actuelle (€) *</label>
                <Input type="number" value={formData.valeurActuelle} onChange={(e) => setFormData({ ...formData, valeurActuelle: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Date d'ouverture</label>
                <Input type="date" value={formData.dateOuverture} onChange={(e) => setFormData({ ...formData, dateOuverture: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Date d'échéance</label>
                <Input type="date" value={formData.dateEcheance} onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Taux rendement (%)</label>
                <Input type="number" step="0.01" value={formData.tauxRendement} onChange={(e) => setFormData({ ...formData, tauxRendement: e.target.value })} placeholder="Ex: 3.5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Préavis sortie (jours)</label>
                <Input type="number" value={formData.preavisSortie} onChange={(e) => setFormData({ ...formData, preavisSortie: e.target.value })} placeholder="0 si disponible immédiatement" />
              </div>
              <div>
                <label className="text-sm font-medium">Régime fiscal</label>
                <Input value={formData.regimeFiscal} onChange={(e) => setFormData({ ...formData, regimeFiscal: e.target.value })} placeholder="IS, PFU, etc." />
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

export default TabPatrimoineFinancierPro
