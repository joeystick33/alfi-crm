 
'use client'

/**
 * Step PEA Détails - Formulaire Actif Financier
 * Spécificités PEA/PEA-PME : titres, dividendes, historique
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Button } from '@/app/_common/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { formatCurrency, cn } from '@/app/_common/lib/utils'
import { LineChart, Plus, Trash2, AlertCircle, Info,
  DollarSign, Target
} from 'lucide-react'
import type { ActifFinancier } from '@/app/_common/types/patrimoine.types'

interface StepPEADetailsProps {
  data: Partial<ActifFinancier>
  updateField: <K extends keyof ActifFinancier>(field: K, value: ActifFinancier[K]) => void
  updateNestedField: (parent: keyof ActifFinancier, field: string, value: any) => void
  errors: Record<string, string>
}

// Types de titres éligibles PEA
const TYPES_TITRES_PEA = [
  { value: 'ACTION', label: 'Actions', description: 'Actions de sociétés européennes' },
  { value: 'ETF', label: 'ETF / Trackers', description: 'Fonds indiciels cotés' },
  { value: 'OPCVM_ACTIONS', label: 'OPCVM Actions', description: 'Fonds actions éligibles' },
  { value: 'SICAV', label: 'SICAV', description: 'Sociétés d\'investissement' },
  { value: 'CERTIFICAT', label: 'Certificats', description: 'Certificats d\'investissement' },
  { value: 'WARRANT', label: 'Warrants', description: 'Warrants éligibles (rare)' },
]

// Indices de référence
const INDICES_REFERENCE = [
  { value: 'CAC40', label: 'CAC 40', description: 'France - Large caps' },
  { value: 'SBF120', label: 'SBF 120', description: 'France - Mid caps' },
  { value: 'EUROSTOXX50', label: 'Euro Stoxx 50', description: 'Zone Euro' },
  { value: 'STOXX600', label: 'Stoxx Europe 600', description: 'Europe large' },
  { value: 'MSCI_WORLD', label: 'MSCI World', description: 'Monde développé' },
  { value: 'MSCI_EUROPE', label: 'MSCI Europe', description: 'Europe' },
]

export function StepPEADetails({ data, updateField: _updateField, updateNestedField, errors: errors }: StepPEADetailsProps) {
  const peaDetails = data.peaDetails || {
    typePEA: 'PEA',
    versementsDepuisOuverture: 0,
    retraitsCumules: 0,
    dividendesPercus: 0,
    plusValuesRealisees: 0,
    lignes: [],
    indiceReference: 'CAC40',
  }

  const [lignes, setLignes] = useState(peaDetails.lignes || [])

  // Calculs
  const totalLignes = lignes.reduce((sum, l) => sum + (l.valorisation || 0), 0)
  const totalPRU = lignes.reduce((sum, l) => sum + ((l.pru || 0) * (l.quantite || 0)), 0)
  const plusValueLatenteLignes = totalLignes - totalPRU

  // Plafond PEA
  const plafondPEA = data.type === 'PEA_PME' ? 225000 : 150000
  const plafondUtilise = ((peaDetails.versementsDepuisOuverture || 0) / plafondPEA) * 100

  // Ajouter une ligne
  const addLigne = () => {
    const newLignes = [...lignes, {
      isin: '',
      nom: '',
      type: 'ACTION',
      quantite: 0,
      pru: 0,
      coursActuel: 0,
      valorisation: 0,
      poids: 0,
    }]
    setLignes(newLignes)
    updateNestedField('peaDetails', 'lignes', newLignes)
  }

  // Supprimer une ligne
  const removeLigne = (index: number) => {
    const newLignes = lignes.filter((_, i) => i !== index)
    setLignes(newLignes)
    updateNestedField('peaDetails', 'lignes', newLignes)
  }

  // Mettre à jour une ligne
  const updateLigne = (index: number, field: string, value: any) => {
    const newLignes = [...lignes]
    newLignes[index] = { ...newLignes[index], [field]: value }
    
    // Recalculer valorisation et poids
    if (field === 'quantite' || field === 'coursActuel') {
      const quantite = field === 'quantite' ? value : newLignes[index].quantite || 0
      const cours = field === 'coursActuel' ? value : newLignes[index].coursActuel || 0
      newLignes[index].valorisation = quantite * cours
    }
    
    // Recalculer les poids
    const total = newLignes.reduce((sum, l) => sum + (l.valorisation || 0), 0)
    newLignes.forEach(l => {
      l.poids = total > 0 ? ((l.valorisation || 0) / total) * 100 : 0
    })
    
    setLignes(newLignes)
    updateNestedField('peaDetails', 'lignes', newLignes)
  }

  return (
    <div className="space-y-6">
      {/* Type et plafonds */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Type de PEA et versements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type de plan</Label>
              <Select
                value={peaDetails.typePEA || 'PEA'}
                onValueChange={(value) => updateNestedField('peaDetails', 'typePEA', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PEA">
                    <div>
                      <span className="font-medium">PEA classique</span>
                      <p className="text-xs text-gray-500">Plafond 150 000€</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="PEA_PME">
                    <div>
                      <span className="font-medium">PEA-PME</span>
                      <p className="text-xs text-gray-500">Plafond cumulé 225 000€</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="PEA_JEUNE">
                    <div>
                      <span className="font-medium">PEA Jeune</span>
                      <p className="text-xs text-gray-500">18-25 ans, plafond 20 000€</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="versementsDepuisOuverture">Versements depuis ouverture (€)</Label>
              <Input
                id="versementsDepuisOuverture"
                type="number"
                min="0"
                value={peaDetails.versementsDepuisOuverture || ''}
                onChange={(e) => updateNestedField('peaDetails', 'versementsDepuisOuverture', parseFloat(e.target.value) || 0)}
                placeholder="100000"
              />
            </div>
          </div>

          {/* Jauge plafond */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Utilisation du plafond</span>
              <span className="text-sm">
                {formatCurrency(peaDetails.versementsDepuisOuverture || 0)} / {formatCurrency(plafondPEA)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full transition-all',
                  plafondUtilise >= 100 ? 'bg-red-500' : plafondUtilise >= 80 ? 'bg-amber-500' : 'bg-green-500'
                )}
                style={{ width: `${Math.min(plafondUtilise, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>{plafondUtilise.toFixed(1)}%</span>
              {plafondUtilise < 100 && (
                <span>Reste : {formatCurrency(plafondPEA - (peaDetails.versementsDepuisOuverture || 0))}</span>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="retraitsCumules">Retraits cumulés (€)</Label>
              <Input
                id="retraitsCumules"
                type="number"
                min="0"
                value={peaDetails.retraitsCumules || ''}
                onChange={(e) => updateNestedField('peaDetails', 'retraitsCumules', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Indice de référence</Label>
              <Select
                value={peaDetails.indiceReference || 'CAC40'}
                onValueChange={(value) => updateNestedField('peaDetails', 'indiceReference', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDICES_REFERENCE.map((indice) => (
                    <SelectItem key={indice.value} value={indice.value}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{indice.label}</span>
                        <span className="text-xs text-gray-500">{indice.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique dividendes et plus-values */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-600" />
            Dividendes et plus-values réalisées
          </CardTitle>
          <CardDescription>
            Historique des revenus perçus (capitalisés dans le PEA)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dividendesPercus">Dividendes perçus cumulés (€)</Label>
              <Input
                id="dividendesPercus"
                type="number"
                min="0"
                value={peaDetails.dividendesPercus || ''}
                onChange={(e) => updateNestedField('peaDetails', 'dividendesPercus', parseFloat(e.target.value) || 0)}
                placeholder="5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plusValuesRealisees">Plus-values réalisées cumulées (€)</Label>
              <Input
                id="plusValuesRealisees"
                type="number"
                value={peaDetails.plusValuesRealisees || ''}
                onChange={(e) => updateNestedField('peaDetails', 'plusValuesRealisees', parseFloat(e.target.value) || 0)}
                placeholder="10000"
              />
            </div>
          </div>

          <Alert className="bg-green-50 border-green-200">
            <Info className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-800">
              Les dividendes et plus-values sont capitalisés dans le PEA et exonérés d'IR après 5 ans 
              (prélèvements sociaux de 17,2% uniquement).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Lignes du portefeuille */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LineChart className="h-5 w-5 text-indigo-600" />
            Composition du portefeuille
          </CardTitle>
          <CardDescription>
            Détail des lignes de titres
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Résumé */}
          {lignes.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-500">Valorisation totale</p>
                <p className="text-lg font-bold">{formatCurrency(totalLignes)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-500">Prix de revient total</p>
                <p className="text-lg font-bold">{formatCurrency(totalPRU)}</p>
              </div>
              <div className={cn(
                'p-3 rounded-lg border',
                plusValueLatenteLignes >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              )}>
                <p className="text-xs text-gray-500">Plus/moins-value latente</p>
                <p className={cn(
                  'text-lg font-bold',
                  plusValueLatenteLignes >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {plusValueLatenteLignes >= 0 ? '+' : ''}{formatCurrency(plusValueLatenteLignes)}
                </p>
              </div>
            </div>
          )}

          {/* Liste des lignes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Lignes de titres ({lignes.length})</h4>
              <Button variant="outline" size="sm" onClick={addLigne}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter un titre
              </Button>
            </div>

            {lignes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <LineChart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Aucune ligne renseignée</p>
                <p className="text-xs">Cliquez sur "Ajouter un titre" pour commencer</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lignes.map((ligne, index) => {
                  const pv = (ligne.valorisation || 0) - ((ligne.pru || 0) * (ligne.quantite || 0))
                  const pvPercent = (ligne.pru || 0) * (ligne.quantite || 0) > 0 
                    ? (pv / ((ligne.pru || 0) * (ligne.quantite || 0))) * 100 
                    : 0
                  
                  return (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="grid gap-3 md:grid-cols-6 items-end">
                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-xs">Titre / ISIN</Label>
                          <Input
                            value={ligne.nom || ''}
                            onChange={(e) => updateLigne(index, 'nom', e.target.value)}
                            placeholder="Total Energies"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={ligne.type || 'ACTION'}
                            onValueChange={(value) => updateLigne(index, 'type', value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TYPES_TITRES_PEA.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Quantité</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={ligne.quantite || ''}
                            onChange={(e) => updateLigne(index, 'quantite', parseFloat(e.target.value) || 0)}
                            placeholder="100"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">PRU (€)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ligne.pru || ''}
                            onChange={(e) => updateLigne(index, 'pru', parseFloat(e.target.value) || 0)}
                            placeholder="45.50"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Cours actuel (€)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ligne.coursActuel || ''}
                            onChange={(e) => updateLigne(index, 'coursActuel', parseFloat(e.target.value) || 0)}
                            placeholder="52.30"
                            className="h-9"
                          />
                        </div>
                      </div>
                      
                      {/* Ligne résumé */}
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            Valo: <span className="font-medium text-gray-900">{formatCurrency(ligne.valorisation || 0)}</span>
                          </span>
                          <span className={cn(
                            pv >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {pv >= 0 ? '+' : ''}{formatCurrency(pv)} ({pvPercent >= 0 ? '+' : ''}{pvPercent.toFixed(1)}%)
                          </span>
                          <span className="text-gray-500">
                            Poids: <span className="font-medium">{(ligne.poids || 0).toFixed(1)}%</span>
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLigne(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertes fiscales */}
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm text-amber-800">
          <strong>Attention :</strong> Un retrait avant 5 ans entraîne la clôture du plan et l'imposition 
          des gains au PFU (30%). Après 5 ans, seuls les PS (17,2%) sont dus.
          <br />
          <span className="text-xs">Les retraits partiels sont possibles après 5 ans sans clôture (depuis loi PACTE 2019).</span>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export default StepPEADetails
