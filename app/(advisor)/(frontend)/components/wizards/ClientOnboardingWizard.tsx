'use client'

/**
 * ClientOnboardingWizard - Parcours d'onboarding client
 * 
 * 5 étapes:
 * 1. Informations civiles
 * 2. Situation familiale
 * 3. Patrimoine (aperçu)
 * 4. Documents KYC
 * 5. Objectifs initiaux
 */

import { cn } from '@/app/_common/lib/utils'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Button } from '@/app/_common/components/ui/Button'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Wizard, WizardStep, WizardStepProps } from './Wizard'
import {
  User,
  Users,
  Wallet,
  FileText,
  Target,
  Upload,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Home,
  Briefcase,
  PiggyBank,
} from 'lucide-react'

// =============================================================================
// Step 1: Informations Civiles
// =============================================================================

type Child = { id: number; firstName: string; birthDate: string }

type OnboardingData = {
  civility?: string
  clientType?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  birthDate?: string
  birthPlace?: string
  address?: string
  postalCode?: string
  city?: string
  familyStatus?: string
  matrimonialRegime?: string
  children?: Child[]
  patrimoine_immobilier?: string | number
  patrimoine_financier?: string | number
  patrimoine_epargne?: string | number
  passifs_total?: string | number
  uploadedDocs?: string[]
  objectifs?: string[]
  notes?: string
} & Record<string, unknown>

