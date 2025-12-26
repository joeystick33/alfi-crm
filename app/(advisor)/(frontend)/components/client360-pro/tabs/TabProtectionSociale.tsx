'use client'

/**
 * TabProtectionSociale - Protection sociale collective (connecté API)
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Shield, Plus, Euro, Heart, Clock, Edit, Trash2, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'

// Types alignés avec Prisma TypeProtectionSocialePro
const TYPES_CONTRATS = [
  { value: 'SANTE_COLLECTIVE', label: 'Santé collective (Mutuelle)', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  { value: 'PREVOYANCE_COLLECTIVE', label: 'Prévoyance collective', icon: Shield, color: 'bg-blue-100 text-blue-600' },
  { value: 'RETRAITE_COLLECTIVE', label: 'Retraite collective', icon: Clock, color: 'bg-purple-100 text-purple-600' },
  { value: 'PREVOYANCE_TNS', label: 'Prévoyance TNS', icon: Shield, color: 'bg-indigo-100 text-indigo-600' },
  { value: 'MADELIN_SANTE', label: 'Madelin Santé', icon: Heart, color: 'bg-rose-100 text-rose-600' },
  { value: 'MADELIN_PREVOYANCE', label: 'Madelin Prévoyance', icon: Shield, color: 'bg-cyan-100 text-cyan-600' },
  { value: 'MADELIN_RETRAITE', label: 'Madelin Retraite', icon: Clock, color: 'bg-violet-100 text-violet-600' },
]

interface ProtectionSocialePro {
  id: string
  type: string
  libelle: string
  assureur?: string | null
  numeroContrat?: string | null
  cotisationAnnuelle?: number | null
  partPatronale?: number | null
  partSalariale?: number | null
  garanties?: any
  beneficiaires?: any
  dateEffet?: string | null
  dateEcheance?: string | null
  notes?: string | null
}

interface TabProtectionSocialeProps {
  clientId: string
  client: ClientDetail
  wealthSummary?: WealthSummary
}

export function TabProtectionSociale({ clientId, client }: TabProtectionSocialeProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingContrat, setEditingContrat] = useState<ProtectionSocialePro | null>(null)
  const [formData, setFormData] = useState({
    type: 'SANTE_COLLECTIVE', assureur: '', dateEffet: '', dateEcheance: '',
    cotisationAnnuelle: '', partPatronale: '', garanties: '', notes: '',
  })

  // Fetch depuis l'API
  const { data, isLoading } = useQuery({
    queryKey: ['protection-sociale-pro', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/advisor/clients/${clientId}/protection-sociale-pro`)
      if (!res.ok) throw new Error('Erreur chargement')
      const json = await res.json()
      return json.data?.protectionSocialePro || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/protection-sociale-pro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      })
      if (!res.ok) throw new Error('Erreur création')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protection-sociale-pro', clientId] })
      toast({ title: 'Contrat ajouté' })
      closeDialog()
    },
    onError: () => toast({ title: 'Erreur lors de l\'ajout', variant: 'destructive' }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/protection-sociale-pro/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur mise à jour')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protection-sociale-pro', clientId] })
      toast({ title: 'Contrat modifié' })
      closeDialog()
    },
    onError: () => toast({ title: 'Erreur lors de la modification', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/protection-sociale-pro/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erreur suppression')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protection-sociale-pro', clientId] })
      toast({ title: 'Contrat supprimé' })
    },
    onError: () => toast({ title: 'Erreur lors de la suppression', variant: 'destructive' }),
  })

  const contrats: ProtectionSocialePro[] = data || []

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '-'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  const closeDialog = () => {
    setFormData({ type: 'SANTE_COLLECTIVE', assureur: '', dateEffet: '', dateEcheance: '', cotisationAnnuelle: '', partPatronale: '', garanties: '', notes: '' })
    setShowAddDialog(false)
    setEditingContrat(null)
  }

  const openEdit = (contrat: ProtectionSocialePro) => {
    setEditingContrat(contrat)
    setFormData({
      type: contrat.type,
      assureur: contrat.assureur || '',
      dateEffet: contrat.dateEffet ? new Date(contrat.dateEffet).toISOString().split('T')[0] : '',
      dateEcheance: contrat.dateEcheance ? new Date(contrat.dateEcheance).toISOString().split('T')[0] : '',
      cotisationAnnuelle: contrat.cotisationAnnuelle?.toString() || '',
      partPatronale: contrat.partPatronale?.toString() || '',
      garanties: contrat.garanties || '',
      notes: contrat.notes || '',
    })
  }

  const handleSubmit = () => {
    if (!formData.assureur) {
      toast({ title: 'Erreur', description: 'Assureur obligatoire', variant: 'destructive' })
      return
    }
    const payload = {
      type: formData.type,
      libelle: `${TYPES_CONTRATS.find(t => t.value === formData.type)?.label || formData.type}`,
      assureur: formData.assureur,
      cotisationAnnuelle: formData.cotisationAnnuelle ? Number(formData.cotisationAnnuelle) : null,
      partPatronale: formData.partPatronale ? Number(formData.partPatronale) : null,
      dateEffet: formData.dateEffet || null,
      dateEcheance: formData.dateEcheance || null,
      garanties: formData.garanties || null,
      notes: formData.notes || null,
    }
    if (editingContrat) {
      updateMutation.mutate({ id: editingContrat.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const getTypeInfo = (type: string) => TYPES_CONTRATS.find(t => t.value === type) || TYPES_CONTRATS[0]

  const hasSante = contrats.some(c => c.type.includes('SANTE'))
  const hasPrevoyance = contrats.some(c => c.type.includes('PREVOYANCE'))
  const hasRetraite = contrats.some(c => c.type.includes('RETRAITE'))
  const totalPrimes = contrats.reduce((sum, c) => sum + Number(c.cotisationAnnuelle || 0), 0)

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
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Protection Sociale</h2>
            <p className="text-sm text-gray-500">Santé, Prévoyance, Retraite collective</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un contrat
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={hasSante ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Mutuelle</span>
              {hasSante ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
            </div>
            <p className="text-xl font-bold">{hasSante ? 'Conforme' : 'OBLIGATOIRE'}</p>
            {!hasSante && <p className="text-xs text-red-600">ANI 2016 - Obligation légale</p>}
          </CardContent>
        </Card>

        <Card className={hasPrevoyance ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Prévoyance</span>
              {hasPrevoyance ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />}
            </div>
            <p className="text-xl font-bold">{hasPrevoyance ? 'En place' : 'Non souscrite'}</p>
          </CardContent>
        </Card>

        <Card className={hasRetraite ? 'border-green-200 bg-green-50' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Retraite supp.</span>
              {hasRetraite ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-gray-400" />}
            </div>
            <p className="text-xl font-bold">{hasRetraite ? 'En place' : 'Non souscrite'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Budget annuel</span>
              <Euro className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalPrimes)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contrats */}
      {contrats.length > 0 ? (
        <div className="space-y-4">
          {contrats.map(contrat => {
            const typeInfo = getTypeInfo(contrat.type)
            const Icon = typeInfo.icon
            return (
              <Card key={contrat.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${typeInfo.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{typeInfo.label}</h3>
                          <Badge variant="outline">{contrat.assureur}</Badge>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3 mt-3">
                          <div>
                            <p className="text-xs text-gray-500">Date effet</p>
                            <p className="text-sm font-medium">{new Date(contrat.dateEffet).toLocaleDateString('fr-FR')}</p>
                          </div>
                          {contrat.cotisationAnnuelle && (
                            <div>
                              <p className="text-xs text-gray-500">Cotisation annuelle</p>
                              <p className="text-sm font-medium">{formatCurrency(Number(contrat.cotisationAnnuelle))}</p>
                            </div>
                          )}
                          {contrat.partPatronale && (
                            <div>
                              <p className="text-xs text-gray-500">Part employeur</p>
                              <p className="text-sm font-medium">{contrat.partPatronale}%</p>
                            </div>
                          )}
                        </div>
                        {contrat.garanties && <p className="text-sm text-gray-600 mt-2">{contrat.garanties}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(contrat)}><Edit className="w-4 h-4 text-gray-400" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(contrat.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
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
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun contrat enregistré</h3>
            <p className="text-gray-500 mb-4">Attention : la mutuelle collective est obligatoire (ANI 2016)</p>
            <Button onClick={() => setShowAddDialog(true)}><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
          </CardContent>
        </Card>
      )}

      {/* Opportunités */}
      {(!hasSante || !hasPrevoyance) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800"><Info className="w-5 h-5" />Points d'attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!hasSante && (
              <div className="p-3 bg-white rounded-lg border border-red-200">
                <p className="font-medium text-red-800">Mutuelle obligatoire manquante</p>
                <p className="text-sm text-gray-600">Depuis le 1er janvier 2016 (ANI), toutes les entreprises doivent proposer une complémentaire santé à leurs salariés.</p>
              </div>
            )}
            {!hasPrevoyance && (
              <div className="p-3 bg-white rounded-lg border border-amber-200">
                <p className="font-medium text-amber-800">Prévoyance conseillée</p>
                <p className="text-sm text-gray-600">Protection des salariés et de leurs familles (décès, invalidité, incapacité). Obligatoire pour les cadres (CCN).</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog Ajout/Édition */}
      <Dialog open={showAddDialog || !!editingContrat} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingContrat ? 'Modifier le contrat' : 'Ajouter un contrat de protection sociale'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Type *</label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES_CONTRATS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Assureur *</label>
              <Input value={formData.assureur} onChange={(e) => setFormData({ ...formData, assureur: e.target.value })} placeholder="Nom de l'assureur" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date d'effet *</label>
                <Input type="date" value={formData.dateEffet} onChange={(e) => setFormData({ ...formData, dateEffet: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Date d'échéance</label>
                <Input type="date" value={formData.dateEcheance} onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Cotisation annuelle (€)</label>
                <Input type="number" value={formData.cotisationAnnuelle} onChange={(e) => setFormData({ ...formData, cotisationAnnuelle: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Part employeur (%)</label>
                <Input type="number" value={formData.partPatronale} onChange={(e) => setFormData({ ...formData, partPatronale: e.target.value })} placeholder="50 minimum pour santé" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Garanties</label>
              <textarea value={formData.garanties} onChange={(e) => setFormData({ ...formData, garanties: e.target.value })} placeholder="Détail des garanties..." className="w-full h-20 p-3 border rounded-lg" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annuler</Button>
            <Button onClick={handleSubmit}>{editingContrat ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TabProtectionSociale
