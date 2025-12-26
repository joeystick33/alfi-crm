'use client'

/**
 * TabEpargneSalariale - Gestion de l'épargne salariale (connecté API)
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/_common/components/ui/Dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import { 
  PiggyBank,
  Plus,
  Euro,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  Info,
  Calculator,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/app/_common/hooks/use-toast'
import type { ClientDetail, WealthSummary } from '@/app/_common/lib/api-types'

// Types de dispositifs (alignés avec Prisma TypeEpargneSalariale)
const TYPES_DISPOSITIFS = [
  { value: 'PEE', label: 'PEE - Plan d\'Épargne Entreprise', icon: PiggyBank },
  { value: 'PEG', label: 'PEG - Plan d\'Épargne Groupe', icon: PiggyBank },
  { value: 'PERCO', label: 'PERCO', icon: PiggyBank },
  { value: 'PERECO', label: 'PER Collectif (PERECO)', icon: PiggyBank },
  { value: 'CET', label: 'Compte Épargne Temps', icon: Euro },
  { value: 'PARTICIPATION', label: 'Participation', icon: Euro },
  { value: 'INTERESSEMENT', label: 'Intéressement', icon: Euro },
  { value: 'STOCK_OPTIONS', label: 'Stock-options', icon: TrendingUp },
  { value: 'ACTIONS_GRATUITES', label: 'Actions gratuites', icon: TrendingUp },
  { value: 'BSPCE', label: 'BSPCE', icon: TrendingUp },
]

interface EpargneSalariale {
  id: string
  type: string
  libelle: string
  organisme?: string | null
  employeur?: string | null
  montantVerse: number
  montantActuel: number
  montantAbonde?: number | null
  dateOuverture?: string | null
  dateDisponibilite?: string | null
  supports?: any
  performanceYTD?: number | null
  notes?: string | null
}

interface TabEpargneSalarialeProps {
  clientId: string
  client: ClientDetail
  wealthSummary?: WealthSummary
}

export function TabEpargneSalariale({ clientId, client }: TabEpargneSalarialeProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editing, setEditing] = useState<EpargneSalariale | null>(null)

  // Fetch épargne salariale depuis l'API
  const { data, isLoading } = useQuery({
    queryKey: ['epargne-salariale', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/advisor/clients/${clientId}/epargne-salariale`)
      if (!res.ok) throw new Error('Erreur chargement')
      const json = await res.json()
      return json.data?.epargneSalariale || []
    },
  })

  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/epargne-salariale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      })
      if (!res.ok) throw new Error('Erreur création')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epargne-salariale', clientId] })
      toast({ title: 'Dispositif ajouté' })
      resetForm()
    },
    onError: () => toast({ title: 'Erreur lors de l\'ajout', variant: 'destructive' }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/advisor/clients/${clientId}/epargne-salariale/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Erreur suppression')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epargne-salariale', clientId] })
      toast({ title: 'Dispositif supprimé' })
    },
    onError: () => toast({ title: 'Erreur lors de la suppression', variant: 'destructive' }),
  })

  const dispositifs: EpargneSalariale[] = data || []

  // Nouveau dispositif
  const [newDispositif, setNewDispositif] = useState({
    type: 'PEE',
    teneur: '',
    dateSignature: '',
    dateEcheance: '',
    encours: '',
    tauxAbondement: '',
    plafondAbondement: '',
    nombreBeneficiaires: '',
    notes: '',
  })

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '-'
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value)
  }

  const resetForm = () => {
    setNewDispositif({
      type: 'PEE',
      teneur: '',
      dateSignature: '',
      dateEcheance: '',
      encours: '',
      tauxAbondement: '',
      plafondAbondement: '',
      nombreBeneficiaires: '',
      notes: '',
    })
    setShowAddDialog(false)
  }

  const handleAddDispositif = () => {
    if (!newDispositif.teneur) {
      toast({ title: 'Erreur', description: 'Organisme obligatoire', variant: 'destructive' })
      return
    }

    const payload = {
      type: newDispositif.type,
      libelle: `${newDispositif.type} - ${newDispositif.teneur}`,
      organisme: newDispositif.teneur,
      montantVerse: newDispositif.encours ? Number(newDispositif.encours) : 0,
      montantActuel: newDispositif.encours ? Number(newDispositif.encours) : 0,
      montantAbonde: newDispositif.plafondAbondement ? Number(newDispositif.plafondAbondement) : null,
      dateOuverture: newDispositif.dateSignature || null,
      dateDisponibilite: newDispositif.dateEcheance || null,
      notes: newDispositif.notes || null,
    }

    createMutation.mutate(payload)
  }

  const handleDeleteDispositif = (id: string) => {
    deleteMutation.mutate(id)
  }

  const getTypeInfo = (type: string) => {
    return TYPES_DISPOSITIFS.find(t => t.value === type) || TYPES_DISPOSITIFS[0]
  }

  // Calculs
  const totalEncours = dispositifs.reduce((sum, d) => sum + Number(d.montantActuel || 0), 0)
  const hasPEE = dispositifs.some(d => d.type === 'PEE' || d.type === 'PEG')
  const hasPER = dispositifs.some(d => d.type === 'PERCO' || d.type === 'PERECO')
  const hasInteressement = dispositifs.some(d => d.type === 'INTERESSEMENT')
  const hasParticipation = dispositifs.some(d => d.type === 'PARTICIPATION')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <PiggyBank className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Épargne Salariale</h2>
            <p className="text-sm text-gray-500">PEE, PERCO, PER Collectif, Intéressement, Participation</p>
          </div>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un dispositif
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Encours total</span>
              <Euro className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalEncours)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Dispositifs</span>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{dispositifs.length}</p>
            <p className="text-sm text-gray-500">en place</p>
          </CardContent>
        </Card>

        <Card className={hasPEE ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">PEE</span>
              {hasPEE ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <p className="text-xl font-bold text-gray-900">
              {hasPEE ? 'En place' : 'Non souscrit'}
            </p>
          </CardContent>
        </Card>

        <Card className={hasPER ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">PER Collectif</span>
              {hasPER ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <p className="text-xl font-bold text-gray-900">
              {hasPER ? 'En place' : 'Non souscrit'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des dispositifs */}
      {dispositifs.length > 0 ? (
        <div className="space-y-4">
          {dispositifs.map(dispositif => {
            const typeInfo = getTypeInfo(dispositif.type)
            const Icon = typeInfo.icon
            return (
              <Card key={dispositif.id} className="hover:border-gray-300 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Icon className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{dispositif.libelle || typeInfo.label}</h3>
                          {dispositif.organisme && <Badge variant="outline">{dispositif.organisme}</Badge>}
                        </div>
                        <div className="grid gap-4 md:grid-cols-4 mt-3">
                          {dispositif.dateOuverture && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Date ouverture</p>
                              <p className="text-sm font-medium">
                                {new Date(dispositif.dateOuverture).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          )}
                          {dispositif.montantActuel !== undefined && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Encours</p>
                              <p className="text-sm font-medium text-green-600">
                                {formatCurrency(Number(dispositif.montantActuel))}
                              </p>
                            </div>
                          )}
                          {dispositif.montantAbonde !== undefined && dispositif.montantAbonde !== null && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Abondement</p>
                              <p className="text-sm font-medium">
                                {formatCurrency(Number(dispositif.montantAbonde))}
                              </p>
                            </div>
                          )}
                          {dispositif.dateDisponibilite && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Disponibilité</p>
                              <p className="text-sm font-medium">{new Date(dispositif.dateDisponibilite).toLocaleDateString('fr-FR')}</p>
                            </div>
                          )}
                        </div>
                        {dispositif.notes && (
                          <p className="text-sm text-gray-600 mt-2">{dispositif.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteDispositif(dispositif.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
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
            <PiggyBank className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun dispositif en place</h3>
            <p className="text-gray-500 mb-4">
              Cette entreprise n'a pas encore de dispositif d'épargne salariale enregistré.
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un dispositif
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Opportunités */}
      {(!hasPEE || !hasPER || !hasInteressement) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="w-5 h-5" />
              Opportunités commerciales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!hasPEE && (
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <PiggyBank className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Plan d'Épargne Entreprise (PEE)</p>
                      <p className="text-sm text-gray-600">
                        Dispositif incontournable. Versements volontaires + abondement entreprise.
                        Exonération sociale et fiscale sur les plus-values après 5 ans.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!hasPER && (
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Calculator className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">PER Collectif</p>
                      <p className="text-sm text-gray-600">
                        Successeur du PERCO. Épargne retraite avec sortie en capital ou rente.
                        Déduction fiscale des versements pour les salariés.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!hasInteressement && (
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Accord d'intéressement</p>
                      <p className="text-sm text-gray-600">
                        Prime collective liée aux performances. Exonération de charges sociales.
                        Outil de motivation et fidélisation des salariés.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog ajout dispositif */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un dispositif d'épargne salariale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Type de dispositif *</label>
              <Select value={newDispositif.type} onValueChange={(v) => setNewDispositif({ ...newDispositif, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_DISPOSITIFS.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Teneur de compte / Gestionnaire *</label>
              <Input
                value={newDispositif.teneur}
                onChange={(e) => setNewDispositif({ ...newDispositif, teneur: e.target.value })}
                placeholder="Ex: Amundi, Natixis, BNP..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Date de signature *</label>
                <Input
                  type="date"
                  value={newDispositif.dateSignature}
                  onChange={(e) => setNewDispositif({ ...newDispositif, dateSignature: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Date d'échéance</label>
                <Input
                  type="date"
                  value={newDispositif.dateEcheance}
                  onChange={(e) => setNewDispositif({ ...newDispositif, dateEcheance: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Encours (€)</label>
              <Input
                type="number"
                value={newDispositif.encours}
                onChange={(e) => setNewDispositif({ ...newDispositif, encours: e.target.value })}
                placeholder="Montant total des avoirs"
              />
            </div>

            {(newDispositif.type === 'PEE' || newDispositif.type === 'PERCO' || newDispositif.type === 'PER_COLLECTIF') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Taux d'abondement (%)</label>
                  <Input
                    type="number"
                    value={newDispositif.tauxAbondement}
                    onChange={(e) => setNewDispositif({ ...newDispositif, tauxAbondement: e.target.value })}
                    placeholder="Ex: 100, 200, 300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Plafond abondement (€)</label>
                  <Input
                    type="number"
                    value={newDispositif.plafondAbondement}
                    onChange={(e) => setNewDispositif({ ...newDispositif, plafondAbondement: e.target.value })}
                    placeholder="Plafond annuel"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">Nombre de bénéficiaires</label>
              <Input
                type="number"
                value={newDispositif.nombreBeneficiaires}
                onChange={(e) => setNewDispositif({ ...newDispositif, nombreBeneficiaires: e.target.value })}
                placeholder="Nombre de salariés bénéficiaires"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={newDispositif.notes}
                onChange={(e) => setNewDispositif({ ...newDispositif, notes: e.target.value })}
                placeholder="Informations complémentaires..."
                className="w-full h-20 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddDispositif}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TabEpargneSalariale
