'use client'

/**
 * PassifFormWizard - Formulaire professionnel de crédit/dette
 * UI/UX moderne avec animations et UX fluide
 * Entièrement en français, similaire à ActifFormWizard
 */

import { useState, useMemo, useEffect } from 'react'
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
import { useCreatePassif, useUpdatePassif, useClientActifs } from '@/app/(advisor)/(frontend)/hooks/use-patrimoine'
import { formatCurrency } from '@/app/_common/lib/utils'
import { PASSIF_TYPES, GUARANTEE_TYPES, INSURANCE_GUARANTEES, getPassifTypeConfig, type PassifTypeValue } from '@/app/_common/lib/patrimoine-config'
import * as LucideIcons from 'lucide-react'
import { 
  ChevronLeft, ChevronRight, Check, Loader2, Euro, Percent, Calendar, 
  CreditCard, Users, Shield, Building2, Link, Home, User, UserPlus, 
  Lock, Clock, Calculator, TrendingDown, Wallet, ArrowRight
} from 'lucide-react'

// =============================================================================
// Types & Props
// =============================================================================

interface PassifFormWizardProps {
  mode?: 'create' | 'edit'
  clientId?: string
   
  initialData?: any
  onSuccess?: () => void
  onCancel?: () => void
}

const schema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  type: z.string().min(1, 'Le type est requis'),
  description: z.string().optional(),
  initialAmount: z.coerce.number().positive('Le montant doit être positif'),
  remainingAmount: z.coerce.number().min(0),
  monthlyPayment: z.coerce.number().min(0),
  interestRate: z.coerce.number().min(0).max(100),
  effectiveRate: z.coerce.number().optional(),
  rateType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  firstPaymentDate: z.string().optional(),
  deferralType: z.string().optional(),
  deferralMonths: z.coerce.number().optional(),
  linkedActifId: z.string().optional(),
  borrowerType: z.string().optional(),
  primaryBorrower: z.string().optional(),
  primaryBorrowerQuota: z.coerce.number().optional(),
  coBorrower: z.string().optional(),
  coBorrowerQuota: z.coerce.number().optional(),
  insuranceType: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceRate: z.coerce.number().optional(),
  hasInsuranceDC: z.boolean().default(true),
  hasInsurancePTIA: z.boolean().default(true),
  hasInsuranceITT: z.boolean().default(false),
  hasInsuranceIPT: z.boolean().default(false),
  hasInsuranceIPP: z.boolean().default(false),
  hasInsurancePE: z.boolean().default(false),
  guaranteeType: z.string().optional(),
  guaranteeProvider: z.string().optional(),
  guaranteeCost: z.coerce.number().optional(),
  lenderName: z.string().optional(),
  contractNumber: z.string().optional(),
  earlyRepaymentAllowed: z.boolean().default(true),
  isModular: z.boolean().default(false),
  pauseAllowed: z.boolean().default(false),
})

type PassifFormValues = z.input<typeof schema>

// =============================================================================
// Composants UI
// =============================================================================

function DynamicIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
   
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.CreditCard
  return <IconComponent className={className} style={style} />
}

function SectionCard({ titre, icone, children, className = '' }: { 
  titre: string; 
  icone?: React.ReactNode; 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 space-y-4 ${className}`}>
      <div className="flex items-center gap-2">
        {icone}
        <p className="text-sm font-semibold text-slate-700">{titre}</p>
      </div>
      {children}
    </div>
  )
}

function StatCard({ label, value, color = 'slate', icon: Icon }: {
  label: string;
  value: string;
  color?: string;
   
  icon?: any;
}) {
  const colorClasses: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  
  return (
    <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.slate} text-center`}>
      {Icon && <Icon className="h-4 w-4 mx-auto mb-1 opacity-60" />}
      <p className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  )
}

