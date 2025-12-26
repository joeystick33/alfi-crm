 
'use client'

/**
 * Formulaire Crédit Professionnel
 * Tous les types de crédits avec assurance emprunteur et amortissement
 */

import { useState, useMemo } from 'react'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Button } from '@/app/_common/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { CollapsibleSection, CollapsibleGroup } from '@/app/_common/components/ui/CollapsibleSection'
import { formatCurrency } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  CreditCard, Home, GraduationCap, Briefcase, Building,
  Euro, Calendar, Info, Save, Loader2, Shield, BarChart3
} from 'lucide-react'
import type { Credit } from '@/app/_common/types/patrimoine.types'

// =============================================================================
// Types et Constantes
// =============================================================================

interface CreditFormProps {
  clientId: string
  initialData?: Partial<Credit>
  onSave: (data: Partial<Credit>) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

// Types de crédits
const TYPES_CREDITS = [
  {
    category: 'IMMOBILIER',
    label: 'Crédits immobiliers',
    icon: Home,
    color: 'blue',
    items: [
      { value: 'CREDIT_IMMOBILIER_RP', label: 'Crédit immobilier RP', description: 'Résidence principale', tauxMoyen: '3.5-4.5%', dureeMax: 25 },
      { value: 'CREDIT_IMMOBILIER_RS', label: 'Crédit immobilier RS', description: 'Résidence secondaire', tauxMoyen: '3.5-4.5%', dureeMax: 25 },
      { value: 'CREDIT_IMMOBILIER_LOCATIF', label: 'Crédit immobilier locatif', description: 'Investissement locatif', tauxMoyen: '3.5-4.5%', dureeMax: 25 },
      { value: 'PRET_RELAIS', label: 'Prêt relais', description: 'En attente de vente', tauxMoyen: '4-5%', dureeMax: 2 },
      { value: 'PRET_IN_FINE', label: 'Prêt in fine', description: 'Capital remboursé à l\'échéance', tauxMoyen: '4-5%', dureeMax: 20 },
      { value: 'PTZ', label: 'PTZ', description: 'Prêt à Taux Zéro', tauxMoyen: '0%', dureeMax: 25 },
      { value: 'PRET_EMPLOYEUR', label: 'Prêt employeur', description: '1% logement, Action Logement', tauxMoyen: '0-1%', dureeMax: 25 },
      { value: 'PEL_CEL', label: 'Prêt PEL/CEL', description: 'Prêt épargne logement', tauxMoyen: 'Variable', dureeMax: 15 },
    ]
  },
  {
    category: 'CONSOMMATION',
    label: 'Crédits à la consommation',
    icon: CreditCard,
    color: 'amber',
    items: [
      { value: 'PRET_PERSONNEL', label: 'Prêt personnel', description: 'Sans affectation', tauxMoyen: '4-8%', dureeMax: 7 },
      { value: 'CREDIT_AUTO', label: 'Crédit auto', description: 'Financement véhicule', tauxMoyen: '3-6%', dureeMax: 7 },
      { value: 'CREDIT_TRAVAUX', label: 'Crédit travaux', description: 'Travaux immobiliers', tauxMoyen: '3-5%', dureeMax: 10 },
      { value: 'CREDIT_RENOUVELABLE', label: 'Crédit renouvelable', description: 'Réserve d\'argent', tauxMoyen: '15-21%', dureeMax: 5 },
      { value: 'LOA', label: 'LOA', description: 'Location avec Option d\'Achat', tauxMoyen: '3-7%', dureeMax: 5 },
      { value: 'LLD', label: 'LLD', description: 'Location Longue Durée', tauxMoyen: 'N/A', dureeMax: 5 },
    ]
  },
  {
    category: 'PROFESSIONNEL',
    label: 'Crédits professionnels',
    icon: Briefcase,
    color: 'purple',
    items: [
      { value: 'PRET_PROFESSIONNEL', label: 'Prêt professionnel', description: 'BIC/BNC, TNS', tauxMoyen: '3-6%', dureeMax: 15 },
      { value: 'CREDIT_BAIL', label: 'Crédit-bail', description: 'Leasing professionnel', tauxMoyen: 'Variable', dureeMax: 7 },
      { value: 'PRET_CREATION', label: 'Prêt création entreprise', description: 'Entrepreneurs', tauxMoyen: '2-4%', dureeMax: 7 },
      { value: 'PRET_BPI', label: 'Prêt BPI', description: 'Banque Publique d\'Investissement', tauxMoyen: '0-2%', dureeMax: 10 },
    ]
  },
  {
    category: 'ETUDES',
    label: 'Prêts étudiants',
    icon: GraduationCap,
    color: 'teal',
    items: [
      { value: 'PRET_ETUDIANT', label: 'Prêt étudiant', description: 'Études supérieures', tauxMoyen: '0.5-2%', dureeMax: 10 },
      { value: 'PRET_ETUDIANT_GARANTI', label: 'Prêt étudiant garanti État', description: 'Sans caution parentale', tauxMoyen: '1-2%', dureeMax: 10 },
    ]
  },
  {
    category: 'AUTRES',
    label: 'Autres',
    icon: Building,
    color: 'gray',
    items: [
      { value: 'PRET_FAMILIAL', label: 'Prêt familial', description: 'Entre particuliers', tauxMoyen: '0-2%', dureeMax: 30 },
      { value: 'COMPTE_COURANT_ASSOCIE', label: 'Compte courant d\'associé', description: 'Avance en société', tauxMoyen: 'Variable', dureeMax: 99 },
      { value: 'AUTRE_CREDIT', label: 'Autre crédit', description: 'Divers', tauxMoyen: 'Variable', dureeMax: 30 },
    ]
  },
]

// Types d'amortissement
const TYPES_AMORTISSEMENT = [
  { value: 'AMORTISSABLE', label: 'Amortissable', description: 'Remboursement progressif capital + intérêts' },
  { value: 'IN_FINE', label: 'In fine', description: 'Intérêts mensuels, capital à l\'échéance' },
  { value: 'DIFFERE_TOTAL', label: 'Différé total', description: 'Aucun remboursement pendant une période' },
  { value: 'DIFFERE_PARTIEL', label: 'Différé partiel', description: 'Intérêts uniquement pendant une période' },
]

// Garanties
const TYPES_GARANTIES = [
  { value: 'HYPOTHEQUE', label: 'Hypothèque', description: 'Inscription au registre foncier' },
  { value: 'PPD', label: 'PPD', description: 'Privilège de Prêteur de Deniers' },
  { value: 'CAUTION_CREDIT_LOGEMENT', label: 'Caution Crédit Logement', description: 'Organisme de caution' },
  { value: 'CAUTION_SACCEF', label: 'Caution SACCEF', description: 'Caisse d\'Épargne' },
  { value: 'CAUTION_CAMCA', label: 'Caution CAMCA', description: 'Crédit Agricole' },
  { value: 'NANTISSEMENT', label: 'Nantissement', description: 'Sur contrat AV ou titres' },
  { value: 'CAUTION_PERSONNELLE', label: 'Caution personnelle', description: 'Engagement d\'un tiers' },
]

// =============================================================================
// Composant Principal
// =============================================================================

export function CreditForm({ clientId, initialData, onSave, onCancel, isEdit = false }: CreditFormProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<Partial<Credit>>({
    clientId,
    libelle: '',
    type: undefined,
    etablissement: '',
    numeroContrat: '',
    montantEmprunte: 0,
    capitalRestantDu: 0,
    tauxNominal: 0,
    tauxEffectifGlobal: 0,
    dureeInitiale: 0,
    dureeRestante: 0,
    dateDebut: '',
    dateFin: '',
    mensualite: 0,
    typeAmortissement: 'AMORTISSABLE',
    ...initialData,
  })

  const [assuranceEmprunteur, setAssuranceEmprunteur] = useState({
    active: initialData?.assuranceEmprunteur?.montant ? true : false,
    montant: initialData?.assuranceEmprunteur?.montant || 0,
    tauxAssurance: initialData?.assuranceEmprunteur?.taux || 0,
    compagnie: initialData?.assuranceEmprunteur?.compagnie || '',
    quotiteCouverte: initialData?.assuranceEmprunteur?.quotite || 100,
    garanties: initialData?.assuranceEmprunteur?.garanties || ['DECES', 'PTIA'],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Trouver le type sélectionné
  const selectedTypeInfo = useMemo(() => {
    for (const cat of TYPES_CREDITS) {
      const item = cat.items.find(i => i.value === formData.type)
      if (item) return { ...item, categoryColor: cat.color, categoryIcon: cat.icon }
    }
    return null
  }, [formData.type])

  // Calculs
  const calculations = useMemo(() => {
    const montantEmprunte = formData.montantEmprunte || 0
    const capitalRestant = formData.capitalRestantDu || 0
    const mensualite = formData.mensualite || 0
    const dureeRestante = formData.dureeRestante || 0
    const tauxNominal = formData.tauxNominal || 0
    const tauxAssurance = assuranceEmprunteur.tauxAssurance || 0

    // Coût total restant
    const coutTotalRestant = mensualite * dureeRestante
    const interetsRestants = coutTotalRestant - capitalRestant
    
    // Coût assurance restant
    const coutAssuranceRestant = assuranceEmprunteur.active 
      ? assuranceEmprunteur.montant * dureeRestante 
      : 0

    // Taux d'effort (si on a le revenu mensuel)
    const tauxEffort = 0 // À calculer avec revenus

    // Capital déjà remboursé
    const capitalRembourse = montantEmprunte - capitalRestant

    // Pourcentage remboursé
    const pourcentageRembourse = montantEmprunte > 0 
      ? (capitalRembourse / montantEmprunte) * 100 
      : 0

    return {
      coutTotalRestant,
      interetsRestants,
      coutAssuranceRestant,
      capitalRembourse,
      pourcentageRembourse,
    }
  }, [formData, assuranceEmprunteur])

  // Mise à jour
  const updateField = <K extends keyof Credit>(field: K, value: Credit[K]) => {
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
    if (!formData.type) newErrors.type = 'Le type de crédit est requis'
    if (!formData.libelle) newErrors.libelle = 'Le libellé est requis'
    if (!formData.montantEmprunte || formData.montantEmprunte <= 0) {
      newErrors.montantEmprunte = 'Le montant emprunté est requis'
    }
    if (!formData.mensualite || formData.mensualite <= 0) {
      newErrors.mensualite = 'La mensualité est requise'
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
      const dataToSave = {
        ...formData,
        assuranceEmprunteur: assuranceEmprunteur.active ? {
          montant: assuranceEmprunteur.montant,
          taux: assuranceEmprunteur.tauxAssurance,
          compagnie: assuranceEmprunteur.compagnie,
          quotite: assuranceEmprunteur.quotiteCouverte,
          garanties: assuranceEmprunteur.garanties,
        } : undefined,
      }
      
      await onSave(dataToSave)
      toast({
        title: isEdit ? 'Crédit modifié' : 'Crédit ajouté',
        description: `Le crédit "${formData.libelle}" a été ${isEdit ? 'modifié' : 'ajouté'} avec succès`,
      })
    } catch (error) {
      toast({ title: 'Erreur', description: 'Une erreur est survenue', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Contenu - pas de gestion de scroll ici, géré par le modal parent */}
      <div className="p-6">
        <CollapsibleGroup accordion={true} defaultOpenId="type" spacing="sm">
          {/* Type de crédit */}
          <CollapsibleSection
            id="type"
            title="Type de crédit"
            icon={CreditCard}
            iconColor="text-blue-600"
            hasRequired={true}
            hasError={!!errors.type}
            defaultOpen={true}
          >
            <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de crédit <span className="text-red-500">*</span></Label>
              <Select
                value={formData.type || ''}
                onValueChange={(value) => updateField('type', value as any)}
              >
                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionnez le type de crédit" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_CREDITS.map((category) => (
                    <div key={category.category}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                        {category.label}
                      </div>
                      {category.items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          <div className="flex items-center justify-between w-full">
                            <span>{item.label}</span>
                            <span className="text-xs text-gray-400 ml-2">Taux: {item.tauxMoyen}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
            </div>

            {selectedTypeInfo && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedTypeInfo.label}:</strong> {selectedTypeInfo.description}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Taux moyen: {selectedTypeInfo.tauxMoyen} | Durée max: {selectedTypeInfo.dureeMax} ans
                  </p>
                </div>
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
                placeholder="Ex: Crédit RP Rue de Paris, Crédit Auto Golf"
                className={errors.libelle ? 'border-red-500' : ''}
              />
              {errors.libelle && <p className="text-xs text-red-500">{errors.libelle}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="etablissement">Établissement prêteur</Label>
                <Input
                  id="etablissement"
                  value={formData.etablissement || ''}
                  onChange={(e) => updateField('etablissement', e.target.value)}
                  placeholder="BNP Paribas, Crédit Agricole..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroContrat">Numéro de contrat</Label>
                <Input
                  id="numeroContrat"
                  value={formData.numeroContrat || ''}
                  onChange={(e) => updateField('numeroContrat', e.target.value)}
                  placeholder="N° de prêt"
                />
              </div>
            </div>
            </div>
          </CollapsibleSection>

          {/* Montants */}
          <CollapsibleSection
            id="montants"
            title="Montants et taux"
            icon={Euro}
            iconColor="text-green-600"
            hasRequired={true}
            hasError={!!errors.montantEmprunte || !!errors.mensualite}
          >
            <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="montantEmprunte">
                  Montant emprunté (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="montantEmprunte"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.montantEmprunte || ''}
                  onChange={(e) => updateField('montantEmprunte', parseFloat(e.target.value) || 0)}
                  placeholder="250000"
                  className={errors.montantEmprunte ? 'border-red-500' : ''}
                />
                {errors.montantEmprunte && <p className="text-xs text-red-500">{errors.montantEmprunte}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="capitalRestantDu">Capital restant dû (€)</Label>
                <Input
                  id="capitalRestantDu"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.capitalRestantDu || ''}
                  onChange={(e) => updateField('capitalRestantDu', parseFloat(e.target.value) || 0)}
                  placeholder="180000"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tauxNominal">Taux nominal (%)</Label>
                <Input
                  id="tauxNominal"
                  type="number"
                  min="0"
                  max="30"
                  step="0.01"
                  value={formData.tauxNominal || ''}
                  onChange={(e) => updateField('tauxNominal', parseFloat(e.target.value) || 0)}
                  placeholder="3.50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tauxEffectifGlobal">TAEG (%)</Label>
                <Input
                  id="tauxEffectifGlobal"
                  type="number"
                  min="0"
                  max="30"
                  step="0.01"
                  value={formData.tauxEffectifGlobal || ''}
                  onChange={(e) => updateField('tauxEffectifGlobal', parseFloat(e.target.value) || 0)}
                  placeholder="4.10"
                />
                <p className="text-xs text-gray-500">Taux Annuel Effectif Global</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mensualite">
                  Mensualité (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mensualite"
                  type="number"
                  min="0"
                  step="10"
                  value={formData.mensualite || ''}
                  onChange={(e) => updateField('mensualite', parseFloat(e.target.value) || 0)}
                  placeholder="1250"
                  className={errors.mensualite ? 'border-red-500' : ''}
                />
                {errors.mensualite && <p className="text-xs text-red-500">{errors.mensualite}</p>}
              </div>
            </div>

            {/* Progression */}
            {formData.montantEmprunte && formData.montantEmprunte > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progression du remboursement</span>
                  <span className="text-sm">
                    {formatCurrency(calculations.capitalRembourse)} / {formatCurrency(formData.montantEmprunte)}
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${calculations.pourcentageRembourse}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {calculations.pourcentageRembourse.toFixed(1)}% remboursé
                </p>
              </div>
            )}
            </div>
          </CollapsibleSection>

          {/* Durée */}
          <CollapsibleSection
            id="duree"
            title="Durée"
            icon={Calendar}
            iconColor="text-indigo-600"
          >
            <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dureeInitiale">Durée initiale (mois)</Label>
                <Input
                  id="dureeInitiale"
                  type="number"
                  min="1"
                  value={formData.dureeInitiale || ''}
                  onChange={(e) => updateField('dureeInitiale', parseInt(e.target.value) || 0)}
                  placeholder="240"
                />
                <p className="text-xs text-gray-500">
                  Soit {Math.floor((formData.dureeInitiale || 0) / 12)} ans et {(formData.dureeInitiale || 0) % 12} mois
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dureeRestante">Durée restante (mois)</Label>
                <Input
                  id="dureeRestante"
                  type="number"
                  min="0"
                  value={formData.dureeRestante || ''}
                  onChange={(e) => updateField('dureeRestante', parseInt(e.target.value) || 0)}
                  placeholder="180"
                />
                <p className="text-xs text-gray-500">
                  Soit {Math.floor((formData.dureeRestante || 0) / 12)} ans et {(formData.dureeRestante || 0) % 12} mois
                </p>
              </div>
            </div>

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
                <Label htmlFor="dateFin">Date de fin prévisionnelle</Label>
                <Input
                  id="dateFin"
                  type="date"
                  value={formData.dateFin || ''}
                  onChange={(e) => updateField('dateFin', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type d'amortissement</Label>
              <Select
                value={formData.typeAmortissement || 'AMORTISSABLE'}
                onValueChange={(value) => updateField('typeAmortissement', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_AMORTISSEMENT.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <span className="font-medium">{type.label}</span>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          </CollapsibleSection>

          {/* Assurance emprunteur */}
          <CollapsibleSection
            id="assurance"
            title="Assurance emprunteur"
            icon={Shield}
            iconColor="text-purple-600"
            badge={assuranceEmprunteur.active ? 'Active' : undefined}
            badgeColor="purple"
          >
            <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
              <Checkbox
                checked={assuranceEmprunteur.active}
                onChange={(checked) => setAssuranceEmprunteur(prev => ({ ...prev, active: checked }))}
              />
              <div>
                <Label className="font-medium">Assurance emprunteur active</Label>
                <p className="text-xs text-gray-500">ADI - Assurance Décès Invalidité</p>
              </div>
            </div>

            {assuranceEmprunteur.active && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="montantAssurance">Prime mensuelle (€)</Label>
                    <Input
                      id="montantAssurance"
                      type="number"
                      min="0"
                      step="1"
                      value={assuranceEmprunteur.montant || ''}
                      onChange={(e) => setAssuranceEmprunteur(prev => ({ 
                        ...prev, 
                        montant: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder="35"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tauxAssurance">Taux assurance (%)</Label>
                    <Input
                      id="tauxAssurance"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={assuranceEmprunteur.tauxAssurance || ''}
                      onChange={(e) => setAssuranceEmprunteur(prev => ({ 
                        ...prev, 
                        tauxAssurance: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder="0.15"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="compagnieAssurance">Compagnie d'assurance</Label>
                    <Input
                      id="compagnieAssurance"
                      value={assuranceEmprunteur.compagnie || ''}
                      onChange={(e) => setAssuranceEmprunteur(prev => ({ 
                        ...prev, 
                        compagnie: e.target.value 
                      }))}
                      placeholder="CNP, April, Cardif..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quotiteCouverte">Quotité couverte (%)</Label>
                    <Input
                      id="quotiteCouverte"
                      type="number"
                      min="0"
                      max="100"
                      value={assuranceEmprunteur.quotiteCouverte || 100}
                      onChange={(e) => setAssuranceEmprunteur(prev => ({ 
                        ...prev, 
                        quotiteCouverte: parseFloat(e.target.value) || 100 
                      }))}
                    />
                    <p className="text-xs text-gray-500">100% = couverture totale du capital</p>
                  </div>
                </div>

                <Alert className="bg-purple-100 border-purple-300">
                  <Info className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-sm text-purple-800">
                    <strong>Loi Lemoine :</strong> Vous pouvez changer d'assurance emprunteur à tout moment 
                    pour une offre équivalente moins chère.
                  </AlertDescription>
                </Alert>
              </>
            )}
            </div>
          </CollapsibleSection>

          {/* Récapitulatif des coûts */}
          <CollapsibleSection
            id="recapitulatif"
            title="Récapitulatif des coûts restants"
            icon={BarChart3}
            iconColor="text-amber-600"
            badge={formatCurrency(calculations.coutTotalRestant + calculations.coutAssuranceRestant)}
            badgeColor="amber"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-3 bg-white rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700">Capital restant</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(formData.capitalRestantDu || 0)}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700">Intérêts restants estimés</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(calculations.interetsRestants)}
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-amber-200">
                <p className="text-xs text-amber-700">Coût assurance restant</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(calculations.coutAssuranceRestant)}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-amber-100 rounded-lg border border-amber-300">
              <div className="flex items-center justify-between">
                <span className="font-medium text-amber-800">Coût total restant</span>
                <span className="text-xl font-bold text-amber-700">
                  {formatCurrency(calculations.coutTotalRestant + calculations.coutAssuranceRestant)}
                </span>
              </div>
            </div>
          </CollapsibleSection>
        </CollapsibleGroup>

        {/* Footer avec boutons d'action */}
        <div className="pt-4 border-t flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEdit ? 'Enregistrer' : 'Créer le crédit'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreditForm
