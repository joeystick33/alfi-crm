 
'use client'

/**
 * Formulaire Bien Immobilier Professionnel - Composant Principal
 * Assemble tous les steps du formulaire
 */

import { useState, useCallback } from 'react'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Progress } from '@/app/_common/components/ui/Progress'
import { cn } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  Home, MapPin, Building2, Euro, Users, Key, Calculator, CheckCircle, ChevronLeft, 
  ChevronRight, Save, Loader2
} from 'lucide-react'
import type { BienImmobilier } from '@/app/_common/types/patrimoine.types'

// Import des steps
import StepIdentification from './StepIdentification'
import StepLocalisation from './StepLocalisation'
import StepCaracteristiques from './StepCaracteristiques'
import StepAcquisition from './StepAcquisition'
import StepDetention from './StepDetention'
import StepLocation from './StepLocation'
import StepChargesFiscalite from './StepChargesFiscalite'

// =============================================================================
// Types
// =============================================================================

interface BienImmobilierFormProps {
  clientId: string
  initialData?: Partial<BienImmobilier>
  onSave: (data: Partial<BienImmobilier>) => Promise<void>
  onCancel: () => void
  isEdit?: boolean
}

type FormStep = 
  | 'identification'
  | 'localisation'
  | 'caracteristiques'
  | 'acquisition'
  | 'detention'
  | 'location'
  | 'charges_fiscalite'
  | 'resume'

interface StepConfig {
  id: FormStep
  label: string
  shortLabel: string
  icon: typeof Home
  required: boolean
}

// =============================================================================
// Configuration des étapes
// =============================================================================

const FORM_STEPS: StepConfig[] = [
  { id: 'identification', label: 'Identification du bien', shortLabel: 'Identification', icon: Home, required: true },
  { id: 'localisation', label: 'Localisation', shortLabel: 'Adresse', icon: MapPin, required: true },
  { id: 'caracteristiques', label: 'Caractéristiques', shortLabel: 'Caractéristiques', icon: Building2, required: true },
  { id: 'acquisition', label: 'Acquisition & Valorisation', shortLabel: 'Acquisition', icon: Euro, required: true },
  { id: 'detention', label: 'Mode de détention', shortLabel: 'Détention', icon: Users, required: true },
  { id: 'location', label: 'Location', shortLabel: 'Location', icon: Key, required: false },
  { id: 'charges_fiscalite', label: 'Charges & Fiscalité', shortLabel: 'Fiscalité', icon: Calculator, required: false },
  { id: 'resume', label: 'Résumé', shortLabel: 'Résumé', icon: CheckCircle, required: true },
]

// =============================================================================
// Composant Principal
// =============================================================================

