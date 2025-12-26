'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_common/components/ui/Dialog'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { formatCurrency, formatPercentage, formatDate } from '@/app/_common/lib/utils'
import { formatLabel } from '@/app/_common/lib/labels'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  FileText,
  Plus,
  RefreshCw,
  AlertCircle,
  Wallet,
  Shield,
  PiggyBank,
  Building2,
  Heart,
  ChevronRight,
  X,
  Users,
  TrendingUp,
  Calendar,
  ArrowRightLeft
} from 'lucide-react'
import type { 
  ContratsData, 
  Contract, 
  ContractType,
  ContractStatus,
  Beneficiary,
  ClientDetail 
} from '@/app/_common/types/client360'

interface TabContratsProps {
  clientId: string
  client: ClientDetail
  onTabChange?: (tabId: string) => void
}

// Contract type configuration - Aligné sur enum Prisma ContratType
const CONTRACT_TYPE_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  ASSURANCE_VIE: { label: 'Assurance-vie', icon: Shield, color: '#3B82F6' },
  MUTUELLE: { label: 'Mutuelle santé', icon: Heart, color: '#EC4899' },
  ASSURANCE_HABITATION: { label: 'Assurance habitation', icon: Building2, color: '#6366F1' },
  ASSURANCE_AUTO: { label: 'Assurance auto', icon: Building2, color: '#8B5CF6' },
  ASSURANCE_PRO: { label: 'Assurance professionnelle', icon: Building2, color: '#F59E0B' },
  ASSURANCE_DECES: { label: 'Assurance décès', icon: Heart, color: '#EF4444' },
  PREVOYANCE: { label: 'Prévoyance', icon: Heart, color: '#8B5CF6' },
  EPARGNE_RETRAITE: { label: 'Épargne retraite', icon: PiggyBank, color: '#10B981' },
  AUTRE: { label: 'Autre', icon: FileText, color: '#6B7280' }
}

// Contract status labels - Aligné sur enum Prisma ContratStatus
const CONTRACT_STATUS_LABELS: Record<string, string> = {
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  RESILIE: 'Résilié',
  EXPIRE: 'Expiré'
}

// Contract status variants
const CONTRACT_STATUS_VARIANTS: Record<string, 'success' | 'destructive' | 'secondary' | 'warning'> = {
  ACTIF: 'success',
  SUSPENDU: 'warning',
  RESILIE: 'destructive',
  EXPIRE: 'secondary'
}

