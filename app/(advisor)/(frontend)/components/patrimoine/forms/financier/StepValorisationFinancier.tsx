'use client'

/**
 * Step Valorisation - Formulaire Actif Financier
 * Versements, valorisation, plus-value
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Progress } from '@/app/_common/components/ui/Progress'
import { formatCurrency, cn } from '@/app/_common/lib/utils'
import { TrendingUp, TrendingDown, Calendar, Percent, 
  Info, AlertCircle, Wallet
} from 'lucide-react'
import type { ActifFinancier } from '@/app/_common/types/patrimoine.types'
import { TYPES_ACTIFS_FINANCIERS } from '@/app/_common/constants/patrimoine.constants'

interface StepValorisationFinancierProps {
  data: Partial<ActifFinancier>
  updateField: <K extends keyof ActifFinancier>(field: K, value: ActifFinancier[K]) => void
  errors: Record<string, string>
}

export function StepValorisationFinancier({ data, updateField, errors }: StepValorisationFinancierProps) {
  const selectedType = TYPES_ACTIFS_FINANCIERS.find(t => t.value === data.type)
  
  // Calculs
  const calculations = useMemo(() => {
    const versements = data.versementsCumules || 0
    const valorisation = data.valorisationActuelle || 0
    const plusValue = valorisation - versements
    const rendement = versements > 0 ? ((plusValue / versements) * 100) : 0
    
    // Calcul du plafond atteint
    const plafond = selectedType?.plafond || 0
    const plafondAtteint = plafond > 0 ? Math.min((versements / plafond) * 100, 100) : 0
    const resteAVerser = plafond > 0 ? Math.max(plafond - versements, 0) : 0

    // Durée de détention
    let dureeDetention = 0
    if (data.dateOuverture) {
      const dateOuv = new Date(data.dateOuverture)
      const today = new Date()
      dureeDetention = Math.floor((today.getTime() - dateOuv.getTime()) / (1000 * 60 * 60 * 24 * 365))
    }

    // Fiscalité applicable
    let fiscaliteInfo = ''
    if (selectedType?.category === 'ASSURANCE_VIE') {
      if (dureeDetention >= 8) {
        fiscaliteInfo = 'Abattement 4 600€/9 200€ applicable'
      } else if (dureeDetention >= 4) {
        fiscaliteInfo = `PFU 30% (${8 - dureeDetention} ans avant abattement)`
      } else {
        fiscaliteInfo = `PFU 30% + pénalité si rachat (${8 - dureeDetention} ans avant avantage fiscal)`
      }
    } else if (selectedType?.category === 'VALEURS_MOBILIERES' && (data.type === 'PEA' || data.type === 'PEA_PME')) {
      if (dureeDetention >= 5) {
        fiscaliteInfo = 'Exonération IR (PS 17,2% uniquement)'
      } else {
        fiscaliteInfo = `Retrait = clôture + PFU 30% (${5 - dureeDetention} ans restants)`
      }
    }

    return {
      plusValue,
      rendement,
      plafondAtteint,
      resteAVerser,
      dureeDetention,
      fiscaliteInfo,
    }
  }, [data, selectedType])

  const hasPlafond = selectedType?.plafond && selectedType.plafond > 0

  return (
    <div className="space-y-6">
      {/* Versements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            Versements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="versementsCumules">
              Versements cumulés (€) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="versementsCumules"
              type="number"
              min="0"
              step="100"
              value={data.versementsCumules || ''}
              onChange={(e) => updateField('versementsCumules', parseFloat(e.target.value) || 0)}
              placeholder="50000"
              className={errors.versementsCumules ? 'border-red-500' : ''}
            />
            {errors.versementsCumules && <p className="text-xs text-red-500">{errors.versementsCumules}</p>}
            <p className="text-xs text-gray-500">
              Total des versements effectués depuis l'ouverture
            </p>
          </div>

          {/* Plafond si applicable */}
          {hasPlafond && (
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Plafond de versement</span>
                <span className="text-sm">
                  {formatCurrency(data.versementsCumules || 0)} / {formatCurrency(selectedType.plafond!)}
                </span>
              </div>
              <Progress 
                value={calculations.plafondAtteint} 
                className={cn(
                  'h-2',
                  calculations.plafondAtteint >= 100 ? 'bg-amber-100' : 'bg-gray-200'
                )}
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{calculations.plafondAtteint.toFixed(0)}% utilisé</span>
                {calculations.resteAVerser > 0 && (
                  <span>Reste à verser : {formatCurrency(calculations.resteAVerser)}</span>
                )}
              </div>
              {calculations.plafondAtteint >= 100 && (
                <Alert className="mt-3 bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs text-amber-800">
                    Plafond de versement atteint. Les intérêts continuent de capitaliser.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Taux de rémunération pour épargne réglementée */}
          {selectedType?.category === 'EPARGNE_REGLEMENTEE' && selectedType.taux && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Taux de rémunération</span>
                <span className="text-lg font-bold text-green-600">{selectedType.taux}%</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Intérêts calculés par quinzaine, capitalisés annuellement
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Valorisation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
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
                step="100"
                value={data.valorisationActuelle || ''}
                onChange={(e) => updateField('valorisationActuelle', parseFloat(e.target.value) || 0)}
                placeholder="55000"
                className={errors.valorisationActuelle ? 'border-red-500' : ''}
              />
              {errors.valorisationActuelle && <p className="text-xs text-red-500">{errors.valorisationActuelle}</p>}
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
          </div>

          {/* Plus-value latente */}
          <div className={cn(
            'p-4 rounded-lg border',
            calculations.plusValue >= 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {calculations.plusValue >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {calculations.plusValue >= 0 ? 'Plus-value latente' : 'Moins-value latente'}
                </span>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-xl font-bold',
                  calculations.plusValue >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {calculations.plusValue >= 0 ? '+' : ''}{formatCurrency(calculations.plusValue)}
                </p>
                <p className="text-sm text-gray-500">
                  {calculations.rendement >= 0 ? '+' : ''}{calculations.rendement.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Durée de détention et fiscalité */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Durée de détention et fiscalité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Durée de détention</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {calculations.dureeDetention} an{calculations.dureeDetention > 1 ? 's' : ''}
              </p>
              {data.dateOuverture && (
                <p className="text-xs text-gray-500 mt-1">
                  Depuis le {new Date(data.dateOuverture).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>

            {calculations.fiscaliteInfo && (
              <div className={cn(
                'p-4 rounded-lg border',
                calculations.dureeDetention >= (selectedType?.category === 'ASSURANCE_VIE' ? 8 : 5)
                  ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4" />
                  <span className="text-sm font-medium">Fiscalité applicable</span>
                </div>
                <p className="text-sm">{calculations.fiscaliteInfo}</p>
              </div>
            )}
          </div>

          {/* Timeline fiscale pour AV */}
          {selectedType?.category === 'ASSURANCE_VIE' && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-medium text-purple-800 mb-3">
                Timeline fiscale Assurance-vie
              </h4>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-200" />
                {[
                  { years: 4, label: 'PFU 30% en cas de rachat', passed: calculations.dureeDetention >= 4 },
                  { years: 8, label: 'Abattement 4 600€/9 200€ sur les gains', passed: calculations.dureeDetention >= 8 },
                  { years: 0, label: 'Transmission avantageuse (152 500€/bénéficiaire)', always: true },
                ].map((step, i) => (
                  <div key={i} className="relative pl-10 pb-3">
                    <div className={cn(
                      'absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      step.passed || step.always
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-white border-purple-300'
                    )}>
                      {(step.passed || step.always) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <div>
                      {step.years > 0 && (
                        <span className="text-xs font-medium text-purple-700">{step.years} ans : </span>
                      )}
                      <span className="text-sm text-purple-800">{step.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline fiscale pour PEA */}
          {(data.type === 'PEA' || data.type === 'PEA_PME') && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-3">
                Timeline fiscale PEA
              </h4>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-green-200" />
                {[
                  { years: 0, label: 'Retrait avant 5 ans = clôture + PFU 30%', warning: calculations.dureeDetention < 5 },
                  { years: 5, label: 'Exonération IR des gains (PS 17,2% uniquement)', passed: calculations.dureeDetention >= 5 },
                  { years: 5, label: 'Retraits partiels possibles sans clôture', passed: calculations.dureeDetention >= 5 },
                ].map((step, i) => (
                  <div key={i} className="relative pl-10 pb-3">
                    <div className={cn(
                      'absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      step.passed
                        ? 'bg-green-600 border-green-600'
                        : step.warning
                        ? 'bg-amber-500 border-amber-500'
                        : 'bg-white border-green-300'
                    )}>
                      {step.passed && <span className="text-white text-xs">✓</span>}
                      {step.warning && <span className="text-white text-xs">!</span>}
                    </div>
                    <div>
                      {step.years > 0 && !step.warning && (
                        <span className="text-xs font-medium text-green-700">{step.years} ans : </span>
                      )}
                      <span className={cn(
                        'text-sm',
                        step.warning ? 'text-amber-800' : 'text-green-800'
                      )}>{step.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerte IFI si applicable */}
      {selectedType?.value?.includes('SCPI') || selectedType?.value?.includes('OPCI') ? (
        <Alert className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            <strong>IFI :</strong> Les SCPI et OPCI sont inclus dans l'assiette de l'IFI pour leur quote-part immobilière.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

export default StepValorisationFinancier
