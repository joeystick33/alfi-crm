 
'use client'

/**
 * Step Identification - Formulaire Actif Financier
 * Type de produit, établissement, numéro de compte/contrat
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { formatCurrency, cn } from '@/app/_common/lib/utils'
import { 
  PiggyBank, Shield, TrendingUp, Wallet, Building, Target,
  Info, AlertCircle, Bitcoin, LineChart, Briefcase, Home
} from 'lucide-react'
import type { ActifFinancier } from '@/app/_common/types/patrimoine.types'
import { TYPES_ACTIFS_FINANCIERS } from '@/app/_common/constants/patrimoine.constants'

interface StepIdentificationFinancierProps {
  data: Partial<ActifFinancier>
  updateField: <K extends keyof ActifFinancier>(field: K, value: ActifFinancier[K]) => void
  errors: Record<string, string>
}

// Regroupement des types par catégorie
const CATEGORIES_ACTIFS = {
  EPARGNE_REGLEMENTEE: { label: 'Épargne réglementée', icon: PiggyBank, color: 'blue' },
  EPARGNE_LOGEMENT: { label: 'Épargne logement', icon: Home, color: 'amber' },
  ASSURANCE_VIE: { label: 'Assurance-vie & Capitalisation', icon: Shield, color: 'purple' },
  EPARGNE_RETRAITE: { label: 'Épargne retraite', icon: Target, color: 'rose' },
  VALEURS_MOBILIERES: { label: 'PEA & Valeurs mobilières', icon: TrendingUp, color: 'green' },
  PRIVATE_EQUITY: { label: 'Private Equity & Défiscalisation', icon: Briefcase, color: 'orange' },
  DEFISCALISATION: { label: 'Défiscalisation', icon: Briefcase, color: 'orange' },
  ALTERNATIF: { label: 'Alternatif', icon: Bitcoin, color: 'amber' },
  LIQUIDITES: { label: 'Liquidités', icon: Wallet, color: 'slate' },
  ENTREPRISE: { label: 'Entreprise', icon: Building, color: 'gray' },
}

// Messages d'information par type
const TYPE_INFO_MESSAGES: Record<string, string> = {
  LIVRET_A: 'Plafond 22 950€. Intérêts exonérés d\'IR et de PS. Disponibilité immédiate.',
  LDDS: 'Plafond 12 000€. Mêmes avantages fiscaux que le Livret A.',
  LEP: 'Livret d\'Épargne Populaire. Plafond 10 000€. Taux boosté (5%). Sous conditions de revenus.',
  PEL: 'Plan Épargne Logement. Plafond 61 200€. Intérêts soumis au PFU après 12 ans. Prêt épargne logement possible.',
  CEL: 'Compte Épargne Logement. Plafond 15 300€. Moins avantageux que le PEL mais plus flexible.',
  ASSURANCE_VIE_FONDS_EUROS: 'Fonds euros : capital garanti, rendement en baisse. Fiscalité avantageuse après 8 ans. Abattement 4 600€/9 200€.',
  ASSURANCE_VIE_UC: 'Unités de compte : potentiel de rendement supérieur mais risque de perte en capital. Diversification recommandée.',
  CONTRAT_LUXEMBOURGEOIS: 'Triangle de sécurité luxembourgeois. Super privilège en cas de faillite. Idéal pour patrimoines importants.',
  PER_INDIVIDUEL: 'Versements déductibles du revenu imposable (plafond 10% revenus). Sortie en capital ou rente à la retraite.',
  PERP: 'Ancien produit fermé aux nouveaux souscripteurs. Transférable vers PER.',
  MADELIN: 'Réservé aux TNS. Transférable vers PER. Cotisations déductibles du BIC/BNC.',
  PEA: 'Plan d\'Épargne en Actions. Plafond 150 000€. Exonération des plus-values après 5 ans (hors PS).',
  PEA_PME: 'PEA-PME. Plafond cumulé avec PEA de 225 000€. Actions de PME-ETI européennes.',
  COMPTE_TITRES: 'Compte-titres ordinaire. Pas de plafond ni contrainte. Fiscalité PFU 30% ou barème.',
  FIP: 'Fonds d\'Investissement de Proximité. Réduction IR 18% (25% en 2024). Blocage 5 ans minimum.',
  FCPI: 'Fonds Commun de Placement dans l\'Innovation. Réduction IR 18% (25% en 2024). Blocage 5 ans.',
  CRYPTO_ACTIFS: 'Crypto-actifs. Flat tax 30% sur les plus-values. Déclaration des comptes à l\'étranger.',
  SCPI: 'SCPI. Revenus fonciers. Inclus dans l\'IFI. Frais d\'entrée élevés mais mutualisation du risque.',
}

export function StepIdentificationFinancier({ data, updateField, errors }: StepIdentificationFinancierProps) {
  const selectedType = TYPES_ACTIFS_FINANCIERS.find(t => t.value === data.type)
  const infoMessage = data.type ? TYPE_INFO_MESSAGES[data.type] : null
  const categoryInfo = selectedType ? CATEGORIES_ACTIFS[selectedType.category as keyof typeof CATEGORIES_ACTIFS] : null

  return (
    <div className="space-y-6">
      {/* Type de produit */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-600" />
            Type de produit financier
          </CardTitle>
          <CardDescription>
            Sélectionnez le type d'actif financier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Type de produit <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.type || ''}
              onValueChange={(value) => updateField('type', value as any)}
            >
              <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionnez le type de produit" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {Object.entries(CATEGORIES_ACTIFS).map(([categoryKey, category]) => {
                  const items = TYPES_ACTIFS_FINANCIERS.filter(t => t.category === categoryKey)
                  if (items.length === 0) return null
                  
                  const CategoryIcon = category.icon
                  return (
                    <div key={categoryKey}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0 flex items-center gap-2">
                        <CategoryIcon className="h-3 w-3" />
                        {category.label}
                      </div>
                      {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4 text-gray-500" />
                            <span>{item.label}</span>
                            {item.plafond && (
                              <span className="text-xs text-gray-400 ml-auto">
                                (plafond {formatCurrency(item.plafond)})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  )
                })}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
          </div>

          {/* Badge du type sélectionné */}
          {selectedType && categoryInfo && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <selectedType.icon className="h-5 w-5 text-gray-600" />
              <div className="flex-1">
                <span className="font-medium">{selectedType.label}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    `bg-${categoryInfo.color}-100 text-${categoryInfo.color}-700`
                  )}>
                    {categoryInfo.label}
                  </span>
                  {selectedType.plafond && (
                    <span className="text-xs text-gray-500">
                      Plafond : {formatCurrency(selectedType.plafond)}
                    </span>
                  )}
                  {'taux' in selectedType && selectedType.taux && (
                    <span className="text-xs text-green-600">
                      Taux : {selectedType.taux}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Message d'information */}
          {infoMessage && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                {infoMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Identification du compte */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="h-5 w-5 text-indigo-600" />
            Identification du compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">
              Nom / Désignation <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nom"
              value={data.nom || ''}
              onChange={(e) => updateField('nom', e.target.value)}
              placeholder="Ex: Assurance-vie Generali, PEA Boursorama, Livret A BNP..."
              className={errors.nom ? 'border-red-500' : ''}
            />
            {errors.nom && <p className="text-xs text-red-500">{errors.nom}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="etablissement">
                Établissement / Compagnie <span className="text-red-500">*</span>
              </Label>
              <Input
                id="etablissement"
                value={data.etablissement || ''}
                onChange={(e) => updateField('etablissement', e.target.value)}
                placeholder="Ex: Generali, AXA, Boursorama, BNP..."
                className={errors.etablissement ? 'border-red-500' : ''}
              />
              {errors.etablissement && <p className="text-xs text-red-500">{errors.etablissement}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroContrat">
                N° de contrat / compte
              </Label>
              <Input
                id="numeroContrat"
                value={data.numeroContrat || data.numeroCompte || ''}
                onChange={(e) => {
                  const isAssurance = selectedType?.category === 'ASSURANCE_VIE' || selectedType?.category === 'EPARGNE_RETRAITE'
                  updateField(isAssurance ? 'numeroContrat' : 'numeroCompte', e.target.value)
                }}
                placeholder="N° de contrat ou de compte"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateOuverture">
                Date d'ouverture <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOuverture"
                type="date"
                value={data.dateOuverture || ''}
                onChange={(e) => updateField('dateOuverture', e.target.value)}
                className={errors.dateOuverture ? 'border-red-500' : ''}
              />
              {errors.dateOuverture && <p className="text-xs text-red-500">{errors.dateOuverture}</p>}
            </div>
            {selectedType?.category === 'EPARGNE_RETRAITE' && (
              <div className="space-y-2">
                <Label htmlFor="dateEcheance">Date d'échéance (retraite)</Label>
                <Input
                  id="dateEcheance"
                  type="date"
                  value={data.dateEcheance || ''}
                  onChange={(e) => updateField('dateEcheance', e.target.value)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertes spécifiques */}
      {selectedType?.category === 'EPARGNE_REGLEMENTEE' && (
        <Alert className="bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            <strong>Épargne réglementée :</strong> Intérêts exonérés d'impôt sur le revenu et de prélèvements sociaux. 
            Disponibilité immédiate. Un seul compte par personne (sauf Livret A + LDDS).
          </AlertDescription>
        </Alert>
      )}

      {selectedType?.category === 'ASSURANCE_VIE' && (
        <Alert className="bg-purple-50 border-purple-200">
          <Info className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-sm text-purple-800">
            <strong>Assurance-vie :</strong> Fiscalité avantageuse après 8 ans. 
            Abattement annuel de 4 600€ (9 200€ pour un couple) sur les gains en cas de rachat.
            Transmission hors succession jusqu'à 152 500€/bénéficiaire (versements avant 70 ans).
          </AlertDescription>
        </Alert>
      )}

      {selectedType?.category === 'EPARGNE_RETRAITE' && (
        <Alert className="bg-rose-50 border-rose-200">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <AlertDescription className="text-sm text-rose-800">
            <strong>Épargne retraite :</strong> Versements déductibles du revenu imposable. 
            Capitaux bloqués jusqu'à la retraite (sauf cas de déblocage anticipé : achat RP, décès conjoint...).
            Sortie en capital ou rente viagère.
          </AlertDescription>
        </Alert>
      )}

      {selectedType?.category === 'VALEURS_MOBILIERES' && data.type === 'PEA' && (
        <Alert className="bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            <strong>PEA :</strong> Exonération des plus-values et dividendes après 5 ans (hors PS 17,2%).
            Retrait avant 5 ans = clôture du plan et imposition au PFU.
            Actions européennes uniquement.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default StepIdentificationFinancier
