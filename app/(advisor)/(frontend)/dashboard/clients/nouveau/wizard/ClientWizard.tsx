'use client'

/**
 * ClientWizard - Formulaire 7 étapes création client
 * Stepper visuel, validation Zod par étape, sauvegarde progressive
 * Thème : Light solid
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { cn } from '@/app/_common/lib/utils'
import { CheckCircle2, ChevronLeft, ChevronRight, Save, User, Phone, Users, Briefcase, Wallet, Shield, AlertTriangle } from 'lucide-react'
import { Step1TypeRelation } from './steps/Step1TypeRelation'
import { Step2Identification } from './steps/Step2Identification'
import { Step3Coordonnees } from './steps/Step3Coordonnees'
import { Step4Famille } from './steps/Step4Famille'
import { Step5Professionnel } from './steps/Step5Professionnel'
import { Step6Patrimoine } from './steps/Step6Patrimoine'
import { Step7KycMifid } from './steps/Step7KycMifid'
import type { WizardData, StepValidation } from './types'

const STEPS = [
  { id: 1, title: 'Type', icon: User, description: 'Type de relation' },
  { id: 2, title: 'Identité', icon: User, description: 'Identification' },
  { id: 3, title: 'Contact', icon: Phone, description: 'Coordonnées' },
  { id: 4, title: 'Famille', icon: Users, description: 'Situation familiale' },
  { id: 5, title: 'Profession', icon: Briefcase, description: 'Situation professionnelle' },
  { id: 6, title: 'Patrimoine', icon: Wallet, description: 'Patrimoine estimé' },
  { id: 7, title: 'KYC/MIF', icon: Shield, description: 'Conformité' },
]

const initialData: WizardData = {
  // Étape 1
  relationType: 'PROSPECT',
  clientType: 'PERSONNE_PHYSIQUE',
  // Étape 2
  civility: '',
  firstName: '',
  lastName: '',
  maidenName: '',
  birthDate: '',
  birthPlace: '',
  nationality: 'FR',
  taxResidence: 'FR',
  // Étape 3
  email: '',
  phone: '',
  mobile: '',
  address: { street: '', city: '', postalCode: '', country: 'FR' },
  // Étape 4
  maritalStatus: '',
  matrimonialRegime: '',
  numberOfChildren: 0,
  dependents: 0,
  // Étape 5
  profession: '',
  professionCategory: '',
  employmentType: '',
  employer: '',
  employmentSince: '',
  annualIncome: 0,
  // Étape 6
  netWealth: 0,
  financialAssets: 0,
  realEstateAssets: 0,
  otherAssets: 0,
  totalLiabilities: 0,
  // Étape 7
  riskProfile: '',
  investmentHorizon: '',
  investmentObjective: '',
  investmentKnowledge: 0,
  isPEP: false,
  originOfFunds: '',
}

export function ClientWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<WizardData>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)

  const updateData = useCallback((updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }))
    setErrors({})
  }, [])

  const validateStep = useCallback((step: number): StepValidation => {
    const errs: Record<string, string> = {}
    
    switch (step) {
      case 1:
        if (!data.relationType) errs.relationType = 'Type de relation requis'
        if (!data.clientType) errs.clientType = 'Type de client requis'
        break
      case 2:
        if (!data.civility) errs.civility = 'Civilité requise'
        if (!data.firstName?.trim()) errs.firstName = 'Prénom requis'
        if (!data.lastName?.trim()) errs.lastName = 'Nom requis'
        if (!data.birthDate) errs.birthDate = 'Date de naissance requise'
        break
      case 3:
        if (!data.email?.trim()) errs.email = 'Email requis'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Email invalide'
        break
      case 4:
        // Optionnel
        break
      case 5:
        // Optionnel
        break
      case 6:
        // Optionnel
        break
      case 7:
        if (!data.riskProfile) errs.riskProfile = 'Profil de risque requis'
        break
    }
    
    setErrors(errs)
    return { valid: Object.keys(errs).length === 0, errors: errs }
  }, [data])

  const nextStep = useCallback(() => {
    const validation = validateStep(currentStep)
    if (validation.valid && currentStep < 7) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, validateStep])

  const prevStep = useCallback(() => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1)
  }, [currentStep])

  const saveDraft = useCallback(async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/advisor/clients/draft', {
        method: draftId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draftId, data, step: currentStep }),
      })
      if (res.ok) {
        const result = await res.json()
        setDraftId(result.data?.id)
      }
    } catch (e) {
      console.error('Erreur sauvegarde brouillon:', e)
    } finally {
      setSaving(false)
    }
  }, [data, currentStep, draftId])

  const submit = useCallback(async () => {
    const validation = validateStep(7)
    if (!validation.valid) return
    
    try {
      setSaving(true)
      const res = await fetch('/api/advisor/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const result = await res.json()
        router.push(`/dashboard/clients/${result.data.id}`)
      }
    } catch (e) {
      console.error('Erreur création client:', e)
    } finally {
      setSaving(false)
    }
  }, [data, validateStep, router])

  const StepComponent = {
    1: Step1TypeRelation,
    2: Step2Identification,
    3: Step3Coordonnees,
    4: Step4Famille,
    5: Step5Professionnel,
    6: Step6Patrimoine,
    7: Step7KycMifid,
  }[currentStep]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau client</h1>
        <p className="text-gray-600">Créez un nouveau client en 7 étapes</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id
          return (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                isCompleted ? 'bg-green-500 border-green-500 text-white' :
                isActive ? 'bg-blue-600 border-blue-600 text-white' :
                'bg-white border-gray-300 text-gray-400'
              )}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="ml-2 hidden md:block">
                <p className={cn('text-sm font-medium', isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500')}>
                  {step.title}
                </p>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={cn('w-8 md:w-16 h-0.5 mx-2', isCompleted ? 'bg-green-500' : 'bg-gray-200')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Erreurs */}
      {Object.keys(errors).length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <AlertDescription className="ml-2 text-red-800">
            Veuillez corriger les erreurs avant de continuer
          </AlertDescription>
        </Alert>
      )}

      {/* Contenu étape */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {(() => { const Icon = STEPS[currentStep - 1].icon; return <Icon className="w-5 h-5 text-blue-600" /> })()}
            Étape {currentStep} : {STEPS[currentStep - 1].description}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {StepComponent && <StepComponent data={data} updateData={updateData} errors={errors} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Précédent
        </Button>
        <Button variant="outline" onClick={saveDraft} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder brouillon'}
        </Button>
        {currentStep < 7 ? (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={nextStep}>
            Suivant
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button className="bg-green-600 hover:bg-green-700" onClick={submit} disabled={saving}>
            {saving ? 'Création...' : 'Créer le client'}
            <CheckCircle2 className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}
