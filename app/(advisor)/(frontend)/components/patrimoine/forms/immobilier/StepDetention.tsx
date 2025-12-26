 
'use client'

/**
 * Step Détention - Formulaire Bien Immobilier
 * Mode de détention, démembrement, SCI, indivision
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Button } from '@/app/_common/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Separator } from '@/app/_common/components/ui/Separator'
import { formatCurrency, cn } from '@/app/_common/lib/utils'
import { 
  Users, Building, Lock, Clock, Info, AlertCircle, Trash2, UserPlus, Heart, Calculator
} from 'lucide-react'
import type { BienImmobilier, LienParente } from '@/app/_common/types/patrimoine.types'
import { MODES_DETENTION, ABATTEMENTS_DEMEMBREMENT } from '@/app/_common/constants/patrimoine.constants'

interface StepDetentionProps {
  data: Partial<BienImmobilier>
  updateField: <K extends keyof BienImmobilier>(field: K, value: BienImmobilier[K]) => void
  updateNestedField: (parent: keyof BienImmobilier, field: string, value: any) => void
  errors: Record<string, string>
}

// Types de liens de parenté pour indivision
const LIENS_PARENTE: { value: LienParente; label: string }[] = [
  { value: 'CONJOINT', label: 'Conjoint' },
  { value: 'PARTENAIRE_PACS', label: 'Partenaire PACS' },
  { value: 'ENFANT', label: 'Enfant' },
  { value: 'PETIT_ENFANT', label: 'Petit-enfant' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'GRAND_PARENT', label: 'Grand-parent' },
  { value: 'FRERE_SOEUR', label: 'Frère / Sœur' },
  { value: 'NEVEU_NIECE', label: 'Neveu / Nièce' },
  { value: 'ONCLE_TANTE', label: 'Oncle / Tante' },
  { value: 'TIERS', label: 'Tiers (sans lien)' },
]

// Calcul barème démembrement
function getBaremeDemembrement(age: number) {
  const bareme = ABATTEMENTS_DEMEMBREMENT.find(b => age < b.ageUsufruitier)
  return bareme || ABATTEMENTS_DEMEMBREMENT[ABATTEMENTS_DEMEMBREMENT.length - 1]
}

export function StepDetention({ data, updateField, updateNestedField, errors: errors }: StepDetentionProps) {
  const [coIndivisaires, setCoIndivisaires] = useState<{
    nom: string
    quotite: number
    lienParente: LienParente
  }[]>(data.indivisionDetails?.coIndivisaires || [])

  // Calculs démembrement
  const demembrementCalc = useMemo(() => {
    if (!data.demembrementDetails?.ageUsufruitier || !data.valorisationActuelle) {
      return null
    }
    const bareme = getBaremeDemembrement(data.demembrementDetails.ageUsufruitier)
    const valeurTotale = data.valorisationActuelle * (data.quotiteDetention || 100) / 100
    return {
      bareme,
      valeurUsufruit: valeurTotale * bareme.usufruit / 100,
      valeurNuePropriete: valeurTotale * bareme.nuePropriete / 100,
    }
  }, [data.demembrementDetails?.ageUsufruitier, data.valorisationActuelle, data.quotiteDetention])

  // Total quotités indivision
  const totalQuotites = useMemo(() => {
    const clientQuotite = data.quotiteDetention || 0
    const autresQuotites = coIndivisaires.reduce((sum, c) => sum + c.quotite, 0)
    return clientQuotite + autresQuotites
  }, [data.quotiteDetention, coIndivisaires])

  // Ajouter un co-indivisaire
  const addCoIndivisaire = () => {
    const newCoIndivisaires = [...coIndivisaires, { nom: '', quotite: 0, lienParente: 'TIERS' as LienParente }]
    setCoIndivisaires(newCoIndivisaires)
    updateNestedField('indivisionDetails', 'coIndivisaires', newCoIndivisaires)
  }

  // Supprimer un co-indivisaire
  const removeCoIndivisaire = (index: number) => {
    const newCoIndivisaires = coIndivisaires.filter((_, i) => i !== index)
    setCoIndivisaires(newCoIndivisaires)
    updateNestedField('indivisionDetails', 'coIndivisaires', newCoIndivisaires)
  }

  // Mettre à jour un co-indivisaire
  const updateCoIndivisaire = (index: number, field: string, value: any) => {
    const newCoIndivisaires = [...coIndivisaires]
    newCoIndivisaires[index] = { ...newCoIndivisaires[index], [field]: value }
    setCoIndivisaires(newCoIndivisaires)
    updateNestedField('indivisionDetails', 'coIndivisaires', newCoIndivisaires)
  }

  const selectedMode = MODES_DETENTION.find(m => m.value === data.modeDetention)
  const isDemembre = data.modeDetention === 'NUE_PROPRIETE' || data.modeDetention === 'USUFRUIT'
  const isIndivision = data.modeDetention === 'INDIVISION'
  const isSCI = data.modeDetention === 'SCI_IR' || data.modeDetention === 'SCI_IS'

  return (
    <div className="space-y-6">
      {/* Mode de détention */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Mode de détention
          </CardTitle>
          <CardDescription>
            Comment le bien est-il détenu juridiquement ?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mode de détention</Label>
              <Select
                value={data.modeDetention || 'PLEINE_PROPRIETE'}
                onValueChange={(value) => updateField('modeDetention', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODES_DETENTION.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div>
                        <span className="font-medium">{mode.label}</span>
                        <p className="text-xs text-gray-500">{mode.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quotiteDetention">
                Quotité de détention (%)
              </Label>
              <Input
                id="quotiteDetention"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={data.quotiteDetention || 100}
                onChange={(e) => updateField('quotiteDetention', parseFloat(e.target.value) || 100)}
              />
              <p className="text-xs text-gray-500">
                Part détenue par le client (100% = totalité)
              </p>
            </div>
          </div>

          {/* Info sur le mode sélectionné */}
          {selectedMode && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedMode.label} :</strong> {selectedMode.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Démembrement */}
      {isDemembre && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-purple-800">
              <Lock className="h-5 w-5" />
              Détails du démembrement
            </CardTitle>
            <CardDescription>
              {data.modeDetention === 'NUE_PROPRIETE' 
                ? 'Vous détenez la nue-propriété (propriété sans l\'usufruit)'
                : 'Vous détenez l\'usufruit (droit d\'usage et de jouissance)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type d'usufruit</Label>
              <Select
                value={data.demembrementDetails?.typeUsufruit || 'VIAGER'}
                onValueChange={(value) => updateNestedField('demembrementDetails', 'typeUsufruit', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIAGER">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Viager (jusqu'au décès de l'usufruitier)
                    </div>
                  </SelectItem>
                  <SelectItem value="TEMPORAIRE">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Temporaire (durée déterminée)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {data.demembrementDetails?.typeUsufruit === 'VIAGER' ? (
              <div className="space-y-2">
                <Label htmlFor="ageUsufruitier">Âge de l'usufruitier</Label>
                <Input
                  id="ageUsufruitier"
                  type="number"
                  min="0"
                  max="120"
                  value={data.demembrementDetails?.ageUsufruitier || ''}
                  onChange={(e) => {
                    const age = parseInt(e.target.value) || 0
                    updateNestedField('demembrementDetails', 'ageUsufruitier', age)
                  }}
                  placeholder="65"
                />
                {demembrementCalc && (
                  <p className="text-xs text-purple-700">
                    Barème fiscal (article 669 CGI) : Usufruit {demembrementCalc.bareme.usufruit}% / Nue-propriété {demembrementCalc.bareme.nuePropriete}%
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="dureeRestante">Durée restante (années)</Label>
                <Input
                  id="dureeRestante"
                  type="number"
                  min="1"
                  max="99"
                  value={data.demembrementDetails?.dureeRestante || ''}
                  onChange={(e) => updateNestedField('demembrementDetails', 'dureeRestante', parseInt(e.target.value) || 0)}
                  placeholder="15"
                />
                <p className="text-xs text-purple-700">
                  Usufruit temporaire : valorisé à 23% par tranche de 10 ans (max 7 tranches = 70%)
                </p>
              </div>
            )}

            {/* Valeurs calculées */}
            {demembrementCalc && (
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Valeur nue-propriété</span>
                  </div>
                  <p className="text-xl font-bold text-purple-700">
                    {formatCurrency(demembrementCalc.valeurNuePropriete)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {demembrementCalc.bareme.nuePropriete}% de la valeur totale
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Valeur usufruit</span>
                  </div>
                  <p className="text-xl font-bold text-purple-700">
                    {formatCurrency(demembrementCalc.valeurUsufruit)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {demembrementCalc.bareme.usufruit}% de la valeur totale
                  </p>
                </div>
              </div>
            )}

            <Alert className="bg-purple-100 border-purple-300">
              <Info className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-800">
                <strong>Implications fiscales :</strong>
                <ul className="mt-1 list-disc list-inside text-xs">
                  <li><strong>IFI :</strong> L'usufruitier déclare la valeur en pleine propriété</li>
                  <li><strong>Revenus :</strong> L'usufruitier perçoit les loyers</li>
                  <li><strong>Charges :</strong> Usufruitier = grosses réparations / Nu-propriétaire = entretien courant</li>
                  <li><strong>Succession :</strong> Reconstitution automatique au décès de l'usufruitier</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Indivision */}
      {isIndivision && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Users className="h-5 w-5" />
              Co-indivisaires
            </CardTitle>
            <CardDescription>
              Listez les autres propriétaires indivis du bien
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client principal */}
            <div className="p-3 bg-white rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">Client principal</p>
                    <p className="text-xs text-gray-500">Quotité : {data.quotiteDetention || 0}%</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-amber-700">
                  {data.quotiteDetention || 0}%
                </span>
              </div>
            </div>

            {/* Liste des co-indivisaires */}
            {coIndivisaires.map((coInd, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border border-amber-200">
                <div className="grid gap-3 md:grid-cols-4 items-end">
                  <div className="space-y-1 md:col-span-1">
                    <Label className="text-xs">Nom</Label>
                    <Input
                      value={coInd.nom}
                      onChange={(e) => updateCoIndivisaire(index, 'nom', e.target.value)}
                      placeholder="Nom du co-indivisaire"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quotité (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={coInd.quotite}
                      onChange={(e) => updateCoIndivisaire(index, 'quotite', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Lien de parenté</Label>
                    <Select
                      value={coInd.lienParente}
                      onValueChange={(value) => updateCoIndivisaire(index, 'lienParente', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LIENS_PARENTE.map((lien) => (
                          <SelectItem key={lien.value} value={lien.value}>
                            {lien.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCoIndivisaire(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Bouton ajouter */}
            <Button
              variant="outline"
              onClick={addCoIndivisaire}
              className="w-full border-dashed"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un co-indivisaire
            </Button>

            {/* Total des quotités */}
            <div className={cn(
              'p-3 rounded-lg border',
              totalQuotites === 100 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            )}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total des quotités</span>
                <span className={cn(
                  'text-lg font-bold',
                  totalQuotites === 100 ? 'text-green-600' : 'text-red-600'
                )}>
                  {totalQuotites}%
                </span>
              </div>
              {totalQuotites !== 100 && (
                <p className="text-xs text-red-600 mt-1">
                  Le total doit être égal à 100%
                </p>
              )}
            </div>

            <Alert className="bg-amber-100 border-amber-300">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                <strong>Attention indivision :</strong> Chaque indivisaire peut demander le partage à tout moment. 
                Convention d'indivision recommandée pour une durée déterminée (max 5 ans renouvelable).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* SCI */}
      {isSCI && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-indigo-800">
              <Building className="h-5 w-5" />
              Détails de la SCI
            </CardTitle>
            <CardDescription>
              {data.modeDetention === 'SCI_IR' 
                ? 'SCI à l\'IR (transparence fiscale)'
                : 'SCI à l\'IS (impôt sur les sociétés)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nomSCI">Nom de la SCI</Label>
                <Input
                  id="nomSCI"
                  value={data.sciDetails?.nomSCI || ''}
                  onChange={(e) => updateNestedField('sciDetails', 'nomSCI', e.target.value)}
                  placeholder="SCI Familiale Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siretSCI">SIRET</Label>
                <Input
                  id="siretSCI"
                  value={data.sciDetails?.siret || ''}
                  onChange={(e) => updateNestedField('sciDetails', 'siret', e.target.value)}
                  placeholder="123 456 789 00012"
                  maxLength={17}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="nombrePartsSCI">Nombre de parts détenues</Label>
                <Input
                  id="nombrePartsSCI"
                  type="number"
                  min="1"
                  value={data.sciDetails?.nombreParts || ''}
                  onChange={(e) => updateNestedField('sciDetails', 'nombreParts', parseInt(e.target.value) || 0)}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPartsSCI">Nombre total de parts</Label>
                <Input
                  id="totalPartsSCI"
                  type="number"
                  min="1"
                  value={data.sciDetails?.totalParts || ''}
                  onChange={(e) => updateNestedField('sciDetails', 'totalParts', parseInt(e.target.value) || 0)}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label>Pourcentage détenu</Label>
                <div className="h-10 px-3 flex items-center bg-gray-100 rounded-md border">
                  <span className="font-medium">
                    {data.sciDetails?.nombreParts && data.sciDetails?.totalParts
                      ? ((data.sciDetails.nombreParts / data.sciDetails.totalParts) * 100).toFixed(2)
                      : '0'}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Régime fiscal de la SCI</Label>
              <Select
                value={data.sciDetails?.regimeFiscal || (data.modeDetention === 'SCI_IS' ? 'IS' : 'IR')}
                onValueChange={(value) => updateNestedField('sciDetails', 'regimeFiscal', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IR">
                    <div>
                      <span className="font-medium">IR (Impôt sur le Revenu)</span>
                      <p className="text-xs text-gray-500">Transparence fiscale - Revenus imposés chez les associés</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="IS">
                    <div>
                      <span className="font-medium">IS (Impôt sur les Sociétés)</span>
                      <p className="text-xs text-gray-500">Imposition au niveau de la société - Amortissement possible</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert className="bg-indigo-100 border-indigo-300">
              <Calculator className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-sm text-indigo-800">
                <strong>Fiscalité SCI :</strong>
                <ul className="mt-1 list-disc list-inside text-xs">
                  {data.sciDetails?.regimeFiscal === 'IR' || data.modeDetention === 'SCI_IR' ? (
                    <>
                      <li>Revenus fonciers imposés dans la catégorie des revenus fonciers des associés</li>
                      <li>Plus-value des particuliers en cas de cession</li>
                      <li>Parts incluses dans l'assiette IFI</li>
                    </>
                  ) : (
                    <>
                      <li>Bénéfices imposés à l'IS (15% jusqu'à 42 500€, puis 25%)</li>
                      <li>Amortissement du bien possible</li>
                      <li>Plus-value professionnelle en cas de cession</li>
                      <li>Dividendes imposés au PFU ou barème pour les associés</li>
                    </>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Communauté */}
      {data.modeDetention === 'COMMUNAUTE' && (
        <Alert className="bg-pink-50 border-pink-200">
          <Heart className="h-4 w-4 text-pink-600" />
          <AlertDescription className="text-sm text-pink-800">
            <strong>Bien commun :</strong> Ce bien fait partie de la communauté des époux. 
            Il sera partagé selon le régime matrimonial en cas de divorce ou de décès.
            Chaque époux détient 50% sauf convention contraire.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default StepDetention
