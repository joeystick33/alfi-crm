 
'use client'

/**
 * Formulaire Actif Financier Professionnel - Composant Principal
 * Assemble tous les steps du formulaire selon le type de produit
 */

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Progress } from '@/app/_common/components/ui/Progress'
import { cn } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  Wallet, LineChart, Shield, Target, TrendingUp,
  ChevronLeft, ChevronRight, Save, Loader2, CheckCircle
} from 'lucide-react'
import type { ActifFinancier } from '@/app/_common/types/patrimoine.types'

// Import des steps
import StepIdentificationFinancier from './StepIdentificationFinancier'
import StepValorisationFinancier from './StepValorisationFinancier'
import StepAssuranceVieDetails from './StepAssuranceVieDetails'
import StepPEADetails from './StepPEADetails'

// =============================================================================
// Types
// =============================================================================

interface ActifFinancierFormProps {
  clientId: string
  initialData?: Partial<ActifFinancier>
  onSave: (data: Partial<ActifFinancier>) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

type FormStep = 
  | 'identification'
  | 'valorisation'
  | 'details_specifiques'
  | 'resume'

interface StepConfig {
  id: FormStep
  label: string
  shortLabel: string
  icon: typeof Wallet
  condition?: (data: Partial<ActifFinancier>) => boolean
}

// =============================================================================
// Configuration des étapes
// =============================================================================

const getFormSteps = (data: Partial<ActifFinancier>): StepConfig[] => {
  const steps: StepConfig[] = [
    { id: 'identification', label: 'Identification du produit', shortLabel: 'Identification', icon: Wallet },
    { id: 'valorisation', label: 'Valorisation', shortLabel: 'Valorisation', icon: TrendingUp },
  ]

  // Ajout conditionnel des steps selon le type
  const type = data.type

  // Assurance-vie et capitalisation
  if (type?.includes('ASSURANCE_VIE') || type === 'CONTRAT_CAPITALISATION' || type === 'CONTRAT_LUXEMBOURGEOIS') {
    steps.push({
      id: 'details_specifiques',
      label: 'Détails Assurance-vie',
      shortLabel: 'Clause & Supports',
      icon: Shield,
    })
  }
  // PEA
  else if (type === 'PEA' || type === 'PEA_PME') {
    steps.push({
      id: 'details_specifiques',
      label: 'Détails PEA',
      shortLabel: 'Portefeuille',
      icon: LineChart,
    })
  }
  // PER
  else if (type?.includes('PER') || type === 'PERP' || type === 'MADELIN') {
    steps.push({
      id: 'details_specifiques',
      label: 'Détails Épargne Retraite',
      shortLabel: 'Retraite',
      icon: Target,
    })
  }

  // Résumé final
  steps.push({ id: 'resume', label: 'Résumé', shortLabel: 'Résumé', icon: CheckCircle })

  return steps
}

// =============================================================================
// Composant Principal
// =============================================================================

export function ActifFinancierForm({ 
  clientId, 
  initialData, 
  onSave, 
  onCancel: _onCancel,
  isEdit = false 
}: ActifFinancierFormProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<FormStep>('identification')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // État du formulaire - type initialisé à '' pour éviter warning uncontrolled→controlled
  const [formData, setFormData] = useState<Partial<ActifFinancier>>({
    clientId,
    nom: '',
    type: '' as any,
    etablissement: '',
    numeroContrat: '',
    dateOuverture: '',
    versementsCumules: 0,
    valorisationActuelle: 0,
    dateValorisation: new Date().toISOString().split('T')[0],
    ...initialData,
  })

  // Steps dynamiques
  const FORM_STEPS = useMemo(() => getFormSteps(formData), [formData.type])

  // Navigation
  const currentStepIndex = FORM_STEPS.findIndex(s => s.id === currentStep)
  const canGoBack = currentStepIndex > 0
  const canGoNext = currentStepIndex < FORM_STEPS.length - 1
  const isLastStep = currentStep === 'resume'
  const progress = ((currentStepIndex + 1) / FORM_STEPS.length) * 100

  const goToStep = (step: FormStep) => setCurrentStep(step)
  const goNext = () => {
    if (validateCurrentStep() && canGoNext) {
      setCurrentStep(FORM_STEPS[currentStepIndex + 1].id)
    }
  }
  const goBack = () => canGoBack && setCurrentStep(FORM_STEPS[currentStepIndex - 1].id)

  // Mise à jour du formulaire
  const updateField = useCallback(<K extends keyof ActifFinancier>(
    field: K, 
    value: ActifFinancier[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as string]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field as string]
        return next
      })
    }
  }, [errors])

  const updateNestedField = useCallback((
    parent: keyof ActifFinancier,
    field: string,
    value: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [field]: value,
      },
    }))
  }, [])

  // Validation
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (currentStep) {
      case 'identification':
        if (!formData.type) newErrors.type = 'Le type de produit est requis'
        if (!formData.nom) newErrors.nom = 'Le nom du produit est requis'
        if (!formData.etablissement) newErrors.etablissement = 'L\'établissement est requis'
        if (!formData.dateOuverture) newErrors.dateOuverture = 'La date d\'ouverture est requise'
        break
      case 'valorisation':
        if (!formData.valorisationActuelle || formData.valorisationActuelle <= 0) {
          newErrors.valorisationActuelle = 'La valorisation actuelle est requise'
        }
        break
    }
    
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      toast({
        title: 'Champs requis manquants',
        description: 'Veuillez remplir tous les champs obligatoires',
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
      // Calculer les valeurs dérivées
      const plusValueLatente = (formData.valorisationActuelle || 0) - (formData.versementsCumules || 0)
      
      await onSave({
        ...formData,
        plusValueLatente,
      })
      
      toast({
        title: isEdit ? 'Actif modifié' : 'Actif ajouté',
        description: `L'actif "${formData.nom}" a été ${isEdit ? 'modifié' : 'ajouté'} avec succès`,
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
      case 'identification':
        return <StepIdentificationFinancier {...commonProps} />
      case 'valorisation':
        return <StepValorisationFinancier {...commonProps} />
      case 'details_specifiques':
        // Rendu conditionnel selon le type
        if (formData.type?.includes('ASSURANCE_VIE') || 
            formData.type === 'CONTRAT_CAPITALISATION' || 
            formData.type === 'CONTRAT_LUXEMBOURGEOIS') {
          return <StepAssuranceVieDetails {...commonProps} />
        } else if (formData.type === 'PEA' || formData.type === 'PEA_PME') {
          return <StepPEADetails {...commonProps} />
        } else if (formData.type?.includes('PER') || formData.type === 'PERP' || formData.type === 'MADELIN') {
          // Pour PER, on pourrait créer un composant StepPERDetails
          return <StepAssuranceVieDetails {...commonProps} />
        }
        return null
      case 'resume':
        return <StepResume data={formData} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col">
      {/* Progress et info étape */}
      <div className="px-6 py-3 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600">
            Étape {currentStepIndex + 1} sur {FORM_STEPS.length} : <span className="font-medium">{FORM_STEPS[currentStepIndex]?.label}</span>
          </p>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Navigation des étapes (desktop) */}
      <div className="hidden lg:flex px-6 py-3 border-b bg-gray-50 gap-1 overflow-x-auto">
        {FORM_STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = index < currentStepIndex
          const isClickable = index <= currentStepIndex + 1

          return (
            <button
              key={step.id}
              onClick={() => isClickable && goToStep(step.id)}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors',
                isActive && 'bg-blue-100 text-blue-700 font-medium',
                isCompleted && !isActive && 'text-green-600 hover:bg-green-50',
                !isActive && !isCompleted && isClickable && 'text-gray-600 hover:bg-gray-100',
                !isClickable && 'text-gray-400 cursor-not-allowed'
              )}
            >
              <Icon className={cn(
                'h-4 w-4',
                isActive && 'text-blue-600',
                isCompleted && !isActive && 'text-green-600'
              )} />
              <span className="hidden xl:inline">{step.shortLabel}</span>
              {isCompleted && !isActive && <CheckCircle className="h-3 w-3 text-green-500 ml-1" />}
            </button>
          )
        })}
      </div>

      {/* Contenu du step */}
      <div className="p-6">
        {renderCurrentStep()}
      </div>

      {/* Footer avec navigation */}
      <div className="px-6 py-4 border-t flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={!canGoBack}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>

        <div className="flex items-center gap-2">
          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEdit ? 'Enregistrer les modifications' : 'Créer l\'actif'}
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

// =============================================================================
// Step Résumé
// =============================================================================

function StepResume({ data }: { data: Partial<ActifFinancier> }) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)

  const plusValue = (data.valorisationActuelle || 0) - (data.versementsCumules || 0)
  const rendement = data.versementsCumules && data.versementsCumules > 0 
    ? ((plusValue / data.versementsCumules) * 100).toFixed(2)
    : '0'

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Récapitulatif de l'actif financier</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nom du produit</p>
                <p className="font-medium">{data.nom || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{data.type?.replace(/_/g, ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Établissement</p>
                <p className="font-medium">{data.etablissement || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date d'ouverture</p>
                <p className="font-medium">
                  {data.dateOuverture ? new Date(data.dateOuverture).toLocaleDateString('fr-FR') : '-'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Versements cumulés</p>
                <p className="font-medium">{formatCurrency(data.versementsCumules || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valorisation actuelle</p>
                <p className="font-medium text-green-600">{formatCurrency(data.valorisationActuelle || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Plus/moins-value</p>
                <p className={cn('font-medium', plusValue >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {plusValue >= 0 ? '+' : ''}{formatCurrency(plusValue)} ({plusValue >= 0 ? '+' : ''}{rendement}%)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ActifFinancierForm