export function BienImmobilierForm({ 
  clientId, 
  initialData, 
  onSave, 
  onCancel: _onCancel,
  isEdit = false 
}: BienImmobilierFormProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<FormStep>('identification')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // État du formulaire
  const [formData, setFormData] = useState<Partial<BienImmobilier>>({
    clientId,
    nom: '',
    type: 'RESIDENCE_PRINCIPALE',
    usage: 'HABITATION',
    etat: 'ANCIEN_BON_ETAT',
    adresse: {
      numero: '',
      rue: '',
      complement: '',
      codePostal: '',
      ville: '',
      pays: 'France',
    },
    surfaceHabitable: 0,
    nombrePieces: 0,
    nombreChambres: 0,
    nombreSDB: 1,
    equipements: {
      parking: false,
      nombrePlacesParking: 0,
      garage: false,
      cave: false,
      balcon: false,
      terrasse: false,
      jardin: false,
      piscine: false,
      ascenseur: false,
      gardien: false,
      interphone: false,
      digicode: false,
    },
    dateAcquisition: '',
    prixAcquisition: 0,
    fraisNotaire: 0,
    valorisationActuelle: 0,
    dateValorisation: new Date().toISOString().split('T')[0],
    sourceValorisation: 'ESTIMATION_PROPRIETAIRE',
    modeDetention: 'PLEINE_PROPRIETE',
    quotiteDetention: 100,
    estLoue: false,
    regimeFiscal: 'REEL_FONCIER',
    charges: {
      taxeFonciere: 0,
      chargesCopropriete: 0,
      assurancePNO: 0,
    },
    inclureDansIFI: true,
    documents: [],
    ...initialData,
  })

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
  const updateField = useCallback(<K extends keyof BienImmobilier>(
    field: K, 
    value: BienImmobilier[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error on change
    if (errors[field as string]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field as string]
        return next
      })
    }
  }, [errors])

  const updateNestedField = useCallback((
    parent: keyof BienImmobilier,
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
        if (!formData.nom) newErrors.nom = 'Le nom du bien est requis'
        if (!formData.type) newErrors.type = 'Le type de bien est requis'
        break
      case 'localisation':
        if (!formData.adresse?.rue) newErrors['adresse.rue'] = 'L\'adresse est requise'
        if (!formData.adresse?.codePostal) newErrors['adresse.codePostal'] = 'Le code postal est requis'
        if (!formData.adresse?.ville) newErrors['adresse.ville'] = 'La ville est requise'
        break
      case 'caracteristiques':
        if (!formData.surfaceHabitable || formData.surfaceHabitable <= 0) {
          newErrors.surfaceHabitable = 'La surface habitable est requise'
        }
        break
      case 'acquisition':
        if (!formData.dateAcquisition) newErrors.dateAcquisition = 'La date d\'acquisition est requise'
        if (!formData.prixAcquisition || formData.prixAcquisition <= 0) {
          newErrors.prixAcquisition = 'Le prix d\'acquisition est requis'
        }
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
      const plusValueLatente = (formData.valorisationActuelle || 0) - 
        (formData.prixAcquisition || 0) - 
        (formData.fraisNotaire || 0) - 
        (formData.montantTravaux || 0)
      
      const valeurIFI = formData.type === 'RESIDENCE_PRINCIPALE' 
        ? (formData.valorisationActuelle || 0) * 0.7 
        : (formData.valorisationActuelle || 0)

      await onSave({
        ...formData,
        plusValueLatente,
        valeurIFI: formData.inclureDansIFI ? valeurIFI : 0,
      })
      
      toast({
        title: isEdit ? 'Bien modifié' : 'Bien ajouté',
        description: `Le bien "${formData.nom}" a été ${isEdit ? 'modifié' : 'ajouté'} avec succès`,
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
        return <StepIdentification {...commonProps} />
      case 'localisation':
        return <StepLocalisation {...commonProps} />
      case 'caracteristiques':
        return <StepCaracteristiques {...commonProps} />
      case 'acquisition':
        return <StepAcquisition {...commonProps} />
      case 'detention':
        return <StepDetention {...commonProps} />
      case 'location':
        return <StepLocation {...commonProps} />
      case 'charges_fiscalite':
        return <StepChargesFiscalite {...commonProps} />
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
            Étape {currentStepIndex + 1} sur {FORM_STEPS.length} : <span className="font-medium">{FORM_STEPS[currentStepIndex].label}</span>
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
                  {isEdit ? 'Enregistrer les modifications' : 'Créer le bien'}
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

function StepResume({ data }: { data: Partial<BienImmobilier> }) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Récapitulatif du bien</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nom du bien</p>
                <p className="font-medium">{data.nom || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{data.type?.replace(/_/g, ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="font-medium">
                  {data.adresse?.numero} {data.adresse?.rue}<br />
                  {data.adresse?.codePostal} {data.adresse?.ville}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Surface</p>
                <p className="font-medium">{data.surfaceHabitable} m²</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Prix d'acquisition</p>
                <p className="font-medium">{formatCurrency(data.prixAcquisition || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valorisation actuelle</p>
                <p className="font-medium text-green-600">{formatCurrency(data.valorisationActuelle || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mode de détention</p>
                <p className="font-medium">{data.modeDetention?.replace(/_/g, ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Loué</p>
                <p className="font-medium">{data.estLoue ? 'Oui' : 'Non'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BienImmobilierForm
