'use client'


/**
 * Wizard de création client professionnel
 * 17 étapes complètes pour CGP/Notaires/Courtiers
 */

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Badge } from '@/app/_common/components/ui/Badge'
import { cn } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  User, MapPin, Heart, Briefcase, Euro, TrendingUp, Home, Wallet,
  CreditCard, Shield, Target, FileText, AlertTriangle, Scale,
  CheckCircle, ChevronLeft, ChevronRight, Save, X, Loader2
} from 'lucide-react'

// Import des steps
import StepIdentite from './steps/StepIdentite'
import StepCoordonnees from './steps/StepCoordonnees'
import StepSituationFamiliale from './steps/StepSituationFamiliale'
import StepSituationProfessionnelle from './steps/StepSituationProfessionnelle'
import StepKycLcbft from './steps/StepKycLcbft'
import StepProfilInvestisseur from './steps/StepProfilInvestisseur'
import StepObjectifs from './steps/StepObjectifs'
import StepConsentements from './steps/StepConsentements'
import StepResume from './steps/StepResume'

// =============================================================================
// Types
// =============================================================================

interface ClientWizardProps {
  onSave: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  initialData?: Record<string, unknown>
  isEdit?: boolean
}

type WizardStep =
  | 'identite'
  | 'coordonnees'
  | 'situation_familiale'
  | 'situation_professionnelle'
  | 'revenus'
  | 'charges'
  | 'patrimoine_immobilier'
  | 'patrimoine_financier'
  | 'credits'
  | 'protection_sociale'
  | 'objectifs'
  | 'profil_risque'
  | 'kyc_lcbft'
  | 'consentements'
  | 'documents'
  | 'validation'
  | 'resume'

interface StepConfig {
  id: WizardStep
  label: string
  shortLabel: string
  icon: typeof User
  category: 'identite' | 'patrimoine' | 'objectifs' | 'conformite'
  required: boolean
}

// =============================================================================
// Configuration des étapes
// =============================================================================

const WIZARD_STEPS: StepConfig[] = [
  // Identité et situation
  { id: 'identite', label: 'Identité', shortLabel: 'Identité', icon: User, category: 'identite', required: false },
  { id: 'coordonnees', label: 'Coordonnées', shortLabel: 'Contact', icon: MapPin, category: 'identite', required: false },
  { id: 'situation_familiale', label: 'Situation familiale', shortLabel: 'Famille', icon: Heart, category: 'identite', required: false },
  { id: 'situation_professionnelle', label: 'Situation professionnelle', shortLabel: 'Emploi', icon: Briefcase, category: 'identite', required: false },
  // Patrimoine
  { id: 'revenus', label: 'Revenus', shortLabel: 'Revenus', icon: Euro, category: 'patrimoine', required: false },
  { id: 'charges', label: 'Charges', shortLabel: 'Charges', icon: TrendingUp, category: 'patrimoine', required: false },
  { id: 'patrimoine_immobilier', label: 'Patrimoine immobilier', shortLabel: 'Immobilier', icon: Home, category: 'patrimoine', required: false },
  { id: 'patrimoine_financier', label: 'Patrimoine financier', shortLabel: 'Financier', icon: Wallet, category: 'patrimoine', required: false },
  { id: 'credits', label: 'Crédits', shortLabel: 'Crédits', icon: CreditCard, category: 'patrimoine', required: false },
  { id: 'protection_sociale', label: 'Protection sociale', shortLabel: 'Protection', icon: Shield, category: 'patrimoine', required: false },
  // Objectifs
  { id: 'objectifs', label: 'Objectifs patrimoniaux', shortLabel: 'Objectifs', icon: Target, category: 'objectifs', required: false },
  { id: 'profil_risque', label: 'Profil investisseur', shortLabel: 'Risque', icon: TrendingUp, category: 'objectifs', required: false },
  // Conformité
  { id: 'kyc_lcbft', label: 'KYC / LCB-FT', shortLabel: 'KYC', icon: AlertTriangle, category: 'conformite', required: false },
  { id: 'consentements', label: 'Consentements', shortLabel: 'RGPD', icon: Scale, category: 'conformite', required: false },
  { id: 'documents', label: 'Documents', shortLabel: 'Docs', icon: FileText, category: 'conformite', required: false },
  { id: 'validation', label: 'Validation', shortLabel: 'Valid.', icon: CheckCircle, category: 'conformite', required: false },
  { id: 'resume', label: 'Résumé', shortLabel: 'Résumé', icon: CheckCircle, category: 'conformite', required: false },
]

