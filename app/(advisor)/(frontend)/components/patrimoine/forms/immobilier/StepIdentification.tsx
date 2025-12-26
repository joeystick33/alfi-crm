 
'use client'

/**
 * Step Identification - Formulaire Bien Immobilier
 * Identification du type de bien et informations générales
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Info, Home, Building2, Warehouse, Map, Building } from 'lucide-react'
import type { BienImmobilier } from '@/app/_common/types/patrimoine.types'
import { TYPES_BIENS_IMMOBILIERS } from '@/app/_common/constants/patrimoine.constants'

interface StepIdentificationProps {
  data: Partial<BienImmobilier>
  updateField: <K extends keyof BienImmobilier>(field: K, value: BienImmobilier[K]) => void
  errors: Record<string, string>
}

// Regroupement des types par catégorie
const CATEGORIES_BIENS = {
  RESIDENTIEL: {
    label: 'Résidentiel',
    items: TYPES_BIENS_IMMOBILIERS.filter(t => t.category === 'RESIDENTIEL')
  },
  LOCATIF: {
    label: 'Locatif',
    items: TYPES_BIENS_IMMOBILIERS.filter(t => t.category === 'LOCATIF')
  },
  PIERRE_PAPIER: {
    label: 'Pierre-papier',
    items: TYPES_BIENS_IMMOBILIERS.filter(t => t.category === 'PIERRE_PAPIER')
  },
  PROFESSIONNEL: {
    label: 'Professionnel / Commercial',
    items: TYPES_BIENS_IMMOBILIERS.filter(t => t.category === 'PROFESSIONNEL')
  },
  DEFISCALISATION: {
    label: 'Défiscalisation',
    items: TYPES_BIENS_IMMOBILIERS.filter(t => t.category === 'DEFISCALISATION')
  },
  SPECIFIQUE: {
    label: 'Spécifique',
    items: TYPES_BIENS_IMMOBILIERS.filter(t => t.category === 'SPECIFIQUE')
  },
  AUTRE: {
    label: 'Autres',
    items: TYPES_BIENS_IMMOBILIERS.filter(t => t.category === 'AUTRE')
  },
}

// Messages d'information par type
const TYPE_INFO_MESSAGES: Record<string, string> = {
  RESIDENCE_PRINCIPALE: 'La résidence principale bénéficie d\'un abattement de 30% sur la valeur pour l\'IFI et d\'une exonération de plus-value à la revente.',
  RESIDENCE_SECONDAIRE: 'La résidence secondaire est assujettie à la taxe d\'habitation et à l\'IFI sans abattement. Plus-value imposable à la revente avec abattements pour durée de détention.',
  LOCATIF_NU: 'Location nue : revenus imposés dans la catégorie des revenus fonciers. Régime micro-foncier possible si revenus < 15 000€/an.',
  LOCATIF_MEUBLE: 'Location meublée : revenus imposés en BIC. Régime micro-BIC si CA < 77 700€/an (abattement 50%).',
  LMNP: 'LMNP : possibilité d\'amortir le bien et le mobilier au régime réel. Pas de cotisations sociales TNS.',
  LMP: 'LMP : statut professionnel si recettes > 23 000€ ET > autres revenus. Cotisations sociales TNS mais déficits imputables sur revenu global.',
  SCPI: 'SCPI : revenus imposés comme revenus fonciers (quote-part). Valeur des parts incluse dans l\'assiette IFI.',
  OPCI: 'OPCI : fiscalité mixte selon composition (immobilier + financier). Plus liquide que les SCPI.',
  SCI: 'Parts de SCI : fiscalité IR (transparence) ou IS selon option. Attention à l\'abus de droit en cas de SCI de gestion.',
  PINEL: 'Pinel : réduction d\'IR de 12% à 21% selon durée d\'engagement (6/9/12 ans). Plafonds de loyers et de ressources locataires.',
  DENORMANDIE: 'Denormandie : même avantage que Pinel mais dans l\'ancien avec travaux > 25% du coût total. Zones éligibles spécifiques.',
  MALRAUX: 'Malraux : réduction d\'IR de 22% à 30% des travaux selon secteur. Engagement de location 9 ans.',
  MONUMENT_HISTORIQUE: 'Monument Historique : déduction totale des travaux du revenu global sans plafond. Engagement de conservation 15 ans.',
  DEFICIT_FONCIER: 'Déficit foncier : imputation sur revenu global jusqu\'à 10 700€/an. Report du surplus sur revenus fonciers 10 ans.',
  VIAGER: 'Viager : acquisition avec rente. Bouquet imposé aux droits de mutation, rentes non déductibles pour l\'acquéreur.',
  NUE_PROPRIETE: 'Nue-propriété : propriété sans usufruit. Non imposable à l\'IFI. Reconstitution automatique à l\'extinction de l\'usufruit.',
  USUFRUIT: 'Usufruit : droit de jouissance. Imposable à l\'IFI pour sa valeur fiscale. Obligations d\'entretien.',
}

export function StepIdentification({ data, updateField, errors }: StepIdentificationProps) {
  const selectedType = TYPES_BIENS_IMMOBILIERS.find(t => t.value === data.type)
  const infoMessage = data.type ? TYPE_INFO_MESSAGES[data.type] : null

  return (
    <div className="space-y-6">
      {/* Nom du bien */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-600" />
            Identification du bien
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom" className="text-sm font-medium">
              Nom / Désignation du bien <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nom"
              value={data.nom || ''}
              onChange={(e) => updateField('nom', e.target.value)}
              placeholder="Ex: Appartement Rue de Paris, Maison de campagne, SCPI Primovie..."
              className={errors.nom ? 'border-red-500' : ''}
            />
            {errors.nom && <p className="text-xs text-red-500">{errors.nom}</p>}
            <p className="text-xs text-gray-500">
              Donnez un nom explicite pour identifier facilement ce bien dans le patrimoine
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Type de bien */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Type de bien immobilier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Catégorie du bien <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.type || ''}
              onValueChange={(value) => updateField('type', value as any)}
            >
              <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionnez le type de bien" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {Object.entries(CATEGORIES_BIENS).map(([key, category]) => (
                  category.items.length > 0 && (
                    <div key={key}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                        {category.label}
                      </div>
                      {category.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <SelectItem key={item.value} value={item.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-gray-500" />
                              <span>{item.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </div>
                  )
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
          </div>

          {/* Badge du type sélectionné */}
          {selectedType && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <selectedType.icon className="h-5 w-5" style={{ color: `var(--${selectedType.color}-500, #6366f1)` }} />
              <span className="font-medium">{selectedType.label}</span>
              <span className="text-xs text-gray-500 ml-auto">
                Catégorie : {selectedType.category.replace(/_/g, ' ')}
              </span>
            </div>
          )}

          {/* Message d'information selon le type */}
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

      {/* Usage et état */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Caractéristiques générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Usage */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Usage du bien</Label>
              <Select
                value={data.usage || 'HABITATION'}
                onValueChange={(value) => updateField('usage', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HABITATION">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Habitation
                    </div>
                  </SelectItem>
                  <SelectItem value="COMMERCIAL">
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      Commercial
                    </div>
                  </SelectItem>
                  <SelectItem value="PROFESSIONNEL">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Professionnel (bureaux)
                    </div>
                  </SelectItem>
                  <SelectItem value="MIXTE">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Mixte (habitation + professionnel)
                    </div>
                  </SelectItem>
                  <SelectItem value="AGRICOLE">
                    <div className="flex items-center gap-2">
                      <Map className="h-4 w-4" />
                      Agricole
                    </div>
                  </SelectItem>
                  <SelectItem value="INDUSTRIEL">
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4" />
                      Industriel
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* État */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">État du bien</Label>
              <Select
                value={data.etat || 'ANCIEN_BON_ETAT'}
                onValueChange={(value) => updateField('etat', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEUF">Neuf (moins de 5 ans)</SelectItem>
                  <SelectItem value="ANCIEN_BON_ETAT">Ancien - Bon état</SelectItem>
                  <SelectItem value="ANCIEN_TRAVAUX">Ancien - Travaux à prévoir</SelectItem>
                  <SelectItem value="VEFA">VEFA (Vente en l'État Futur d'Achèvement)</SelectItem>
                  <SelectItem value="RENOVATION_COMPLETE">Rénovation complète récente</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {data.etat === 'NEUF' && 'Frais de notaire réduits (~2-3%)'}
                {data.etat === 'ANCIEN_BON_ETAT' && 'Frais de notaire standards (~7-8%)'}
                {data.etat === 'ANCIEN_TRAVAUX' && 'Potentiel de déficit foncier si travaux déductibles'}
                {data.etat === 'VEFA' && 'TVA à 20%, frais de notaire réduits'}
                {data.etat === 'RENOVATION_COMPLETE' && 'Vérifier garanties et diagnostics'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Description et notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Description du bien</Label>
            <Textarea
              value={data.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Description détaillée du bien, particularités, historique, points d'attention, travaux réalisés ou à prévoir..."
              rows={4}
            />
            <p className="text-xs text-gray-500">
              Ces informations sont internes et ne seront pas partagées avec le client
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StepIdentification