// Catégories de passifs - Alignées avec PASSIF_TYPES de patrimoine-config.ts
const PASSIF_CATEGORIES = [
  { 
    value: 'IMMOBILIER', 
    label: 'Crédits immobiliers', 
    icon: 'Home', 
    color: '#3B82F6',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    description: 'Résidence principale, investissement locatif',
    types: ['CREDIT_IMMOBILIER', 'PTZ', 'PRET_ACTION_LOGEMENT', 'PRET_RELAIS', 'PRET_IN_FINE']
  },
  { 
    value: 'CONSOMMATION', 
    label: 'Crédits à la consommation', 
    icon: 'CreditCard', 
    color: '#8B5CF6',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    description: 'Auto, personnel, revolving, leasing',
    types: ['CREDIT_CONSOMMATION', 'CREDIT_AUTO', 'CREDIT_REVOLVING', 'LEASING']
  },
  { 
    value: 'PROFESSIONNEL', 
    label: 'Crédits professionnels', 
    icon: 'Briefcase', 
    color: '#10B981',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    description: 'Entreprise, prêt étudiant',
    types: ['PRET_PROFESSIONNEL', 'PRET_ETUDIANT']
  },
  { 
    value: 'AUTRE', 
    label: 'Autres dettes', 
    icon: 'Wallet', 
    color: '#F59E0B',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    description: 'Prêt familial, découvert bancaire',
    types: ['PRET_FAMILIAL', 'DECOUVERT', 'AUTRE']
  },
]

// =============================================================================
// Composant Principal
// =============================================================================

