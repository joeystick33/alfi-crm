 
'use client'

import { useState, useCallback } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from '@/app/_common/components/ui/Modal'
import { Button } from '@/app/_common/components/ui/Button'
import { useCreateClient } from '@/app/_common/hooks/use-api'
import { User, Building2, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { StepIndicator } from './StepIndicator'
import type { 
  ClientType, 
  ParticulierFormData, 
  ProfessionnelFormData,
} from './types'
import {
  ParticulierStep1Identity as Step1Identity,
  ParticulierStep2Contact as Step2Contact,
  ParticulierStep3Family as Step3Family,
  ParticulierStep4Professional as Step4Professional,
  ParticulierStep5Financial as Step5Financial,
  ParticulierStep6Investor as Step6Investor,
  ProfessionnelStep1Entreprise as ProStep1Entreprise,
  ProfessionnelStep2Activite as ProStep2Activite,
  ProfessionnelStep3Representant as ProStep3Representant,
  ProfessionnelStep4Coordonnees as ProStep4Coordonnees,
} from './steps'
import type { Entreprise } from '@/lib/services/entreprise/api-sirene'

interface CreateClientWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultStatus?: 'ACTIF' | 'INACTIF' | 'PROSPECT'
}

const PARTICULIER_STEPS = [
  { id: 1, title: 'Identité' },
  { id: 2, title: 'Coordonnées' },
  { id: 3, title: 'Famille' },
  { id: 4, title: 'Profession' },
  { id: 5, title: 'Finances' },
  { id: 6, title: 'Investisseur' },
  { id: 7, title: 'Récapitulatif' },
]

const PROFESSIONNEL_STEPS = [
  { id: 1, title: 'Entreprise' },
  { id: 2, title: 'Activité' },
  { id: 3, title: 'Représentant' },
  { id: 4, title: 'Coordonnées' },
  { id: 5, title: 'Récapitulatif' },
]

const initialParticulierData: ParticulierFormData = {
  step1: { civilite: '', firstName: '', lastName: '', birthDate: '', birthPlace: '', nationality: 'FR' },
  step2: { email: '', phone: '', address: { street: '', postalCode: '', city: '', country: 'FR' } },
  step3: { maritalStatus: '', numberOfChildren: 0, dependents: 0, hasConjoint: false },
  step4: { professionCategory: '', profession: '', employmentType: '' },
  step5: { annualIncome: 0, taxBracket: '', taxResidenceCountry: 'FR', ifiSubject: false },
  step6: { riskProfile: '', investmentHorizon: '', investmentGoals: [], investmentKnowledge: '', investmentExperience: '' },
}

const initialProfessionnelData: ProfessionnelFormData = {
  step1: { companyName: '', siren: '', siret: '', legalForm: '' },
  step2: { activitySector: '', companyCreationDate: '', numberOfEmployees: 0, annualRevenue: 0 },
  step3: { civilite: '', firstName: '', lastName: '', role: '', birthDate: '', nationality: 'FR', email: '', phone: '' },
  step4: { siegeAddress: { street: '', postalCode: '', city: '', country: 'FR' }, email: '', phone: '' },
}

