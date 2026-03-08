"use client"

import { Suspense, useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCreateAffaire } from '@/app/_common/hooks/api/use-operations-api'
import { useProviders, useProviderProducts } from '@/app/_common/hooks/api/use-providers-api'
import { useClients, useClient } from '@/app/_common/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Stepper } from '@/app/_common/components/ui/Stepper'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import { cn } from '@/app/_common/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  User,
  Package,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Search,
  Euro,
  Calendar,
  Check,
  X,
} from 'lucide-react'
import {
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABELS,
  AFFAIRE_SOURCE,
  AFFAIRE_SOURCE_LABELS,
  type ProductType,
  type AffaireSource,
  type AffaireProductDetails,
} from '@/lib/operations/types'
import { ComplianceStatusBanner } from '@/app/(advisor)/(frontend)/components/operations'

// ============================================================================
// Types
// ============================================================================

interface WizardStep {
  id: string
  label: string
  description?: string
}

interface FormData {
  // Step 1: Client
  clientId: string
  clientSearch: string
  
  // Step 2: Product
  productType: ProductType | null
  
  // Step 3: Provider
  providerId: string
  productId: string
  
  // Step 4: Details
  source: AffaireSource
  estimatedAmount: number
  targetDate: string
  notes: string
  
  // Step 5: Documents (compliance check)
  documentsChecked: boolean
}

interface ComplianceStatus {
  kycValid: boolean
  mifidValid: boolean
  documentsComplete: boolean
  issues: string[]
  isBlocking: boolean
}

// ============================================================================
// Steps Configuration
// ============================================================================

const WIZARD_STEPS: WizardStep[] = [
  { id: 'client', label: 'Client', description: 'Sélectionner le client' },
  { id: 'product', label: 'Produit', description: 'Type de produit' },
  { id: 'provider', label: 'Fournisseur', description: 'Assureur / Société' },
  { id: 'details', label: 'Détails', description: 'Montant et informations' },
  { id: 'documents', label: 'Documents', description: 'Vérification conformité' },
]

// ============================================================================
// Step Components
// ============================================================================

