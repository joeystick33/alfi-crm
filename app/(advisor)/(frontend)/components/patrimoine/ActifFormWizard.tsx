 
'use client'

/**
 * ActifFormWizard - Formulaire professionnel complet d'ajout d'actif
 * Utilise patrimoine-config.ts pour les types, dispositifs, clauses
 * Champs spécifiques selon le type d'actif sélectionné
 */

import { useState, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Switch } from '@/app/_common/components/ui/Switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useToast } from '@/app/_common/hooks/use-toast'
import { useCreateActif, useUpdateActif } from '@/app/(advisor)/(frontend)/hooks/use-patrimoine'
import { AdresseInput } from '@/app/_common/components/AdresseInput'
import { formatCurrency } from '@/app/_common/lib/utils'
import {
  ACTIF_CATEGORIES, RENTAL_SCHEMES, BENEFICIARY_CLAUSE_TEMPLATES,
  getActifTypesByCategory, getActifTypeConfig,
  type ActifCategoryValue, type ActifTypeValue
} from '@/app/_common/lib/patrimoine-config'
import * as LucideIcons from 'lucide-react'
import { 
  ChevronLeft, ChevronRight, Check, Loader2, Calculator, Euro, Percent, 
  Calendar, MapPin, Building2, Shield, Users
} from 'lucide-react'

// =============================================================================
// Types & Props
// =============================================================================

interface ActifFormWizardProps {
  mode?: 'create' | 'edit'
  clientId?: string
  initialData?: Partial<ActifFormValues> & { id?: string; clientId?: string }
  onSuccess?: () => void
  onCancel?: () => void
}

// Schema de validation complet
const schema = z.object({
  // Base
  name: z.string().min(1, 'Le nom est requis'),
  type: z.string().min(1, 'Le type est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  value: z.coerce.number().positive('La valeur doit être positive'),
  acquisitionDate: z.string().optional(),
  acquisitionValue: z.coerce.number().optional(),
  description: z.string().optional(),
  managedByFirm: z.boolean().default(false),
  managementFees: z.coerce.number().optional(),
  annualIncome: z.coerce.number().optional(),
  
  // Immobilier
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyPostalCode: z.string().optional(),
  propertySurface: z.coerce.number().optional(),
  propertyRooms: z.coerce.number().optional(),
  propertyType: z.string().optional(),
  propertyCondition: z.string().optional(),
  
  // Locatif
  rentalScheme: z.string().optional(),
  rentalSchemeStartDate: z.string().optional(),
  rentalSchemeEndDate: z.string().optional(),
  rentalMonthlyRent: z.coerce.number().optional(),
  rentalCharges: z.coerce.number().optional(),
  rentalOccupancyRate: z.coerce.number().optional(),
  rentalTenantName: z.string().optional(),
  
  // Démembrement
  dismembermentType: z.string().optional(),
  dismembermentEndDate: z.string().optional(),
  usufructuaryName: z.string().optional(),
  bareOwnerName: z.string().optional(),
  
  // IFI
  fiscalPropertyType: z.string().optional(),
  fiscalRpAbatement: z.boolean().default(false),
  fiscalManualDiscount: z.coerce.number().optional(),
  
  // Assurance-vie / Contrats
  insurerName: z.string().optional(),
  contractNumber: z.string().optional(),
  contractOpenDate: z.string().optional(),
  beneficiaryClause: z.string().optional(),
  beneficiaryClauseType: z.string().optional(),
  totalPremiums: z.coerce.number().optional(),
  premiumsBefore70: z.coerce.number().optional(),
  premiumsAfter70: z.coerce.number().optional(),
  euroFundRate: z.coerce.number().optional(),
  managementMode: z.string().optional(),
  
  // PEA / Compte-titres
  brokerName: z.string().optional(),
  accountNumber: z.string().optional(),
  dividendsReceived: z.coerce.number().optional(),
  
  // Épargne salariale
  employerName: z.string().optional(),
  availabilityDate: z.string().optional(),
  unvestedAmount: z.coerce.number().optional(),
  
  // Mobilier
  objectBrand: z.string().optional(),
  objectModel: z.string().optional(),
  objectSerial: z.string().optional(),
  objectCertificate: z.boolean().default(false),
  objectInsured: z.boolean().default(false),
  objectInsuranceValue: z.coerce.number().optional(),
  lastAppraisalDate: z.string().optional(),
  lastAppraisalValue: z.coerce.number().optional(),
  
  // Véhicules
  vehicleBrand: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.coerce.number().optional(),
  vehicleRegistration: z.string().optional(),
  vehicleMileage: z.coerce.number().optional(),
  
  // Crypto
  walletAddress: z.string().optional(),
  exchangePlatform: z.string().optional(),
  tokenSymbol: z.string().optional(),
  tokenQuantity: z.coerce.number().optional(),
  
  // Professionnel
  companyName: z.string().optional(),
  companySiren: z.string().optional(),
  companyLegalForm: z.string().optional(),
  companySharesCount: z.coerce.number().optional(),
  companyTotalShares: z.coerce.number().optional(),
})

type ActifFormValues = z.input<typeof schema>

// =============================================================================
// Helper Components
// =============================================================================

function DynamicIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Package
  return <IconComponent className={className} style={style} />
}

function FieldSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-gray-50 space-y-4">
      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        {icon}
        {title}
      </p>
      {children}
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function ActifFormWizard({ mode = 'create', clientId: propClientId, initialData, onSuccess, onCancel }: ActifFormWizardProps) {
  const { toast } = useToast()
  const createActif = useCreateActif()
  const updateActif = useUpdateActif()
  
  const clientId = propClientId || initialData?.clientId || ''
  
  const [step, setStep] = useState<'category' | 'type' | 'details' | 'specific' | 'valuation'>(
    mode === 'edit' ? 'details' : 'category'
  )
  const [selectedCategory, setSelectedCategory] = useState<ActifCategoryValue | null>(
    (initialData?.category as ActifCategoryValue) || null
  )
  const [selectedType, setSelectedType] = useState<ActifTypeValue | null>(
    (initialData?.type as ActifTypeValue) || null
  )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting }
  } = useForm<ActifFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || '',
      category: initialData?.category || '',
      value: initialData?.value ?? 0,
      acquisitionDate: initialData?.acquisitionDate?.slice(0, 10) || '',
      acquisitionValue: initialData?.acquisitionValue ?? undefined,
      description: initialData?.description || '',
      managedByFirm: initialData?.managedByFirm ?? false,
      managementFees: initialData?.managementFees ?? undefined,
      annualIncome: initialData?.annualIncome ?? undefined,
      fiscalRpAbatement: false,
      objectCertificate: false,
      objectInsured: false,
    }
  })

  // Watched values for calculations
  const value = Number(watch('value')) || 0
  const acquisitionValue = Number(watch('acquisitionValue')) || 0
  const annualIncome = Number(watch('annualIncome')) || 0
  const rentalMonthlyRent = Number(watch('rentalMonthlyRent')) || 0

  // Type config
  const typeConfig = useMemo(() => 
    selectedType ? getActifTypeConfig(selectedType) : null,
    [selectedType]
  )

  // Available types for selected category
  const availableTypes = useMemo(() =>
    selectedCategory ? getActifTypesByCategory(selectedCategory) : [],
    [selectedCategory]
  )

  // Calculations
  const calculations = useMemo(() => {
    const plusValue = value - acquisitionValue
    const plusValuePercent = acquisitionValue > 0 ? (plusValue / acquisitionValue) * 100 : 0
    const annualRent = rentalMonthlyRent * 12
    const rendementBrut = value > 0 ? (annualRent / value) * 100 : 0
    const rendementFromIncome = value > 0 ? (annualIncome / value) * 100 : 0
    
    return {
      plusValue,
      plusValuePercent,
      annualRent,
      rendementBrut,
      rendementFromIncome,
      isPositive: plusValue >= 0
    }
  }, [value, acquisitionValue, annualIncome, rentalMonthlyRent])

  // Handlers
  const handleCategorySelect = (category: ActifCategoryValue) => {
    setSelectedCategory(category)
    setValue('category', category)
    setStep('type')
  }

  const handleTypeSelect = (type: ActifTypeValue) => {
    setSelectedType(type)
    setValue('type', type)
    const config = getActifTypeConfig(type)
    if (!watch('name') && config) {
      setValue('name', config.label)
    }
    setStep('details')
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload: any = {
        type: values.type,
        category: values.category,
        name: values.name,
        value: Number(values.value),
        acquisitionDate: values.acquisitionDate || undefined,
        acquisitionValue: values.acquisitionValue ? Number(values.acquisitionValue) : undefined,
        description: values.description || undefined,
        managedByFirm: values.managedByFirm,
        managementFees: values.managementFees ? Number(values.managementFees) : undefined,
        annualIncome: values.annualIncome ? Number(values.annualIncome) : undefined,
        clientId,
        // Immobilier
        propertyAddress: values.propertyAddress || undefined,
        propertyCity: values.propertyCity || undefined,
        propertyPostalCode: values.propertyPostalCode || undefined,
        propertySurface: values.propertySurface ? Number(values.propertySurface) : undefined,
        propertyRooms: values.propertyRooms ? Number(values.propertyRooms) : undefined,
        propertyType: values.propertyType || undefined,
        propertyCondition: values.propertyCondition || undefined,
        // Locatif
        rentalScheme: values.rentalScheme || undefined,
        rentalSchemeStartDate: values.rentalSchemeStartDate || undefined,
        rentalSchemeEndDate: values.rentalSchemeEndDate || undefined,
        rentalMonthlyRent: values.rentalMonthlyRent ? Number(values.rentalMonthlyRent) : undefined,
        rentalCharges: values.rentalCharges ? Number(values.rentalCharges) : undefined,
        rentalOccupancyRate: values.rentalOccupancyRate ? Number(values.rentalOccupancyRate) : undefined,
        rentalTenantName: values.rentalTenantName || undefined,
        // IFI
        fiscalPropertyType: values.fiscalPropertyType || undefined,
        fiscalRpAbatement: values.fiscalRpAbatement,
        fiscalManualDiscount: values.fiscalManualDiscount ? Number(values.fiscalManualDiscount) : undefined,
        // Démembrement
        dismembermentType: values.dismembermentType || undefined,
        dismembermentEndDate: values.dismembermentEndDate || undefined,
        usufructuaryName: values.usufructuaryName || undefined,
        bareOwnerName: values.bareOwnerName || undefined,
        // Assurance-vie
        insurerName: values.insurerName || undefined,
        contractNumber: values.contractNumber || undefined,
        contractOpenDate: values.contractOpenDate || undefined,
        beneficiaryClause: values.beneficiaryClause || undefined,
        beneficiaryClauseType: values.beneficiaryClauseType || undefined,
        totalPremiums: values.totalPremiums ? Number(values.totalPremiums) : undefined,
        premiumsBefore70: values.premiumsBefore70 ? Number(values.premiumsBefore70) : undefined,
        premiumsAfter70: values.premiumsAfter70 ? Number(values.premiumsAfter70) : undefined,
        euroFundRate: values.euroFundRate ? Number(values.euroFundRate) : undefined,
        managementMode: values.managementMode || undefined,
        // Compte-titres
        brokerName: values.brokerName || undefined,
        accountNumber: values.accountNumber || undefined,
        dividendsReceived: values.dividendsReceived ? Number(values.dividendsReceived) : undefined,
        // Épargne salariale
        employerName: values.employerName || undefined,
        availabilityDate: values.availabilityDate || undefined,
        unvestedAmount: values.unvestedAmount ? Number(values.unvestedAmount) : undefined,
        // Mobilier
        objectBrand: values.objectBrand || undefined,
        objectModel: values.objectModel || undefined,
        objectSerial: values.objectSerial || undefined,
        objectCertificate: values.objectCertificate,
        objectInsured: values.objectInsured,
        objectInsuranceValue: values.objectInsuranceValue ? Number(values.objectInsuranceValue) : undefined,
        lastAppraisalDate: values.lastAppraisalDate || undefined,
        lastAppraisalValue: values.lastAppraisalValue ? Number(values.lastAppraisalValue) : undefined,
        // Véhicules
        vehicleBrand: values.vehicleBrand || undefined,
        vehicleModel: values.vehicleModel || undefined,
        vehicleYear: values.vehicleYear ? Number(values.vehicleYear) : undefined,
        vehicleRegistration: values.vehicleRegistration || undefined,
        vehicleMileage: values.vehicleMileage ? Number(values.vehicleMileage) : undefined,
        // Crypto
        walletAddress: values.walletAddress || undefined,
        exchangePlatform: values.exchangePlatform || undefined,
        tokenSymbol: values.tokenSymbol || undefined,
        tokenQuantity: values.tokenQuantity ? Number(values.tokenQuantity) : undefined,
        // Professionnel
        companyName: values.companyName || undefined,
        companySiren: values.companySiren || undefined,
        companyLegalForm: values.companyLegalForm || undefined,
        companySharesCount: values.companySharesCount ? Number(values.companySharesCount) : undefined,
        companyTotalShares: values.companyTotalShares ? Number(values.companyTotalShares) : undefined,
      }

      if (mode === 'edit' && initialData?.id) {
        await updateActif.mutateAsync({ id: initialData.id, data: payload })
        toast({ title: 'Actif modifié', description: 'Les informations ont été mises à jour.' })
      } else {
        await createActif.mutateAsync(payload)
        toast({ title: 'Actif créé', description: 'L\'actif a été ajouté au patrimoine.' })
      }
      onSuccess?.()
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message || 'Impossible d\'enregistrer.', variant: 'destructive' })
    }
  })

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Progress indicator */}
      {mode === 'create' && (
        <div className="flex items-center gap-1 mb-6 flex-wrap">
          {['category', 'type', 'details', 'valuation'].map((s, i) => {
            const steps = ['category', 'type', 'details', 'valuation']
            const currentIndex = steps.indexOf(step)
            const isComplete = i < currentIndex
            const isCurrent = s === step
            const labels: Record<string, string> = { category: 'Catégorie', type: 'Type', details: 'Détails', valuation: 'Valorisation' }
            
            return (
              <div key={s} className="flex items-center">
                <button
                  type="button"
                  onClick={() => isComplete && setStep(s as typeof step)}
                  disabled={!isComplete}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    isCurrent ? 'bg-[#7373FF] text-white' :
                    isComplete ? 'bg-[#7373FF]/10 text-[#7373FF] hover:bg-[#7373FF]/20 cursor-pointer' :
                    'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isComplete ? <Check className="h-3 w-3" /> : <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px]">{i + 1}</span>}
                  <span className="hidden sm:inline">{labels[s]}</span>
                </button>
                {i < 3 && <ChevronRight className="h-3 w-3 text-gray-300 mx-0.5" />}
              </div>
            )
          })}
        </div>
      )}

      {/* Step 1: Category Selection */}
      {step === 'category' && (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Catégorie d'actif</h3>
            <p className="text-sm text-gray-500 mt-1">Sélectionnez le type de patrimoine</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {ACTIF_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => handleCategorySelect(cat.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all group ${cat.bgColor} border-transparent hover:border-gray-200 hover:shadow-lg`}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <DynamicIcon name={cat.icon} className="h-5 w-5" style={{ color: cat.color }} />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{cat.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cat.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Type Selection */}
      {step === 'type' && selectedCategory && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <button type="button" onClick={() => setStep('category')} className="p-2 rounded-lg hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div>
              <h3 className="font-semibold text-gray-900">Type d'actif</h3>
              <p className="text-sm text-gray-500">
                {ACTIF_CATEGORIES.find(c => c.value === selectedCategory)?.label}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
            {availableTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeSelect(type.value)}
                className="p-3 rounded-xl border text-left transition-all group hover:border-gray-300 hover:shadow-md bg-white"
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${type.color}15` }}
                  >
                    <DynamicIcon name={type.icon} className="h-4 w-4" style={{ color: type.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{type.label}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{type.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 'details' && typeConfig && (
        <form onSubmit={(e) => { e.preventDefault(); setStep('valuation') }} className="space-y-5">
          <div className="flex items-center gap-3 mb-4">
            {mode === 'create' && (
              <button type="button" onClick={() => setStep('type')} className="p-2 rounded-lg hover:bg-gray-100">
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              </button>
            )}
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${typeConfig.color}15` }}
            >
              <DynamicIcon name={typeConfig.icon} className="h-5 w-5" style={{ color: typeConfig.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{typeConfig.label}</h3>
              <p className="text-sm text-gray-500">Informations générales</p>
            </div>
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label>Nom de l'actif <span className="text-red-500">*</span></Label>
            <Input {...register('name')} placeholder="Ex: Appartement Paris 15ème" className="h-10" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          {/* Champs spécifiques IMMOBILIER */}
          {selectedCategory === 'IMMOBILIER' && (
            <FieldSection title="Localisation" icon={<MapPin className="h-4 w-4 text-blue-500" />}>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <AdresseInput
                    label="Adresse"
                    placeholder="Saisissez une adresse..."
                    showZonePTZ={true}
                    onSelect={(adresse) => {
                      setValue('propertyAddress', adresse.label)
                      setValue('propertyPostalCode', adresse.postcode)
                      setValue('propertyCity', adresse.city)
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Code postal</Label>
                    <Input {...register('propertyPostalCode')} placeholder="75015" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Ville</Label>
                    <Input {...register('propertyCity')} placeholder="Paris" className="h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Surface m²</Label>
                    <Input type="number" {...register('propertySurface')} placeholder="75" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Pièces</Label>
                    <Input type="number" {...register('propertyRooms')} placeholder="3" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Controller
                      name="propertyType"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="APPARTEMENT">Appartement</SelectItem>
                            <SelectItem value="MAISON">Maison</SelectItem>
                            <SelectItem value="TERRAIN">Terrain</SelectItem>
                            <SelectItem value="PARKING">Parking</SelectItem>
                            <SelectItem value="LOCAL_COMMERCIAL">Local commercial</SelectItem>
                            <SelectItem value="IMMEUBLE">Immeuble</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>
            </FieldSection>
          )}

          {/* Champs spécifiques LOCATIF */}
          {selectedType === 'IMMOBILIER_LOCATIF' && (
            <FieldSection title="Dispositif fiscal locatif" icon={<Shield className="h-4 w-4 text-emerald-500" />}>
              <div className="space-y-3">
                <Controller
                  name="rentalScheme"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Sélectionner un dispositif" /></SelectTrigger>
                      <SelectContent>
                        {RENTAL_SCHEMES.map((scheme) => (
                          <SelectItem key={scheme.value} value={scheme.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{scheme.label}</span>
                              <span className="text-xs text-gray-500">{scheme.taxBenefit}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Loyer mensuel</Label>
                    <div className="relative">
                      <Euro className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input type="number" {...register('rentalMonthlyRent')} placeholder="1200" className="h-9 text-sm pl-8" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Charges</Label>
                    <div className="relative">
                      <Euro className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input type="number" {...register('rentalCharges')} placeholder="150" className="h-9 text-sm pl-8" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Taux d'occupation %</Label>
                    <Input type="number" {...register('rentalOccupancyRate')} placeholder="95" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Locataire actuel</Label>
                    <Input {...register('rentalTenantName')} placeholder="M. Dupont" className="h-9 text-sm" />
                  </div>
                </div>
              </div>
            </FieldSection>
          )}

          {/* Champs spécifiques ASSURANCE-VIE */}
          {selectedType === 'ASSURANCE_VIE' && (
            <>
              <FieldSection title="Contrat" icon={<Shield className="h-4 w-4 text-blue-500" />}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Assureur</Label>
                    <Input {...register('insurerName')} placeholder="AXA, Generali..." className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">N° de contrat</Label>
                    <Input {...register('contractNumber')} placeholder="12345678" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Date d'ouverture</Label>
                    <Input type="date" {...register('contractOpenDate')} className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Mode de gestion</Label>
                    <Controller
                      name="managementMode"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ''} onValueChange={field.onChange}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Mode" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LIBRE">Gestion libre</SelectItem>
                            <SelectItem value="GESTION_PILOTEE">Gestion pilotée</SelectItem>
                            <SelectItem value="GESTION_SOUS_MANDAT">Gestion sous mandat</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </FieldSection>

              <FieldSection title="Versements" icon={<Euro className="h-4 w-4 text-green-500" />}>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Total versé</Label>
                    <Input type="number" {...register('totalPremiums')} placeholder="100000" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Avant 70 ans</Label>
                    <Input type="number" {...register('premiumsBefore70')} placeholder="80000" className="h-9 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Après 70 ans</Label>
                    <Input type="number" {...register('premiumsAfter70')} placeholder="20000" className="h-9 text-sm" />
                  </div>
                </div>
              </FieldSection>

              <FieldSection title="Clause bénéficiaire" icon={<Users className="h-4 w-4 text-purple-500" />}>
                <Controller
                  name="beneficiaryClauseType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={(v) => {
                      field.onChange(v)
                      const template = BENEFICIARY_CLAUSE_TEMPLATES.find(t => t.value === v)
                      if (template) setValue('beneficiaryClause', template.template)
                    }}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Type de clause" /></SelectTrigger>
                      <SelectContent>
                        {BENEFICIARY_CLAUSE_TEMPLATES.map((clause) => (
                          <SelectItem key={clause.value} value={clause.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{clause.label}</span>
                              <span className="text-xs text-gray-500">{clause.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Textarea 
                  {...register('beneficiaryClause')} 
                  placeholder="Clause bénéficiaire complète..."
                  rows={3}
                  className="text-sm mt-2"
                />
              </FieldSection>
            </>
          )}

          {/* Champs spécifiques ÉPARGNE SALARIALE */}
          {['PEE', 'PEG', 'PERCO', 'PERECO', 'PARTICIPATION', 'INTERESSEMENT', 'STOCK_OPTIONS', 'ACTIONS_GRATUITES', 'BSPCE'].includes(selectedType || '') && (
            <FieldSection title="Épargne salariale" icon={<Building2 className="h-4 w-4 text-purple-500" />}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Employeur</Label>
                  <Input {...register('employerName')} placeholder="Nom de l'entreprise" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Date de disponibilité</Label>
                  <Input type="date" {...register('availabilityDate')} className="h-9 text-sm" />
                </div>
                {['STOCK_OPTIONS', 'ACTIONS_GRATUITES'].includes(selectedType || '') && (
                  <div>
                    <Label className="text-xs">Montant non acquis</Label>
                    <Input type="number" {...register('unvestedAmount')} placeholder="0" className="h-9 text-sm" />
                  </div>
                )}
              </div>
            </FieldSection>
          )}

          {/* Champs spécifiques MOBILIER */}
          {['JEWELRY', 'WATCHES', 'ART_COLLECTION', 'PRECIOUS_METALS', 'WINE_COLLECTION', 'FURNITURE'].includes(selectedType || '') && (
            <FieldSection title="Objet de valeur" icon={<LucideIcons.Gem className="h-4 w-4 text-pink-500" />}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Marque / Artiste</Label>
                  <Input {...register('objectBrand')} placeholder="Cartier, Picasso..." className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Modèle / Titre</Label>
                  <Input {...register('objectModel')} placeholder="" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">N° de série</Label>
                  <Input {...register('objectSerial')} placeholder="" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Dernière expertise</Label>
                  <Input type="date" {...register('lastAppraisalDate')} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Valeur expertise</Label>
                  <Input type="number" {...register('lastAppraisalValue')} className="h-9 text-sm" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2">
                  <LucideIcons.FileCheck className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Certificat d'authenticité</span>
                </div>
                <Controller name="objectCertificate" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Assuré</span>
                </div>
                <Controller name="objectInsured" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
              </div>
            </FieldSection>
          )}

          {/* Champs spécifiques VÉHICULES */}
          {selectedType === 'VEHICULES' && (
            <FieldSection title="Véhicule" icon={<LucideIcons.Car className="h-4 w-4 text-blue-500" />}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Marque</Label>
                  <Input {...register('vehicleBrand')} placeholder="Porsche, Mercedes..." className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Modèle</Label>
                  <Input {...register('vehicleModel')} placeholder="911, Classe S..." className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Année</Label>
                  <Input type="number" {...register('vehicleYear')} placeholder="2024" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Immatriculation</Label>
                  <Input {...register('vehicleRegistration')} placeholder="AB-123-CD" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Kilométrage</Label>
                  <Input type="number" {...register('vehicleMileage')} placeholder="15000" className="h-9 text-sm" />
                </div>
              </div>
            </FieldSection>
          )}

          {/* Champs spécifiques CRYPTO */}
          {['CRYPTO', 'NFT'].includes(selectedType || '') && (
            <FieldSection title="Cryptomonnaies" icon={<LucideIcons.Bitcoin className="h-4 w-4 text-orange-500" />}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Plateforme</Label>
                  <Input {...register('exchangePlatform')} placeholder="Binance, Coinbase..." className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Token / Symbole</Label>
                  <Input {...register('tokenSymbol')} placeholder="BTC, ETH..." className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Quantité</Label>
                  <Input type="number" step="0.00000001" {...register('tokenQuantity')} placeholder="0.5" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Adresse wallet</Label>
                  <Input {...register('walletAddress')} placeholder="0x..." className="h-9 text-sm" />
                </div>
              </div>
            </FieldSection>
          )}

          {/* Champs spécifiques PROFESSIONNEL */}
          {['COMPANY_SHARES', 'SCI'].includes(selectedType || '') && (
            <FieldSection title="Entreprise" icon={<Building2 className="h-4 w-4 text-amber-500" />}>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Raison sociale</Label>
                  <Input {...register('companyName')} placeholder="Ma SARL" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">SIREN</Label>
                  <Input {...register('companySiren')} placeholder="123456789" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Forme juridique</Label>
                  <Input {...register('companyLegalForm')} placeholder="SARL, SAS..." className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Nombre de parts</Label>
                  <Input type="number" {...register('companySharesCount')} placeholder="100" className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Total parts société</Label>
                  <Input type="number" {...register('companyTotalShares')} placeholder="1000" className="h-9 text-sm" />
                </div>
              </div>
            </FieldSection>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm">Notes / Observations</Label>
            <Textarea {...register('description')} placeholder="Informations complémentaires..." rows={2} />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => setStep('valuation')}
              className="bg-[#7373FF] hover:bg-[#5c5ce6] text-white"
            >
              Continuer
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </form>
      )}

      {/* Step 4: Valuation */}
      {step === 'valuation' && (
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="flex items-center gap-3 mb-4">
            <button type="button" onClick={() => setStep('details')} className="p-2 rounded-lg hover:bg-gray-100">
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Calculator className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Valorisation</h3>
              <p className="text-sm text-gray-500">Valeur actuelle et acquisition</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valeur actuelle <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="number" {...register('value')} placeholder="250000" className="h-11 pl-10 text-lg font-semibold" />
              </div>
              {errors.value && <p className="text-sm text-red-500">{errors.value.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Valeur d'acquisition</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="number" {...register('acquisitionValue')} placeholder="200000" className="h-11 pl-10" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date d'acquisition</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="date" {...register('acquisitionDate')} className="h-11 pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Revenus annuels</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="number" {...register('annualIncome')} placeholder="12000" className="h-11 pl-10" />
              </div>
            </div>
          </div>

          {/* Calculations */}
          {(value > 0 || acquisitionValue > 0) && (
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Plus-value latente</p>
                <span className={`text-lg font-bold ${calculations.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                  {calculations.isPositive ? '+' : ''}{formatCurrency(calculations.plusValue)}
                </span>
                <p className="text-xs text-gray-400">
                  {calculations.isPositive ? '+' : ''}{calculations.plusValuePercent.toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Rendement brut</p>
                <span className="text-lg font-bold text-blue-600">
                  {(calculations.rendementBrut || calculations.rendementFromIncome).toFixed(2)}%
                </span>
                <p className="text-xs text-gray-400">
                  {formatCurrency(calculations.annualRent || annualIncome)}/an
                </p>
              </div>
            </div>
          )}

          {/* Gestion par le cabinet */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#7373FF]/10 flex items-center justify-center">
                <LucideIcons.Building className="h-5 w-5 text-[#7373FF]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Géré par le cabinet</p>
                <p className="text-xs text-gray-500">Actif sous gestion</p>
              </div>
            </div>
            <Controller name="managedByFirm" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
          </div>

          {watch('managedByFirm') && (
            <div className="space-y-2 p-4 rounded-xl bg-gray-50">
              <Label className="text-sm">Frais de gestion annuels (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="number" step="0.01" {...register('managementFees')} placeholder="1" className="h-10 pl-10" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onCancel} className="text-gray-500">Annuler</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#7373FF] hover:bg-[#5c5ce6] text-white min-w-[160px]">
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</> : <><Check className="h-4 w-4 mr-2" />{mode === 'edit' ? 'Enregistrer' : 'Ajouter l\'actif'}</>}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default ActifFormWizard
