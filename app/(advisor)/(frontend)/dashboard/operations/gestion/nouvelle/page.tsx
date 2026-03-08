"use client"

import { RULES } from '@/app/_common/lib/rules/fiscal-rules'
import { Suspense, useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCreateOperationGestion } from '@/app/_common/hooks/api/use-operations-api'
import { useClients, useClient, useClientContrats } from '@/app/_common/hooks/use-api'
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
  FileText,
  Check,
  Euro,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowDownUp,
  Wallet,
  CreditCard,
  Users,
  Settings,
  ArrowRightLeft,
  Search,
} from 'lucide-react'
import {
  OPERATION_GESTION_TYPES,
  OPERATION_GESTION_TYPE_LABELS,
  type OperationGestionType,
  type OperationGestionDetails,
  type FundAllocation,
  type TaxSimulation,
} from '@/lib/operations/types'

// ============================================================================
// Types
// ============================================================================

interface WizardStep {
  id: string
  label: string
  description?: string
}

interface ContractInfo {
  id: string
  reference: string
  productName: string
  providerName: string
  currentValue: number
  openDate: Date
  allocations: FundAllocation[]
}

interface FormData {
  // Step 1: Contract Selection
  clientId: string
  clientSearch: string
  contractId: string
  
  // Step 2: Operation Type
  operationType: OperationGestionType | null
  
  // Step 3: Operation Details (varies by type)
  amount: number
  effectiveDate: string
  
  // Arbitrage specific
  sourceAllocations: FundAllocation[]
  targetAllocations: FundAllocation[]
  arbitrageType: 'PONCTUEL' | 'PROGRAMME'
  
  // Rachat specific
  destinationRib: string
  rachatType: 'PARTIEL' | 'TOTAL'
  
  // Versement specific
  versementAllocations: FundAllocation[]
  allocationMode: 'IDENTIQUE' | 'NOUVELLE'
  
  // Modification bénéficiaire
  newBeneficiaryClause: string
  previousBeneficiaryClause: string
  
  // Avance
  avanceDuration: number
  avanceInterestRate: number
  
  // Transfert
  targetProviderId: string
  targetProductId: string
  
  // Changement option gestion
  newOption: string
  previousOption: string
  
  // Step 4: Confirmation
  confirmed: boolean
}

// ============================================================================
// Steps Configuration
// ============================================================================

const WIZARD_STEPS: WizardStep[] = [
  { id: 'contract', label: 'Contrat', description: 'Sélectionner le contrat' },
  { id: 'type', label: 'Type', description: "Type d'opération" },
  { id: 'details', label: 'Détails', description: 'Paramètres de l\'opération' },
  { id: 'confirm', label: 'Confirmation', description: 'Vérification et validation' },
]

// ============================================================================
// Note: Les clients et contrats sont maintenant chargés via API
// Voir les hooks useClients et useClientContrats dans les composants
// ============================================================================

const AVAILABLE_FUNDS: FundAllocation[] = [
  { fundId: 'fund-1', fundName: 'Fonds Euro', percentage: 0 },
  { fundId: 'fund-2', fundName: 'Actions Monde', percentage: 0 },
  { fundId: 'fund-3', fundName: 'Obligations', percentage: 0 },
  { fundId: 'fund-4', fundName: 'Actions Europe', percentage: 0 },
  { fundId: 'fund-5', fundName: 'Immobilier', percentage: 0 },
]

// ============================================================================
// Operation Type Icons
// ============================================================================

const OPERATION_TYPE_ICONS: Record<OperationGestionType, React.ElementType> = {
  ARBITRAGE: ArrowDownUp,
  RACHAT_PARTIEL: Wallet,
  RACHAT_TOTAL: Wallet,
  VERSEMENT_COMPLEMENTAIRE: CreditCard,
  MODIFICATION_BENEFICIAIRE: Users,
  CHANGEMENT_OPTION_GESTION: Settings,
  AVANCE: Euro,
  TRANSFERT: ArrowRightLeft,
}

// ============================================================================
// Tax Simulation Helper
// ============================================================================

