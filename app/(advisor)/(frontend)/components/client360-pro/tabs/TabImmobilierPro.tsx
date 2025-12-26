'use client'

/**
 * TabImmobilierPro - Immobilier professionnel (connecté API)
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Building, Plus, Euro, MapPin, Home, Warehouse, Building2, Edit, Trash2, Info, Key, Loader2 } from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'

// Types alignés avec Prisma TypeImmobilierPro
const TYPES_BIENS = [
  { value: 'BUREAUX', label: 'Bureaux', icon: Building2 },
  { value: 'LOCAL_COMMERCIAL', label: 'Local commercial', icon: Home },
  { value: 'ENTREPOT', label: 'Entrepôt / Stockage', icon: Warehouse },
  { value: 'LOCAL_ACTIVITE', label: 'Local d\'activité', icon: Building },
  { value: 'TERRAIN_PRO', label: 'Terrain professionnel', icon: MapPin },
  { value: 'PARKING_PRO', label: 'Parking professionnel', icon: MapPin },
  { value: 'SCI_PRO', label: 'Parts de SCI', icon: Building },
  { value: 'AUTRE', label: 'Autre', icon: Building },
]

const MODES_DETENTION = [
  { value: 'PLEINE_PROPRIETE', label: 'Pleine propriété' },
  { value: 'SCI_IS', label: 'SCI à l\'IS' },
  { value: 'SCI_IR', label: 'SCI à l\'IR' },
  { value: 'INDIVISION', label: 'Indivision' },
  { value: 'DEMEMBREMENT', label: 'Démembrement' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'CREDIT_BAIL', label: 'Crédit-bail' },
]

interface ImmobilierPro {
  id: string
  type: string
  libelle: string
  adresse?: string | null
  surface?: number | null
  modeDetention: string
  valeurActuelle: number
  valeurAcquisition?: number | null
  loyerAnnuel?: number | null
  chargesAnnuelles?: number | null
  rendementBrut?: number | null
  dateAcquisition?: string | null
  notes?: string | null
}

interface TabImmobilierProProps {
  clientId: string
  client: ClientDetail
  wealthSummary?: WealthSummary
}

export function TabImmobilierPro({ clientId, client }: TabImmobilierProProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<ImmobilierPro | null>(null)
  const [formData, setFormData] = useState({
    type: 'BUREAUX', libelle: '', adresse: '', surface: '', modeDetention: 'PLEINE_PROPRIETE',
    valeurActuelle: '', loyerAnnuel: '', chargesAnnuelles: '', dateAcquisition: '', notes: '',
  })

  // Fetch depuis l'API
  const { data, isLoading } = useQuery({
    queryKey: ['immobilier-pro', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/advisor/clients/${clientId}/immobilier-pro`)
      if (!res.ok) throw new Error('Erreur chargement')
      const json = await res.json()
      return json.data?.immobilierPro || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/immobilier-pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      })
      if (!res.ok) throw new Error('Erreur création')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['immobilier-pro', clientId] })
      toast({ title: 'Bien ajouté' })
      closeDialog()
    },
    onError: () => toast({ title: 'Erreur lors de l\'ajout', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/immobilier-pro/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur mise à jour')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['immobilier-pro', clientId] })
      toast({ title: 'Bien modifié' })
      closeDialog()
    },
    onError: () => toast({ title: 'Erreur lors de la modification', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/immobilier-pro/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erreur suppression')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['immobilier-pro', clientId] })
      toast({ title: 'Bien supprimé' })
    },
    onError: () => toast({ title: 'Erreur lors de la suppression', variant: 'destructive' }),
  })

  const biens: ImmobilierPro[] = data || []

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '-'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  const closeDialog = () => {
    setFormData({ type: 'BUREAUX', libelle: '', adresse: '', surface: '', modeDetention: 'PLEINE_PROPRIETE', valeurActuelle: '', loyerAnnuel: '', chargesAnnuelles: '', dateAcquisition: '', notes: '' })
    setShowAddDialog(false)
    setEditingItem(null)
  }

  const openEdit = (item: ImmobilierPro) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      libelle: item.libelle || '',
      adresse: item.adresse || '',
      surface: item.surface?.toString() || '',
      modeDetention: item.modeDetention,
      valeurActuelle: item.valeurActuelle?.toString() || '',
      loyerAnnuel: item.loyerAnnuel?.toString() || '',
      chargesAnnuelles: item.chargesAnnuelles?.toString() || '',
      dateAcquisition: item.dateAcquisition ? new Date(item.dateAcquisition).toISOString().split('T')[0] : '',
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
      adresse: formData.adresse || null,
      surface: formData.surface ? Number(formData.surface) : null,
      modeDetention: formData.modeDetention,
      valeurActuelle: formData.valeurActuelle ? Number(formData.valeurActuelle) : 0,
      loyerAnnuel: formData.loyerAnnuel ? Number(formData.loyerAnnuel) : null,
      chargesAnnuelles: formData.chargesAnnuelles ? Number(formData.chargesAnnuelles) : null,
      dateAcquisition: formData.dateAcquisition || null,
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

  const getTypeInfo = (type: string) => TYPES_BIENS.find(t => t.value === type) || TYPES_BIENS[0]
  const getModeLabel = (mode: string) => MODES_DETENTION.find(m => m.value === mode)?.label || mode

  const totalValeur = biens.filter(b => b.modeDetention !== 'LOCATION').reduce((sum, b) => sum + Number(b.valeurActuelle || 0), 0)
  const totalLoyers = biens.filter(b => b.modeDetention === 'LOCATION').reduce((sum, b) => sum + Number(b.loyerAnnuel || 0), 0)
  const biensEnPropriete = biens.filter(b => b.modeDetention !== 'LOCATION').length
  const biensEnLocation = biens.filter(b => b.modeDetention === 'LOCATION').length

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
          <div className="p-2 bg-amber-100 rounded-lg">
            <Building className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Immobilier Professionnel</h2>
            <p className="text-sm text-gray-500">Locaux, SCI, Investissements</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un bien
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Patrimoine immo</span>
              <Euro className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalValeur)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Loyers payés/an</span>
              <Key className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalLoyers)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Biens détenus</span>
              <Building className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{biensEnPropriete}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Locations</span>
              <Home className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{biensEnLocation}</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des biens */}
      {biens.length > 0 ? (
        <div className="space-y-4">
          {biens.map(bien => {
            const typeInfo = getTypeInfo(bien.type)
            const Icon = typeInfo.icon
            const isLocation = bien.modeDetention === 'LOCATION'
            return (
              <Card key={bien.id} className={isLocation ? 'border-amber-200' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${isLocation ? 'bg-amber-100' : 'bg-green-100'}`}>
                        <Icon className={`w-6 h-6 ${isLocation ? 'text-amber-600' : 'text-green-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{bien.libelle}</h3>
                          <Badge variant="outline">{typeInfo.label}</Badge>
                          <Badge className={isLocation ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
                            {getModeLabel(bien.modeDetention)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                          <MapPin className="w-3 h-3" />
                          {bien.adresse}
                        </p>
                        <div className="grid gap-4 md:grid-cols-4 mt-2">
                          {bien.surface && (
                            <div>
                              <p className="text-xs text-gray-500">Surface</p>
                              <p className="text-sm font-medium">{bien.surface} m²</p>
                            </div>
                          )}
                          {bien.valeurActuelle > 0 && !isLocation && (
                            <div>
                              <p className="text-xs text-gray-500">Valeur</p>
                              <p className="text-sm font-medium text-green-600">{formatCurrency(Number(bien.valeurActuelle))}</p>
                            </div>
                          )}
                          {bien.loyerAnnuel && (
                            <div>
                              <p className="text-xs text-gray-500">{isLocation ? 'Loyer annuel' : 'Revenus locatifs'}</p>
                              <p className={`text-sm font-medium ${isLocation ? 'text-amber-600' : 'text-green-600'}`}>{formatCurrency(bien.loyerAnnuel)}</p>
                            </div>
                          )}
                          {bien.dateAcquisition && (
                            <div>
                              <p className="text-xs text-gray-500">Acquisition</p>
                              <p className="text-sm font-medium">{new Date(bien.dateAcquisition).toLocaleDateString('fr-FR')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(bien)}><Edit className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(bien.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
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
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun bien immobilier</h3>
            <p className="text-gray-500 mb-4">Enregistrez les locaux professionnels et investissements immobiliers</p>
            <Button onClick={() => setShowAddDialog(true)}><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
          </CardContent>
        </Card>
      )}

      {/* Conseil */}
      {biensEnLocation > 0 && totalLoyers > 50000 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Opportunité d'optimisation</p>
                <p className="text-sm text-gray-600">
                  Avec {formatCurrency(totalLoyers)} de loyers annuels, l'acquisition via SCI ou crédit-bail 
                  pourrait être plus avantageuse fiscalement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog Ajout/Édition */}
      <Dialog open={showAddDialog || !!editingItem} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? 'Modifier le bien' : 'Ajouter un bien immobilier'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type *</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES_BIENS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Mode de détention *</label>
                <Select value={formData.modeDetention} onValueChange={(v) => setFormData({ ...formData, modeDetention: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODES_DETENTION.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Désignation *</label>
              <Input value={formData.libelle} onChange={(e) => setFormData({ ...formData, libelle: e.target.value })} placeholder="Ex: Siège social, Entrepôt Nord..." />
            </div>
            <div>
              <label className="text-sm font-medium">Adresse</label>
              <Input value={formData.adresse} onChange={(e) => setFormData({ ...formData, adresse: e.target.value })} placeholder="Adresse complète" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Surface (m²)</label>
                <Input type="number" value={formData.surface} onChange={(e) => setFormData({ ...formData, surface: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Date d'acquisition</label>
                <Input type="date" value={formData.dateAcquisition} onChange={(e) => setFormData({ ...formData, dateAcquisition: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {formData.modeDetention !== 'LOCATION' && (
                <div>
                  <label className="text-sm font-medium">Valeur (€)</label>
                  <Input type="number" value={formData.valeurActuelle} onChange={(e) => setFormData({ ...formData, valeurActuelle: e.target.value })} />
                </div>
              )}
              <div>
                <label className="text-sm font-medium">{formData.modeDetention === 'LOCATION' ? 'Loyer annuel (€)' : 'Revenus locatifs (€/an)'}</label>
                <Input type="number" value={formData.loyerAnnuel} onChange={(e) => setFormData({ ...formData, loyerAnnuel: e.target.value })} />
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

export default TabImmobilierPro
