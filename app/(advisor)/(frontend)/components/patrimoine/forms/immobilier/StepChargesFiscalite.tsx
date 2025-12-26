 
'use client'

/**
 * Step Charges & Fiscalité - Formulaire Bien Immobilier
 * Charges annuelles, régime fiscal, dispositifs
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Separator } from '@/app/_common/components/ui/Separator'
import { formatCurrency, cn } from '@/app/_common/lib/utils'
import { 
  Calculator, Receipt, Euro, Percent, Building2,
  Info, AlertCircle, TrendingDown, Shield, Home
} from 'lucide-react'
import type { BienImmobilier } from '@/app/_common/types/patrimoine.types'
import { 
  REGIMES_FISCAUX_IMMOBILIER, 
  DISPOSITIFS_FISCAUX 
} from '@/app/_common/constants/patrimoine.constants'

interface StepChargesFiscaliteProps {
  data: Partial<BienImmobilier>
  updateField: <K extends keyof BienImmobilier>(field: K, value: BienImmobilier[K]) => void
  updateNestedField: (parent: keyof BienImmobilier, field: string, value: any) => void
  errors: Record<string, string>
}

export function StepChargesFiscalite({ data, updateField, updateNestedField, errors: errors }: StepChargesFiscaliteProps) {
  const charges = data.charges || {
    taxeFonciere: 0,
    taxeHabitation: 0,
    chargesCopropriete: 0,
    assurancePNO: 0,
    fraisGestion: 0,
    travaux: 0,
    autres: 0,
  }

  // Calculs
  const calculations = useMemo(() => {
    const chargesAnnuelles = 
      (charges.taxeFonciere || 0) +
      (charges.taxeHabitation || 0) +
      ((charges.chargesCopropriete || 0) * 12) +
      (charges.assurancePNO || 0) +
      (charges.fraisGestion || 0) +
      (charges.travaux || 0) +
      (charges.autres || 0)
    
    const chargesMensuelles = chargesAnnuelles / 12

    // Calcul revenus fonciers net si loué
    const loyerAnnuel = data.estLoue && data.locationDetails?.loyerHC 
      ? data.locationDetails.loyerHC * 12 
      : 0
    const revenuNetFoncier = loyerAnnuel - chargesAnnuelles

    // Rendement net
    const valorisation = data.valorisationActuelle || 0
    const rendementNet = valorisation > 0 && loyerAnnuel > 0
      ? (revenuNetFoncier / valorisation) * 100
      : 0

    // IFI
    const valeurIFI = data.type === 'RESIDENCE_PRINCIPALE'
      ? (data.valorisationActuelle || 0) * 0.7 // Abattement 30% RP
      : (data.valorisationActuelle || 0)

    return {
      chargesAnnuelles,
      chargesMensuelles,
      revenuNetFoncier,
      rendementNet,
      valeurIFI,
    }
  }, [charges, data])

  // Régimes fiscaux applicables selon le type
  const regimesApplicables = useMemo(() => {
    if (!data.estLoue) return []
    
    const locationMeublee = data.locationDetails?.typeLocation === 'MEUBLEE' || 
                           data.locationDetails?.typeLocation === 'SAISONNIERE' ||
                           data.type === 'LMNP' || 
                           data.type === 'LMP'
    
    if (locationMeublee) {
      return REGIMES_FISCAUX_IMMOBILIER.filter(r => 
        r.value === 'MICRO_BIC' || r.value === 'REEL_BIC' || r.value === 'IS'
      )
    } else {
      return REGIMES_FISCAUX_IMMOBILIER.filter(r => 
        r.value === 'MICRO_FONCIER' || r.value === 'REEL_FONCIER'
      )
    }
  }, [data.estLoue, data.locationDetails?.typeLocation, data.type])

  // Dispositif fiscal applicable
  const dispositifApplicable = data.type ? 
    DISPOSITIFS_FISCAUX.find(d => d.value === data.type) : null

  return (
    <div className="space-y-6">
      {/* Charges annuelles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Charges annuelles
          </CardTitle>
          <CardDescription>
            Renseignez toutes les charges liées à ce bien
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Impôts locaux */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Impôts locaux
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="taxeFonciere">Taxe foncière (€/an)</Label>
                <Input
                  id="taxeFonciere"
                  type="number"
                  min="0"
                  step="100"
                  value={charges.taxeFonciere || ''}
                  onChange={(e) => updateNestedField('charges', 'taxeFonciere', parseFloat(e.target.value) || 0)}
                  placeholder="1500"
                />
                <p className="text-xs text-gray-500">
                  Payée par le propriétaire
                </p>
              </div>
              {data.type === 'RESIDENCE_SECONDAIRE' && (
                <div className="space-y-2">
                  <Label htmlFor="taxeHabitation">Taxe d'habitation RS (€/an)</Label>
                  <Input
                    id="taxeHabitation"
                    type="number"
                    min="0"
                    step="100"
                    value={charges.taxeHabitation || ''}
                    onChange={(e) => updateNestedField('charges', 'taxeHabitation', parseFloat(e.target.value) || 0)}
                    placeholder="800"
                  />
                  <p className="text-xs text-gray-500">
                    Maintenue pour les résidences secondaires
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Charges copropriété et assurance */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Copropriété et assurance
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="chargesCopropriete">Charges copropriété (€/mois)</Label>
                <Input
                  id="chargesCopropriete"
                  type="number"
                  min="0"
                  step="10"
                  value={charges.chargesCopropriete || ''}
                  onChange={(e) => updateNestedField('charges', 'chargesCopropriete', parseFloat(e.target.value) || 0)}
                  placeholder="150"
                />
                <p className="text-xs text-gray-500">
                  Soit {formatCurrency((charges.chargesCopropriete || 0) * 12)}/an
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assurancePNO">Assurance PNO (€/an)</Label>
                <Input
                  id="assurancePNO"
                  type="number"
                  min="0"
                  step="10"
                  value={charges.assurancePNO || ''}
                  onChange={(e) => updateNestedField('charges', 'assurancePNO', parseFloat(e.target.value) || 0)}
                  placeholder="200"
                />
                <p className="text-xs text-gray-500">
                  {data.estLoue 
                    ? 'Assurance Propriétaire Non Occupant obligatoire'
                    : 'Assurance habitation'}
                </p>
              </div>
            </div>
          </div>

          {/* Si loué - charges supplémentaires */}
          {data.estLoue && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Charges locatives
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fraisGestion">Frais de gestion (€/an)</Label>
                    <Input
                      id="fraisGestion"
                      type="number"
                      min="0"
                      step="100"
                      value={charges.fraisGestion || ''}
                      onChange={(e) => updateNestedField('charges', 'fraisGestion', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">
                      Agence immobilière (6-8% des loyers)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="travaux">Provision travaux (€/an)</Label>
                    <Input
                      id="travaux"
                      type="number"
                      min="0"
                      step="100"
                      value={charges.travaux || ''}
                      onChange={(e) => updateNestedField('charges', 'travaux', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">
                      Budget travaux annuel moyen
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Autres charges */}
          <div className="space-y-2">
            <Label htmlFor="autres">Autres charges (€/an)</Label>
            <Input
              id="autres"
              type="number"
              min="0"
              step="100"
              value={charges.autres || ''}
              onChange={(e) => updateNestedField('charges', 'autres', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          {/* Récapitulatif */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <span className="font-medium">Total charges annuelles</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(calculations.chargesAnnuelles)}
                </p>
                <p className="text-sm text-gray-500">
                  soit {formatCurrency(calculations.chargesMensuelles)}/mois
                </p>
              </div>
            </div>
          </div>

          {/* Revenu net si loué */}
          {data.estLoue && (
            <div className={cn(
              'p-4 rounded-lg border',
              calculations.revenuNetFoncier >= 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            )}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Revenu foncier net</span>
                <div className="text-right">
                  <p className={cn(
                    'text-xl font-bold',
                    calculations.revenuNetFoncier >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatCurrency(calculations.revenuNetFoncier)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Rendement net : {calculations.rendementNet.toFixed(2)}%
                  </p>
                </div>
              </div>
              {calculations.revenuNetFoncier < 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Déficit foncier imputable sur le revenu global (max 10 700€/an)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Régime fiscal */}
      {data.estLoue && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="h-5 w-5 text-indigo-600" />
              Régime fiscal
            </CardTitle>
            <CardDescription>
              Choisissez le régime d'imposition des revenus locatifs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Régime fiscal applicable</Label>
              <Select
                value={data.regimeFiscal || 'REEL_FONCIER'}
                onValueChange={(value) => updateField('regimeFiscal', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regimesApplicables.map((regime) => (
                    <SelectItem key={regime.value} value={regime.value}>
                      <div>
                        <span className="font-medium">{regime.label}</span>
                        {regime.seuil && (
                          <span className="text-xs text-gray-500 ml-2">
                            (seuil : {formatCurrency(regime.seuil)})
                          </span>
                        )}
                        <p className="text-xs text-gray-500">{regime.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info sur le régime sélectionné */}
            {data.regimeFiscal && (
              <Alert className="bg-indigo-50 border-indigo-200">
                <Info className="h-4 w-4 text-indigo-600" />
                <AlertDescription className="text-sm text-indigo-800">
                  {data.regimeFiscal === 'MICRO_FONCIER' && (
                    <>
                      <strong>Micro-foncier :</strong> Abattement forfaitaire de 30% sur les loyers bruts. 
                      Applicable si revenus fonciers annuels inférieurs à 15 000€.
                      Simple mais pas toujours optimal si charges élevées.
                    </>
                  )}
                  {data.regimeFiscal === 'REEL_FONCIER' && (
                    <>
                      <strong>Régime réel :</strong> Déduction des charges réelles (intérêts d'emprunt, travaux, 
                      assurance, taxe foncière, frais de gestion...). Obligatoire si revenus fonciers supérieurs à 15 000€.
                      Permet de créer du déficit foncier.
                    </>
                  )}
                  {data.regimeFiscal === 'MICRO_BIC' && (
                    <>
                      <strong>Micro-BIC :</strong> Abattement forfaitaire de 50% sur les recettes 
                      (71% pour les meublés de tourisme classés). 
                      Applicable si CA inférieur à 77 700€ (188 700€ tourisme).
                    </>
                  )}
                  {data.regimeFiscal === 'REEL_BIC' && (
                    <>
                      <strong>Régime réel BIC :</strong> Déduction des charges réelles ET amortissement du bien 
                      et du mobilier. Permet souvent de neutraliser fiscalement les revenus locatifs.
                      Comptabilité obligatoire.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dispositif fiscal spécifique */}
      {dispositifApplicable && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-purple-800">
              <Shield className="h-5 w-5" />
              Dispositif fiscal : {dispositifApplicable.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateDebutDispositif">Date de début du dispositif</Label>
                <Input
                  id="dateDebutDispositif"
                  type="date"
                  value={data.dispositifFiscal?.dateDebut || data.dateAcquisition || ''}
                  onChange={(e) => updateNestedField('dispositifFiscal', 'dateDebut', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFinDispositif">Date de fin du dispositif</Label>
                <Input
                  id="dateFinDispositif"
                  type="date"
                  value={data.dispositifFiscal?.dateFin || ''}
                  onChange={(e) => updateNestedField('dispositifFiscal', 'dateFin', e.target.value)}
                />
              </div>
            </div>

            {(data.type === 'PINEL' || data.type === 'DENORMANDIE') && (
              <div className="space-y-2">
                <Label>Durée d'engagement</Label>
                <Select
                  value={String(data.dispositifFiscal?.engagementLocation || 6)}
                  onValueChange={(value) => updateNestedField('dispositifFiscal', 'engagementLocation', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 ans (réduction 12%)</SelectItem>
                    <SelectItem value="9">9 ans (réduction 18%)</SelectItem>
                    <SelectItem value="12">12 ans (réduction 21%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {data.dispositifFiscal?.reductionImpot !== undefined && (
              <div className="p-3 bg-white rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-800">Réduction d'impôt estimée</span>
                  <span className="text-lg font-bold text-purple-700">
                    {formatCurrency(data.dispositifFiscal.reductionImpot)}
                  </span>
                </div>
              </div>
            )}

            <Alert className="bg-purple-100 border-purple-300">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-800">
                <strong>Rappel :</strong> Le non-respect des engagements (durée de location, plafonds) 
                entraîne la reprise de l'avantage fiscal.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* IFI */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Euro className="h-5 w-5 text-amber-600" />
            Impôt sur la Fortune Immobilière (IFI)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              checked={data.inclureDansIFI !== false}
              onChange={(checked) => updateField('inclureDansIFI', checked)}
            />
            <div>
              <Label className="font-medium cursor-pointer">
                Inclure ce bien dans le calcul IFI
              </Label>
              <p className="text-sm text-gray-500">
                Les biens professionnels peuvent être exonérés sous conditions
              </p>
            </div>
          </div>

          {data.inclureDansIFI !== false && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-amber-800">Valeur IFI du bien</span>
                  {data.type === 'RESIDENCE_PRINCIPALE' && (
                    <p className="text-xs text-amber-600">
                      Après abattement 30% résidence principale
                    </p>
                  )}
                </div>
                <span className="text-xl font-bold text-amber-700">
                  {formatCurrency(calculations.valeurIFI)}
                </span>
              </div>
            </div>
          )}

          <Alert className="bg-gray-50 border-gray-200">
            <Info className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-sm text-gray-700">
              <strong>Rappel IFI 2024 :</strong> Patrimoine immobilier net taxable supérieur à 1 300 000€. 
              Barème progressif de 0,5% à 1,5%. 
              Les dettes immobilières sont déductibles sous conditions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}

export default StepChargesFiscalite