function calculateTaxSimulation(
  contractOpenDate: Date,
  currentValue: number,
  withdrawalAmount: number,
  totalPremiums: number = currentValue * 0.8 // Simplified assumption
): TaxSimulation {
  const contractAge = Math.floor(
    (new Date().getTime() - contractOpenDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
  )
  
  const gainRatio = (currentValue - totalPremiums) / currentValue
  const taxableAmount = withdrawalAmount * gainRatio
  
  // Simplified tax calculation — Source : RULES
  let taxRate = RULES.ps.pfu_ir // PFU 12.8%
  if (contractAge >= 8) {
    taxRate = RULES.assurance_vie.rachat.taux_reduit_8ans // Taux réduit après 8 ans
  }
  
  const socialCharges = taxableAmount * RULES.ps.total // Prélèvements sociaux
  const estimatedTax = taxableAmount * taxRate
  
  return {
    contractAge,
    totalGains: currentValue - totalPremiums,
    taxableAmount,
    estimatedTax,
    taxRate,
    socialCharges,
  }
}

// ============================================================================
// Step Components
// ============================================================================

function ContractStep({
  formData,
  setFormData,
  clientLocked,
  clientLockedName,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
  clientLocked: boolean
  clientLockedName?: string
}) {
  const [searchQuery, setSearchQuery] = useState(formData.clientSearch)
  
  // Charger les clients via API
  const { data: clientsData, isLoading: loadingClients } = useClients(
    { search: searchQuery || undefined },
    { enabled: !clientLocked }
  )
  
  // Charger les contrats du client sélectionné
  const { data: contractsData, isLoading: loadingContracts } = useClientContrats(
    formData.clientId || ''
  )
  
  // Transformer les données clients
  const clients = useMemo(() => {
    const rawClients = (clientsData as any)?.data || (clientsData as any)?.data?.data || []
    return (Array.isArray(rawClients) ? rawClients : []).map((c: any) => ({
      id: c.id,
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Client',
      email: c.email || '',
    }))
  }, [clientsData])
  
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients
    const query = searchQuery.toLowerCase()
    return clients.filter(
      (c: any) => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query)
    )
  }, [searchQuery, clients])

  // Transformer les contrats pour l'affichage
  const clientContracts: ContractInfo[] = useMemo(() => {
    if (!formData.clientId) return []
    const rawContracts = Array.isArray(contractsData) ? contractsData : []
    return rawContracts.map((c: any) => ({
      id: c.id,
      reference: c.contractNumber || c.reference || `Contrat ${String(c.id).slice(0, 8)}`,
      productName: c.name || c.productName || 'Produit',
      providerName: c.provider || c.providerName || 'Fournisseur',
      currentValue: Number(c.value || c.currentValue || 0),
      openDate: c.startDate ? new Date(c.startDate) : new Date(c.openDate || Date.now()),
      allocations: [],
    }))
  }, [formData.clientId, contractsData])

  return (
    <div className="space-y-6">
      {/* Client Selection (locked when coming from Client360) */}
      {clientLocked ? (
        <div>
          <Label>Client</Label>
          <div className="mt-2 flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="p-2 bg-white rounded-lg border border-gray-200">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{clientLockedName || 'Client'}</p>
              <p className="text-xs text-gray-500">Client sélectionné</p>
            </div>
          </div>
        </div>
      ) : (
        <>
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
            <div className="grid gap-2 max-h-[200px] overflow-y-auto">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setFormData({ clientId: client.id, contractId: '' })}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border text-left transition-all',
                    formData.clientId === client.id
                      ? 'border-[#7373FF] bg-[#7373FF]/5 ring-2 ring-[#7373FF]/20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.email}</p>
                    </div>
                  </div>
                  {formData.clientId === client.id && (
                    <CheckCircle2 className="h-5 w-5 text-[#7373FF]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Contract Selection */}
      {formData.clientId && (
        <div className="space-y-2">
          <Label>Sélectionner un contrat</Label>
          {clientContracts.length === 0 ? (
            <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg">
              Aucun contrat trouvé pour ce client
            </p>
          ) : (
            <div className="grid gap-2">
              {clientContracts.map((contract) => (
                <button
                  key={contract.id}
                  type="button"
                  onClick={() => setFormData({ contractId: contract.id })}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border text-left transition-all',
                    formData.contractId === contract.id
                      ? 'border-[#7373FF] bg-[#7373FF]/5 ring-2 ring-[#7373FF]/20'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div>
                    <p className="font-medium text-gray-900">{contract.reference}</p>
                    <p className="text-sm text-gray-500">{contract.productName} - {contract.providerName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ouvert le {contract.openDate.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {contract.currentValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    {formData.contractId === contract.id && (
                      <CheckCircle2 className="h-5 w-5 text-[#7373FF] ml-auto mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function NouvelleOperationGestionPage() {
  return (
    <Suspense fallback={null}>
      <NouvelleOperationGestionPageInner />
    </Suspense>
  )
}

function OperationTypeStep({
  formData,
  setFormData,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Type d'opération</Label>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Sélectionnez le type d'opération à effectuer sur ce contrat
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {OPERATION_GESTION_TYPES.map((type) => {
            const Icon = OPERATION_TYPE_ICONS[type]
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ operationType: type })}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-lg border text-left transition-all',
                  formData.operationType === type
                    ? 'border-[#7373FF] bg-[#7373FF]/5 ring-2 ring-[#7373FF]/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg',
                  formData.operationType === type ? 'bg-[#7373FF]/10' : 'bg-gray-100'
                )}>
                  <Icon className={cn(
                    'h-5 w-5',
                    formData.operationType === type ? 'text-[#7373FF]' : 'text-gray-600'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium text-sm',
                    formData.operationType === type ? 'text-[#7373FF]' : 'text-gray-900'
                  )}>
                    {OPERATION_GESTION_TYPE_LABELS[type]}
                  </p>
                </div>
                {formData.operationType === type && (
                  <CheckCircle2 className="h-5 w-5 text-[#7373FF] flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


// ============================================================================
// Operation Details Forms
// ============================================================================

function ArbitrageForm({
  formData,
  setFormData,
  contract,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
  contract: ContractInfo | null
}) {
  const [sourceAllocations, setSourceAllocations] = useState<FundAllocation[]>(
    contract?.allocations || []
  )
  const [targetAllocations, setTargetAllocations] = useState<FundAllocation[]>(
    AVAILABLE_FUNDS.map(f => ({ ...f, percentage: 0 }))
  )

  const totalSource = sourceAllocations.reduce((sum, a) => sum + a.percentage, 0)
  const totalTarget = targetAllocations.reduce((sum, a) => sum + a.percentage, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type d'arbitrage</Label>
          <Select
            value={formData.arbitrageType}
            onValueChange={(value) => setFormData({ arbitrageType: value as 'PONCTUEL' | 'PROGRAMME' })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PONCTUEL">Ponctuel</SelectItem>
              <SelectItem value="PROGRAMME">Programmé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="effectiveDate">Date d'effet</Label>
          <div className="relative mt-2">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="effectiveDate"
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ effectiveDate: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Source Allocations */}
      <div>
        <Label>Allocation source (à arbitrer)</Label>
        <p className="text-sm text-gray-500 mt-1 mb-3">
          Répartition actuelle du contrat - indiquez les % à désinvestir
        </p>
        <div className="space-y-2">
          {sourceAllocations.map((alloc, idx) => (
            <div key={alloc.fundId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-1 text-sm text-gray-700">{alloc.fundName}</span>
              <span className="text-sm text-gray-500 w-16 text-right">{alloc.percentage}%</span>
              <Input
                type="number"
                min="0"
                max={alloc.percentage}
                className="w-20"
                placeholder="0"
                onChange={(e) => {
                  const newAllocations = [...sourceAllocations]
                  newAllocations[idx] = { ...alloc, percentage: parseInt(e.target.value) || 0 }
                  setSourceAllocations(newAllocations)
                  setFormData({ sourceAllocations: newAllocations })
                }}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">Total à arbitrer: {totalSource}%</p>
      </div>

      {/* Target Allocations */}
      <div>
        <Label>Allocation cible (réinvestissement)</Label>
        <p className="text-sm text-gray-500 mt-1 mb-3">
          Indiquez la nouvelle répartition souhaitée
        </p>
        <div className="space-y-2">
          {targetAllocations.map((alloc, idx) => (
            <div key={alloc.fundId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex-1 text-sm text-gray-700">{alloc.fundName}</span>
              <Input
                type="number"
                min="0"
                max="100"
                className="w-20"
                placeholder="0"
                value={alloc.percentage || ''}
                onChange={(e) => {
                  const newAllocations = [...targetAllocations]
                  newAllocations[idx] = { ...alloc, percentage: parseInt(e.target.value) || 0 }
                  setTargetAllocations(newAllocations)
                  setFormData({ targetAllocations: newAllocations })
                }}
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          ))}
        </div>
        <p className={cn(
          'text-xs mt-2',
          totalTarget === 100 ? 'text-emerald-600' : 'text-amber-600'
        )}>
          Total: {totalTarget}% {totalTarget !== 100 && '(doit être égal à 100%)'}
        </p>
      </div>
    </div>
  )
}

function RachatForm({
  formData,
  setFormData,
  contract,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
  contract: ContractInfo | null
}) {
  const taxSimulation = useMemo(() => {
    if (!contract || !formData.amount) return null
    return calculateTaxSimulation(
      contract.openDate,
      contract.currentValue,
      formData.amount
    )
  }, [contract, formData.amount])

  const isPartial = formData.rachatType === 'PARTIEL'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Type de rachat</Label>
          <Select
            value={formData.rachatType}
            onValueChange={(value) => {
              setFormData({ 
                rachatType: value as 'PARTIEL' | 'TOTAL',
                amount: value === 'TOTAL' ? (contract?.currentValue || 0) : formData.amount,
                operationType: value === 'TOTAL' ? 'RACHAT_TOTAL' : 'RACHAT_PARTIEL',
              })
            }}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PARTIEL">Rachat partiel</SelectItem>
              <SelectItem value="TOTAL">Rachat total</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="effectiveDate">Date d'effet souhaitée</Label>
          <div className="relative mt-2">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="effectiveDate"
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ effectiveDate: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="amount">Montant du rachat</Label>
        <div className="relative mt-2">
          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="amount"
            type="number"
            min="0"
            max={contract?.currentValue || 0}
            value={formData.amount || ''}
            onChange={(e) => setFormData({ amount: parseFloat(e.target.value) || 0 })}
            className="pl-9"
            placeholder="0"
            disabled={!isPartial}
          />
        </div>
        {contract && (
          <p className="text-xs text-gray-500 mt-1">
            Valeur actuelle du contrat: {contract.currentValue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="destinationRib">RIB de destination</Label>
        <Input
          id="destinationRib"
          value={formData.destinationRib}
          onChange={(e) => setFormData({ destinationRib: e.target.value })}
          className="mt-2"
          placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
        />
      </div>

      {/* Tax Simulation */}
      {taxSimulation && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-900">Simulation fiscale indicative</p>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-amber-700">Ancienneté du contrat</p>
                  <p className="font-semibold text-amber-900">{taxSimulation.contractAge} ans</p>
                </div>
                <div>
                  <p className="text-amber-700">Plus-values totales</p>
                  <p className="font-semibold text-amber-900">
                    {taxSimulation.totalGains.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div>
                  <p className="text-amber-700">Part imposable</p>
                  <p className="font-semibold text-amber-900">
                    {taxSimulation.taxableAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div>
                  <p className="text-amber-700">Taux d'imposition</p>
                  <p className="font-semibold text-amber-900">{(taxSimulation.taxRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-amber-700">Impôt estimé</p>
                  <p className="font-semibold text-amber-900">
                    {taxSimulation.estimatedTax.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div>
                  <p className="text-amber-700">Prélèvements sociaux</p>
                  <p className="font-semibold text-amber-900">
                    {taxSimulation.socialCharges.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-3">
                * Simulation indicative, les montants réels peuvent varier selon votre situation fiscale
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VersementForm({
  formData,
  setFormData,
  contract,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
  contract: ContractInfo | null
}) {
  const [allocations, setAllocations] = useState<FundAllocation[]>(
    formData.allocationMode === 'IDENTIQUE' 
      ? (contract?.allocations || [])
      : AVAILABLE_FUNDS.map(f => ({ ...f, percentage: 0 }))
  )

  const totalAllocation = allocations.reduce((sum, a) => sum + a.percentage, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Montant du versement</Label>
          <div className="relative mt-2">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="amount"
              type="number"
              min="0"
              step="100"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ amount: parseFloat(e.target.value) || 0 })}
              className="pl-9"
              placeholder="0"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="effectiveDate">Date d'effet</Label>
          <div className="relative mt-2">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="effectiveDate"
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => setFormData({ effectiveDate: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div>
        <Label>Mode d'allocation</Label>
        <Select
          value={formData.allocationMode}
          onValueChange={(value) => {
            const mode = value as 'IDENTIQUE' | 'NOUVELLE'
            setFormData({ allocationMode: mode })
            if (mode === 'IDENTIQUE' && contract) {
              setAllocations(contract.allocations)
              setFormData({ versementAllocations: contract.allocations })
            } else {
              setAllocations(AVAILABLE_FUNDS.map(f => ({ ...f, percentage: 0 })))
            }
          }}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IDENTIQUE">Identique à l'allocation actuelle</SelectItem>
            <SelectItem value="NOUVELLE">Nouvelle allocation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.allocationMode === 'NOUVELLE' && (
        <div>
          <Label>Répartition du versement</Label>
          <p className="text-sm text-gray-500 mt-1 mb-3">
            Indiquez la répartition souhaitée pour ce versement
          </p>
          <div className="space-y-2">
            {allocations.map((alloc, idx) => (
              <div key={alloc.fundId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="flex-1 text-sm text-gray-700">{alloc.fundName}</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  className="w-20"
                  placeholder="0"
                  value={alloc.percentage || ''}
                  onChange={(e) => {
                    const newAllocations = [...allocations]
                    newAllocations[idx] = { ...alloc, percentage: parseInt(e.target.value) || 0 }
                    setAllocations(newAllocations)
                    setFormData({ versementAllocations: newAllocations })
                  }}
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            ))}
          </div>
          <p className={cn(
            'text-xs mt-2',
            totalAllocation === 100 ? 'text-emerald-600' : 'text-amber-600'
          )}>
            Total: {totalAllocation}% {totalAllocation !== 100 && '(doit être égal à 100%)'}
          </p>
        </div>
      )}
    </div>
  )
}

function ModificationBeneficiaireForm({
  formData,
  setFormData,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Clause bénéficiaire actuelle</Label>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            {formData.previousBeneficiaryClause || 
              "Mon conjoint, à défaut mes enfants nés ou à naître, vivants ou représentés, par parts égales entre eux, à défaut mes héritiers."}
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="newClause">Nouvelle clause bénéficiaire</Label>
        <Textarea
          id="newClause"
          value={formData.newBeneficiaryClause}
          onChange={(e) => setFormData({ newBeneficiaryClause: e.target.value })}
          className="mt-2"
          rows={4}
          placeholder="Saisissez la nouvelle clause bénéficiaire..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Attention: la rédaction de la clause bénéficiaire est un acte important. 
          Vérifiez la conformité avec les souhaits du client.
        </p>
      </div>

      <div>
        <Label htmlFor="effectiveDate">Date d'effet</Label>
        <div className="relative mt-2">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="effectiveDate"
            type="date"
            value={formData.effectiveDate}
            onChange={(e) => setFormData({ effectiveDate: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>
    </div>
  )
}

function AvanceForm({
  formData,
  setFormData,
  contract,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
  contract: ContractInfo | null
}) {
  const maxAvance = contract ? contract.currentValue * 0.6 : 0 // Max 60% of contract value

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          L'avance est un prêt consenti par l'assureur, garanti par le contrat. 
          Elle doit être remboursée avec intérêts. Le montant maximum est généralement 
          de 60% de la valeur de rachat.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Montant de l'avance</Label>
          <div className="relative mt-2">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="amount"
              type="number"
              min="0"
              max={maxAvance}
              value={formData.amount || ''}
              onChange={(e) => setFormData({ amount: parseFloat(e.target.value) || 0 })}
              className="pl-9"
              placeholder="0"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Maximum: {maxAvance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
        <div>
          <Label htmlFor="duration">Durée (mois)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            max="36"
            value={formData.avanceDuration || ''}
            onChange={(e) => setFormData({ avanceDuration: parseInt(e.target.value) || 0 })}
            className="mt-2"
            placeholder="12"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="interestRate">Taux d'intérêt annuel (%)</Label>
        <Input
          id="interestRate"
          type="number"
          min="0"
          max="10"
          step="0.1"
          value={formData.avanceInterestRate || ''}
          onChange={(e) => setFormData({ avanceInterestRate: parseFloat(e.target.value) || 0 })}
          className="mt-2"
          placeholder="3.5"
        />
        <p className="text-xs text-gray-500 mt-1">
          Le taux est généralement communiqué par l'assureur
        </p>
      </div>
    </div>
  )
}

function ChangementOptionForm({
  formData,
  setFormData,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
}) {
  const options = [
    { value: 'GESTION_LIBRE', label: 'Gestion libre' },
    { value: 'GESTION_PILOTEE', label: 'Gestion pilotée' },
    { value: 'GESTION_PROFILEE', label: 'Gestion profilée' },
    { value: 'GESTION_HORIZON', label: 'Gestion horizon' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Label>Option de gestion actuelle</Label>
        <div className="mt-2 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            {formData.previousOption || 'Gestion libre'}
          </p>
        </div>
      </div>

      <div>
        <Label>Nouvelle option de gestion</Label>
        <Select
          value={formData.newOption}
          onValueChange={(value) => setFormData({ newOption: value })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Sélectionner..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="effectiveDate">Date d'effet</Label>
        <div className="relative mt-2">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="effectiveDate"
            type="date"
            value={formData.effectiveDate}
            onChange={(e) => setFormData({ effectiveDate: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>
    </div>
  )
}

function TransfertForm({
  formData,
  setFormData,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Attention</p>
            <p className="text-sm text-amber-700 mt-1">
              Le transfert d'un contrat peut avoir des implications fiscales et des frais. 
              Assurez-vous que le client a bien compris les conséquences de cette opération.
            </p>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="targetProvider">Nouvel assureur / Société de gestion</Label>
        <Input
          id="targetProvider"
          value={formData.targetProviderId}
          onChange={(e) => setFormData({ targetProviderId: e.target.value })}
          className="mt-2"
          placeholder="Nom du nouvel assureur"
        />
      </div>

      <div>
        <Label htmlFor="targetProduct">Nouveau produit</Label>
        <Input
          id="targetProduct"
          value={formData.targetProductId}
          onChange={(e) => setFormData({ targetProductId: e.target.value })}
          className="mt-2"
          placeholder="Nom du nouveau produit"
        />
      </div>

      <div>
        <Label htmlFor="effectiveDate">Date de transfert souhaitée</Label>
        <div className="relative mt-2">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="effectiveDate"
            type="date"
            value={formData.effectiveDate}
            onChange={(e) => setFormData({ effectiveDate: e.target.value })}
            className="pl-9"
          />
        </div>
      </div>
    </div>
  )
}


// ============================================================================
// Details Step Component
// ============================================================================

function DetailsStep({
  formData,
  setFormData,
  contract,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
  contract: ContractInfo | null
}) {
  switch (formData.operationType) {
    case 'ARBITRAGE':
      return <ArbitrageForm formData={formData} setFormData={setFormData} contract={contract} />
    case 'RACHAT_PARTIEL':
    case 'RACHAT_TOTAL':
      return <RachatForm formData={formData} setFormData={setFormData} contract={contract} />
    case 'VERSEMENT_COMPLEMENTAIRE':
      return <VersementForm formData={formData} setFormData={setFormData} contract={contract} />
    case 'MODIFICATION_BENEFICIAIRE':
      return <ModificationBeneficiaireForm formData={formData} setFormData={setFormData} />
    case 'AVANCE':
      return <AvanceForm formData={formData} setFormData={setFormData} contract={contract} />
    case 'CHANGEMENT_OPTION_GESTION':
      return <ChangementOptionForm formData={formData} setFormData={setFormData} />
    case 'TRANSFERT':
      return <TransfertForm formData={formData} setFormData={setFormData} />
    default:
      return (
        <div className="text-center py-8 text-gray-500">
          Sélectionnez un type d'opération pour continuer
        </div>
      )
  }
}

// ============================================================================
// Confirmation Step Component
// ============================================================================

function ConfirmationStep({
  formData,
  setFormData,
  contract,
  clientName,
}: {
  formData: FormData
  setFormData: (data: Partial<FormData>) => void
  contract: ContractInfo | null
  clientName?: string
}) {
  // Le nom du client est maintenant passé en props depuis le composant parent

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Récapitulatif de l'opération</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Client</dt>
              <dd className="font-medium text-gray-900">{clientName || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Contrat</dt>
              <dd className="font-medium text-gray-900">{contract?.reference || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Produit</dt>
              <dd className="font-medium text-gray-900">{contract?.productName || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Type d'opération</dt>
              <dd className="font-medium text-gray-900">
                {formData.operationType ? OPERATION_GESTION_TYPE_LABELS[formData.operationType] : '—'}
              </dd>
            </div>
            {formData.amount > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Montant</dt>
                <dd className="font-medium text-gray-900">
                  {formData.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </dd>
              </div>
            )}
            {formData.effectiveDate && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Date d'effet</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(formData.effectiveDate).toLocaleDateString('fr-FR')}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Required Documents */}
      <div>
        <Label>Documents à générer</Label>
        <p className="text-sm text-gray-500 mt-1 mb-3">
          Les documents suivants seront générés pour cette opération
        </p>
        <div className="space-y-2">
          {[
            { id: 'demande', label: 'Demande d\'opération', required: true },
            { id: 'adequation', label: 'Déclaration d\'adéquation', required: true },
            { id: 'bulletin', label: 'Bulletin d\'opération', required: true },
          ].map((doc) => (
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

      {/* Confirmation Checkbox */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
        <input
          type="checkbox"
          id="confirm"
          checked={formData.confirmed}
          onChange={(e) => setFormData({ confirmed: e.target.checked })}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-[#7373FF] focus:ring-[#7373FF]"
        />
        <label htmlFor="confirm" className="text-sm text-gray-700">
          Je confirme avoir vérifié les informations ci-dessus et souhaite créer cette opération 
          de gestion. Les documents réglementaires seront générés automatiquement.
        </label>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

function NouvelleOperationGestionPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientIdFromUrl = searchParams.get('clientId') || ''
  const contractIdFromUrl = searchParams.get('contractId') || ''
  const clientLocked = !!clientIdFromUrl

  const [currentStep, setCurrentStep] = useState(clientLocked && contractIdFromUrl ? 1 : 0)
  
  const [formData, setFormData] = useState<FormData>({
    clientId: clientIdFromUrl,
    clientSearch: '',
    contractId: contractIdFromUrl,
    operationType: null,
    amount: 0,
    effectiveDate: '',
    sourceAllocations: [],
    targetAllocations: [],
    arbitrageType: 'PONCTUEL',
    destinationRib: '',
    rachatType: 'PARTIEL',
    versementAllocations: [],
    allocationMode: 'IDENTIQUE',
    newBeneficiaryClause: '',
    previousBeneficiaryClause: '',
    avanceDuration: 12,
    avanceInterestRate: 3.5,
    targetProviderId: '',
    targetProductId: '',
    newOption: '',
    previousOption: 'GESTION_LIBRE',
    confirmed: false,
  })

  const createOperation = useCreateOperationGestion()

  const { data: clientDetail } = useClient(formData.clientId || '')
  const selectedClientName = useMemo(() => {
    if (!clientDetail) return undefined
    const firstName = (clientDetail as any)?.firstName || ''
    const lastName = (clientDetail as any)?.lastName || ''
    return `${firstName} ${lastName}`.trim() || (clientDetail as any)?.email || 'Client'
  }, [clientDetail])

  // Charger les contrats du client sélectionné pour le composant principal
  const { data: mainContractsData } = useClientContrats(formData.clientId || '')
  
  // Get selected contract from API data
  const selectedContract: ContractInfo | null = useMemo(() => {
    if (!formData.contractId) return null
    const contracts = Array.isArray(mainContractsData) ? mainContractsData : []
    const found = contracts.find((c) => c.id === formData.contractId)
    if (!found) return null
    return {
      id: found.id,
      reference: found.contractNumber || `Contrat ${String(found.id).slice(0, 8)}`,
      productName: found.name || 'Produit',
      providerName: found.provider || 'Fournisseur',
      currentValue: Number((found as any).value ?? 0),
      openDate: found.startDate ? new Date(found.startDate as any) : new Date(),
      allocations: [],
    }
  }, [formData.contractId, mainContractsData])

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  // Validation for each step
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0: return !!formData.clientId && !!formData.contractId
      case 1: return !!formData.operationType
      case 2: {
        // Validate based on operation type
        switch (formData.operationType) {
          case 'ARBITRAGE':
            return formData.targetAllocations.reduce((sum, a) => sum + a.percentage, 0) === 100
          case 'RACHAT_PARTIEL':
            return formData.amount > 0 && !!formData.destinationRib
          case 'RACHAT_TOTAL':
            return !!formData.destinationRib
          case 'VERSEMENT_COMPLEMENTAIRE':
            return formData.amount > 0
          case 'MODIFICATION_BENEFICIAIRE':
            return !!formData.newBeneficiaryClause
          case 'AVANCE':
            return formData.amount > 0 && formData.avanceDuration > 0
          case 'CHANGEMENT_OPTION_GESTION':
            return !!formData.newOption
          case 'TRANSFERT':
            return !!formData.targetProviderId
          default:
            return false
        }
      }
      case 3: return formData.confirmed
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

  const buildOperationDetails = (): OperationGestionDetails | undefined => {
    switch (formData.operationType) {
      case 'ARBITRAGE':
        return {
          type: 'ARBITRAGE',
          sourceAllocations: formData.sourceAllocations,
          targetAllocations: formData.targetAllocations,
          arbitrageType: formData.arbitrageType,
        }
      case 'RACHAT_PARTIEL':
      case 'RACHAT_TOTAL':
        return {
          type: formData.operationType === 'RACHAT_TOTAL' ? 'RACHAT_TOTAL' : 'RACHAT_PARTIEL',
          destinationRib: formData.destinationRib,
          taxSimulation: selectedContract 
            ? calculateTaxSimulation(selectedContract.openDate, selectedContract.currentValue, formData.amount)
            : { contractAge: 0, totalGains: 0, taxableAmount: 0, estimatedTax: 0, taxRate: 0, socialCharges: 0 },
        }
      case 'VERSEMENT_COMPLEMENTAIRE':
        return {
          type: 'VERSEMENT_COMPLEMENTAIRE',
          allocation: formData.versementAllocations,
          allocationMode: formData.allocationMode,
        }
      case 'MODIFICATION_BENEFICIAIRE':
        return {
          type: 'MODIFICATION_BENEFICIAIRE',
          newClause: formData.newBeneficiaryClause,
          previousClause: formData.previousBeneficiaryClause,
        }
      case 'AVANCE':
        return {
          type: 'AVANCE',
          duration: formData.avanceDuration,
          interestRate: formData.avanceInterestRate,
        }
      case 'CHANGEMENT_OPTION_GESTION':
        return {
          type: 'CHANGEMENT_OPTION_GESTION',
          newOption: formData.newOption,
          previousOption: formData.previousOption,
        }
      case 'TRANSFERT':
        return {
          type: 'TRANSFERT',
          targetProviderId: formData.targetProviderId,
          targetProductId: formData.targetProductId,
        }
      default:
        return undefined
    }
  }

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.contractId || !formData.operationType) return

    try {
      await createOperation.mutateAsync({
        clientId: formData.clientId,
        contractId: formData.contractId,
        affaireOrigineId: formData.contractId, // Using contract as affaire origine for now
        type: formData.operationType,
        amount: formData.amount || undefined,
        effectiveDate: formData.effectiveDate || undefined,
        operationDetails: buildOperationDetails(),
      })
      router.push('/dashboard/operations/gestion')
    } catch {
      // Error handled by mutation
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ContractStep
            formData={formData}
            setFormData={updateFormData}
            clientLocked={clientLocked}
            clientLockedName={selectedClientName}
          />
        )
      case 1:
        return <OperationTypeStep formData={formData} setFormData={updateFormData} />
      case 2:
        return <DetailsStep formData={formData} setFormData={updateFormData} contract={selectedContract} />
      case 3:
        return <ConfirmationStep formData={formData} setFormData={updateFormData} contract={selectedContract} />
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
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle Opération de Gestion</h1>
          <p className="text-sm text-gray-500">
            Créez une opération sur un contrat existant
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
            disabled={!canProceed || createOperation.isPending}
            className="gap-2"
          >
            {createOperation.isPending ? (
              'Création...'
            ) : isLastStep ? (
              <>
                Créer l'opération
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