function StepCivil({ data, updateData, errors }: WizardStepProps) {
  const formData = data as OnboardingData
  const civility = formData.civility ?? ''
  const clientType = formData.clientType ?? 'PARTICULIER'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Civilité <span className="text-red-500">*</span>
          </label>
          <Select
            value={civility}
            onValueChange={(value) => updateData({ civility: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Monsieur</SelectItem>
              <SelectItem value="MME">Madame</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Type de client
          </label>
          <Select
            value={clientType}
            onValueChange={(value) => updateData({ clientType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PARTICULIER">Particulier</SelectItem>
              <SelectItem value="PROFESSIONNEL">Professionnel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Prénom <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.firstName || ''}
            onChange={(e) => updateData({ firstName: e.target.value })}
            placeholder="Prénom"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nom <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.lastName || ''}
            onChange={(e) => updateData({ lastName: e.target.value })}
            placeholder="Nom"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={formData.email || ''}
            onChange={(e) => updateData({ email: e.target.value })}
            placeholder="email@exemple.com"
          />
          {errors?.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Téléphone
          </label>
          <Input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => updateData({ phone: e.target.value })}
            placeholder="06 00 00 00 00"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Date de naissance
          </label>
          <Input
            type="date"
            value={formData.birthDate || ''}
            onChange={(e) => updateData({ birthDate: e.target.value })}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Lieu de naissance
          </label>
          <Input
            value={formData.birthPlace || ''}
            onChange={(e) => updateData({ birthPlace: e.target.value })}
            placeholder="Ville"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Adresse
        </label>
        <Input
          value={formData.address || ''}
          onChange={(e) => updateData({ address: e.target.value })}
          placeholder="Adresse complète"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Code postal
          </label>
          <Input
            value={formData.postalCode || ''}
            onChange={(e) => updateData({ postalCode: e.target.value })}
            placeholder="75001"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ville
          </label>
          <Input
            value={formData.city || ''}
            onChange={(e) => updateData({ city: e.target.value })}
            placeholder="Paris"
          />
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Step 2: Situation Familiale
// =============================================================================

function StepFamily({ data, updateData }: WizardStepProps) {
  const formData = data as OnboardingData
  const children: Child[] = formData.children ?? []
  const familyStatus = formData.familyStatus ?? ''
  const matrimonialRegime = formData.matrimonialRegime ?? ''
  
  const addChild = () => {
    updateData({ 
      children: [...children, { id: Date.now(), firstName: '', birthDate: '' }] 
    })
  }
  
  const removeChild = (id: number) => {
    updateData({ 
      children: children.filter((c: any) => c.id !== id) 
    })
  }
  
  const updateChild = (id: number, field: string, value: string) => {
    updateData({
      children: children.map((c: any) => 
        c.id === id ? { ...c, [field]: value } : c
      )
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Situation matrimoniale <span className="text-red-500">*</span>
        </label>
        <Select
          value={familyStatus}
          onValueChange={(value) => updateData({ familyStatus: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SINGLE">Célibataire</SelectItem>
            <SelectItem value="MARRIED">Marié(e)</SelectItem>
            <SelectItem value="PACS">Pacsé(e)</SelectItem>
            <SelectItem value="DIVORCED">Divorcé(e)</SelectItem>
            <SelectItem value="WIDOWED">Veuf/Veuve</SelectItem>
            <SelectItem value="COHABITING">En concubinage</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {(familyStatus === 'MARRIED' || familyStatus === 'PACS') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Régime matrimonial
          </label>
          <Select
            value={matrimonialRegime}
            onValueChange={(value) => updateData({ matrimonialRegime: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="COMMUNAUTE_REDUITE">Communauté réduite aux acquêts</SelectItem>
              <SelectItem value="COMMUNAUTE_UNIVERSELLE">Communauté universelle</SelectItem>
              <SelectItem value="SEPARATION_BIENS">Séparation de biens</SelectItem>
              <SelectItem value="PARTICIPATION_ACQUETS">Participation aux acquêts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Enfants</h4>
          <Button variant="outline" size="sm" onClick={addChild} className="gap-1">
            <Plus className="h-4 w-4" />
            Ajouter un enfant
          </Button>
        </div>
        
        {children.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
            Aucun enfant renseigné
          </p>
        ) : (
          <div className="space-y-3">
            {children.map((child: any, index: number) => (
              <div key={child.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                <Input
                  value={child.firstName}
                  onChange={(e) => updateChild(child.id, 'firstName', e.target.value)}
                  placeholder="Prénom"
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={child.birthDate}
                  onChange={(e) => updateChild(child.id, 'birthDate', e.target.value)}
                  className="w-40"
                />
                <button
                  onClick={() => removeChild(child.id)}
                  className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Step 3: Patrimoine (aperçu)
// =============================================================================

function StepPatrimoine({ data, updateData }: WizardStepProps) {
  const formData = data as OnboardingData
  const categories = [
    { id: 'immobilier', label: 'Immobilier', icon: Home, color: 'indigo' },
    { id: 'financier', label: 'Financier', icon: Briefcase, color: 'emerald' },
    { id: 'epargne', label: 'Épargne', icon: PiggyBank, color: 'violet' },
  ]

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Renseignez une estimation du patrimoine. Ces informations pourront être affinées ultérieurement.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className={cn('border-2', `hover:border-${cat.color}-200`)}>
            <CardContent className="pt-4">
              <div className={cn('p-2 rounded-lg w-fit mb-3', `bg-${cat.color}-100`)}>
                <cat.icon className={cn('h-5 w-5', `text-${cat.color}-600`)} />
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {cat.label}
              </label>
              <div className="relative">
                <Input
                  type="number"
                  value={(formData[`patrimoine_${cat.id}` as keyof OnboardingData] as string | number | undefined) ?? ''}
                  onChange={(e) => updateData({ [`patrimoine_${cat.id}`]: e.target.value })}
                  placeholder="0"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="border-t pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Passifs / Crédits en cours
        </label>
        <div className="relative">
          <Input
            type="number"
            value={formData.passifs_total ?? ''}
            onChange={(e) => updateData({ passifs_total: e.target.value })}
            placeholder="0"
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
        </div>
      </div>
      
      <Card className="bg-indigo-50 border-indigo-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Patrimoine net estimé</span>
            <span className="text-xl font-bold text-indigo-600">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(
                (Number(formData.patrimoine_immobilier) || 0) +
                (Number(formData.patrimoine_financier) || 0) +
                (Number(formData.patrimoine_epargne) || 0) -
                (Number(formData.passifs_total) || 0)
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// Step 4: Documents KYC
// =============================================================================

function StepDocuments({ data, updateData }: WizardStepProps) {
  const formData = data as OnboardingData
  const requiredDocs = [
    { id: 'identite', label: 'Pièce d\'identité', required: true },
    { id: 'domicile', label: 'Justificatif de domicile', required: true },
    { id: 'revenus', label: 'Justificatif de revenus', required: false },
    { id: 'rib', label: 'RIB', required: false },
  ]
  
  const uploadedDocs = formData.uploadedDocs ?? []
  
  const toggleDoc = (docId: string) => {
    const isUploaded = uploadedDocs.includes(docId)
    if (isUploaded) {
      updateData({ uploadedDocs: uploadedDocs.filter((id: string) => id !== docId) })
    } else {
      updateData({ uploadedDocs: [...uploadedDocs, docId] })
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Indiquez les documents déjà fournis ou à collecter. Vous pourrez les télécharger ultérieurement.
      </p>
      
      <div className="space-y-3">
        {requiredDocs.map((doc) => {
          const isUploaded = uploadedDocs.includes(doc.id)
          
          return (
            <div
              key={doc.id}
              onClick={() => toggleDoc(doc.id)}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                isUploaded 
                  ? 'bg-emerald-50 border-emerald-500' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              )}
            >
              <div className={cn(
                'h-10 w-10 rounded-full flex items-center justify-center',
                isUploaded ? 'bg-emerald-500' : 'bg-gray-100'
              )}>
                {isUploaded ? (
                  <CheckCircle2 className="h-5 w-5 text-white" />
                ) : (
                  <Upload className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{doc.label}</p>
                <p className="text-xs text-gray-500">
                  {isUploaded ? 'Document fourni' : 'Cliquez pour marquer comme fourni'}
                </p>
              </div>
              {doc.required && (
                <Badge variant={isUploaded ? 'success' : 'default'} size="xs">
                  {isUploaded ? 'OK' : 'Requis'}
                </Badge>
              )}
            </div>
          )
        })}
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Documents obligatoires</p>
          <p className="text-xs text-amber-700 mt-0.5">
            La pièce d'identité et le justificatif de domicile sont requis pour la conformité KYC.
          </p>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Step 5: Objectifs
// =============================================================================

function StepObjectifs({ data, updateData }: WizardStepProps) {
  const formData = data as OnboardingData
  const objectifOptions = [
    { id: 'epargne_precaution', label: 'Constituer une épargne de précaution', icon: PiggyBank },
    { id: 'achat_immobilier', label: 'Préparer un achat immobilier', icon: Home },
    { id: 'retraite', label: 'Préparer la retraite', icon: Target },
    { id: 'transmission', label: 'Organiser la transmission', icon: Users },
    { id: 'optimisation_fiscale', label: 'Optimiser la fiscalité', icon: Wallet },
    { id: 'revenus_complementaires', label: 'Générer des revenus complémentaires', icon: Briefcase },
  ]
  
  const selectedObjectifs = formData.objectifs ?? []
  
  const toggleObjectif = (id: string) => {
    const isSelected = selectedObjectifs.includes(id)
    if (isSelected) {
      updateData({ objectifs: selectedObjectifs.filter((o: string) => o !== id) })
    } else {
      updateData({ objectifs: [...selectedObjectifs, id] })
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Sélectionnez les objectifs prioritaires du client (plusieurs choix possibles).
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {objectifOptions.map((obj) => {
          const isSelected = selectedObjectifs.includes(obj.id)
          
          return (
            <button
              key={obj.id}
              onClick={() => toggleObjectif(obj.id)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all',
                isSelected 
                  ? 'bg-indigo-50 border-indigo-500' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg',
                isSelected ? 'bg-indigo-100' : 'bg-gray-100'
              )}>
                <obj.icon className={cn(
                  'h-5 w-5',
                  isSelected ? 'text-indigo-600' : 'text-gray-400'
                )} />
              </div>
              <span className={cn(
                'text-sm font-medium',
                isSelected ? 'text-indigo-700' : 'text-gray-700'
              )}>
                {obj.label}
              </span>
              {isSelected && (
                <CheckCircle2 className="h-5 w-5 text-indigo-600 ml-auto" />
              )}
            </button>
          )
        })}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Notes complémentaires
        </label>
        <textarea
          value={formData.notes ?? ''}
          onChange={(e) => updateData({ notes: e.target.value })}
          placeholder="Informations complémentaires sur les objectifs du client..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
    </div>
  )
}

// =============================================================================
// Configuration des étapes
// =============================================================================

const onboardingSteps: WizardStep[] = [
  {
    id: 'civil',
    title: 'Informations civiles',
    description: 'Identité et coordonnées',
    icon: User,
    component: StepCivil,
    validate: (data) => {
      const formData = data as OnboardingData
      if (!formData.firstName || !formData.lastName || !formData.email) {
        return 'Veuillez remplir les champs obligatoires'
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return 'Email invalide'
      }
      return true
    },
  },
  {
    id: 'family',
    title: 'Situation familiale',
    description: 'État civil et enfants',
    icon: Users,
    component: StepFamily,
    validate: (data) => {
      if (!data.familyStatus) {
        return 'Veuillez sélectionner la situation matrimoniale'
      }
      return true
    },
  },
  {
    id: 'patrimoine',
    title: 'Patrimoine',
    description: 'Estimation globale',
    icon: Wallet,
    component: StepPatrimoine,
    optional: true,
  },
  {
    id: 'documents',
    title: 'Documents KYC',
    description: 'Pièces justificatives',
    icon: FileText,
    component: StepDocuments,
    optional: true,
  },
  {
    id: 'objectifs',
    title: 'Objectifs',
    description: 'Priorités du client',
    icon: Target,
    component: StepObjectifs,
    optional: true,
  },
]

// =============================================================================
// Composant Principal
// =============================================================================

interface ClientOnboardingWizardProps {
  onComplete: (data: Record<string, any>) => Promise<void>
  onCancel: () => void
  initialData?: Record<string, any>
}

export function ClientOnboardingWizard({
  onComplete,
  onCancel,
  initialData,
}: ClientOnboardingWizardProps) {
  return (
    <Wizard
      steps={onboardingSteps}
      initialData={initialData}
      onComplete={onComplete}
      onCancel={onCancel}
      title="Nouveau client"
      description="Créez une fiche client complète en quelques étapes"
      allowSkip={true}
    />
  )
}

export default ClientOnboardingWizard
