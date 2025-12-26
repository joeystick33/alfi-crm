 
'use client'

/**
 * Step Acquisition - Formulaire Bien Immobilier
 * Prix, frais, valorisation, plus-value
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Separator } from '@/app/_common/components/ui/Separator'
import { formatCurrency, cn } from '@/app/_common/lib/utils'
import { 
  Euro, Calendar, TrendingUp, TrendingDown, 
  Calculator, Gift, Scale, Home, Info
} from 'lucide-react'
import type { BienImmobilier } from '@/app/_common/types/patrimoine.types'

interface StepAcquisitionProps {
  data: Partial<BienImmobilier>
  updateField: <K extends keyof BienImmobilier>(field: K, value: BienImmobilier[K]) => void
  errors: Record<string, string>
}

// Taux de frais de notaire par défaut
const FRAIS_NOTAIRE = {
  NEUF: 0.025, // 2.5%
  ANCIEN: 0.08, // 8%
}

export function StepAcquisition({ data, updateField, errors }: StepAcquisitionProps) {
  // Calculs automatiques
  const calculations = useMemo(() => {
    const prixAcquisition = data.prixAcquisition || 0
    const fraisNotaire = data.fraisNotaire || 0
    const fraisAgence = data.fraisAgence || 0
    const montantTravaux = data.montantTravaux || 0
    const valorisationActuelle = data.valorisationActuelle || 0
    
    const coutTotalAcquisition = prixAcquisition + fraisNotaire + fraisAgence + montantTravaux
    const plusValueLatente = valorisationActuelle - coutTotalAcquisition
    const pourcentagePlusValue = coutTotalAcquisition > 0 
      ? ((plusValueLatente / coutTotalAcquisition) * 100) 
      : 0
    
    // Estimation frais notaire
    const isNeuf = data.etat === 'NEUF' || data.etat === 'VEFA'
    const fraisNotaireEstimes = prixAcquisition * (isNeuf ? FRAIS_NOTAIRE.NEUF : FRAIS_NOTAIRE.ANCIEN)
    
    // Durée de détention
    let dureeDetention = 0
    if (data.dateAcquisition) {
      const dateAcq = new Date(data.dateAcquisition)
      const today = new Date()
      dureeDetention = Math.floor((today.getTime() - dateAcq.getTime()) / (1000 * 60 * 60 * 24 * 365))
    }
    
    // Abattement plus-value (si > 5 ans de détention pour RP)
    const abattementPV = data.type === 'RESIDENCE_PRINCIPALE' ? 100 : 
      dureeDetention >= 22 ? 100 : // Exonération totale IR après 22 ans
      dureeDetention >= 6 ? (dureeDetention - 5) * 6 : 0

    return {
      coutTotalAcquisition,
      plusValueLatente,
      pourcentagePlusValue,
      fraisNotaireEstimes,
      dureeDetention,
      abattementPV,
    }
  }, [data])

  return (
    <div className="space-y-6">
      {/* Mode et date d'acquisition */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Acquisition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateAcquisition">
                Date d'acquisition <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateAcquisition"
                type="date"
                value={data.dateAcquisition || ''}
                onChange={(e) => updateField('dateAcquisition', e.target.value)}
                className={errors.dateAcquisition ? 'border-red-500' : ''}
              />
              {errors.dateAcquisition && (
                <p className="text-xs text-red-500">{errors.dateAcquisition}</p>
              )}
              {calculations.dureeDetention > 0 && (
                <p className="text-xs text-gray-500">
                  Détention : {calculations.dureeDetention} an{calculations.dureeDetention > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="modeAcquisition">Mode d'acquisition</Label>
              <Select
                value={data.modeAcquisition || 'ACHAT'}
                onValueChange={(value) => updateField('modeAcquisition', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACHAT">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Achat
                    </div>
                  </SelectItem>
                  <SelectItem value="DONATION">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Donation
                    </div>
                  </SelectItem>
                  <SelectItem value="SUCCESSION">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Succession
                    </div>
                  </SelectItem>
                  <SelectItem value="CONSTRUCTION">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Construction
                    </div>
                  </SelectItem>
                  <SelectItem value="VIAGER">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Viager
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {data.modeAcquisition === 'DONATION' && 'La valeur retenue est celle de la donation'}
                {data.modeAcquisition === 'SUCCESSION' && 'La valeur retenue est celle de la déclaration de succession'}
                {data.modeAcquisition === 'VIAGER' && 'Indiquez le bouquet comme prix d\'acquisition'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prix et frais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Euro className="h-5 w-5 text-green-600" />
            Prix et frais d'acquisition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prixAcquisition">
                Prix d'acquisition (€) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prixAcquisition"
                type="number"
                min="0"
                step="1000"
                value={data.prixAcquisition || ''}
                onChange={(e) => updateField('prixAcquisition', parseFloat(e.target.value) || 0)}
                placeholder="250000"
                className={errors.prixAcquisition ? 'border-red-500' : ''}
              />
              {errors.prixAcquisition && (
                <p className="text-xs text-red-500">{errors.prixAcquisition}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fraisNotaire">Frais de notaire (€)</Label>
              <Input
                id="fraisNotaire"
                type="number"
                min="0"
                step="100"
                value={data.fraisNotaire || ''}
                onChange={(e) => updateField('fraisNotaire', parseFloat(e.target.value) || 0)}
                placeholder={Math.round(calculations.fraisNotaireEstimes).toString()}
              />
              <p className="text-xs text-gray-500">
                Estimation : {formatCurrency(calculations.fraisNotaireEstimes)} 
                ({data.etat === 'NEUF' || data.etat === 'VEFA' ? '2.5%' : '8%'})
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fraisAgence">Frais d'agence (€)</Label>
              <Input
                id="fraisAgence"
                type="number"
                min="0"
                step="100"
                value={data.fraisAgence || ''}
                onChange={(e) => updateField('fraisAgence', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">
                Si à charge de l'acquéreur
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="montantTravaux">Montant des travaux (€)</Label>
              <Input
                id="montantTravaux"
                type="number"
                min="0"
                step="1000"
                value={data.montantTravaux || ''}
                onChange={(e) => updateField('montantTravaux', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">
                Travaux réalisés après acquisition
              </p>
            </div>
          </div>

          {data.montantTravaux && data.montantTravaux > 0 && (
            <div className="space-y-2">
              <Label htmlFor="detailTravaux">Détail des travaux</Label>
              <Textarea
                id="detailTravaux"
                value={data.detailTravaux || ''}
                onChange={(e) => updateField('detailTravaux', e.target.value)}
                placeholder="Nature des travaux, dates, entreprises..."
                rows={2}
              />
              <p className="text-xs text-gray-500">
                Important pour le calcul de la plus-value (travaux de plus de 5 ans = forfait 15%)
              </p>
            </div>
          )}

          <Separator />

          {/* Récapitulatif coût total */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Prix d'acquisition</span>
                <span>{formatCurrency(data.prixAcquisition || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frais de notaire</span>
                <span>{formatCurrency(data.fraisNotaire || 0)}</span>
              </div>
              {(data.fraisAgence || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais d'agence</span>
                  <span>{formatCurrency(data.fraisAgence || 0)}</span>
                </div>
              )}
              {(data.montantTravaux || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Travaux</span>
                  <span>{formatCurrency(data.montantTravaux || 0)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Coût total d'acquisition</span>
                <span className="text-lg">{formatCurrency(calculations.coutTotalAcquisition)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valorisation actuelle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Valorisation actuelle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="valorisationActuelle">
                Valorisation actuelle (€) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="valorisationActuelle"
                type="number"
                min="0"
                step="1000"
                value={data.valorisationActuelle || ''}
                onChange={(e) => updateField('valorisationActuelle', parseFloat(e.target.value) || 0)}
                placeholder="280000"
                className={errors.valorisationActuelle ? 'border-red-500' : ''}
              />
              {errors.valorisationActuelle && (
                <p className="text-xs text-red-500">{errors.valorisationActuelle}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceValorisation">Source de valorisation</Label>
              <Select
                value={data.sourceValorisation || 'ESTIMATION_PROPRIETAIRE'}
                onValueChange={(value) => updateField('sourceValorisation', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESTIMATION_PROPRIETAIRE">Estimation propriétaire</SelectItem>
                  <SelectItem value="AGENT_IMMOBILIER">Agent immobilier</SelectItem>
                  <SelectItem value="NOTAIRE">Notaire</SelectItem>
                  <SelectItem value="EXPERT">Expert immobilier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateValorisation">Date de valorisation</Label>
            <Input
              id="dateValorisation"
              type="date"
              value={data.dateValorisation || new Date().toISOString().split('T')[0]}
              onChange={(e) => updateField('dateValorisation', e.target.value)}
            />
          </div>

          {/* Plus-value latente */}
          <div className={cn(
            'p-4 rounded-lg border',
            calculations.plusValueLatente >= 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {calculations.plusValueLatente >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">Plus-value latente</span>
              </div>
              <div className="text-right">
                <span className={cn(
                  'text-xl font-bold',
                  calculations.plusValueLatente >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {calculations.plusValueLatente >= 0 ? '+' : ''}{formatCurrency(calculations.plusValueLatente)}
                </span>
                <p className="text-sm text-gray-500">
                  {calculations.pourcentagePlusValue >= 0 ? '+' : ''}{calculations.pourcentagePlusValue.toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Valorisation - Coût total d'acquisition
            </p>
          </div>

          {/* Info plus-value */}
          {calculations.plusValueLatente > 0 && data.type !== 'RESIDENCE_PRINCIPALE' && (
            <Alert className="bg-amber-50 border-amber-200">
              <Calculator className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                <strong>Plus-value imposable en cas de vente :</strong>
                <ul className="mt-1 list-disc list-inside text-xs">
                  <li>IR : 19% après abattements pour durée de détention (exonération après 22 ans)</li>
                  <li>PS : 17.2% après abattements (exonération après 30 ans)</li>
                  <li>Surtaxe si PV supérieure à 50 000€</li>
                  {calculations.dureeDetention > 0 && (
                    <li>Abattement actuel IR : {calculations.abattementPV}% ({calculations.dureeDetention} ans de détention)</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {data.type === 'RESIDENCE_PRINCIPALE' && calculations.plusValueLatente > 0 && (
            <Alert className="bg-green-50 border-green-200">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                <strong>Exonération totale :</strong> La plus-value sur la résidence principale est totalement exonérée d'impôt.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StepAcquisition