const CATEGORIES = [
  { id: 'identite', label: 'Identité & Situation', color: 'blue' },
  { id: 'patrimoine', label: 'Patrimoine', color: 'green' },
  { id: 'objectifs', label: 'Objectifs', color: 'amber' },
  { id: 'conformite', label: 'Conformité', color: 'purple' },
]

// =============================================================================
// Composant Principal
// =============================================================================

export function ClientWizard({ onSave, onCancel, initialData, isEdit = false }: ClientWizardProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<WizardStep>('identite')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())

  // État du formulaire
  const [formData, setFormData] = useState<Record<string, unknown>>({
    identite: {},
    coordonnees: {},
    situationFamiliale: {},
    situationProfessionnelle: {},
    revenus: [],
    charges: [],
    patrimoineImmobilier: [],
    patrimoineFinancier: [],
    credits: [],
    protectionSociale: {},
    objectifs: {},
    profilRisque: {},
    kycLcbft: {},
    consentements: {},
    documents: [],
    ...initialData,
  })

  // Navigation
  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep)
  const currentStepConfig = WIZARD_STEPS[currentStepIndex]
  const canGoBack = currentStepIndex > 0
  const canGoNext = currentStepIndex < WIZARD_STEPS.length - 1
  const isLastStep = currentStep === 'resume'
  const progress = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step)
  }

  const goNext = () => {
    if (validateCurrentStep()) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      if (canGoNext) {
        setCurrentStep(WIZARD_STEPS[currentStepIndex + 1].id)
      }
    }
  }

  const goBack = () => {
    if (canGoBack) {
      setCurrentStep(WIZARD_STEPS[currentStepIndex - 1].id)
    }
  }

  // Mise à jour du formulaire
  const updateField = useCallback(<K extends string>(field: K, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }, [errors])

  const updateNestedField = useCallback((path: string, field: string, value: any) => {
    setFormData((prev: any) => {
      const parts = path.split('.')
      const newData = { ...prev }
      let current = newData

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...current[parts[i]] }
        current = current[parts[i]]
      }

      const lastPart = parts[parts.length - 1]
      current[lastPart] = { ...current[lastPart], [field]: value }

      return newData
    })
  }, [])

  // Validation souple - pas de champs obligatoires bloquants
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validation format uniquement (pas d'obligation de remplir)
    switch (currentStep) {
      case 'identite':
        // Format date si fournie
        const identite = formData.identite as any
        if (identite?.dateNaissance && !/^\d{4}-\d{2}-\d{2}$/.test(identite.dateNaissance)) {
          newErrors['identite.dateNaissance'] = 'Format date invalide (AAAA-MM-JJ)'
        }
        break
      case 'coordonnees':
        // Format email si fourni
        const coordonnees = formData.coordonnees as any
        if (coordonnees?.emailPersonnel && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coordonnees.emailPersonnel)) {
          newErrors['coordonnees.emailPersonnel'] = 'Format email invalide'
        }
        // Format téléphone si fourni
        if (coordonnees?.telephoneMobile && !/^[0-9+\s]{10,}$/.test(coordonnees.telephoneMobile.replace(/\s/g, ''))) {
          newErrors['coordonnees.telephoneMobile'] = 'Format téléphone invalide'
        }
        break
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast({
        title: 'Format invalide',
        description: 'Veuillez corriger les erreurs de format',
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  // Soumission
  const handleSubmit = async () => {
    setSaving(true)
    try {
      await onSave(formData)
      toast({
        title: isEdit ? 'Client modifié' : 'Client créé',
        description: `Le client a été ${isEdit ? 'modifié' : 'créé'} avec succès`,
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'enregistrement',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Rendu du step actuel
  const renderCurrentStep = () => {
    const commonProps = {
      data: formData,
      updateField,
      updateNestedField,
      errors,
    }

    switch (currentStep) {
      case 'identite':
        return <StepIdentite {...commonProps} />
      case 'coordonnees':
        return <StepCoordonnees {...commonProps} />
      case 'situation_familiale':
        return <StepSituationFamiliale {...commonProps} />
      case 'situation_professionnelle':
        return <StepSituationProfessionnelle {...commonProps} />
      case 'kyc_lcbft':
        return <StepKycLcbft {...commonProps} />
      case 'profil_risque':
        return <StepProfilInvestisseur {...commonProps} />
      case 'objectifs':
        return <StepObjectifs {...commonProps} />
      case 'consentements':
        return <StepConsentements {...commonProps} />
      case 'resume':
        return <StepResume {...commonProps} />
      // Pour les autres steps, afficher un placeholder
      default:
        return <StepPlaceholder step={currentStepConfig} />
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              {isEdit ? 'Modifier le client' : 'Nouveau client'}
            </h2>
            <p className="text-sm text-gray-500">
              Étape {currentStepIndex + 1} sur {WIZARD_STEPS.length} : {currentStepConfig?.label}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Navigation latérale */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar avec les étapes */}
        <div className="hidden lg:block w-64 border-r bg-white overflow-y-auto">
          {CATEGORIES.map((category) => {
            const categorySteps = WIZARD_STEPS.filter(s => s.category === category.id)
            return (
              <div key={category.id} className="p-4 border-b">
                <h3 className={cn('text-xs font-semibold uppercase tracking-wide mb-2', `text-${category.color}-600`)}>
                  {category.label}
                </h3>
                <div className="space-y-1">
                  {categorySteps.map((step) => {
                    const Icon = step.icon
                    const isActive = currentStep === step.id
                    const isCompleted = completedSteps.has(step.id)
                    const stepIndex = WIZARD_STEPS.findIndex(s => s.id === step.id)
                    const isClickable = stepIndex <= currentStepIndex + 1 || isCompleted

                    return (
                      <button
                        key={step.id}
                        onClick={() => isClickable && goToStep(step.id)}
                        disabled={!isClickable}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                          isActive && 'bg-blue-100 text-blue-700 font-medium',
                          isCompleted && !isActive && 'text-green-600',
                          !isActive && !isCompleted && isClickable && 'text-gray-600 hover:bg-gray-100',
                          !isClickable && 'text-gray-400 cursor-not-allowed'
                        )}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-blue-600', isCompleted && 'text-green-600')} />
                        <span className="truncate">{step.shortLabel}</span>
                        {isCompleted && !isActive && <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />}
                        {step.required && !isCompleted && (
                          <Badge variant="outline" className="ml-auto text-[10px] px-1 h-4">req</Badge>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderCurrentStep()}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t bg-white flex items-center justify-between">
        <Button variant="outline" onClick={goBack} disabled={!canGoBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        <div className="flex items-center gap-2">
          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? 'Enregistrer' : 'Créer le client'}
                </>
              )}
            </Button>
          ) : (
            <Button onClick={goNext}>
              Suivant
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Placeholder pour les steps non encore implémentés
function StepPlaceholder({ step }: { step: StepConfig }) {
  const Icon = step.icon
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Icon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{step.label}</h3>
        <p className="text-sm text-gray-500">
          Cette étape sera bientôt disponible
        </p>
      </CardContent>
    </Card>
  )
}

export default ClientWizard