export function PassifFormWizard({ mode = 'create', clientId: propClientId, initialData, onSuccess, onCancel }: PassifFormWizardProps) {
  const { toast } = useToast()
  const createPassif = useCreatePassif()
  const updatePassif = useUpdatePassif()
  
  const clientId = propClientId || initialData?.clientId || ''
  const { data: clientActifs } = useClientActifs(clientId)
  
  // État des étapes
  type StepType = 'categorie' | 'type' | 'montants' | 'emprunteurs' | 'assurance' | 'recap'
  const [step, setStep] = useState<StepType>(mode === 'edit' ? 'montants' : 'categorie')
  const [selectedCategorie, setSelectedCategorie] = useState<string | null>(
    initialData?.type ? PASSIF_CATEGORIES.find(c => c.types.includes(initialData.type))?.value || null : null
  )
  const [selectedType, setSelectedType] = useState<PassifTypeValue | null>((initialData?.type as PassifTypeValue) || null)
  const [animate, setAnimate] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting }
  } = useForm<PassifFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || '',
      description: initialData?.description || '',
      initialAmount: initialData?.initialAmount ?? 0,
      remainingAmount: initialData?.remainingAmount ?? 0,
      monthlyPayment: initialData?.monthlyPayment ?? 0,
      interestRate: initialData?.interestRate ?? 0,
      effectiveRate: initialData?.effectiveRate ?? undefined,
      rateType: initialData?.rateType || 'MONTANT_FIXE',
      startDate: initialData?.startDate?.toString().slice(0, 10) || '',
      endDate: initialData?.endDate?.toString().slice(0, 10) || '',
      borrowerType: initialData?.borrowerType || 'SOLO',
      primaryBorrower: initialData?.primaryBorrower || '',
      coBorrower: initialData?.coBorrower || '',
      insuranceType: initialData?.insuranceType || '',
      insuranceProvider: initialData?.insuranceProvider || '',
      insuranceRate: initialData?.insuranceRate ?? 0,
      guaranteeType: initialData?.guaranteeType || '',
      guaranteeProvider: initialData?.guaranteeProvider || '',
      lenderName: initialData?.lenderName || '',
      contractNumber: initialData?.contractNumber || '',
      hasInsuranceDC: true,
      hasInsurancePTIA: true,
      earlyRepaymentAllowed: initialData?.earlyRepaymentAllowed ?? true,
      isModular: initialData?.isModular ?? false,
      pauseAllowed: initialData?.pauseAllowed ?? false,
    }
  })

  // Valeurs observées
  const initialAmount = Number(watch('initialAmount')) || 0
  const remainingAmount = Number(watch('remainingAmount')) || 0
  const monthlyPayment = Number(watch('monthlyPayment')) || 0
  const interestRate = Number(watch('interestRate')) || 0
  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const borrowerType = watch('borrowerType')
  const insuranceRate = Number(watch('insuranceRate')) || 0
  const linkedActifId = watch('linkedActifId')

  const typeConfig = useMemo(() => selectedType ? getPassifTypeConfig(selectedType) : null, [selectedType])
  
  const typesDisponibles = useMemo(() => {
    if (!selectedCategorie) return []
    const cat = PASSIF_CATEGORIES.find(c => c.value === selectedCategorie)
    if (!cat) return []
    return PASSIF_TYPES.filter(t => cat.types.includes(t.value))
  }, [selectedCategorie])

  const actifsRattachables = useMemo(() => {
    if (!Array.isArray(clientActifs) || !typeConfig) return []
    if (!typeConfig.requiresLinkedAsset) return clientActifs
    return clientActifs
  }, [clientActifs, typeConfig])

  // Calculs
  const calculs = useMemo(() => {
    let dureeMois = 0
    if (startDate && endDate) {
      const s = new Date(startDate), e = new Date(endDate)
      dureeMois = Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()))
    }
    
    const totalRemboursements = monthlyPayment * dureeMois
    const totalInterets = Math.max(0, totalRemboursements - initialAmount)
    const progressionPourcent = initialAmount > 0 ? ((initialAmount - remainingAmount) / initialAmount) * 100 : 0
    const moisRestants = monthlyPayment > 0 ? Math.ceil(remainingAmount / monthlyPayment) : 0
    const assuranceMensuelle = (initialAmount * insuranceRate / 100) / 12
    const totalAssurance = assuranceMensuelle * dureeMois
    const coutTotal = totalInterets + totalAssurance
    const mensualiteTotale = monthlyPayment + assuranceMensuelle
    
    return {
      dureeMois,
      dureeAnnees: Math.floor(dureeMois / 12),
      dureeMoisRestant: dureeMois % 12,
      totalRemboursements,
      totalInterets,
      progressionPourcent,
      moisRestants,
      assuranceMensuelle,
      totalAssurance,
      coutTotal,
      mensualiteTotale,
    }
  }, [initialAmount, remainingAmount, monthlyPayment, startDate, endDate, insuranceRate])

  // Auto-fill
  useEffect(() => {
    if (mode === 'create' && initialAmount > 0 && !watch('remainingAmount')) {
      setValue('remainingAmount', initialAmount)
    }
  }, [initialAmount, mode, setValue, watch])

  // Animation de transition
  const goToStep = (newStep: StepType) => {
    setAnimate(true)
    setTimeout(() => {
      setStep(newStep)
      setAnimate(false)
    }, 150)
  }

  // Handlers
  const handleCategorieSelect = (categorie: string) => {
    setSelectedCategorie(categorie)
    goToStep('type')
  }

  const handleTypeSelect = (type: PassifTypeValue) => {
    setSelectedType(type)
    setValue('type', type)
    const config = getPassifTypeConfig(type)
    if (!watch('name') && config) {
      setValue('name', config.label)
    }
    goToStep('montants')
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const garantiesAssurance = []
      if (values.hasInsuranceDC) garantiesAssurance.push({ type: 'DC', covered: true })
      if (values.hasInsurancePTIA) garantiesAssurance.push({ type: 'PTIA', covered: true })
      if (values.hasInsuranceITT) garantiesAssurance.push({ type: 'ITT', covered: true })
      if (values.hasInsuranceIPT) garantiesAssurance.push({ type: 'IPT', covered: true })
      if (values.hasInsuranceIPP) garantiesAssurance.push({ type: 'IPP', covered: true })
      if (values.hasInsurancePE) garantiesAssurance.push({ type: 'PE', covered: true })

      const payload = {
        type: values.type as any,
        name: values.name,
        description: values.description || undefined,
        clientId,
        initialAmount: Number(values.initialAmount),
        remainingAmount: Number(values.remainingAmount) || Number(values.initialAmount),
        monthlyPayment: Number(values.monthlyPayment),
        interestRate: Number(values.interestRate),
        startDate: values.startDate ? new Date(values.startDate) : undefined,
        endDate: values.endDate ? new Date(values.endDate) : undefined,
        linkedActifId: values.linkedActifId || undefined,
        insurance: garantiesAssurance.length > 0 ? { guarantees: garantiesAssurance, rate: values.insuranceRate } : undefined,
      }

      if (mode === 'edit' && initialData?.id) {
        await updatePassif.mutateAsync({ id: initialData.id, data: payload })
        toast({ title: 'Crédit modifié', description: 'Les informations ont été mises à jour.' })
      } else {
        await createPassif.mutateAsync(payload)
        toast({ title: 'Crédit ajouté', description: 'Le crédit a été ajouté au patrimoine.' })
      }
      onSuccess?.()
    } catch (error: any) {
      toast({ title: 'Erreur', description: error?.message || 'Impossible d\'enregistrer.', variant: 'destructive' })
    }
  })

  // Étapes configuration
  const etapes = ['categorie', 'type', 'montants', 'emprunteurs', 'assurance', 'recap'] as const
  const etapesLabels: Record<string, string> = {
    categorie: 'Catégorie',
    type: 'Type',
    montants: 'Montants',
    emprunteurs: 'Emprunteurs',
    assurance: 'Assurance',
    recap: 'Récapitulatif'
  }
  const etapeIndex = etapes.indexOf(step)

  // ==========================================================================
  // Rendu
  // ==========================================================================

  return (
    <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
      {/* Indicateur de progression moderne */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 pb-4 -mt-2 pt-2">
        <div className="flex items-center justify-between mb-2">
          {etapes.map((s, i) => {
            const estComplete = i < etapeIndex
            const estActuelle = s === step
            const peutNaviguer = mode === 'edit' ? i >= 2 : estComplete
            
            return (
              <div key={s} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => peutNaviguer && goToStep(s)}
                  disabled={!peutNaviguer && !estActuelle}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    estActuelle ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 scale-110' :
                    estComplete ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer' :
                    'bg-slate-100 text-slate-400'
                  }`}
                >
                  {estComplete ? <Check className="h-4 w-4" /> : i + 1}
                </button>
                {i < etapes.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded-full transition-all duration-500 ${
                    i < etapeIndex ? 'bg-indigo-400' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
        <p className="text-center text-xs text-slate-500 font-medium">{etapesLabels[step]}</p>
      </div>

      {/* Contenu animé */}
      <div className={`transition-all duration-150 ${animate ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
        
        {/* Étape 1: Catégorie */}
        {step === 'categorie' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white mb-3 shadow-lg shadow-red-200">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Quel type de crédit ?</h3>
              <p className="text-sm text-slate-500 mt-1">Sélectionnez la catégorie de dette</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {PASSIF_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleCategorieSelect(cat.value)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 group ${cat.bgColor} border-transparent hover:border-slate-200 hover:shadow-lg hover:-translate-y-0.5`}
                >
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 shadow-sm"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <DynamicIcon name={cat.icon} className="h-5 w-5" style={{ color: cat.color }} />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{cat.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Étape 2: Type */}
        {step === 'type' && selectedCategorie && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => goToStep('categorie')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <ChevronLeft className="h-5 w-5 text-slate-500" />
              </button>
              <div>
                <h3 className="font-bold text-slate-800">Type de crédit</h3>
                <p className="text-xs text-slate-500">{PASSIF_CATEGORIES.find(c => c.value === selectedCategorie)?.label}</p>
              </div>
            </div>
            
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {typesDisponibles.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeSelect(type.value)}
                  className="w-full p-4 rounded-xl border-2 border-slate-100 text-left transition-all group hover:border-slate-200 hover:bg-slate-50 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${type.color}15` }}
                    >
                      <DynamicIcon name={type.icon} className="h-5 w-5" style={{ color: type.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800">{type.label}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{type.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Étape 3: Montants */}
        {step === 'montants' && (
          <form onSubmit={(e) => { e.preventDefault(); goToStep('emprunteurs') }} className="space-y-5">
            <div className="flex items-center gap-3">
              {mode === 'create' && (
                <button type="button" onClick={() => goToStep('type')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                  <ChevronLeft className="h-5 w-5 text-slate-500" />
                </button>
              )}
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: typeConfig ? `${typeConfig.color}15` : '#7373FF15' }}
              >
                <DynamicIcon name={typeConfig?.icon || 'CreditCard'} className="h-5 w-5" style={{ color: typeConfig?.color || '#7373FF' }} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{typeConfig?.label || 'Crédit'}</h3>
                <p className="text-xs text-slate-500">Caractéristiques du prêt</p>
              </div>
            </div>

            {/* Nom */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Nom du crédit <span className="text-red-500">*</span></Label>
              <Input {...register('name')} placeholder="Ex: Crédit résidence principale" className="h-11 rounded-xl border-slate-200 focus:border-indigo-400" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Rattachement actif */}
            {typeConfig?.requiresLinkedAsset && actifsRattachables.length > 0 && (
              <SectionCard titre="Actif financé" icone={<Link className="h-4 w-4 text-blue-500" />}>
                <Controller
                  name="linkedActifId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Sélectionner l'actif correspondant" />
                      </SelectTrigger>
                      <SelectContent>
                        {actifsRattachables.map((actif: any) => (
                          <SelectItem key={actif.id} value={actif.id}>
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-slate-400" />
                              <span>{actif.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </SectionCard>
            )}

            {/* Montants */}
            <SectionCard titre="Montants" icone={<Euro className="h-4 w-4 text-emerald-500" />}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Capital emprunté *</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="number" {...register('initialAmount')} placeholder="200 000" className="h-10 pl-9 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Capital restant dû</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input type="number" {...register('remainingAmount')} className="h-10 pl-9 rounded-xl" />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Taux */}
            <SectionCard titre="Taux et mensualité" icone={<Percent className="h-4 w-4 text-purple-500" />}>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Taux nominal *</Label>
                  <div className="relative">
                    <Input type="number" step="0.01" {...register('interestRate')} placeholder="3.5" className="h-10 pr-8 rounded-xl" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">TAEG</Label>
                  <div className="relative">
                    <Input type="number" step="0.01" {...register('effectiveRate')} placeholder="3.8" className="h-10 pr-8 rounded-xl" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Type</Label>
                  <Controller
                    name="rateType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || 'MONTANT_FIXE'} onValueChange={field.onChange}>
                        <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FIXED">Fixe</SelectItem>
                          <SelectItem value="VARIABLE">Variable</SelectItem>
                          <SelectItem value="CAPPED">Variable capé</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Mensualité hors assurance *</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input type="number" {...register('monthlyPayment')} placeholder="1 200" className="h-10 pl-9 rounded-xl" />
                </div>
              </div>
            </SectionCard>

            {/* Dates */}
            <SectionCard titre="Durée du prêt" icone={<Calendar className="h-4 w-4 text-amber-500" />}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Date de déblocage</Label>
                  <Input type="date" {...register('startDate')} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Date de fin</Label>
                  <Input type="date" {...register('endDate')} className="h-10 rounded-xl" />
                </div>
              </div>
              {calculs.dureeAnnees > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Durée: <strong className="text-slate-700">{calculs.dureeAnnees} ans {calculs.dureeMoisRestant > 0 ? `et ${calculs.dureeMoisRestant} mois` : ''}</strong></span>
                </div>
              )}
            </SectionCard>

            {/* Prêteur */}
            <SectionCard titre="Établissement prêteur" icone={<Building2 className="h-4 w-4 text-slate-500" />}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Banque</Label>
                  <Input {...register('lenderName')} placeholder="BNP, Crédit Agricole..." className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">N° de contrat</Label>
                  <Input {...register('contractNumber')} placeholder="12345678" className="h-10 rounded-xl" />
                </div>
              </div>
            </SectionCard>

            <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-200">
              Continuer <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        )}

        {/* Étape 4: Emprunteurs */}
        {step === 'emprunteurs' && (
          <form onSubmit={(e) => { e.preventDefault(); goToStep('assurance') }} className="space-y-5">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => goToStep('montants')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <ChevronLeft className="h-5 w-5 text-slate-500" />
              </button>
              <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Emprunteurs</h3>
                <p className="text-xs text-slate-500">Qui emprunte ?</p>
              </div>
            </div>

            {/* Type d'emprunt */}
            <Controller
              name="borrowerType"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => field.onChange('SOLO')}
                    className={`p-5 rounded-2xl border-2 text-center transition-all ${
                      field.value === 'SOLO' 
                        ? 'border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-100' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <User className={`h-8 w-8 mx-auto mb-2 ${field.value === 'SOLO' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <p className={`font-semibold ${field.value === 'SOLO' ? 'text-indigo-700' : 'text-slate-700'}`}>Seul</p>
                    <p className="text-xs text-slate-500">Un seul emprunteur</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange('JOINT')}
                    className={`p-5 rounded-2xl border-2 text-center transition-all ${
                      field.value === 'JOINT' 
                        ? 'border-indigo-400 bg-indigo-50 shadow-lg shadow-indigo-100' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Users className={`h-8 w-8 mx-auto mb-2 ${field.value === 'JOINT' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <p className={`font-semibold ${field.value === 'JOINT' ? 'text-indigo-700' : 'text-slate-700'}`}>À deux</p>
                    <p className="text-xs text-slate-500">Co-emprunteur</p>
                  </button>
                </div>
              )}
            />

            {/* Emprunteur principal */}
            <SectionCard titre="Emprunteur principal" icone={<User className="h-4 w-4 text-blue-500" />}>
              <Input {...register('primaryBorrower')} placeholder="M. Jean Dupont" className="h-10 rounded-xl" />
              {borrowerType === 'JOINT' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Quotité (%)</Label>
                  <Input type="number" {...register('primaryBorrowerQuota')} placeholder="50" className="h-10 rounded-xl" />
                </div>
              )}
            </SectionCard>

            {borrowerType === 'JOINT' && (
              <SectionCard titre="Co-emprunteur" icone={<UserPlus className="h-4 w-4 text-purple-500" />}>
                <Input {...register('coBorrower')} placeholder="Mme Marie Dupont" className="h-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Quotité (%)</Label>
                  <Input type="number" {...register('coBorrowerQuota')} placeholder="50" className="h-10 rounded-xl" />
                </div>
              </SectionCard>
            )}

            <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-200">
              Continuer <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        )}

        {/* Étape 5: Assurance */}
        {step === 'assurance' && (
          <form onSubmit={(e) => { e.preventDefault(); goToStep('recap') }} className="space-y-5">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => goToStep('emprunteurs')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <ChevronLeft className="h-5 w-5 text-slate-500" />
              </button>
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Assurance emprunteur</h3>
                <p className="text-xs text-slate-500">ADI et garanties</p>
              </div>
            </div>

            {/* Type assurance */}
            <SectionCard titre="Contrat d'assurance" icone={<Shield className="h-4 w-4 text-emerald-500" />}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Type de contrat</Label>
                  <Controller
                    name="insuranceType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GROUPE">Contrat groupe</SelectItem>
                          <SelectItem value="DELEGATION">Délégation</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Assureur</Label>
                  <Input {...register('insuranceProvider')} placeholder="CNP, AXA..." className="h-10 rounded-xl" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Taux annuel (%)</Label>
                <div className="relative">
                  <Input type="number" step="0.01" {...register('insuranceRate')} placeholder="0.36" className="h-10 pr-8 rounded-xl" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                </div>
                {insuranceRate > 0 && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Prime mensuelle: {formatCurrency(calculs.assuranceMensuelle)}
                  </p>
                )}
              </div>
            </SectionCard>

            {/* Garanties */}
            <SectionCard titre="Garanties couvertes" icone={<Lock className="h-4 w-4 text-amber-500" />}>
              <div className="grid grid-cols-2 gap-2">
                {INSURANCE_GUARANTEES.map((g) => (
                  <div key={g.value} className={`flex items-center justify-between p-3 rounded-xl border ${g.mandatory ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200'}`}>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{g.shortLabel}</p>
                      <p className="text-[10px] text-slate-500">{g.label}</p>
                    </div>
                    <Controller
                      name={`hasInsurance${g.value}` as any}
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={g.mandatory} />
                      )}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Garantie du prêt */}
            <SectionCard titre="Garantie du prêt" icone={<Building2 className="h-4 w-4 text-slate-500" />}>
              <Controller
                name="guaranteeType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Type de garantie" /></SelectTrigger>
                    <SelectContent>
                      {GUARANTEE_TYPES.map((g) => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </SectionCard>

            <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-200">
              Continuer <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </form>
        )}

        {/* Étape 6: Récapitulatif */}
        {step === 'recap' && (
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => goToStep('assurance')} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <ChevronLeft className="h-5 w-5 text-slate-500" />
              </button>
              <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Récapitulatif</h3>
                <p className="text-xs text-slate-500">Vérification avant validation</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              <StatCard label="Durée" value={`${calculs.dureeAnnees}ans`} color="blue" icon={Clock} />
              <StatCard label="Intérêts" value={formatCurrency(calculs.totalInterets)} color="red" icon={TrendingDown} />
              <StatCard label="Assurance" value={formatCurrency(calculs.totalAssurance)} color="purple" icon={Shield} />
              <StatCard label="Coût total" value={formatCurrency(calculs.coutTotal)} color="amber" icon={Calculator} />
            </div>

            {/* Mensualité totale */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">Mensualité totale</p>
                  <p className="text-xs opacity-70">Prêt + Assurance</p>
                </div>
                <span className="text-3xl font-bold">{formatCurrency(calculs.mensualiteTotale)}</span>
              </div>
            </div>

            {/* Progression */}
            {calculs.progressionPourcent > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Déjà remboursé</span>
                  <span className="font-bold text-emerald-600">{calculs.progressionPourcent.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all" style={{ width: `${calculs.progressionPourcent}%` }} />
                </div>
              </div>
            )}

            {/* Options */}
            <SectionCard titre="Options du prêt" icone={<Wallet className="h-4 w-4 text-slate-500" />}>
              <div className="space-y-2">
                {[
                  { name: 'earlyRepaymentAllowed', label: 'Remboursement anticipé', desc: 'Avec IRA potentielle' },
                  { name: 'isModular', label: 'Mensualités modulables', desc: 'Augmenter ou diminuer' },
                  { name: 'pauseAllowed', label: 'Pause possible', desc: 'Report de mensualités' },
                ].map((opt) => (
                  <div key={opt.name} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                      <p className="text-[10px] text-slate-500">{opt.desc}</p>
                    </div>
                    <Controller name={opt.name as any} control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">Notes / Observations</Label>
              <Textarea {...register('description')} placeholder="Informations complémentaires..." rows={2} className="rounded-xl resize-none" />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 rounded-xl">
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-200">
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" />{mode === 'edit' ? 'Enregistrer' : 'Ajouter le crédit'}</>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default PassifFormWizard