export function TabContrats({ clientId, client: _client, onTabChange }: TabContratsProps) {
  const [contratsData, setContratsData] = useState<ContratsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('tous')
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Fetch contracts data
  const fetchContratsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/advisor/clients/${clientId}/contracts/data`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts data')
      }
      
      const result = await response.json()
      setContratsData(result.data)
    } catch (err) {
      console.error('Error fetching contracts data:', err)
      setError('Impossible de charger les données des contrats')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchContratsData()
  }, [fetchContratsData])

  // Handle contract click
  const handleContractClick = (contract: Contract) => {
    setSelectedContract(contract)
    setShowDetailsModal(true)
  }

  // Loading state
  if (loading) {
    return <TabContratsSkeleton />
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-destructive font-medium">{error}</p>
        <button 
          onClick={fetchContratsData}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (!contratsData) {
    return null
  }

  const { contracts, summary } = contratsData

  // Filter contracts by type for tabs
  const getContractsByType = (type: ContractType | 'tous'): Contract[] => {
    if (type === 'tous') return contracts
    return contracts.filter(c => c.type === type)
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contrats</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion des contrats d'assurance, épargne et prévoyance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchContratsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un contrat
          </Button>
        </div>
      </div>

      {/* Summary Dashboard */}
      <ManagedDashboard summary={summary} contracts={contracts} />

      {/* Contracts by Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="tous">
            Tous
            <Badge variant="secondary" className="ml-2">{contracts.length}</Badge>
          </TabsTrigger>
          {Object.entries(CONTRACT_TYPE_CONFIG).map(([type, config]) => {
            const count = getContractsByType(type as ContractType).length
            if (count === 0) return null
            return (
              <TabsTrigger key={type} value={type}>
                {config.label}
                <Badge variant="secondary" className="ml-2">{count}</Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* All Contracts Tab */}
        <TabsContent value="tous" className="space-y-4">
          <ContractsList 
            contracts={contracts} 
            onContractClick={handleContractClick}
            onRefresh={fetchContratsData}
          />
        </TabsContent>

        {/* Type-specific Tabs */}
        {Object.keys(CONTRACT_TYPE_CONFIG).map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <ContractsList 
              contracts={getContractsByType(type as ContractType)} 
              onContractClick={handleContractClick}
              onRefresh={fetchContratsData}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Contract Modal */}
      <AddContractModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        clientId={clientId}
        onSuccess={() => {
          setShowAddModal(false)
          fetchContratsData()
        }}
      />

      {/* Contract Details Modal */}
      {selectedContract && (
        <ContractDetailsModal
          open={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedContract(null)
          }}
          contract={selectedContract}
          clientId={clientId}
          onUpdate={fetchContratsData}
        />
      )}
    </div>
  )
}


// ============================================================================
// Sub-components
// ============================================================================

interface ManagedDashboardProps {
  summary: ContratsData['summary']
  contracts: Contract[]
}

function ManagedDashboard({ summary, contracts }: ManagedDashboardProps) {
  const managedContracts = contracts.filter(c => c.isManaged)
  const nonManagedContracts = contracts.filter(c => !c.isManaged)
  
  const managedValue = managedContracts.reduce((sum, c) => sum + c.value, 0)
  const nonManagedValue = nonManagedContracts.reduce((sum, c) => sum + c.value, 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Value */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-700">Valeur totale</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">{formatCurrency(summary.totalValue)}</div>
          <div className="text-xs text-gray-600 mt-1">{contracts.length} contrat{contracts.length > 1 ? 's' : ''}</div>
        </CardContent>
      </Card>

      {/* Managed Contracts */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-700">Géré par le cabinet</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{formatCurrency(managedValue)}</div>
          <div className="text-xs text-gray-600 mt-1">{summary.managedCount} contrat{summary.managedCount > 1 ? 's' : ''}</div>
        </CardContent>
      </Card>

      {/* Non-Managed Contracts */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-700">Non géré</span>
          </div>
          <div className="text-2xl font-bold text-gray-700">{formatCurrency(nonManagedValue)}</div>
          <div className="text-xs text-gray-600 mt-1">{summary.nonManagedCount} contrat{summary.nonManagedCount > 1 ? 's' : ''}</div>
        </CardContent>
      </Card>

      {/* Active Contracts */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-700">Contrats actifs</span>
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {contracts.filter(c => c.status === 'ACTIF').length}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            sur {contracts.length} total
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ContractsListProps {
  contracts: Contract[]
  onContractClick: (contract: Contract) => void
  onRefresh: () => void
}

function ContractsList({ contracts, onContractClick, onRefresh }: ContractsListProps) {
  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Aucun contrat enregistré</p>
        </CardContent>
      </Card>
    )
  }

  // Group contracts by type
  const groupedContracts: Record<ContractType, Contract[]> = contracts.reduce((acc, contract) => {
    const type = contract.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(contract)
    return acc
  }, {} as Record<ContractType, Contract[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedContracts).map(([type, typeContracts]) => {
        const config = CONTRACT_TYPE_CONFIG[type as ContractType]
        const Icon = config?.icon || FileText
        const totalValue = typeContracts.reduce((sum, c) => sum + c.value, 0)

        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" style={{ color: config?.color }} />
                  <span>{config?.label || type}</span>
                  <Badge variant="secondary">{typeContracts.length}</Badge>
                </div>
                <span className="text-primary font-bold">{formatCurrency(totalValue)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {typeContracts.map((contract) => (
                  <ContractRow 
                    key={contract.id} 
                    contract={contract} 
                    onClick={() => onContractClick(contract)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

interface ContractRowProps {
  contract: Contract
  onClick: () => void
}

function ContractRow({ contract, onClick }: ContractRowProps) {
  return (
    <div 
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{contract.name}</h4>
          <Badge variant={CONTRACT_STATUS_VARIANTS[contract.status]}>
            {CONTRACT_STATUS_LABELS[contract.status]}
          </Badge>
          {contract.isManaged && (
            <Badge variant="outline" className="text-xs">
              <Wallet className="h-3 w-3 mr-1" />
              Géré
            </Badge>
          )}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
          <span>{contract.provider}</span>
          {contract.openDate && <span>Ouvert le {formatDate(contract.openDate)}</span>}
          {contract.performance > 0 && (
            <span className="text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {formatPercentage(contract.performance)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-lg font-bold text-primary">{formatCurrency(contract.value)}</span>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  )
}


// ============================================================================
// Contract Details Modal
// ============================================================================

interface ContractDetailsModalProps {
  open: boolean
  onClose: () => void
  contract: Contract
  clientId: string
  onUpdate: () => void
}

function ContractDetailsModal({ open, onClose, contract, clientId, onUpdate }: ContractDetailsModalProps) {
  const [activeSection, setActiveSection] = useState('details')
  const [isClosing, setIsClosing] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)

  const handleClose = async () => {
    if (!confirm('Êtes-vous sûr de vouloir clôturer ce contrat ?')) return
    
    setIsClosing(true)
    try {
      const response = await fetch(`/api/advisor/clients/${clientId}/contracts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: contract.id, status: 'RESILIE' })
      })
      
      if (response.ok) {
        onUpdate()
        onClose()
      }
    } catch (error) {
      console.error('Error closing contract:', error)
    } finally {
      setIsClosing(false)
    }
  }

  const handleTransfer = async () => {
    if (!confirm('Êtes-vous sûr de vouloir transférer ce contrat ?')) return
    
    setIsTransferring(true)
    try {
      const response = await fetch(`/api/advisor/clients/${clientId}/contracts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: contract.id, status: 'TRANSFERRED' })
      })
      
      if (response.ok) {
        onUpdate()
        onClose()
      }
    } catch (error) {
      console.error('Error transferring contract:', error)
    } finally {
      setIsTransferring(false)
    }
  }

  const config = CONTRACT_TYPE_CONFIG[contract.type]
  const Icon = config?.icon || FileText

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" style={{ color: config?.color }} />
            {contract.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contract Header Info */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">{contract.provider}</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(contract.value)}</p>
            </div>
            <div className="text-right">
              <Badge variant={CONTRACT_STATUS_VARIANTS[contract.status]}>
                {CONTRACT_STATUS_LABELS[contract.status]}
              </Badge>
              {contract.isManaged && (
                <Badge variant="outline" className="ml-2">
                  <Wallet className="h-3 w-3 mr-1" />
                  Géré
                </Badge>
              )}
            </div>
          </div>

          {/* Section Tabs */}
          <Tabs value={activeSection} onValueChange={setActiveSection}>
            <TabsList>
              <TabsTrigger value="details">Caractéristiques</TabsTrigger>
              <TabsTrigger value="beneficiaries">Bénéficiaires</TabsTrigger>
              <TabsTrigger value="fees">Frais</TabsTrigger>
              <TabsTrigger value="versements">Versements</TabsTrigger>
            </TabsList>

            {/* Details Section */}
            <TabsContent value="details" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem label="Type" value={config?.label || formatLabel(contract.type)} />
                <DetailItem label="Fournisseur" value={contract.provider} />
                <DetailItem label="Date d'ouverture" value={contract.openDate ? formatDate(contract.openDate) : '-'} />
                <DetailItem label="Performance" value={contract.performance > 0 ? formatPercentage(contract.performance) : '-'} />
                <DetailItem label="Statut" value={CONTRACT_STATUS_LABELS[contract.status]} />
                <DetailItem label="Gestion" value={contract.isManaged ? 'Géré par le cabinet' : 'Non géré'} />
              </div>
            </TabsContent>

            {/* Beneficiaries Section */}
            <TabsContent value="beneficiaries" className="space-y-4">
              {contract.beneficiaries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun bénéficiaire défini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contract.beneficiaries.map((beneficiary) => (
                    <div key={`beneficiary-${beneficiary.name}-${beneficiary.percentage}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{beneficiary.name}</p>
                        {beneficiary.clause && (
                          <p className="text-sm text-muted-foreground">{beneficiary.clause}</p>
                        )}
                      </div>
                      <Badge variant="secondary">{beneficiary.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Fees Section */}
            <TabsContent value="fees" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Frais d'entrée</p>
                    <p className="text-xl font-bold">{formatPercentage(contract.fees.entryFee)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Frais de gestion</p>
                    <p className="text-xl font-bold">{formatPercentage(contract.fees.managementFee)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Frais d'arbitrage</p>
                    <p className="text-xl font-bold">{formatPercentage(contract.fees.arbitrageFee)}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Versements Section */}
            <TabsContent value="versements" className="space-y-4">
              {contract.versements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun versement enregistré</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contract.versements.map((versement) => (
                    <div key={`versement-${versement.date}-${versement.type}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{formatDate(versement.date)}</p>
                        <Badge variant="outline" className="text-xs">
                          {formatLabel(versement.type)}
                        </Badge>
                      </div>
                      <span className="font-bold text-success">{formatCurrency(versement.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex gap-2">
          {contract.status === 'ACTIF' && (
            <>
              <Button 
                variant="outline" 
                onClick={handleTransfer}
                disabled={isTransferring}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                {isTransferring ? 'Transfert...' : 'Transférer'}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleClose}
                disabled={isClosing}
              >
                <X className="h-4 w-4 mr-2" />
                {isClosing ? 'Clôture...' : 'Clôturer'}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}


// ============================================================================
// Add Contract Modal
// ============================================================================

interface AddContractModalProps {
  open: boolean
  onClose: () => void
  clientId: string
  onSuccess: () => void
}

function AddContractModal({ open, onClose, clientId, onSuccess }: AddContractModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'ASSURANCE_VIE',
    name: '',
    provider: '',
    value: '',
    startDate: '',
    isManaged: false,
    beneficiaries: [] as Beneficiary[],
    fees: { entryFee: 0, managementFee: 0, arbitrageFee: 0 }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/advisor/clients/${clientId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value) || 0,
        })
      })

      if (response.ok) {
        onSuccess()
        // Reset form
        setFormData({
          type: 'ASSURANCE_VIE',
          name: '',
          provider: '',
          value: '',
          startDate: '',
          isManaged: false,
          beneficiaries: [],
          fees: { entryFee: 0, managementFee: 0, arbitrageFee: 0 }
        })
      } else {
        const error = await response.json()
        toast({ title: 'Erreur', description: error.error || 'Erreur lors de la création du contrat', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error creating contract:', error)
      toast({ title: 'Erreur', description: 'Erreur lors de la création du contrat', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un contrat</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type de contrat</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LIFE_INSURANCE">Assurance-vie</SelectItem>
                <SelectItem value="RETIREMENT_SAVINGS">Plan Épargne Retraite (PER)</SelectItem>
                <SelectItem value="HEALTH_INSURANCE">Prévoyance Santé</SelectItem>
                <SelectItem value="DEATH_INSURANCE">Prévoyance Décès</SelectItem>
                <SelectItem value="DISABILITY_INSURANCE">Prévoyance Invalidité</SelectItem>
                <SelectItem value="OTHER">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nom du contrat</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Assurance-vie Generali"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">Fournisseur</Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="Ex: Generali, AXA, Allianz..."
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="value">Valeur (€)</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Date d'ouverture</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isManaged"
              checked={formData.isManaged}
              onChange={(e) => setFormData({ ...formData, isManaged: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isManaged" className="cursor-pointer">
              Géré par le cabinet
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le contrat'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Skeleton Loader
// ============================================================================

function TabContratsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-96" />
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  )
}
