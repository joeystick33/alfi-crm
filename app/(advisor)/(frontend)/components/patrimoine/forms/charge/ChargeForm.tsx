'use client'

/**
 * Formulaire Charge Professionnel
 * Toutes les catégories de charges avec déductibilité fiscale
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
  Receipt, Home, Car, Heart, Briefcase, CreditCard,
  Euro, Calendar, Info, Calculator, FileText,
  Save, Loader2, ChevronDown, Shield, Baby, Landmark
} from 'lucide-react'
import type { Charge, CategorieCharge, FrequenceRevenu } from '@/app/_common/types/patrimoine.types'

// =============================================================================
// Types et Constantes
// =============================================================================

interface ChargeFormProps {
  clientId: string
  initialData?: Partial<Charge>
  onSave: (data: Partial<Charge>) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

// Catégories de charges détaillées avec déductibilité
const CATEGORIES_CHARGES: {
  category: string
  label: string
  icon: typeof Receipt
  color: string
  items: { 
    value: CategorieCharge
    label: string
    description: string
    deductibilite: 'NON_DEDUCTIBLE' | 'DEDUCTIBLE_RF' | 'DEDUCTIBLE_BIC' | 'DEDUCTIBLE_IR' | 'CREDIT_IMPOT' | 'REDUCTION_IR'
    deductibiliteLabel: string
  }[]
}[] = [
  {
    category: 'LOGEMENT',
    label: 'Logement',
    icon: Home,
    color: 'blue',
    items: [
      { value: 'LOYER', label: 'Loyer', description: 'Location résidence principale', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'CHARGES_COPROPRIETE', label: 'Charges copropriété', description: 'Charges courantes', deductibilite: 'DEDUCTIBLE_RF', deductibiliteLabel: 'Déductible des revenus fonciers' },
      { value: 'TAXE_FONCIERE', label: 'Taxe foncière', description: 'Impôt local', deductibilite: 'DEDUCTIBLE_RF', deductibiliteLabel: 'Déductible des revenus fonciers' },
      { value: 'TAXE_HABITATION', label: 'Taxe habitation RS', description: 'Résidence secondaire uniquement', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'ASSURANCE_HABITATION', label: 'Assurance habitation', description: 'MRH, PNO', deductibilite: 'DEDUCTIBLE_RF', deductibiliteLabel: 'Déductible si locatif' },
      { value: 'ELECTRICITE_GAZ', label: 'Électricité / Gaz', description: 'Énergie', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'EAU', label: 'Eau', description: 'Consommation eau', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'INTERNET_TELEPHONE', label: 'Internet / Téléphone', description: 'Abonnements télécom', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible (sauf pro)' },
      { value: 'TRAVAUX_ENTRETIEN', label: 'Travaux entretien', description: 'Réparations, maintenance', deductibilite: 'DEDUCTIBLE_RF', deductibiliteLabel: 'Déductible RF (améliorations)' },
      { value: 'FRAIS_GESTION_LOCATIVE', label: 'Frais gestion locative', description: 'Agence immobilière', deductibilite: 'DEDUCTIBLE_RF', deductibiliteLabel: 'Déductible des revenus fonciers' },
    ]
  },
  {
    category: 'TRANSPORT',
    label: 'Transport',
    icon: Car,
    color: 'amber',
    items: [
      { value: 'CREDIT_AUTO', label: 'Crédit auto', description: 'Remboursement véhicule', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'ASSURANCE_AUTO', label: 'Assurance auto', description: 'Responsabilité civile, tous risques', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'CARBURANT', label: 'Carburant', description: 'Essence, diesel, électrique', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Frais réels possibles' },
      { value: 'ENTRETIEN_VEHICULE', label: 'Entretien véhicule', description: 'Révisions, réparations', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Frais réels possibles' },
      { value: 'PARKING', label: 'Parking', description: 'Abonnement stationnement', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'TRANSPORT_COMMUN', label: 'Transports en commun', description: 'Abonnements RATP, SNCF...', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Remboursement employeur 50%' },
      { value: 'PEAGES', label: 'Péages', description: 'Autoroutes', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
    ]
  },
  {
    category: 'SANTE',
    label: 'Santé',
    icon: Heart,
    color: 'rose',
    items: [
      { value: 'MUTUELLE', label: 'Mutuelle santé', description: 'Complémentaire santé', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible (sauf Madelin TNS)' },
      { value: 'FRAIS_MEDICAUX', label: 'Frais médicaux', description: 'Consultations, médicaments', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'OPTIQUE_DENTAIRE', label: 'Optique / Dentaire', description: 'Lunettes, prothèses', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
    ]
  },
  {
    category: 'ASSURANCES',
    label: 'Assurances',
    icon: Shield,
    color: 'purple',
    items: [
      { value: 'ASSURANCE_VIE_PRIMES', label: 'Primes assurance-vie', description: 'Versements AV', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible (avantage à la sortie)' },
      { value: 'PREVOYANCE', label: 'Prévoyance', description: 'Décès, invalidité, incapacité', deductibilite: 'DEDUCTIBLE_BIC', deductibiliteLabel: 'Déductible BIC/BNC (Madelin)' },
      { value: 'ASSURANCE_EMPRUNTEUR', label: 'Assurance emprunteur', description: 'ADI crédit immobilier', deductibilite: 'DEDUCTIBLE_RF', deductibiliteLabel: 'Déductible si locatif' },
      { value: 'PROTECTION_JURIDIQUE', label: 'Protection juridique', description: 'Défense et recours', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'GAV', label: 'GAV', description: 'Garantie Accidents de la Vie', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
    ]
  },
  {
    category: 'ENFANTS',
    label: 'Enfants / Famille',
    icon: Baby,
    color: 'teal',
    items: [
      { value: 'GARDE_ENFANTS', label: 'Garde d\'enfants', description: 'Crèche, nounou, périscolaire', deductibilite: 'CREDIT_IMPOT', deductibiliteLabel: 'Crédit impôt 50% (max 2 300€/enfant)' },
      { value: 'SCOLARITE', label: 'Scolarité', description: 'École privée, cantine', deductibilite: 'REDUCTION_IR', deductibiliteLabel: 'Réduction IR si privé' },
      { value: 'ACTIVITES_ENFANTS', label: 'Activités extra-scolaires', description: 'Sport, musique, loisirs', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'PENSION_ALIMENTAIRE_VERSEE', label: 'Pension alimentaire versée', description: 'Enfants, ex-conjoint', deductibilite: 'DEDUCTIBLE_IR', deductibiliteLabel: 'Déductible du revenu global' },
      { value: 'ETUDES_SUPERIEURES', label: 'Études supérieures', description: 'Frais universitaires', deductibilite: 'REDUCTION_IR', deductibiliteLabel: 'Réduction IR (61-183€/enfant)' },
    ]
  },
  {
    category: 'EPARGNE',
    label: 'Épargne et investissement',
    icon: Landmark,
    color: 'green',
    items: [
      { value: 'VERSEMENT_PER', label: 'Versement PER', description: 'Plan Épargne Retraite', deductibilite: 'DEDUCTIBLE_IR', deductibiliteLabel: 'Déductible (10% revenus, plafond)' },
      { value: 'VERSEMENT_PERP', label: 'Versement PERP/Madelin', description: 'Retraite TNS', deductibilite: 'DEDUCTIBLE_IR', deductibiliteLabel: 'Déductible (plafond Madelin)' },
      { value: 'VERSEMENT_EPARGNE', label: 'Épargne programmée', description: 'Versements réguliers', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'INVESTISSEMENT_FIP_FCPI', label: 'FIP / FCPI', description: 'Private Equity défiscalisant', deductibilite: 'REDUCTION_IR', deductibiliteLabel: 'Réduction IR 18-25%' },
      { value: 'INVESTISSEMENT_SOFICA', label: 'SOFICA', description: 'Investissement cinéma', deductibilite: 'REDUCTION_IR', deductibiliteLabel: 'Réduction IR jusqu\'à 48%' },
    ]
  },
  {
    category: 'CREDITS',
    label: 'Crédits et emprunts',
    icon: CreditCard,
    color: 'red',
    items: [
      { value: 'CREDIT_IMMOBILIER_RP', label: 'Crédit immobilier RP', description: 'Résidence principale', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'CREDIT_IMMOBILIER_LOCATIF', label: 'Crédit immobilier locatif', description: 'Investissement locatif', deductibilite: 'DEDUCTIBLE_RF', deductibiliteLabel: 'Intérêts déductibles RF' },
      { value: 'CREDIT_CONSOMMATION', label: 'Crédit consommation', description: 'Prêt personnel', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'CREDIT_REVOLVING', label: 'Crédit renouvelable', description: 'Réserve d\'argent', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
    ]
  },
  {
    category: 'PROFESSIONNEL',
    label: 'Charges professionnelles',
    icon: Briefcase,
    color: 'indigo',
    items: [
      { value: 'COTISATIONS_SOCIALES', label: 'Cotisations sociales', description: 'URSSAF, RSI, caisses', deductibilite: 'DEDUCTIBLE_BIC', deductibiliteLabel: 'Déductible BIC/BNC' },
      { value: 'CFE', label: 'CFE', description: 'Cotisation Foncière des Entreprises', deductibilite: 'DEDUCTIBLE_BIC', deductibiliteLabel: 'Déductible BIC/BNC' },
      { value: 'FRAIS_COMPTABILITE', label: 'Comptabilité', description: 'Expert-comptable', deductibilite: 'DEDUCTIBLE_BIC', deductibiliteLabel: 'Déductible + réduction IR' },
      { value: 'COTISATION_SYNDICALE', label: 'Cotisations syndicales', description: 'Syndicats professionnels', deductibilite: 'CREDIT_IMPOT', deductibiliteLabel: 'Crédit impôt 66%' },
      { value: 'FORMATION_PROFESSIONNELLE', label: 'Formation professionnelle', description: 'Stages, certifications', deductibilite: 'CREDIT_IMPOT', deductibiliteLabel: 'Crédit impôt formation' },
    ]
  },
  {
    category: 'IMPOTS',
    label: 'Impôts et taxes',
    icon: Landmark,
    color: 'gray',
    items: [
      { value: 'IMPOT_REVENU', label: 'Impôt sur le revenu', description: 'IR annuel', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'IFI', label: 'IFI', description: 'Impôt sur la Fortune Immobilière', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible (dons déductibles)' },
      { value: 'PRELEVEMENTS_SOCIAUX', label: 'Prélèvements sociaux', description: 'CSG, CRDS sur revenus du patrimoine', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'CSG partiellement déductible' },
    ]
  },
  {
    category: 'DIVERS',
    label: 'Divers',
    icon: Receipt,
    color: 'slate',
    items: [
      { value: 'DONS', label: 'Dons', description: 'Associations, fondations', deductibilite: 'REDUCTION_IR', deductibiliteLabel: 'Réduction IR 66-75%' },
      { value: 'EMPLOI_DOMICILE', label: 'Emploi à domicile', description: 'Ménage, jardinage', deductibilite: 'CREDIT_IMPOT', deductibiliteLabel: 'Crédit impôt 50% (max 12 000€)' },
      { value: 'ABONNEMENTS_LOISIRS', label: 'Abonnements / Loisirs', description: 'Salle de sport, streaming...', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'ALIMENTATION', label: 'Alimentation', description: 'Courses alimentaires', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'Non déductible' },
      { value: 'AUTRE_CHARGE', label: 'Autre charge', description: 'Divers', deductibilite: 'NON_DEDUCTIBLE', deductibiliteLabel: 'À évaluer' },
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

export function ChargeForm({ clientId, initialData, onSave, onCancel, isEdit = false }: ChargeFormProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<Charge>>({
    clientId,
    libelle: '',
    categorie: undefined,
    montant: 0,
    frequence: 'MENSUEL',
    dateDebut: '',
    dateFin: '',
    estRecurrent: true,
    estDeductible: false,
    typeDeductibilite: 'NON_DEDUCTIBLE',
    notes: '',
    ...initialData,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Trouver les infos de la catégorie sélectionnée
  const selectedCategoryInfo = useMemo(() => {
    for (const cat of CATEGORIES_CHARGES) {
      const item = cat.items.find(i => i.value === formData.categorie)
      if (item) return { ...item, categoryColor: cat.color, categoryIcon: cat.icon }
    }
    return null
  }, [formData.categorie])

  // Calcul du montant annuel
  const montantAnnuel = useMemo(() => {
    const montant = formData.montant || 0
    const freq = formData.frequence
    switch (freq) {
      case 'MENSUEL': return montant * 12
      case 'TRIMESTRIEL': return montant * 4
      case 'SEMESTRIEL': return montant * 2
      case 'ANNUEL': return montant
      case 'PONCTUEL': return montant
      default: return montant * 12
    }
  }, [formData.montant, formData.frequence])

  // Mise à jour automatique de la déductibilité
  const handleCategorieChange = (value: CategorieCharge) => {
    const info = CATEGORIES_CHARGES.flatMap(c => c.items).find(i => i.value === value)
    setFormData(prev => ({
      ...prev,
      categorie: value,
      estDeductible: info ? info.deductibilite !== 'NON_DEDUCTIBLE' : false,
      typeDeductibilite: info?.deductibilite || 'NON_DEDUCTIBLE',
    }))
  }

  // Mise à jour
  const updateField = <K extends keyof Charge>(field: K, value: Charge[K]) => {
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
    if (!formData.montant || formData.montant <= 0) newErrors.montant = 'Le montant est requis'
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
        title: isEdit ? 'Charge modifiée' : 'Charge ajoutée',
        description: `La charge "${formData.libelle}" a été ${isEdit ? 'modifiée' : 'ajoutée'} avec succès`,
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
            title="Type de charge"
            icon={Receipt}
            iconColor="text-red-600"
            hasRequired={true}
            hasError={!!errors.categorie}
            defaultOpen={true}
          >
            <div className="space-y-4">
            {/* Catégories avec accordion */}
            <div className="space-y-2">
              {CATEGORIES_CHARGES.map((category) => {
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
                              onChange={() => handleCategorieChange(item.value)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{item.label}</p>
                              <p className="text-xs text-gray-500">{item.description}</p>
                              <p className={cn(
                                'text-xs mt-1',
                                item.deductibilite !== 'NON_DEDUCTIBLE' ? 'text-green-600' : 'text-gray-400'
                              )}>
                                {item.deductibiliteLabel}
                              </p>
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

            {/* Info déductibilité */}
            {selectedCategoryInfo && selectedCategoryInfo.deductibilite !== 'NON_DEDUCTIBLE' && (
              <Alert className="bg-green-50 border-green-200">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm text-green-800">
                  <strong>Avantage fiscal :</strong> {selectedCategoryInfo.deductibiliteLabel}
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
                placeholder="Ex: Loyer appartement, Crédit immobilier Locatif..."
                className={errors.libelle ? 'border-red-500' : ''}
              />
              {errors.libelle && <p className="text-xs text-red-500">{errors.libelle}</p>}
            </div>
            </div>
          </CollapsibleSection>

          {/* Montants */}
          <CollapsibleSection
            id="montant"
            title="Montant"
            icon={Euro}
            iconColor="text-red-600"
            hasRequired={true}
            hasError={!!errors.montant}
            badge={montantAnnuel > 0 ? `${formatCurrency(montantAnnuel)}/an` : undefined}
            badgeColor="red"
          >
            <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="montant">
                  Montant (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="montant"
                  type="number"
                  min="0"
                  step="10"
                  value={formData.montant || ''}
                  onChange={(e) => updateField('montant', parseFloat(e.target.value) || 0)}
                  placeholder="1200"
                  className={errors.montant ? 'border-red-500' : ''}
                />
                {errors.montant && <p className="text-xs text-red-500">{errors.montant}</p>}
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
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">Montant annuel</span>
                </div>
                <span className="text-xl font-bold text-red-600">{formatCurrency(montantAnnuel)}</span>
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
                <Label className="font-medium">Charge récurrente</Label>
                <p className="text-xs text-gray-500">Cette charge est payée régulièrement</p>
              </div>
            </div>
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
          <Button onClick={handleSubmit} disabled={saving} className="bg-red-600 hover:bg-red-700">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Enregistrer' : 'Créer la charge'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChargeForm
