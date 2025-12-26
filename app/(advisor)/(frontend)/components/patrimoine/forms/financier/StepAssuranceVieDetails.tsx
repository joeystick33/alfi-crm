 
'use client'

/**
 * Step Assurance-Vie Détails - Formulaire Actif Financier
 * Clause bénéficiaire, supports, frais, options
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Button } from '@/app/_common/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Separator } from '@/app/_common/components/ui/Separator'
import { cn } from '@/app/_common/lib/utils'
import { 
  Shield, Users, Percent, Plus, Trash2, Info, Settings, PieChart
} from 'lucide-react'
import type { ActifFinancier, LienParente, TypeSupportAssuranceVie } from '@/app/_common/types/patrimoine.types'

interface StepAssuranceVieDetailsProps {
  data: Partial<ActifFinancier>
  updateField: <K extends keyof ActifFinancier>(field: K, value: ActifFinancier[K]) => void
  updateNestedField: (parent: keyof ActifFinancier, field: string, value: any) => void
  errors: Record<string, string>
}

// Types de clauses bénéficiaires
const TYPES_CLAUSES = [
  { value: 'STANDARD', label: 'Clause standard', description: 'Conjoint, à défaut enfants, à défaut héritiers' },
  { value: 'DEMEMBREE', label: 'Clause démembrée', description: 'Usufruit au conjoint, nue-propriété aux enfants' },
  { value: 'PERSONNALISEE', label: 'Clause personnalisée', description: 'Rédaction sur mesure' },
  { value: 'A_TITRE_GRATUIT', label: 'À titre gratuit', description: 'Donation indirecte' },
]

// Liens de parenté
const LIENS_PARENTE: { value: LienParente; label: string }[] = [
  { value: 'CONJOINT', label: 'Conjoint' },
  { value: 'PARTENAIRE_PACS', label: 'Partenaire PACS' },
  { value: 'ENFANT', label: 'Enfant' },
  { value: 'PETIT_ENFANT', label: 'Petit-enfant' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'FRERE_SOEUR', label: 'Frère / Sœur' },
  { value: 'NEVEU_NIECE', label: 'Neveu / Nièce' },
  { value: 'TIERS', label: 'Tiers (sans lien)' },
]

// Types de supports
const TYPES_SUPPORTS: { value: TypeSupportAssuranceVie; label: string; risque: 'Faible' | 'Moyen' | 'Élevé' }[] = [
  { value: 'FONDS_EUROS', label: 'Fonds Euros', risque: 'Faible' },
  { value: 'EURO_CROISSANCE', label: 'Euro-croissance', risque: 'Moyen' },
  { value: 'UC_MONETAIRE', label: 'UC Monétaire', risque: 'Faible' },
  { value: 'UC_OBLIGATIONS', label: 'UC Obligations', risque: 'Moyen' },
  { value: 'UC_DIVERSIFIE', label: 'UC Diversifié', risque: 'Moyen' },
  { value: 'UC_ACTIONS', label: 'UC Actions', risque: 'Élevé' },
  { value: 'UC_IMMOBILIER', label: 'UC Immobilier (SCI)', risque: 'Moyen' },
  { value: 'SCPI', label: 'SCPI', risque: 'Moyen' },
  { value: 'OPCI', label: 'OPCI', risque: 'Moyen' },
  { value: 'ETF', label: 'ETF', risque: 'Moyen' },
  { value: 'ACTIONS_TITRES_VIFS', label: 'Titres vifs', risque: 'Élevé' },
  { value: 'PRODUITS_STRUCTURES', label: 'Produits structurés', risque: 'Élevé' },
]

// Profils de gestion
const PROFILS_GESTION = [
  { value: 'GESTION_LIBRE', label: 'Gestion libre', description: 'Vous choisissez vos supports' },
  { value: 'GESTION_PROFILEE_PRUDENT', label: 'Gestion profilée Prudent', description: '20-30% UC max' },
  { value: 'GESTION_PROFILEE_EQUILIBRE', label: 'Gestion profilée Équilibré', description: '40-60% UC' },
  { value: 'GESTION_PROFILEE_DYNAMIQUE', label: 'Gestion profilée Dynamique', description: '60-80% UC' },
  { value: 'GESTION_PILOTEE', label: 'Gestion pilotée', description: 'Allocation automatique selon horizon' },
  { value: 'GESTION_SOUS_MANDAT', label: 'Gestion sous mandat', description: 'Gérant dédié' },
]

export function StepAssuranceVieDetails({ data, updateField: _updateField, updateNestedField, errors: errors }: StepAssuranceVieDetailsProps) {
  const avDetails = data.assuranceVieDetails || {
    typeContrat: 'MULTI_SUPPORT',
    profilGestion: 'GESTION_LIBRE',
    fraisEntree: 0,
    fraisGestion: 0,
    fraisArbitrage: 0,
    clauseBeneficiaire: {
      type: 'STANDARD',
      texteClause: '',
      beneficiaires: [],
      dateRedaction: '',
      acceptee: false,
    },
    supports: [],
    rachatsPartiels: [],
    avancesEnCours: 0,
    options: {
      garantiePlancher: false,
      garantieDecesAccidentel: false,
      ratchet: false,
    },
  }

  const [beneficiaires, setBeneficiaires] = useState(avDetails.clauseBeneficiaire?.beneficiaires || [])
  const [supports, setSupports] = useState(avDetails.supports || [])

  // Calcul du total des quotités bénéficiaires
  const totalQuotites = beneficiaires.reduce((sum, b) => sum + (b.quotite || 0), 0)
  
  // Calcul du total des supports
  const totalSupports = supports.reduce((sum, s) => sum + (s.pourcentage || 0), 0)
  const partFondsEuros = supports.filter(s => s.type === 'FONDS_EUROS').reduce((sum, s) => sum + (s.pourcentage || 0), 0)
  const partUC = 100 - partFondsEuros

  // Ajouter un bénéficiaire
  const addBeneficiaire = () => {
    const newBenefs = [...beneficiaires, { ordre: beneficiaires.length + 1, designation: '', quotite: 0, lienParente: 'TIERS' as LienParente }]
    setBeneficiaires(newBenefs)
    updateNestedField('assuranceVieDetails', 'clauseBeneficiaire', { 
      ...avDetails.clauseBeneficiaire, 
      beneficiaires: newBenefs 
    })
  }

  // Supprimer un bénéficiaire
  const removeBeneficiaire = (index: number) => {
    const newBenefs = beneficiaires.filter((_, i) => i !== index)
    setBeneficiaires(newBenefs)
    updateNestedField('assuranceVieDetails', 'clauseBeneficiaire', { 
      ...avDetails.clauseBeneficiaire, 
      beneficiaires: newBenefs 
    })
  }

  // Mettre à jour un bénéficiaire
  const updateBeneficiaire = (index: number, field: string, value: any) => {
    const newBenefs = [...beneficiaires]
    newBenefs[index] = { ...newBenefs[index], [field]: value }
    setBeneficiaires(newBenefs)
    updateNestedField('assuranceVieDetails', 'clauseBeneficiaire', { 
      ...avDetails.clauseBeneficiaire, 
      beneficiaires: newBenefs 
    })
  }

  // Ajouter un support
  const addSupport = () => {
    const newSupports = [...supports, { nom: '', type: 'FONDS_EUROS' as TypeSupportAssuranceVie, valorisation: 0, pourcentage: 0, fraisGestionSupport: 0 }]
    setSupports(newSupports)
    updateNestedField('assuranceVieDetails', 'supports', newSupports)
  }

  // Supprimer un support
  const removeSupport = (index: number) => {
    const newSupports = supports.filter((_, i) => i !== index)
    setSupports(newSupports)
    updateNestedField('assuranceVieDetails', 'supports', newSupports)
  }

  // Mettre à jour un support
  const updateSupport = (index: number, field: string, value: any) => {
    const newSupports = [...supports]
    newSupports[index] = { ...newSupports[index], [field]: value }
    setSupports(newSupports)
    updateNestedField('assuranceVieDetails', 'supports', newSupports)
  }

  return (
    <div className="space-y-6">
      {/* Type de contrat et gestion */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Type de contrat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type de contrat</Label>
              <Select
                value={avDetails.typeContrat}
                onValueChange={(value) => updateNestedField('assuranceVieDetails', 'typeContrat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONO_SUPPORT">Mono-support (100% fonds euros)</SelectItem>
                  <SelectItem value="MULTI_SUPPORT">Multi-support (fonds euros + UC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mode de gestion</Label>
              <Select
                value={avDetails.profilGestion}
                onValueChange={(value) => updateNestedField('assuranceVieDetails', 'profilGestion', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFILS_GESTION.map((profil) => (
                    <SelectItem key={profil.value} value={profil.value}>
                      <div>
                        <span className="font-medium">{profil.label}</span>
                        <p className="text-xs text-gray-500">{profil.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-5 w-5 text-amber-600" />
            Frais du contrat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fraisEntree">Frais d'entrée (%)</Label>
              <Input
                id="fraisEntree"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={avDetails.fraisEntree || ''}
                onChange={(e) => updateNestedField('assuranceVieDetails', 'fraisEntree', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fraisGestion">Frais de gestion annuels (%)</Label>
              <Input
                id="fraisGestion"
                type="number"
                min="0"
                max="3"
                step="0.1"
                value={avDetails.fraisGestion || ''}
                onChange={(e) => updateNestedField('assuranceVieDetails', 'fraisGestion', parseFloat(e.target.value) || 0)}
                placeholder="0.6"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fraisArbitrage">Frais d'arbitrage (%)</Label>
              <Input
                id="fraisArbitrage"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={avDetails.fraisArbitrage || ''}
                onChange={(e) => updateNestedField('assuranceVieDetails', 'fraisArbitrage', parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clause bénéficiaire */}
      <Card className="border-purple-200 bg-purple-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-purple-800">
            <Users className="h-5 w-5" />
            Clause bénéficiaire
          </CardTitle>
          <CardDescription>
            Définit les bénéficiaires en cas de décès
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type de clause</Label>
              <Select
                value={avDetails.clauseBeneficiaire?.type || 'STANDARD'}
                onValueChange={(value) => updateNestedField('assuranceVieDetails', 'clauseBeneficiaire', {
                  ...avDetails.clauseBeneficiaire,
                  type: value,
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_CLAUSES.map((clause) => (
                    <SelectItem key={clause.value} value={clause.value}>
                      <div>
                        <span className="font-medium">{clause.label}</span>
                        <p className="text-xs text-gray-500">{clause.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateRedaction">Date de rédaction</Label>
              <Input
                id="dateRedaction"
                type="date"
                value={avDetails.clauseBeneficiaire?.dateRedaction || ''}
                onChange={(e) => updateNestedField('assuranceVieDetails', 'clauseBeneficiaire', {
                  ...avDetails.clauseBeneficiaire,
                  dateRedaction: e.target.value,
                })}
              />
            </div>
          </div>

          {/* Texte de la clause si personnalisée */}
          {avDetails.clauseBeneficiaire?.type === 'PERSONNALISEE' && (
            <div className="space-y-2">
              <Label htmlFor="texteClause">Texte de la clause</Label>
              <Textarea
                id="texteClause"
                value={avDetails.clauseBeneficiaire?.texteClause || ''}
                onChange={(e) => updateNestedField('assuranceVieDetails', 'clauseBeneficiaire', {
                  ...avDetails.clauseBeneficiaire,
                  texteClause: e.target.value,
                })}
                placeholder="Rédiger la clause bénéficiaire personnalisée..."
                rows={4}
              />
            </div>
          )}

          <Separator />

          {/* Liste des bénéficiaires */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Bénéficiaires désignés</h4>
              <Button variant="outline" size="sm" onClick={addBeneficiaire}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>

            {beneficiaires.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                Aucun bénéficiaire renseigné. Utilisez la clause standard par défaut.
              </p>
            ) : (
              <div className="space-y-3">
                {beneficiaires.map((benef, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-purple-200">
                    <div className="grid gap-3 md:grid-cols-4 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Ordre</Label>
                        <Input
                          type="number"
                          min="1"
                          value={benef.ordre || index + 1}
                          onChange={(e) => updateBeneficiaire(index, 'ordre', parseInt(e.target.value) || 1)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Désignation</Label>
                        <Input
                          value={benef.designation || ''}
                          onChange={(e) => updateBeneficiaire(index, 'designation', e.target.value)}
                          placeholder="Nom ou 'Mon conjoint'"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quotité (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={benef.quotite || ''}
                          onChange={(e) => updateBeneficiaire(index, 'quotite', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Lien</Label>
                          <Select
                            value={benef.lienParente || 'TIERS'}
                            onValueChange={(value) => updateBeneficiaire(index, 'lienParente', value)}
                          >
                            <SelectTrigger className="h-9">
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
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBeneficiaire(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total quotités */}
            {beneficiaires.length > 0 && (
              <div className={cn(
                'mt-3 p-2 rounded border text-sm',
                totalQuotites === 100 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              )}>
                Total des quotités : {totalQuotites}%
                {totalQuotites !== 100 && ' (doit être égal à 100%)'}
              </div>
            )}
          </div>

          {/* Clause acceptée */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-200">
            <Checkbox
              checked={avDetails.clauseBeneficiaire?.acceptee || false}
              onChange={(checked) => updateNestedField('assuranceVieDetails', 'clauseBeneficiaire', {
                ...avDetails.clauseBeneficiaire,
                acceptee: checked,
              })}
            />
            <div>
              <Label className="font-medium">Clause acceptée par le(s) bénéficiaire(s)</Label>
              <p className="text-xs text-gray-500">
                Une clause acceptée ne peut plus être modifiée sans l'accord du bénéficiaire
              </p>
            </div>
          </div>

          <Alert className="bg-purple-100 border-purple-300">
            <Info className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-sm text-purple-800">
              <strong>Transmission :</strong> Jusqu'à 152 500€/bénéficiaire exonérés de droits 
              (pour versements avant 70 ans). Au-delà : 20% puis 31,25%.
              Versements après 70 ans : abattement global de 30 500€.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Répartition des supports */}
      {avDetails.typeContrat === 'MULTI_SUPPORT' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-600" />
              Répartition des supports
            </CardTitle>
            <CardDescription>
              Détail des supports d'investissement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Résumé allocation */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">Part Fonds Euros</p>
                <p className="text-xl font-bold text-blue-600">{partFondsEuros}%</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">Part Unités de Compte</p>
                <p className="text-xl font-bold text-green-600">{partUC}%</p>
              </div>
            </div>

            {/* Liste des supports */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Supports d'investissement</h4>
                <Button variant="outline" size="sm" onClick={addSupport}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              {supports.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  Aucun support renseigné
                </p>
              ) : (
                <div className="space-y-3">
                  {supports.map((support, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="grid gap-3 md:grid-cols-5 items-end">
                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-xs">Support</Label>
                          <Input
                            value={support.nom || ''}
                            onChange={(e) => updateSupport(index, 'nom', e.target.value)}
                            placeholder="Nom du support"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={support.type || 'FONDS_EUROS'}
                            onValueChange={(value) => updateSupport(index, 'type', value)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TYPES_SUPPORTS.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Répartition (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={support.pourcentage || ''}
                            onChange={(e) => updateSupport(index, 'pourcentage', parseFloat(e.target.value) || 0)}
                            className="h-9"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSupport(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total supports */}
              {supports.length > 0 && (
                <div className={cn(
                  'mt-3 p-2 rounded border text-sm',
                  totalSupports === 100 
                    ? 'bg-green-50 border-green-200 text-green-700' 
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                )}>
                  Total : {totalSupports}%
                  {totalSupports !== 100 && ' (doit être égal à 100%)'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options et garanties */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Options et garanties
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { key: 'garantiePlancher', label: 'Garantie plancher décès', description: 'Garantit au minimum les versements nets' },
              { key: 'garantieDecesAccidentel', label: 'Garantie décès accidentel', description: 'Capital doublé en cas de décès accidentel' },
              { key: 'ratchet', label: 'Option Ratchet', description: 'Cristallise les gains à certaines dates' },
              { key: 'garantieBonneFinTMG', label: 'Taux minimum garanti', description: 'Rendement minimum sur le fonds euros' },
            ].map((option) => (
              <label 
                key={option.key}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  avDetails.options?.[option.key as keyof typeof avDetails.options]
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                )}
              >
                <Checkbox
                  checked={Boolean(avDetails.options?.[option.key as keyof typeof avDetails.options]) || false}
                  onChange={(checked) => updateNestedField('assuranceVieDetails', 'options', {
                    ...avDetails.options,
                    [option.key]: checked,
                  })}
                />
                <div>
                  <span className="font-medium text-sm">{option.label}</span>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Avances en cours */}
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="avancesEnCours">Avances en cours (€)</Label>
            <Input
              id="avancesEnCours"
              type="number"
              min="0"
              value={avDetails.avancesEnCours || ''}
              onChange={(e) => updateNestedField('assuranceVieDetails', 'avancesEnCours', parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
            <p className="text-xs text-gray-500">
              Montant des avances sur contrat non remboursées
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StepAssuranceVieDetails
