'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { formatCurrency, cn } from '@/app/_common/lib/utils'
import { FileText, Plus, Wallet, Shield, PiggyBank, Home, CreditCard, CheckCircle2 } from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'

interface TabContractsProps { clientId: string; client: ClientDetail }
interface Contract {
  id: string
  type: string
  category: 'EPARGNE' | 'CREDIT' | 'PREVOYANCE' | 'AUTRE'
  name: string
  provider: string
  contractNumber?: string
  startDate: Date
  endDate?: Date
  value?: number
  monthlyPayment?: number
  interestRate?: number
  isManaged: boolean
  status: 'ACTIF' | 'EN_ATTENTE' | 'CLOSED'
}

const CONTRACT_TYPES: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; category: string }> = {
  ASSURANCE_VIE: { label: 'Assurance-vie', icon: Wallet, category: 'EPARGNE' },
  PER: { label: 'PER', icon: PiggyBank, category: 'EPARGNE' },
  PEA: { label: 'PEA', icon: Wallet, category: 'EPARGNE' },
  COMPTE_TITRES: { label: 'Compte-titres', icon: Wallet, category: 'EPARGNE' },
  LIVRET: { label: 'Livret', icon: PiggyBank, category: 'EPARGNE' },
  CREDIT_IMMOBILIER: { label: 'Crédit immobilier', icon: Home, category: 'CREDIT' },
  CREDIT_CONSO: { label: 'Crédit conso', icon: CreditCard, category: 'CREDIT' },
  PREVOYANCE: { label: 'Prévoyance', icon: Shield, category: 'PREVOYANCE' },
  SANTE: { label: 'Santé', icon: Shield, category: 'PREVOYANCE' },
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  EPARGNE: { label: 'Épargne', color: 'bg-green-100 text-green-800' },
  CREDIT: { label: 'Crédit', color: 'bg-orange-100 text-orange-800' },
  PREVOYANCE: { label: 'Prévoyance', color: 'bg-blue-100 text-blue-800' },
  AUTRE: { label: 'Autre', color: 'bg-gray-100 text-gray-800' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Actif', color: 'bg-green-100 text-green-800' },
  PENDING: { label: 'En attente', color: 'bg-orange-100 text-orange-800' },
  CLOSED: { label: 'Clôturé', color: 'bg-gray-100 text-gray-800' },
}

export function TabContracts({ clientId, client: _client }: TabContractsProps) {
  const [loading, setLoading] = useState(true)
  const [contracts, setContracts] = useState<Contract[]>([])

  useEffect(() => { loadContracts() }, [clientId])

  async function loadContracts() {
    try {
      setLoading(true)
      const res = await fetch(`/api/advisor/clients/${clientId}/contracts`)
      if (res.ok) {
        const data = await res.json()
        setContracts(data.data || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const grouped = useMemo(() => ({
    EPARGNE: contracts.filter(c => c.category === 'EPARGNE'),
    CREDIT: contracts.filter(c => c.category === 'CREDIT'),
    PREVOYANCE: contracts.filter(c => c.category === 'PREVOYANCE'),
    AUTRE: contracts.filter(c => c.category === 'AUTRE'),
  }), [contracts])

  const stats = useMemo(() => ({
    total: contracts.length,
    managed: contracts.filter(c => c.isManaged).length,
    totalEpargne: grouped.EPARGNE.reduce((s, c) => s + (c.value || 0), 0),
    totalCredit: grouped.CREDIT.reduce((s, c) => s + (c.value || 0), 0),
  }), [contracts, grouped])

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" />
            Contrats
          </h2>
          <p className="text-gray-600 mt-1">Épargne, crédits, prévoyance et assurances</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total contrats</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Contrats gérés</div>
            <div className="text-2xl font-bold text-blue-600">{stats.managed}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Épargne totale</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalEpargne)}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 bg-white">
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Crédits en cours</div>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalCredit)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs par catégorie */}
      <Tabs defaultValue="EPARGNE" className="w-full">
        <TabsList className="bg-gray-100 border border-gray-200">
          <TabsTrigger value="EPARGNE" className="data-[state=active]:bg-white">Épargne ({grouped.EPARGNE.length})</TabsTrigger>
          <TabsTrigger value="CREDIT" className="data-[state=active]:bg-white">Crédits ({grouped.CREDIT.length})</TabsTrigger>
          <TabsTrigger value="PREVOYANCE" className="data-[state=active]:bg-white">Prévoyance ({grouped.PREVOYANCE.length})</TabsTrigger>
        </TabsList>

        {Object.entries(grouped).map(([category, list]) => (
          <TabsContent key={category} value={category} className="mt-6 space-y-3">
            {list.length > 0 ? list.map(contract => {
              const typeConfig = CONTRACT_TYPES[contract.type] || { label: contract.type, icon: FileText }
              const Icon = typeConfig.icon
              const statusCfg = STATUS_CONFIG[contract.status]
              return (
                <Card key={contract.id} className="border border-gray-200 bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', CATEGORY_CONFIG[category].color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{contract.name}</span>
                            {contract.isManaged && <Badge className="bg-blue-100 text-blue-800 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Géré</Badge>}
                            <Badge className={cn('text-xs', statusCfg?.color)}>{statusCfg?.label}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                            <span>{typeConfig.label}</span>
                            <span>•</span>
                            <span>{contract.provider}</span>
                            {contract.contractNumber && <><span>•</span><span>N°{contract.contractNumber}</span></>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {contract.value && <div className="text-lg font-bold text-gray-900">{formatCurrency(contract.value)}</div>}
                        {contract.monthlyPayment && <div className="text-sm text-gray-600">{formatCurrency(contract.monthlyPayment)}/mois</div>}
                        {contract.interestRate && <div className="text-sm text-green-600">{contract.interestRate}%</div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }) : (
              <Card className="border border-gray-200 bg-white">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun contrat {CATEGORY_CONFIG[category]?.label.toLowerCase()}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
