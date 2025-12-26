'use client'
 

/**
 * Step Location - Formulaire Bien Immobilier
 * Détails de la location, loyers, locataire, garanties
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Separator } from '@/app/_common/components/ui/Separator'
import { formatCurrency, formatPercentage, cn } from '@/app/_common/lib/utils'
import { Home, Euro, Percent, Users, Shield, 
  TrendingUp, AlertCircle, Info
} from 'lucide-react'
import type { BienImmobilier } from '@/app/_common/types/patrimoine.types'

interface StepLocationProps {
  data: Partial<BienImmobilier>
  updateField: <K extends keyof BienImmobilier>(field: K, value: BienImmobilier[K]) => void
  updateNestedField: (parent: keyof BienImmobilier, field: string, value: any) => void
  errors: Record<string, string>
}

// Types de garanties locatives
const GARANTIES_LOCATIVES = [
  { 
    value: 'CAUTION_SOLIDAIRE', 
    label: 'Caution solidaire', 
    description: 'Un garant (parent, proche) se porte caution',
    avantages: 'Gratuit, engagement du garant',
    inconvenients: 'Procédure longue en cas d\'impayé'
  },
  { 
    value: 'GLI', 
    label: 'GLI (Garantie Loyers Impayés)', 
    description: 'Assurance couvrant les impayés',
    avantages: 'Couverture immédiate, prise en charge procédure',
    inconvenients: 'Coût (2-4% du loyer), conditions d\'éligibilité locataire'
  },
  { 
    value: 'VISALE', 
    label: 'Visale', 
    description: 'Garantie gratuite Action Logement',
    avantages: 'Gratuit pour bailleur et locataire',
    inconvenients: 'Conditions d\'éligibilité strictes, plafonds'
  },
  { 
    value: 'GARANT_PHYSIQUE', 
    label: 'Garant physique certifié', 
    description: 'Service de cautionnement (Garantme, Unkle...)',
    avantages: 'Rapide, sécurisé',
    inconvenients: 'Coût pour le locataire'
  },
]

export function StepLocation({ data, updateField, updateNestedField, errors: errors }: StepLocationProps) {
  const locationDetails = data.locationDetails || {
    typeLocation: 'NUE',
    typeBail: 'BAIL_3_ANS',
    dateDebutBail: '',
    dateFinBail: '',
    loyerHC: 0,
    chargesRecuperables: 0,
    loyerCC: 0,
    depotGarantie: 0,
    tauxOccupation: 100,
    nomLocataire: '',
    garanties: [],
  }

  // Calculs
  const calculations = useMemo(() => {
    const loyerHC = locationDetails.loyerHC || 0
    const chargesRecup = locationDetails.chargesRecuperables || 0
    const loyerCC = loyerHC + chargesRecup
    const loyerAnnuel = loyerHC * 12
    const tauxOccupation = locationDetails.tauxOccupation || 100
    const loyerAnnuelEffectif = loyerAnnuel * (tauxOccupation / 100)
    const valorisation = data.valorisationActuelle || 0
    const rendementBrut = valorisation > 0 ? (loyerAnnuel / valorisation) * 100 : 0
    const rendementBrutEffectif = valorisation > 0 ? (loyerAnnuelEffectif / valorisation) * 100 : 0
    
    // Dépôt de garantie légal
    const depotLegal = locationDetails.typeLocation === 'MEUBLEE' ? loyerCC * 2 : loyerHC

    return {
      loyerCC,
      loyerAnnuel,
      loyerAnnuelEffectif,
      rendementBrut,
      rendementBrutEffectif,
      depotLegal,
    }
  }, [locationDetails, data.valorisationActuelle])

  // Gestion des garanties
  const toggleGarantie = (garantie: string) => {
    const current = locationDetails.garanties || []
    const updated = current.includes(garantie as any)
      ? current.filter(g => g !== garantie)
      : [...current, garantie as any]
    updateNestedField('locationDetails', 'garanties', updated)
  }

  return (
    <div className="space-y-6">
      {/* Switch location */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              checked={data.estLoue || false}
              onChange={(checked) => updateField('estLoue', checked)}
            />
            <div>
              <Label className="font-medium cursor-pointer">Ce bien est actuellement loué</Label>
              <p className="text-sm text-gray-500">
                Cochez si le bien génère des revenus locatifs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.estLoue && (
        <>
          {/* Type de location */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                Type de location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Type de location</Label>
                  <Select
                    value={locationDetails.typeLocation}
                    onValueChange={(value) => updateNestedField('locationDetails', 'typeLocation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NUE">
                        <div>
                          <span className="font-medium">Location nue</span>
                          <p className="text-xs text-gray-500">Revenus fonciers - Bail 3 ans</p>
                        </div>
                      </SelectItem>
                      <SelectItem value="MEUBLEE">
                        <div>
                          <span className="font-medium">Location meublée</span>
                          <p className="text-xs text-gray-500">BIC - Bail 1 an - LMNP/LMP</p>
                        </div>
                      </SelectItem>
                      <SelectItem value="SAISONNIERE">
                        <div>
                          <span className="font-medium">Location saisonnière</span>
                          <p className="text-xs text-gray-500">Courte durée - Airbnb, Booking...</p>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {locationDetails.typeLocation === 'NUE' && 'Fiscalité : revenus fonciers (micro ou réel)'}
                    {locationDetails.typeLocation === 'MEUBLEE' && 'Fiscalité : BIC (micro-BIC ou réel avec amortissement)'}
                    {locationDetails.typeLocation === 'SAISONNIERE' && 'Fiscalité : BIC - Déclaration mairie obligatoire'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Type de bail</Label>
                  <Select
                    value={locationDetails.typeBail}
                    onValueChange={(value) => updateNestedField('locationDetails', 'typeBail', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAIL_3_ANS">
                        <div>
                          <span className="font-medium">Bail 3 ans</span>
                          <p className="text-xs text-gray-500">Location vide - Bailleur particulier</p>
                        </div>
                      </SelectItem>
                      <SelectItem value="BAIL_6_ANS">
                        <div>
                          <span className="font-medium">Bail 6 ans</span>
                          <p className="text-xs text-gray-500">Location vide - Bailleur personne morale</p>
                        </div>
                      </SelectItem>
                      <SelectItem value="BAIL_1_AN_MEUBLE">
                        <div>
                          <span className="font-medium">Bail 1 an meublé</span>
                          <p className="text-xs text-gray-500">Location meublée classique</p>
                        </div>
                      </SelectItem>
                      <SelectItem value="BAIL_MOBILITE">
                        <div>
                          <span className="font-medium">Bail mobilité</span>
                          <p className="text-xs text-gray-500">1 à 10 mois - Non renouvelable</p>
                        </div>
                      </SelectItem>
                      <SelectItem value="SAISONNIER">
                        <div>
                          <span className="font-medium">Contrat saisonnier</span>
                          <p className="text-xs text-gray-500">Location courte durée</p>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates du bail */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateDebutBail">Date de début du bail</Label>
                  <Input
                    id="dateDebutBail"
                    type="date"
                    value={locationDetails.dateDebutBail}
                    onChange={(e) => updateNestedField('locationDetails', 'dateDebutBail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFinBail">Date de fin du bail</Label>
                  <Input
                    id="dateFinBail"
                    type="date"
                    value={locationDetails.dateFinBail}
                    onChange={(e) => updateNestedField('locationDetails', 'dateFinBail', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loyers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" />
                Loyers et charges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="loyerHC">Loyer hors charges (€/mois)</Label>
                  <Input
                    id="loyerHC"
                    type="number"
                    min="0"
                    step="10"
                    value={locationDetails.loyerHC || ''}
                    onChange={(e) => updateNestedField('locationDetails', 'loyerHC', parseFloat(e.target.value) || 0)}
                    placeholder="800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chargesRecuperables">Charges récupérables (€/mois)</Label>
                  <Input
                    id="chargesRecuperables"
                    type="number"
                    min="0"
                    step="10"
                    value={locationDetails.chargesRecuperables || ''}
                    onChange={(e) => updateNestedField('locationDetails', 'chargesRecuperables', parseFloat(e.target.value) || 0)}
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Loyer charges comprises (€/mois)</Label>
                  <div className="h-10 px-3 flex items-center bg-gray-100 rounded-md border font-semibold">
                    {formatCurrency(calculations.loyerCC)}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="depotGarantie">Dépôt de garantie (€)</Label>
                  <Input
                    id="depotGarantie"
                    type="number"
                    min="0"
                    value={locationDetails.depotGarantie || ''}
                    onChange={(e) => updateNestedField('locationDetails', 'depotGarantie', parseFloat(e.target.value) || 0)}
                    placeholder={Math.round(calculations.depotLegal).toString()}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum légal : {locationDetails.typeLocation === 'MEUBLEE' ? '2 mois CC' : '1 mois HC'} = {formatCurrency(calculations.depotLegal)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tauxOccupation">Taux d'occupation annuel (%)</Label>
                  <Input
                    id="tauxOccupation"
                    type="number"
                    min="0"
                    max="100"
                    value={locationDetails.tauxOccupation || 100}
                    onChange={(e) => updateNestedField('locationDetails', 'tauxOccupation', parseFloat(e.target.value) || 100)}
                  />
                  <p className="text-xs text-gray-500">
                    100% = loué toute l'année, 92% = 1 mois de vacance
                  </p>
                </div>
              </div>

              {/* Récap loyers */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 mb-1">Loyer annuel brut</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(calculations.loyerAnnuel)}
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-700 mb-1">Loyer annuel effectif ({locationDetails.tauxOccupation}%)</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(calculations.loyerAnnuelEffectif)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Locataire */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Locataire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomLocataire">Nom du locataire actuel</Label>
                <Input
                  id="nomLocataire"
                  value={locationDetails.nomLocataire || ''}
                  onChange={(e) => updateNestedField('locationDetails', 'nomLocataire', e.target.value)}
                  placeholder="Nom et prénom du locataire"
                />
              </div>
            </CardContent>
          </Card>

          {/* Garanties */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Garanties locatives
              </CardTitle>
              <CardDescription>
                Sélectionnez les garanties mises en place pour ce bail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {GARANTIES_LOCATIVES.map((garantie) => {
                  const isSelected = locationDetails.garanties?.includes(garantie.value as any) || false
                  return (
                    <label
                      key={garantie.value}
                      className={cn(
                        'p-4 rounded-lg border cursor-pointer transition-colors',
                        isSelected 
                          ? 'bg-purple-50 border-purple-300' 
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleGarantie(garantie.value)}
                        />
                        <div>
                          <p className="font-medium">{garantie.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{garantie.description}</p>
                          {isSelected && (
                            <div className="mt-2 text-xs">
                              <p className="text-green-600">✓ {garantie.avantages}</p>
                              <p className="text-amber-600">⚠ {garantie.inconvenients}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>

              {(!locationDetails.garanties || locationDetails.garanties.length === 0) && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-800">
                    <strong>Attention :</strong> Aucune garantie sélectionnée. 
                    Il est fortement recommandé d'avoir au moins une garantie (caution ou GLI).
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Rendements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Rendements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800">Rendement brut</span>
                    <Percent className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPercentage(calculations.rendementBrut)}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Loyer annuel / Valeur du bien
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-emerald-800">Rendement brut effectif</span>
                    <Percent className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatPercentage(calculations.rendementBrutEffectif)}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Avec vacance locative ({locationDetails.tauxOccupation}%)
                  </p>
                </div>
              </div>

              <Alert className="mt-4 bg-gray-50 border-gray-200">
                <Info className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-sm text-gray-700">
                  Le rendement net (après charges et fiscalité) sera calculé dans la synthèse du patrimoine.
                  Repères : rendement brut moyen France ≈ 5-6%, Paris ≈ 3-4%, province ≈ 6-8%.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </>
      )}

      {/* Si non loué */}
      {!data.estLoue && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            Ce bien n'est pas actuellement loué. Si vous souhaitez simuler une mise en location, 
            cochez la case ci-dessus pour renseigner les informations locatives.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default StepLocation