export function CreateClientWizard({ open, onOpenChange, defaultStatus }: CreateClientWizardProps) {
  const [phase, setPhase] = useState<'type' | 'wizard'>('type')
  const [clientType, setClientType] = useState<ClientType>('PARTICULIER')
  const [currentStep, setCurrentStep] = useState(1)
  const [particulierData, setParticulierData] = useState<ParticulierFormData>(initialParticulierData)
  const [professionnelData, setProfessionnelData] = useState<ProfessionnelFormData>(initialProfessionnelData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedEntreprise, setSelectedEntreprise] = useState<Entreprise | null>(null)

  const createClient = useCreateClient({
    onSuccess: () => {
      onOpenChange(false)
      resetForm()
    },
  })

  const resetForm = useCallback(() => {
    setPhase('type')
    setClientType('PARTICULIER')
    setCurrentStep(1)
    setParticulierData(initialParticulierData)
    setProfessionnelData(initialProfessionnelData)
    setErrors({})
    setSelectedEntreprise(null)
  }, [])

  const steps = clientType === 'PARTICULIER' ? PARTICULIER_STEPS : PROFESSIONNEL_STEPS
  const totalSteps = steps.length

  // Validation souple - uniquement format, pas de champs obligatoires
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (clientType === 'PARTICULIER') {
      switch (currentStep) {
        case 1:
          // Format date si fournie
          if (particulierData.step1.birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(particulierData.step1.birthDate)) {
            newErrors.birthDate = 'Format invalide'
          }
          break
        case 2:
          // Format email si fourni
          if (particulierData.step2.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(particulierData.step2.email)) {
            newErrors.email = 'Format email invalide'
          }
          break
      }
    } else {
      switch (currentStep) {
        case 1:
          // Format SIRET si fourni
          if (professionnelData.step1.siret && !/^\d{14}$/.test(professionnelData.step1.siret.replace(/\s/g, ''))) {
            newErrors.siret = 'Le SIRET doit contenir 14 chiffres'
          }
          break
        case 3:
          // Format email si fourni
          if (professionnelData.step3.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(professionnelData.step3.email)) {
            newErrors.email = 'Format email invalide'
          }
          break
        case 4:
          // Format email si fourni
          if (professionnelData.step4.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(professionnelData.step4.email)) {
            newErrors.email = 'Format email invalide'
          }
          break
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    if (clientType === 'PARTICULIER') {
      const data = particulierData
      createClient.mutate({
        ...(defaultStatus ? { status: defaultStatus } : {}),
        clientType: 'PARTICULIER',
        civilite: data.step1.civilite,
        firstName: data.step1.firstName,
        lastName: data.step1.lastName,
        nomUsage: data.step1.nomUsage,
        birthDate: data.step1.birthDate,
        birthPlace: data.step1.birthPlace,
        nationality: data.step1.nationality,
        email: data.step2.email,
        phone: data.step2.phone,
        mobile: data.step2.mobile,
        address: data.step2.address,
        maritalStatus: data.step3.maritalStatus,
        matrimonialRegime: data.step3.matrimonialRegime,
        numberOfChildren: data.step3.numberOfChildren,
        dependents: data.step3.dependents,
        professionCategory: data.step4.professionCategory,
        profession: data.step4.profession,
        employmentType: data.step4.employmentType,
        employerName: data.step4.employerName,
        employmentSince: data.step4.employmentSince,
        annualIncome: data.step5.annualIncome,
        taxBracket: data.step5.taxBracket,
        taxResidenceCountry: data.step5.taxResidenceCountry,
        ifiSubject: data.step5.ifiSubject,
        riskProfile: data.step6.riskProfile,
        investmentHorizon: data.step6.investmentHorizon,
        investmentGoals: data.step6.investmentGoals,
        investmentKnowledge: data.step6.investmentKnowledge,
        investmentExperience: data.step6.investmentExperience,
      } as any)
    } else {
      const data = professionnelData
      createClient.mutate({
        ...(defaultStatus ? { status: defaultStatus } : {}),
        clientType: 'PROFESSIONNEL',
        companyName: data.step1.companyName,
        siren: data.step1.siren,
        siret: data.step1.siret,
        legalForm: data.step1.legalForm,
        activitySector: data.step2.activitySector,
        companyCreationDate: data.step2.companyCreationDate,
        numberOfEmployees: data.step2.numberOfEmployees,
        annualRevenue: data.step2.annualRevenue,
        firstName: data.step3.firstName,
        lastName: data.step3.lastName,
        email: data.step3.email,
        phone: data.step3.phone,
        mobile: data.step3.mobile,
        address: data.step4.siegeAddress,
      } as any)
    }
  }

  // Handler pour auto-remplir depuis l'API SIRENE
  const handleEntrepriseSelected = (entreprise: Entreprise) => {
    setSelectedEntreprise(entreprise)
    
    // Remplir step2 avec les données de l'entreprise
    setProfessionnelData(prev => ({
      ...prev,
      step2: {
        ...prev.step2,
        activitySector: entreprise.activite_principale || '',
        codeNAF: entreprise.activite_principale,
        numberOfEmployees: parseInt(entreprise.tranche_effectif_salarie || '0') || 0,
      },
      step4: {
        ...prev.step4,
        siegeAddress: entreprise.siege ? {
          street: entreprise.siege.adresse,
          postalCode: entreprise.siege.code_postal || '',
          city: entreprise.siege.libelle_commune || '',
          country: 'FR',
        } : prev.step4.siegeAddress,
      },
    }))

    // Remplir dirigeant si disponible
    if (entreprise.dirigeants && entreprise.dirigeants.length > 0) {
      const dirigeant = entreprise.dirigeants[0]
      if (dirigeant.type_dirigeant === 'personne physique') {
        const pp = dirigeant as any
        setProfessionnelData(prev => ({
          ...prev,
          step3: {
            ...prev.step3,
            firstName: pp.prenoms?.split(' ')[0] || '',
            lastName: pp.nom || '',
            role: pp.qualite || 'GERANT',
          },
        }))
      }
    }
  }

  const renderStep = () => {
    if (clientType === 'PARTICULIER') {
      switch (currentStep) {
        case 1:
          return (
            <Step1Identity
              data={particulierData.step1}
              onChange={(data) => setParticulierData({ ...particulierData, step1: data })}
              errors={errors}
            />
          )
        case 2:
          return (
            <Step2Contact
              data={particulierData.step2}
              onChange={(data) => setParticulierData({ ...particulierData, step2: data })}
              errors={errors}
            />
          )
        case 3:
          return (
            <Step3Family
              data={particulierData.step3}
              onChange={(data) => setParticulierData({ ...particulierData, step3: data })}
              errors={errors}
            />
          )
        case 4:
          return (
            <Step4Professional
              data={particulierData.step4}
              onChange={(data) => setParticulierData({ ...particulierData, step4: data })}
              errors={errors}
            />
          )
        case 5:
          return (
            <Step5Financial
              data={particulierData.step5}
              onChange={(data) => setParticulierData({ ...particulierData, step5: data })}
              errors={errors}
              hasConjoint={particulierData.step3.hasConjoint}
            />
          )
        case 6:
          return (
            <Step6Investor
              data={particulierData.step6}
              onChange={(data) => setParticulierData({ ...particulierData, step6: data })}
              errors={errors}
            />
          )
        case 7:
          return renderRecapParticulier()
      }
    } else {
      switch (currentStep) {
        case 1:
          return (
            <ProStep1Entreprise
              data={professionnelData.step1}
              onChange={(data) => setProfessionnelData({ ...professionnelData, step1: data })}
              onEntrepriseSelected={handleEntrepriseSelected}
              errors={errors}
            />
          )
        case 2:
          return (
            <ProStep2Activite
              data={professionnelData.step2}
              onChange={(data) => setProfessionnelData({ ...professionnelData, step2: data })}
              errors={errors}
            />
          )
        case 3:
          return (
            <ProStep3Representant
              data={professionnelData.step3}
              onChange={(data) => setProfessionnelData({ ...professionnelData, step3: data })}
              errors={errors}
            />
          )
        case 4:
          return (
            <ProStep4Coordonnees
              data={professionnelData.step4}
              onChange={(data) => setProfessionnelData({ ...professionnelData, step4: data })}
              errors={errors}
            />
          )
        case 5:
          return renderRecapProfessionnel()
      }
    }
  }

  const renderRecapParticulier = () => {
    const d = particulierData
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600" />
            Récapitulatif
          </h3>
          <p className="mt-1 text-sm text-gray-500">Vérifiez les informations avant de créer le client</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Identité */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Identité</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Nom</dt><dd className="font-medium">{d.step1.civilite} {d.step1.firstName} {d.step1.lastName}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Naissance</dt><dd>{d.step1.birthDate} à {d.step1.birthPlace}</dd></div>
            </dl>
          </div>

          {/* Coordonnées */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Coordonnées</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{d.step2.email}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Tél</dt><dd>{d.step2.mobile || d.step2.phone}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Ville</dt><dd>{d.step2.address?.city}</dd></div>
            </dl>
          </div>

          {/* Famille */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Situation familiale</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Statut</dt><dd>{d.step3.maritalStatus}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Enfants</dt><dd>{d.step3.numberOfChildren}</dd></div>
            </dl>
          </div>

          {/* Finances */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Situation financière</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Revenus</dt><dd className="font-medium">{d.step5.annualIncome?.toLocaleString('fr-FR')} €</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">TMI</dt><dd>{d.step5.taxBracket}%</dd></div>
            </dl>
          </div>
        </div>
      </div>
    )
  }

  const renderRecapProfessionnel = () => {
    const d = professionnelData
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-600" />
            Récapitulatif
          </h3>
          <p className="mt-1 text-sm text-gray-500">Vérifiez les informations avant de créer le client</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Entreprise */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Entreprise</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Raison sociale</dt><dd className="font-medium">{d.step1.companyName}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">SIRET</dt><dd>{d.step1.siret}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Forme</dt><dd>{d.step1.legalForm}</dd></div>
            </dl>
          </div>

          {/* Activité */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Activité</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Secteur</dt><dd>{d.step2.activitySector}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Effectifs</dt><dd>{d.step2.numberOfEmployees} salariés</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">CA</dt><dd className="font-medium">{d.step2.annualRevenue?.toLocaleString('fr-FR')} €</dd></div>
            </dl>
          </div>

          {/* Représentant */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Représentant</h4>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Nom</dt><dd className="font-medium">{d.step3.firstName} {d.step3.lastName}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Fonction</dt><dd>{d.step3.role}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd>{d.step3.email}</dd></div>
            </dl>
          </div>

          {/* Siège */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Siège social</h4>
            <dl className="space-y-2 text-sm">
              <div><dd>{d.step4.siegeAddress?.street}</dd></div>
              <div><dd>{d.step4.siegeAddress?.postalCode} {d.step4.siegeAddress?.city}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Modal open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o) }}>
      <ModalContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>
            {phase === 'type' 
              ? 'Nouveau client' 
              : `Nouveau client ${clientType === 'PARTICULIER' ? 'particulier' : 'professionnel'}`
            }
          </ModalTitle>
        </ModalHeader>

        {phase === 'type' ? (
          <div className="py-6">
            <p className="text-sm text-gray-500 mb-6 text-center">
              Sélectionnez le type de client à créer
            </p>
            <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
              <button
                className="group flex flex-col items-center gap-4 rounded-xl border-2 border-gray-200 p-8 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-lg"
                onClick={() => { setClientType('PARTICULIER'); setPhase('wizard') }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                  <User className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Particulier</h3>
                  <p className="text-sm text-gray-500 mt-1">Client personne physique</p>
                  <p className="text-xs text-gray-400 mt-2">6 étapes • Identité, famille, finances...</p>
                </div>
              </button>

              <button
                className="group flex flex-col items-center gap-4 rounded-xl border-2 border-gray-200 p-8 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-lg"
                onClick={() => { setClientType('PROFESSIONNEL'); setPhase('wizard') }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <Building2 className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Professionnel</h3>
                  <p className="text-sm text-gray-500 mt-1">Client personne morale</p>
                  <p className="text-xs text-gray-400 mt-2">4 étapes • Recherche SIRENE automatique</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <StepIndicator 
              steps={steps} 
              currentStep={currentStep}
              onStepClick={(step) => {
                if (step < currentStep) setCurrentStep(step)
              }}
            />
            <div className="min-h-[400px]">
              {renderStep()}
            </div>
          </div>
        )}

        <ModalFooter>
          {phase === 'wizard' && (
            <>
              <Button
                variant="outline"
                onClick={() => currentStep === 1 ? setPhase('type') : handleBack()}
                disabled={createClient.isPending}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {currentStep === 1 ? 'Type' : 'Précédent'}
              </Button>
              
              <div className="flex-1" />

              {currentStep < totalSteps ? (
                <Button onClick={handleNext}>
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={createClient.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {createClient.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Création...</>
                  ) : (
                    <><Check className="h-4 w-4 mr-2" /> Créer le client</>
                  )}
                </Button>
              )}
            </>
          )}
          
          {phase === 'type' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
