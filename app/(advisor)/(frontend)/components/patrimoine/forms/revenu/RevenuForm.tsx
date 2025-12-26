'use client'

/**
 * Formulaire Revenu Professionnel
 * Toutes les catégories de revenus avec fiscalité détaillée
 */

import { useState, useMemo } from 'react'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Button } from '@/app/_common/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { CollapsibleSection, CollapsibleGroup } from '@/app/_common/components/ui/CollapsibleSection'
import { formatCurrency, cn } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  Wallet, Briefcase, Building, Home, TrendingUp, Award, Gift,
  Euro, Calendar, Percent, Info, Calculator, FileText,
  Save, Loader2, ChevronDown
} from 'lucide-react'
import type { Revenu, CategorieRevenu, FrequenceRevenu } from '@/app/_common/types/patrimoine.types'

// =============================================================================
// Types et Constantes
// =============================================================================

interface RevenuFormProps {
  clientId: string
  initialData?: Partial<Revenu>
  onSave: (data: Partial<Revenu>) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

// Catégories de revenus détaillées
const CATEGORIES_REVENUS: {
  category: string
  label: string
  icon: typeof Wallet
  color: string
  items: { value: CategorieRevenu; label: string; description: string; fiscalite: string }[]
}[] = [
  {
    category: 'SALAIRES',
    label: 'Revenus du travail salarié',
    icon: Briefcase,
    color: 'blue',
    items: [
      { value: 'SALAIRE', label: 'Salaire', description: 'Rémunération contrat de travail', fiscalite: 'Traitements et salaires - Abattement 10%' },
      { value: 'PRIME', label: 'Prime', description: 'Primes exceptionnelles, intéressement, participation', fiscalite: 'Traitements et salaires' },
      { value: 'BONUS', label: 'Bonus', description: 'Bonus annuel, variable', fiscalite: 'Traitements et salaires' },
      { value: 'AVANTAGE_NATURE', label: 'Avantage en nature', description: 'Voiture, logement, téléphone...', fiscalite: 'Ajouté au salaire imposable' },
      { value: 'INDEMNITE_LICENCIEMENT', label: 'Indemnité de licenciement', description: 'Indemnité de départ', fiscalite: 'Exonérée dans certaines limites' },
      { value: 'INDEMNITE_RUPTURE_CONVENTIONNELLE', label: 'Indemnité rupture conventionnelle', description: '', fiscalite: 'Régime spécifique' },
    ]
  },
  {
    category: 'TNS',
    label: 'Revenus des indépendants',
    icon: Briefcase,
    color: 'indigo',
    items: [
      { value: 'BIC', label: 'BIC', description: 'Bénéfices Industriels et Commerciaux', fiscalite: 'Micro-BIC (71%) ou réel' },
      { value: 'BNC', label: 'BNC', description: 'Bénéfices Non Commerciaux', fiscalite: 'Micro-BNC (34%) ou réel' },
      { value: 'BA', label: 'BA', description: 'Bénéfices Agricoles', fiscalite: 'Micro-BA ou réel' },
      { value: 'HONORAIRES', label: 'Honoraires', description: 'Professions libérales', fiscalite: 'BNC' },
      { value: 'DROITS_AUTEUR', label: 'Droits d\'auteur', description: 'Royalties, propriété intellectuelle', fiscalite: 'BNC ou traitements et salaires' },
    ]
  },
  {
    category: 'DIRIGEANT',
    label: 'Revenus de dirigeant',
    icon: Building,
    color: 'purple',
    items: [
      { value: 'REMUNERATION_GERANT', label: 'Rémunération gérant', description: 'Gérant majoritaire ou minoritaire', fiscalite: 'Art. 62 ou traitements et salaires' },
      { value: 'DIVIDENDES', label: 'Dividendes', description: 'Distribution de bénéfices', fiscalite: 'PFU 30% ou barème + abattement 40%' },
      { value: 'JETONS_PRESENCE', label: 'Jetons de présence', description: 'Administrateur', fiscalite: 'Revenus de capitaux mobiliers' },
    ]
  },
  {
    category: 'IMMOBILIER',
    label: 'Revenus immobiliers',
    icon: Home,
    color: 'amber',
    items: [
      { value: 'REVENUS_FONCIERS', label: 'Revenus fonciers', description: 'Location nue', fiscalite: 'Micro-foncier (30%) ou réel' },
      { value: 'LMNP', label: 'LMNP', description: 'Location Meublée Non Professionnelle', fiscalite: 'Micro-BIC (50%) ou réel avec amortissement' },
      { value: 'LMP', label: 'LMP', description: 'Location Meublée Professionnelle', fiscalite: 'BIC professionnel' },
      { value: 'LOCATION_SAISONNIERE', label: 'Location saisonnière', description: 'Airbnb, tourisme', fiscalite: 'BIC - Micro ou réel' },
      { value: 'SCPI', label: 'Revenus SCPI', description: 'Distributions SCPI', fiscalite: 'Revenus fonciers' },
    ]
  },
  {
    category: 'CAPITAUX',
    label: 'Revenus de capitaux mobiliers',
    icon: TrendingUp,
    color: 'green',
    items: [
      { value: 'INTERETS', label: 'Intérêts', description: 'Comptes, obligations', fiscalite: 'PFU 30% ou barème' },
      { value: 'PLUS_VALUES_MOBILIERES', label: 'Plus-values mobilières', description: 'Cession titres', fiscalite: 'PFU 30% ou barème + abattements' },
      { value: 'ASSURANCE_VIE_RACHAT', label: 'Rachat assurance-vie', description: 'Retrait contrat', fiscalite: 'Fiscalité spécifique AV' },
      { value: 'CRYPTO', label: 'Crypto-actifs', description: 'Gains crypto-monnaies', fiscalite: 'PFU 30%' },
    ]
  },
  {
    category: 'RETRAITE',
    label: 'Retraite et pension',
    icon: Award,
    color: 'rose',
    items: [
      { value: 'PENSION_RETRAITE', label: 'Pension de retraite', description: 'Régime de base et complémentaire', fiscalite: 'Pensions - Abattement 10%' },
      { value: 'RETRAITE_COMPLEMENTAIRE', label: 'Retraite complémentaire', description: 'AGIRC-ARRCO, Madelin...', fiscalite: 'Pensions' },
      { value: 'PER_RENTE', label: 'Rente PER', description: 'Sortie en rente PER', fiscalite: 'Rente viagère à titre onéreux' },
      { value: 'PENSION_REVERSION', label: 'Pension de réversion', description: 'Conjoint décédé', fiscalite: 'Pensions' },
    ]
  },
  {
    category: 'SOCIAL',
    label: 'Prestations sociales',
    icon: Gift,
    color: 'teal',
    items: [
      { value: 'PENSION_ALIMENTAIRE_RECUE', label: 'Pension alimentaire reçue', description: 'Versée par ex-conjoint', fiscalite: 'Imposable' },
      { value: 'PENSION_INVALIDITE', label: 'Pension d\'invalidité', description: 'Sécurité sociale', fiscalite: 'Imposable selon les cas' },
      { value: 'ALLOCATION_CHOMAGE', label: 'Allocations chômage', description: 'Pôle Emploi', fiscalite: 'Imposable' },
      { value: 'RSA', label: 'RSA', description: 'Revenu de Solidarité Active', fiscalite: 'Non imposable' },
      { value: 'ALLOCATIONS_FAMILIALES', label: 'Allocations familiales', description: 'CAF', fiscalite: 'Non imposables' },
    ]
  },
  {
    category: 'AUTRES',
    label: 'Autres revenus',
    icon: Euro,
    color: 'gray',
    items: [
      { value: 'RENTE_VIAGERE', label: 'Rente viagère', description: 'Contrat viager', fiscalite: 'Fraction imposable selon âge' },
      { value: 'REVENU_EXCEPTIONNEL', label: 'Revenu exceptionnel', description: 'Indemnités, gains exceptionnels', fiscalite: 'Système du quotient possible' },
      { value: 'AUTRE', label: 'Autre revenu', description: 'Divers', fiscalite: 'Selon nature' },
    ]
  },
]

// Fréquences
const FREQUENCES: { value: FrequenceRevenu; label: string }[] = [
  { value: 'MENSUEL', label: 'Mensuel' },
  { value: 'TRIMESTRIEL', label: 'Trimestriel' },
  { value: 'SEMESTRIEL', label: 'Semestriel' },
  { value: 'ANNUEL', label: 'Annuel' },
  { value: 'PONCTUEL', label: 'Ponctuel (unique)' },
]

// =============================================================================
// Composant Principal
// =============================================================================

export function RevenuForm({ clientId, initialData, onSave, onCancel, isEdit = false }: RevenuFormProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<Revenu>>({
    clientId,
    libelle: '',
    categorie: undefined,
    montantBrut: 0,
    montantNet: 0,
    frequence: 'MENSUEL',
    dateDebut: '',
    dateFin: '',
    estRecurrent: true,
    estImposable: true,
    tauxImposition: 0,
    sourceRevenu: '',
    notes: '',
    ...initialData,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Trouver les infos de la catégorie sélectionnée
  const selectedCategoryInfo = useMemo(() => {
    for (const cat of CATEGORIES_REVENUS) {
      const item = cat.items.find(i => i.value === formData.categorie)
      if (item) return { ...item, categoryColor: cat.color, categoryIcon: cat.icon }
    }
    return null
  }, [formData.categorie])

  // Calcul du montant annuel
  const montantAnnuel = useMemo(() => {
    const montant = formData.montantNet || formData.montantBrut || 0
    const freq = formData.frequence
    switch (freq) {
      case 'MENSUEL': return montant * 12
      case 'TRIMESTRIEL': return montant * 4
      case 'SEMESTRIEL': return montant * 2
      case 'ANNUEL': return montant
      case 'PONCTUEL': return montant
      default: return montant * 12
    }
  }, [formData.montantNet, formData.montantBrut, formData.frequence])

  // Mise à jour
  const updateField = <K extends keyof Revenu>(field: K, value: Revenu[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as string]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field as string]
        return next
      })
    }
  }

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.categorie) newErrors.categorie = 'La catégorie est requise'
    if (!formData.libelle) newErrors.libelle = 'Le libellé est requis'
    if (!formData.montantBrut && !formData.montantNet) {
      newErrors.montantBrut = 'Le montant est requis'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumission
  const handleSubmit = async () => {
    if (!validate()) {
      toast({ title: 'Champs requis manquants', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      await onSave({
        ...formData,
        montantAnnuel,
      })
      toast({
        title: isEdit ? 'Revenu modifié' : 'Revenu ajouté',
        description: `Le revenu "${formData.libelle}" a été ${isEdit ? 'modifié' : 'ajouté'} avec succès`,
      })
    } catch (error) {
      toast({ title: 'Erreur', description: 'Une erreur est survenue', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Contenu - scroll géré par le modal parent */}
      <div className="p-6">
        <CollapsibleGroup accordion={true} defaultOpenId="type" spacing="sm">
          {/* Sélection de catégorie */}
          <CollapsibleSection
            id="type"
            title="Type de revenu"
            icon={Wallet}
            iconColor="text-blue-600"
            hasRequired={true}
            hasError={!!errors.categorie}
            defaultOpen={true}
          >
            <div className="space-y-4">
            {/* Catégories avec accordion */}
            <div className="space-y-2">
              {CATEGORIES_REVENUS.map((category) => {
                const Icon = category.icon
                const isExpanded = expandedCategory === category.category
                const hasSelectedItem = category.items.some(i => i.value === formData.categorie)

                return (
                  <div key={category.category} className="border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedCategory(isExpanded ? null : category.category)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 text-left transition-colors',
                        hasSelectedItem ? `bg-${category.color}-50` : 'bg-gray-50 hover:bg-gray-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn('h-5 w-5', `text-${category.color}-600`)} />
                        <span className="font-medium">{category.label}</span>
                        {hasSelectedItem && (
                          <span className={cn('text-xs px-2 py-0.5 rounded', `bg-${category.color}-100 text-${category.color}-700`)}>
                            {category.items.find(i => i.value === formData.categorie)?.label}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                    </button>

                    {isExpanded && (
                      <div className="p-3 border-t bg-white grid gap-2 md:grid-cols-2">
                        {category.items.map((item) => (
                          <label
                            key={item.value}
                            className={cn(
                              'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                              formData.categorie === item.value
                                ? `bg-${category.color}-50 border-${category.color}-300`
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            )}
                          >
                            <input
                              type="radio"
                              name="categorie"
                              value={item.value}
                              checked={formData.categorie === item.value}
                              onChange={() => updateField('categorie', item.value)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{item.label}</p>
                              <p className="text-xs text-gray-500">{item.description}</p>
                              <p className="text-xs text-gray-400 mt-1">{item.fiscalite}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {errors.categorie && <p className="text-xs text-red-500">{errors.categorie}</p>}

            {/* Info fiscalité */}
            {selectedCategoryInfo && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  <strong>Fiscalité :</strong> {selectedCategoryInfo.fiscalite}
                </AlertDescription>
              </Alert>
            )}
            </div>
          </CollapsibleSection>

          {/* Identification */}
          <CollapsibleSection
            id="identification"
            title="Identification"
            hasRequired={true}
            hasError={!!errors.libelle}
          >
            <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="libelle">
                Libellé <span className="text-red-500">*</span>
              </Label>
              <Input
                id="libelle"
                value={formData.libelle || ''}
                onChange={(e) => updateField('libelle', e.target.value)}
                placeholder="Ex: Salaire Net, Loyers Appartement Paris..."
                className={errors.libelle ? 'border-red-500' : ''}
              />
              {errors.libelle && <p className="text-xs text-red-500">{errors.libelle}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceRevenu">Source / Payeur</Label>
              <Input
                id="sourceRevenu"
                value={formData.sourceRevenu || ''}
                onChange={(e) => updateField('sourceRevenu', e.target.value)}
                placeholder="Ex: Employeur ACME SAS, Locataire M. Dupont..."
              />
            </div>
            </div>
          </CollapsibleSection>

          {/* Montants */}
          <CollapsibleSection
            id="montants"
            title="Montants"
            icon={Euro}
            iconColor="text-green-600"
            hasRequired={true}
            hasError={!!errors.montantBrut}
            badge={montantAnnuel > 0 ? `${formatCurrency(montantAnnuel)}/an` : undefined}
            badgeColor="green"
          >
            <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="montantBrut">
                  Montant brut (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="montantBrut"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.montantBrut || ''}
                  onChange={(e) => updateField('montantBrut', parseFloat(e.target.value) || 0)}
                  placeholder="4500"
                  className={errors.montantBrut ? 'border-red-500' : ''}
                />
                {errors.montantBrut && <p className="text-xs text-red-500">{errors.montantBrut}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="montantNet">Montant net (€)</Label>
                <Input
                  id="montantNet"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.montantNet || ''}
                  onChange={(e) => updateField('montantNet', parseFloat(e.target.value) || 0)}
                  placeholder="3500"
                />
              </div>
              <div className="space-y-2">
                <Label>Fréquence</Label>
                <Select
                  value={formData.frequence || 'MENSUEL'}
                  onValueChange={(value) => updateField('frequence', value as FrequenceRevenu)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Montant annuel calculé */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Montant annuel</span>
                </div>
                <span className="text-xl font-bold text-green-600">{formatCurrency(montantAnnuel)}</span>
              </div>
            </div>
            </div>
          </CollapsibleSection>

          {/* Dates et récurrence */}
          <CollapsibleSection
            id="periode"
            title="Période"
            icon={Calendar}
            iconColor="text-indigo-600"
          >
            <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateDebut">Date de début</Label>
                <Input
                  id="dateDebut"
                  type="date"
                  value={formData.dateDebut || ''}
                  onChange={(e) => updateField('dateDebut', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFin">Date de fin (si applicable)</Label>
                <Input
                  id="dateFin"
                  type="date"
                  value={formData.dateFin || ''}
                  onChange={(e) => updateField('dateFin', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                checked={formData.estRecurrent || false}
                onChange={(checked) => updateField('estRecurrent', checked)}
              />
              <div>
                <Label className="font-medium">Revenu récurrent</Label>
                <p className="text-xs text-gray-500">Ce revenu est perçu régulièrement</p>
              </div>
            </div>
            </div>
          </CollapsibleSection>

          {/* Fiscalité */}
          <CollapsibleSection
            id="fiscalite"
            title="Fiscalité"
            icon={Percent}
            iconColor="text-amber-600"
            badge={formData.estImposable !== false ? `TMI ${formData.tauxImposition || 30}%` : 'Non imposable'}
            badgeColor="amber"
          >
            <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                checked={formData.estImposable !== false}
                onChange={(checked) => updateField('estImposable', checked)}
              />
              <div>
                <Label className="font-medium">Revenu imposable</Label>
                <p className="text-xs text-gray-500">Ce revenu est soumis à l'impôt sur le revenu</p>
              </div>
            </div>

            {formData.estImposable !== false && (
              <div className="space-y-2">
                <Label htmlFor="tauxImposition">Taux marginal d'imposition estimé (%)</Label>
                <Select
                  value={String(formData.tauxImposition || 30)}
                  onValueChange={(value) => updateField('tauxImposition', parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Non imposable)</SelectItem>
                    <SelectItem value="11">11%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="41">41%</SelectItem>
                    <SelectItem value="45">45%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            </div>
          </CollapsibleSection>

          {/* Notes */}
          <CollapsibleSection
            id="notes"
            title="Notes"
            icon={FileText}
            iconColor="text-gray-600"
          >
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Notes complémentaires..."
              rows={3}
            />
          </CollapsibleSection>
        </CollapsibleGroup>

        {/* Footer avec boutons d'action */}
        <div className="pt-4 border-t flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Enregistrer' : 'Créer le revenu'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default RevenuForm
