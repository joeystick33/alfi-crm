 
'use client'

import { useState, useEffect } from 'react'
import { useUpdateClient } from '@/app/_common/hooks/use-api'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { AdresseInput } from '@/app/_common/components/AdresseInput'
import { Badge } from '@/app/_common/components/ui/Badge'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from '@/app/_common/components/ui/Modal'
import type { ClientDetail, InvestmentHorizon, MaritalStatus, RiskProfile } from '@/app/_common/lib/api-types'
import { cn } from '@/app/_common/lib/utils'
import {
  User,
  MapPin,
  Briefcase,
  Users,
  Shield,
  Wallet,
  Save,
  Loader2,
  ChevronRight,
  Check,
  AlertCircle
} from 'lucide-react'

interface ClientEditModalProps {
  client: ClientDetail
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type EditStep = 'identification' | 'coordonnees' | 'famille' | 'professionnel' | 'patrimoine' | 'kyc'

const STEPS: { id: EditStep; label: string; icon: React.ElementType }[] = [
  { id: 'identification', label: 'Identification', icon: User },
  { id: 'coordonnees', label: 'Coordonnées', icon: MapPin },
  { id: 'famille', label: 'Famille', icon: Users },
  { id: 'professionnel', label: 'Professionnel', icon: Briefcase },
  { id: 'patrimoine', label: 'Patrimoine', icon: Wallet },
  { id: 'kyc', label: 'KYC & Conformité', icon: Shield },
]

const MARITAL_STATUS_VALUES = [
  'CELIBATAIRE',
  'MARIE',
  'PACSE',
  'DIVORCE',
  'VEUF',
  'CONCUBINAGE',
] as const

const RISK_PROFILE_VALUES = [
  'CONSERVATEUR',
  'PRUDENT',
  'EQUILIBRE',
  'DYNAMIQUE',
  'OFFENSIF',
] as const

const INVESTMENT_HORIZON_VALUES = ['COURT', 'MOYEN', 'LONG'] as const

function parseMaritalStatus(value: string): MaritalStatus | undefined {
  if (!value) return undefined

  const legacyMap: Record<string, MaritalStatus> = {
    SINGLE: 'CELIBATAIRE',
    MARRIED: 'MARIE',
    PACS: 'PACSE',
    DIVORCED: 'DIVORCE',
    WIDOWED: 'VEUF',
    COHABITING: 'CONCUBINAGE',
  }

  if (value in legacyMap) return legacyMap[value]

  return (MARITAL_STATUS_VALUES as readonly string[]).includes(value)
    ? (value as MaritalStatus)
    : undefined
}

function parseRiskProfile(value: string): RiskProfile | undefined {
  if (!value) return undefined

  const legacyMap: Record<string, RiskProfile> = {
    CONSERVATIVE: 'CONSERVATEUR',
    MODERATE: 'EQUILIBRE',
    DYNAMIC: 'DYNAMIQUE',
    AGGRESSIVE: 'OFFENSIF',
  }

  if (value in legacyMap) return legacyMap[value]

  return (RISK_PROFILE_VALUES as readonly string[]).includes(value)
    ? (value as RiskProfile)
    : undefined
}

function parseInvestmentHorizon(value: string): InvestmentHorizon | undefined {
  if (!value) return undefined

  const legacyMap: Record<string, InvestmentHorizon> = {
    SHORT: 'COURT',
    MEDIUM: 'MOYEN',
    LONG: 'LONG',
  }

  if (value in legacyMap) return legacyMap[value]

  return (INVESTMENT_HORIZON_VALUES as readonly string[]).includes(value)
    ? (value as InvestmentHorizon)
    : undefined
}

export function ClientEditModal({ client, isOpen, onClose, onSuccess }: ClientEditModalProps) {
  const { toast } = useToast()
  const updateClient = useUpdateClient()
  const [activeStep, setActiveStep] = useState<EditStep>('identification')
  const [hasChanges, setHasChanges] = useState(false)

  // Form state - initialized from client data
  const [formData, setFormData] = useState({
    // Identification
    civility: client.civility || '',
    firstName: client.firstName || '',
    lastName: client.lastName || '',
    nomUsage: client.nomUsage || '',
    birthDate: client.birthDate ? new Date(client.birthDate).toISOString().split('T')[0] : '',
    birthPlace: client.birthPlace || '',
    nationality: client.nationality || 'Française',
    
    // Coordonnées
    email: client.email || '',
    phone: client.phone || '',
    mobile: client.mobile || '',
    addressStreet: client.address?.street || '',
    addressCity: client.address?.city || '',
    addressPostalCode: client.address?.postalCode || '',
    addressCountry: client.address?.country || 'France',
    
    // Famille
    maritalStatus: client.maritalStatus || '',
    matrimonialRegime: client.matrimonialRegime || '',
    numberOfChildren: client.numberOfChildren || 0,
    dependents: client.dependents || 0,
    
    // Professionnel
    profession: client.profession || '',
    professionCategory: client.professionCategory || '',
    employmentType: client.employmentType || '',
    employerName: client.employerName || '',
    employmentSince: client.employmentSince ? new Date(client.employmentSince).toISOString().split('T')[0] : '',
    annualIncome: client.annualIncome || 0,
    
    // Patrimoine
    netWealth: client.netWealth || 0,
    financialAssets: client.financialAssets || 0,
    realEstateAssets: client.realEstateAssets || 0,
    otherAssets: client.otherAssets || 0,
    totalLiabilities: client.totalLiabilities || 0,
    
    // KYC
    riskProfile: client.riskProfile || '',
    investmentHorizon: client.investmentHorizon || '',
    investmentObjective: client.investmentObjective || '',
    investmentKnowledge: client.investmentKnowledge || 1,
    isPEP: client.isPEP || false,
    originOfFunds: client.originOfFunds || '',
  })

  // Reset form when client changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        civility: client.civility || '',
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        nomUsage: client.nomUsage || '',
        birthDate: client.birthDate ? new Date(client.birthDate).toISOString().split('T')[0] : '',
        birthPlace: client.birthPlace || '',
        nationality: client.nationality || 'Française',
        email: client.email || '',
        phone: client.phone || '',
        mobile: client.mobile || '',
        addressStreet: client.address?.street || '',
        addressCity: client.address?.city || '',
        addressPostalCode: client.address?.postalCode || '',
        addressCountry: client.address?.country || 'France',
        maritalStatus: client.maritalStatus || '',
        matrimonialRegime: client.matrimonialRegime || '',
        numberOfChildren: client.numberOfChildren || 0,
        dependents: client.dependents || 0,
        profession: client.profession || '',
        professionCategory: client.professionCategory || '',
        employmentType: client.employmentType || '',
        employerName: client.employerName || '',
        employmentSince: client.employmentSince ? new Date(client.employmentSince).toISOString().split('T')[0] : '',
        annualIncome: client.annualIncome || 0,
        netWealth: client.netWealth || 0,
        financialAssets: client.financialAssets || 0,
        realEstateAssets: client.realEstateAssets || 0,
        otherAssets: client.otherAssets || 0,
        totalLiabilities: client.totalLiabilities || 0,
        riskProfile: client.riskProfile || '',
        investmentHorizon: client.investmentHorizon || '',
        investmentObjective: client.investmentObjective || '',
        investmentKnowledge: client.investmentKnowledge || 1,
        isPEP: client.isPEP || false,
        originOfFunds: client.originOfFunds || '',
      })
      setActiveStep('identification')
      setHasChanges(false)
    }
  }, [client, isOpen])

  const updateField = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      const maritalStatus = parseMaritalStatus(formData.maritalStatus)
      const riskProfile = parseRiskProfile(formData.riskProfile)
      const investmentHorizon = parseInvestmentHorizon(formData.investmentHorizon)

      await updateClient.mutateAsync({
        id: client.id,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          mobile: formData.mobile || undefined,
          birthDate: formData.birthDate || undefined,
          birthPlace: formData.birthPlace || undefined,
          nationality: formData.nationality || undefined,
          address: {
            street: formData.addressStreet,
            city: formData.addressCity,
            postalCode: formData.addressPostalCode,
            country: formData.addressCountry,
          },
          maritalStatus,
          numberOfChildren: formData.numberOfChildren,
          profession: formData.profession || undefined,
          employerName: formData.employerName || undefined,
          annualIncome: formData.annualIncome,
          riskProfile,
          investmentHorizon,
        }
      })

      toast({
        title: 'Dossier mis à jour',
        description: 'Les informations du client ont été enregistrées avec succès.',
      })
      
      onSuccess()
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de mettre à jour le dossier',
        variant: 'destructive',
      })
    }
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === activeStep)

  const goToNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setActiveStep(STEPS[currentStepIndex + 1].id)
    }
  }

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setActiveStep(STEPS[currentStepIndex - 1].id)
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <ModalHeader className="border-b border-gray-100 pb-4">
          <ModalTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7373FF] to-[#8b8bff] flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-gray-900">
                Modifier le dossier client
              </span>
              <p className="text-sm font-normal text-gray-500">
                {client.firstName} {client.lastName}
              </p>
            </div>
          </ModalTitle>
        </ModalHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-56 border-r border-gray-100 p-4 bg-gray-50/50 overflow-y-auto">
            <nav className="space-y-1">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = activeStep === step.id
                const isPast = index < currentStepIndex
                
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-white text-[#7373FF] shadow-sm'
                        : isPast
                        ? 'text-gray-600 hover:bg-white/60'
                        : 'text-gray-500 hover:bg-white/60'
                    )}
                  >
                    <div className={cn(
                      'h-7 w-7 rounded-lg flex items-center justify-center shrink-0',
                      isActive
                        ? 'bg-[#7373FF]/15'
                        : isPast
                        ? 'bg-emerald-100'
                        : 'bg-gray-100'
                    )}>
                      {isPast ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Icon className={cn(
                          'h-4 w-4',
                          isActive ? 'text-[#7373FF]' : 'text-gray-400'
                        )} />
                      )}
                    </div>
                    <span className="truncate">{step.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeStep === 'identification' && (
              <StepIdentification formData={formData} updateField={updateField} />
            )}
            {activeStep === 'coordonnees' && (
              <StepCoordonnees formData={formData} updateField={updateField} />
            )}
            {activeStep === 'famille' && (
              <StepFamille formData={formData} updateField={updateField} />
            )}
            {activeStep === 'professionnel' && (
              <StepProfessionnel formData={formData} updateField={updateField} />
            )}
            {activeStep === 'patrimoine' && (
              <StepPatrimoine formData={formData} updateField={updateField} />
            )}
            {activeStep === 'kyc' && (
              <StepKyc formData={formData} updateField={updateField} />
            )}
          </div>
        </div>

        <ModalFooter className="border-t border-gray-100 pt-4 gap-3">
          <div className="flex-1 flex items-center gap-2">
            {hasChanges && (
              <Badge variant="warning" size="sm" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Modifications non enregistrées
              </Badge>
            )}
          </div>
          
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          
          {currentStepIndex > 0 && (
            <Button variant="outline" onClick={goToPrevStep}>
              Précédent
            </Button>
          )}
          
          {currentStepIndex < STEPS.length - 1 ? (
            <Button onClick={goToNextStep} className="gap-2">
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSave}
              disabled={updateClient.isPending}
              className="gap-2 bg-gradient-to-r from-[#7373FF] to-[#8b8bff]"
            >
              {updateClient.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// Step Components
interface StepProps {
  formData: any
  updateField: (field: string, value: any) => void
}

function StepIdentification({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Identification</h3>
        <p className="text-sm text-gray-500">Informations d'identité du client</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Civilité</label>
          <select
            value={formData.civility}
            onChange={(e) => updateField('civility', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-[#7373FF] focus:border-[#7373FF]"
          >
            <option value="">Sélectionner</option>
            <option value="M.">M.</option>
            <option value="Mme">Mme</option>
            <option value="Mlle">Mlle</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nationalité</label>
          <Input
            value={formData.nationality}
            onChange={(e) => updateField('nationality', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom *</label>
          <Input
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom *</label>
          <Input
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de naissance</label>
          <Input
            value={formData.maidenName}
            onChange={(e) => updateField('maidenName', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Date de naissance</label>
          <Input
            type="date"
            value={formData.birthDate}
            onChange={(e) => updateField('birthDate', e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Lieu de naissance</label>
          <Input
            value={formData.birthPlace}
            onChange={(e) => updateField('birthPlace', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

function StepCoordonnees({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Coordonnées</h3>
        <p className="text-sm text-gray-500">Informations de contact et adresse</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone fixe</label>
          <Input
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile</label>
          <Input
            value={formData.mobile}
            onChange={(e) => updateField('mobile', e.target.value)}
          />
        </div>

        {/* Adresse avec autocomplétion API BAN */}
        <div className="md:col-span-2">
          <AdresseInput
            label="Adresse"
            placeholder="Rechercher une adresse..."
            value={formData.addressStreet ? `${formData.addressStreet}, ${formData.addressPostalCode} ${formData.addressCity}` : ''}
            showZonePTZ={false}
            helpText="Tapez pour rechercher ou modifiez manuellement ci-dessous"
            onSelect={(adresse) => {
              updateField('addressStreet', adresse.housenumber 
                ? `${adresse.housenumber} ${adresse.street || ''}`.trim()
                : adresse.street || adresse.label)
              updateField('addressCity', adresse.city)
              updateField('addressPostalCode', adresse.postcode)
              updateField('addressCountry', 'France')
            }}
          />
        </div>

        {/* Champs manuels pour ajustement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Rue</label>
          <Input
            value={formData.addressStreet}
            onChange={(e) => updateField('addressStreet', e.target.value)}
            placeholder="Numéro et nom de rue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Code postal</label>
          <Input
            value={formData.addressPostalCode}
            onChange={(e) => updateField('addressPostalCode', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
          <Input
            value={formData.addressCity}
            onChange={(e) => updateField('addressCity', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
          <Input
            value={formData.addressCountry}
            onChange={(e) => updateField('addressCountry', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

function StepFamille({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Situation familiale</h3>
        <p className="text-sm text-gray-500">Informations sur la famille et le foyer</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Situation matrimoniale</label>
          <select
            value={formData.maritalStatus}
            onChange={(e) => updateField('maritalStatus', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-[#7373FF] focus:border-[#7373FF]"
          >
            <option value="">Sélectionner</option>
            <option value="CELIBATAIRE">Célibataire</option>
            <option value="MARIE">Marié(e)</option>
            <option value="PACSE">Pacsé(e)</option>
            <option value="DIVORCE">Divorcé(e)</option>
            <option value="VEUF">Veuf/Veuve</option>
            <option value="CONCUBINAGE">Concubinage</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Régime matrimonial</label>
          <select
            value={formData.matrimonialRegime}
            onChange={(e) => updateField('matrimonialRegime', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-[#7373FF] focus:border-[#7373FF]"
          >
            <option value="">Sélectionner</option>
            <option value="COMMUNITY">Communauté réduite aux acquêts</option>
            <option value="SEPARATION">Séparation de biens</option>
            <option value="UNIVERSAL">Communauté universelle</option>
            <option value="PARTICIPATION">Participation aux acquêts</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre d'enfants</label>
          <Input
            type="number"
            min="0"
            value={formData.numberOfChildren}
            onChange={(e) => updateField('numberOfChildren', parseInt(e.target.value) || 0)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Personnes à charge</label>
          <Input
            type="number"
            min="0"
            value={formData.dependents}
            onChange={(e) => updateField('dependents', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  )
}

function StepProfessionnel({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Situation professionnelle</h3>
        <p className="text-sm text-gray-500">Informations sur l'activité professionnelle</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Profession</label>
          <Input
            value={formData.profession}
            onChange={(e) => updateField('profession', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie socio-professionnelle</label>
          <select
            value={formData.professionCategory}
            onChange={(e) => updateField('professionCategory', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-[#7373FF] focus:border-[#7373FF]"
          >
            <option value="">Sélectionner</option>
            <option value="EXECUTIVE">Cadre</option>
            <option value="EMPLOYEE">Employé</option>
            <option value="WORKER">Ouvrier</option>
            <option value="SELF_EMPLOYED">Indépendant</option>
            <option value="LIBERAL">Profession libérale</option>
            <option value="RETIRED">Retraité</option>
            <option value="STUDENT">Étudiant</option>
            <option value="UNEMPLOYED">Sans emploi</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de contrat</label>
          <select
            value={formData.employmentType}
            onChange={(e) => updateField('employmentType', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-[#7373FF] focus:border-[#7373FF]"
          >
            <option value="">Sélectionner</option>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
            <option value="INTERIM">Intérim</option>
            <option value="FREELANCE">Freelance</option>
            <option value="BUSINESS_OWNER">Chef d'entreprise</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Employeur</label>
          <Input
            value={formData.employer}
            onChange={(e) => updateField('employer', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">En poste depuis</label>
          <Input
            type="date"
            value={formData.employmentSince}
            onChange={(e) => updateField('employmentSince', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Revenus annuels bruts (€)</label>
          <Input
            type="number"
            min="0"
            value={formData.annualIncome}
            onChange={(e) => updateField('annualIncome', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  )
}

function StepPatrimoine({ formData, updateField }: StepProps) {
  const totalActifs = formData.financialAssets + formData.realEstateAssets + formData.otherAssets
  const patrimoineNet = totalActifs - formData.totalLiabilities

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Patrimoine</h3>
        <p className="text-sm text-gray-500">Vue d'ensemble du patrimoine</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Actifs financiers (€)</label>
          <Input
            type="number"
            min="0"
            value={formData.financialAssets}
            onChange={(e) => updateField('financialAssets', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Actifs immobiliers (€)</label>
          <Input
            type="number"
            min="0"
            value={formData.realEstateAssets}
            onChange={(e) => updateField('realEstateAssets', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Autres actifs (€)</label>
          <Input
            type="number"
            min="0"
            value={formData.otherAssets}
            onChange={(e) => updateField('otherAssets', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Total passifs (€)</label>
          <Input
            type="number"
            min="0"
            value={formData.totalLiabilities}
            onChange={(e) => updateField('totalLiabilities', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="text-sm text-gray-500">Total actifs</p>
          <p className="text-xl font-bold text-gray-900">
            {totalActifs.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Patrimoine net</p>
          <p className={cn(
            'text-xl font-bold',
            patrimoineNet >= 0 ? 'text-emerald-600' : 'text-rose-600'
          )}>
            {patrimoineNet.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
      </div>
    </div>
  )
}

function StepKyc({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">KYC & Conformité</h3>
        <p className="text-sm text-gray-500">Profil d'investisseur et conformité réglementaire</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Profil de risque</label>
          <select
            value={formData.riskProfile}
            onChange={(e) => updateField('riskProfile', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-[#7373FF] focus:border-[#7373FF]"
          >
            <option value="">Sélectionner</option>
            <option value="CONSERVATEUR">Conservateur</option>
            <option value="PRUDENT">Prudent</option>
            <option value="EQUILIBRE">Équilibré</option>
            <option value="DYNAMIQUE">Dynamique</option>
            <option value="OFFENSIF">Offensif</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Horizon d'investissement</label>
          <select
            value={formData.investmentHorizon}
            onChange={(e) => updateField('investmentHorizon', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-[#7373FF] focus:border-[#7373FF]"
          >
            <option value="">Sélectionner</option>
            <option value="COURT">Court terme (&lt; 3 ans)</option>
            <option value="MOYEN">Moyen terme (3-8 ans)</option>
            <option value="LONG">Long terme (&gt; 8 ans)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Objectif d'investissement</label>
          <select
            value={formData.investmentObjective}
            onChange={(e) => updateField('investmentObjective', e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-[#7373FF] focus:border-[#7373FF]"
          >
            <option value="">Sélectionner</option>
            <option value="CAPITAL_PRESERVATION">Préservation du capital</option>
            <option value="INCOME">Revenus réguliers</option>
            <option value="GROWTH">Croissance du capital</option>
            <option value="SPECULATION">Spéculation</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Niveau de connaissance (1-5)</label>
          <Input
            type="number"
            min="1"
            max="5"
            value={formData.investmentKnowledge}
            onChange={(e) => updateField('investmentKnowledge', parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Origine des fonds</label>
          <Input
            value={formData.originOfFunds}
            onChange={(e) => updateField('originOfFunds', e.target.value)}
            placeholder="Ex: Épargne, Héritage, Vente immobilière..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPEP}
              onChange={(e) => updateField('isPEP', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#7373FF] focus:ring-[#7373FF]"
            />
            <div>
              <p className="text-sm font-medium text-amber-800">Personne Politiquement Exposée (PPE)</p>
              <p className="text-xs text-amber-700">Le client exerce ou a exercé des fonctions politiques importantes</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