function ClientStep({
  formData,
  setFormData,
  clientLocked,
  clientLockedName,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
  clientLocked?: boolean
  clientLockedName?: string
}) {
  const [searchQuery, setSearchQuery] = useState(formData.clientSearch)
  
  // Utiliser l'API réelle pour charger les clients
  const { data: clientsData, isLoading: loadingClients } = useClients({ 
    search: searchQuery || undefined,
  },
  { enabled: !clientLocked }
  )
  
  // Transformer les données clients pour l'affichage
  const clients = useMemo(() => {
    const rawClients = (clientsData as any)?.data?.data || (clientsData as any)?.data || []
    return (Array.isArray(rawClients) ? rawClients : []).map((c: any) => ({
      id: c.id,
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Client',
      email: c.email || '',
      kycStatus: c.kycStatus || 'INCOMPLETE',
    }))
  }, [clientsData])
  
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients
    const query = searchQuery.toLowerCase()
    return clients.filter(
      (c: any) => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
    )
  }, [searchQuery, clients])

  // Si client verrouillé, afficher seulement le nom
  if (clientLocked && formData.clientId) {
    return (
      <div className="space-y-6">
        <div>
          <Label>Client</Label>
          <div className="mt-2 flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="p-2 bg-white rounded-lg border border-gray-200">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{clientLockedName || 'Client sélectionné'}</p>
              <p className="text-xs text-gray-500">Client pré-sélectionné</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-[#7373FF] ml-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="client-search">Rechercher un client</Label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="client-search"
            placeholder="Nom, email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setFormData({ clientSearch: e.target.value })
            }}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Sélectionner un client</Label>
        <div className="grid gap-2 max-h-[300px] overflow-y-auto">
          {loadingClients ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Aucun client trouvé</p>
              <p className="text-sm mt-1">Modifiez votre recherche ou créez un nouveau client</p>
            </div>
          ) : filteredClients.map((client: any) => (
            <button
              key={client.id}
              type="button"
              onClick={() => setFormData({ clientId: client.id })}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border text-left transition-all',
                formData.clientId === client.id
                  ? 'border-[#7373FF] bg-[#7373FF]/5 ring-2 ring-[#7373FF]/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{client.name}</p>
                  <p className="text-sm text-gray-500">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={
                    client.kycStatus === 'VALID' ? 'success' : 
                    client.kycStatus === 'EXPIRED' ? 'danger' : 'warning'
                  }
                  size="sm"
                >
                  KYC {client.kycStatus === 'VALID' ? 'OK' : client.kycStatus === 'EXPIRED' ? 'Expiré' : 'Incomplet'}
                </Badge>
                {formData.clientId === client.id && (
                  <CheckCircle2 className="h-5 w-5 text-[#7373FF]" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function NouvelleAffairePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientIdFromUrl = searchParams.get('clientId')
  const clientLocked = !!clientIdFromUrl
  
  // Si clientId dans URL, on commence à l'étape 2 (produit)
  const [currentStep, setCurrentStep] = useState(clientIdFromUrl ? 1 : 0)
  const [isClientCompliant, setIsClientCompliant] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    clientId: clientIdFromUrl || '',
    clientSearch: '',
    productType: null,
    providerId: '',
    productId: '',
    source: 'CLIENT_EXISTANT',
    estimatedAmount: 0,
    targetDate: '',
    notes: '',
    documentsChecked: false,
  })

  const createAffaire = useCreateAffaire()
  
  // Fetch client details when locked
  const { data: clientDetail } = useClient(clientIdFromUrl || '')
  const selectedClientName = useMemo(() => {
    if (!clientDetail) return undefined
    const firstName = (clientDetail as any)?.firstName || ''
    const lastName = (clientDetail as any)?.lastName || ''
    return `${firstName} ${lastName}`.trim() || (clientDetail as any)?.email || 'Client'
  }, [clientDetail])

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  // Handle compliance status change from the banner
  const handleComplianceChange = (isCompliant: boolean) => {
    setIsClientCompliant(isCompliant)
  }

  // Validation for each step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: return !!formData.clientId
      case 1: return !!formData.productType
      case 2: return !!formData.providerId
      case 3: return formData.estimatedAmount > 0
      case 4: return formData.documentsChecked && isClientCompliant
      default: return false
    }
  }

  const canProceed = isStepValid(currentStep)
  const isLastStep = currentStep === WIZARD_STEPS.length - 1

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.productType || !formData.providerId) return
    
    // Block if client is not compliant
    if (!isClientCompliant) {
      return
    }

    try {
      await createAffaire.mutateAsync({
        clientId: formData.clientId,
        productType: formData.productType,
        providerId: formData.providerId,
        productId: formData.productId || undefined,
        source: formData.source,
        estimatedAmount: formData.estimatedAmount,
        targetDate: formData.targetDate || undefined,
      })
      router.push('/dashboard/operations/affaires-nouvelles')
    } catch (error) {
      // Error handled by mutation
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ClientStep 
            formData={formData} 
            setFormData={updateFormData}
            clientLocked={clientLocked}
            clientLockedName={selectedClientName}
          />
        )
      case 1:
        return <ProductStep formData={formData} setFormData={updateFormData} />
      case 2:
        return <ProviderStep formData={formData} setFormData={updateFormData} />
      case 3:
        return <DetailsStep formData={formData} setFormData={updateFormData} />
      case 4:
        return (
          <DocumentsStep 
            formData={formData} 
            setFormData={updateFormData}
            onComplianceChange={handleComplianceChange}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle Affaire</h1>
          <p className="text-sm text-gray-500">
            Créez une nouvelle souscription en suivant les étapes
          </p>
        </div>
      </header>

      {/* Stepper */}
      <Card>
        <CardContent className="p-6">
          <Stepper
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            onStepClick={(step) => {
              // Only allow going back to completed steps
              if (step < currentStep) {
                setCurrentStep(step)
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader bordered>
          <CardTitle size="lg">{WIZARD_STEPS[currentStep].label}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed || createAffaire.isPending}
            className="gap-2"
          >
            {createAffaire.isPending ? (
              'Création...'
            ) : isLastStep ? (
              <>
                Créer l'affaire
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function NouvelleAffairePage() {
  return (
    <Suspense fallback={null}>
      <NouvelleAffairePageInner />
    </Suspense>
  )
}

function ProductStep({
  formData,
  setFormData,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Type de produit</Label>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Sélectionnez le type de produit pour cette affaire
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {PRODUCT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ productType: type, providerId: '', productId: '' })}
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border text-left transition-all',
                formData.productType === type
                  ? 'border-[#7373FF] bg-[#7373FF]/5 ring-2 ring-[#7373FF]/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg',
                formData.productType === type ? 'bg-[#7373FF]/10' : 'bg-gray-100'
              )}>
                <Package className={cn(
                  'h-5 w-5',
                  formData.productType === type ? 'text-[#7373FF]' : 'text-gray-600'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium truncate',
                  formData.productType === type ? 'text-[#7373FF]' : 'text-gray-900'
                )}>
                  {PRODUCT_TYPE_LABELS[type]}
                </p>
              </div>
              {formData.productType === type && (
                <CheckCircle2 className="h-5 w-5 text-[#7373FF] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProviderStep({
  formData,
  setFormData,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
}) {
  const { data: providersData, isLoading: providersLoading } = useProviders()
  const { data: productsData, isLoading: productsLoading } = useProviderProducts(
    formData.providerId,
  )

  const rawProviders = (providersData as any)?.data
  const providers = Array.isArray(rawProviders)
    ? rawProviders
    : Array.isArray(rawProviders?.data)
      ? rawProviders.data
      : []

  const rawProducts = (productsData as any)?.data
  const products = Array.isArray(rawProducts)
    ? rawProducts
    : Array.isArray(rawProducts?.data)
      ? rawProducts.data
      : []

  // Filter products by selected product type
  const filteredProducts = products.filter(p => p.type === formData.productType)

  if (providersLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Label>Fournisseur / Assureur</Label>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Sélectionnez le fournisseur pour ce produit
        </p>
        
        <div className="grid gap-2 max-h-[200px] overflow-y-auto">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => setFormData({ providerId: provider.id, productId: '' })}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border text-left transition-all',
                formData.providerId === provider.id
                  ? 'border-[#7373FF] bg-[#7373FF]/5 ring-2 ring-[#7373FF]/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{provider.name}</p>
                  <p className="text-sm text-gray-500">{provider.type}</p>
                </div>
              </div>
              {formData.providerId === provider.id && (
                <CheckCircle2 className="h-5 w-5 text-[#7373FF]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {formData.providerId && (
        <div>
          <Label>Produit spécifique (optionnel)</Label>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Sélectionnez un produit du catalogue si disponible
          </p>
          
          {productsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : filteredProducts.length === 0 ? (
            <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">
              Aucun produit {PRODUCT_TYPE_LABELS[formData.productType!]} disponible pour ce fournisseur
            </p>
          ) : (
            <div className="grid gap-2 max-h-[150px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setFormData({ productId: product.id })}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border text-left transition-all',
                    formData.productId === product.id
                      ? 'border-[#7373FF] bg-[#7373FF]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.code}</p>
                  </div>
                  {formData.productId === product.id && (
                    <Check className="h-4 w-4 text-[#7373FF]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DetailsStep({
  formData,
  setFormData,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="source">Source de l'affaire</Label>
          <Select
            value={formData.source}
            onValueChange={(value) => setFormData({ source: value as AffaireSource })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {AFFAIRE_SOURCE.map((source) => (
                <SelectItem key={source} value={source}>
                  {AFFAIRE_SOURCE_LABELS[source]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="targetDate">Date cible</Label>
          <div className="relative mt-2">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="targetDate"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ targetDate: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="estimatedAmount">Montant estimé</Label>
        <div className="relative mt-2">
          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="estimatedAmount"
            type="number"
            min="0"
            step="1000"
            value={formData.estimatedAmount || ''}
            onChange={(e) => setFormData({ estimatedAmount: parseFloat(e.target.value) || 0 })}
            className="pl-9"
            placeholder="0"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Montant prévu de l'investissement
        </p>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ notes: e.target.value })}
          placeholder="Informations complémentaires..."
          className="mt-2"
          rows={3}
        />
      </div>
    </div>
  )
}

function DocumentsStep({
  formData,
  setFormData,
  onComplianceChange,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
  onComplianceChange: (isCompliant: boolean) => void
}) {
  const requiredDocuments = [
    { id: 'der', label: 'Document d\'Entrée en Relation (DER)', required: true },
    { id: 'recueil', label: 'Recueil d\'Informations Client', required: true },
    { id: 'mifid', label: 'Questionnaire MiFID II', required: true },
    { id: 'lettre', label: 'Lettre de Mission', required: true },
    { id: 'adequation', label: 'Déclaration d\'Adéquation', required: true },
    { id: 'bulletin', label: 'Bulletin de Souscription', required: true },
  ]

  return (
    <div className="space-y-6">
      {/* Real Compliance Status Banner */}
      {formData.clientId && (
        <ComplianceStatusBanner
          clientId={formData.clientId}
          onComplianceChange={onComplianceChange}
        />
      )}

      {/* Required Documents Checklist */}
      <div>
        <Label>Documents requis pour cette opération</Label>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Ces documents seront générés automatiquement lors de la constitution du dossier
        </p>
        
        <div className="space-y-2">
          {requiredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">{doc.label}</span>
              </div>
              <Badge variant="default" size="xs">
                {doc.required ? 'Requis' : 'Optionnel'}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          id="confirm-docs"
          checked={formData.documentsChecked}
          onChange={(e) => setFormData({ documentsChecked: e.target.checked })}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-[#7373FF] focus:ring-[#7373FF]"
        />
        <label htmlFor="confirm-docs" className="text-sm text-gray-700">
          Je confirme avoir vérifié la conformité du client et m'engage à générer les documents 
          réglementaires requis avant l'envoi au fournisseur.
        </label>
      </div>
    </div>
  )
}
