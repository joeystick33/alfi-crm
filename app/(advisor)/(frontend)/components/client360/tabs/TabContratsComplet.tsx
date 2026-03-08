'use client'

/**
 * TabContratsComplet - Module Contrats & Placements
 * 
 * HARMONISATION (Option 1) :
 * - Produits financiers (AV, PER, PEA, compte-titres) → depuis table Actifs
 * - Assurances non-patrimoniales (santé, auto, prévoyance) → depuis table Contrats
 */

import { useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { formatCurrency, formatPercentage, formatDate } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { FileText, Shield, TrendingUp, Plus, RefreshCw, Edit, Wallet, PiggyBank, Heart, Users, BarChart3, Briefcase, Building2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import type { ClientDetail } from '@/app/_common/lib/api-types'

interface TabContratsCompletProps {
  clientId: string
  client: ClientDetail
}

// Type unifié pour affichage (actifs financiers + contrats assurance)
interface PlacementUnifie {
  id: string
  source: 'actif' | 'contrat' // Origine des données
  categorie: 'epargne' | 'retraite' | 'financier' | 'assurance' | 'bancaire'
  type: string
  name: string
  company: string
  number: string
  value: number
  openDate: string
  status: string
  beneficiaires: { name: string; part: number }[]
  performance?: number
  // Champs enrichis des actifs
  fundsAllocation?: unknown[]
  managementMode?: string
  surrenderValue?: number
}

// Types d'actifs financiers (source: table Actifs - enums FR)
const ACTIF_TYPES_FINANCIERS = [
  'ASSURANCE_VIE', 'CONTRAT_CAPITALISATION', // Assurance-vie
  'PER', 'PERP', 'MADELIN', 'ARTICLE_83', 'PREFON', 'COREM', // Retraite
  'COMPTE_TITRES', 'PEA', 'PEA_PME', // Placements
  'PEE', 'PEG', 'PERCO', 'PERECO', 'CET', 'PARTICIPATION', 'INTERESSEMENT', 'STOCK_OPTIONS', 'ACTIONS_GRATUITES', 'BSPCE', // Épargne salariale
  'COMPTE_BANCAIRE', 'LIVRETS', 'PEL', 'CEL', 'COMPTE_A_TERME', // Bancaire
]

// Types de contrats d'assurance (source: table Contrats - assurances non-patrimoniales)
const CONTRAT_TYPES_ASSURANCE = [
  'HEALTH_INSURANCE', 'HOME_INSURANCE', 'CAR_INSURANCE', 'PROFESSIONAL_INSURANCE',
  'DEATH_INSURANCE', 'DISABILITY_INSURANCE', 'OTHER'
]

// Configuration d'affichage par type (enums FR)
const TYPE_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string; categorie: PlacementUnifie['categorie'] }> = {
  // Assurance-vie
  'ASSURANCE_VIE': { label: 'Assurance-vie', icon: Shield, color: 'blue', categorie: 'epargne' },
  'CONTRAT_CAPITALISATION': { label: 'Contrat de capitalisation', icon: Shield, color: 'blue', categorie: 'epargne' },
  // Retraite
  'PER': { label: 'PER', icon: PiggyBank, color: 'purple', categorie: 'retraite' },
  'PERP': { label: 'PERP', icon: PiggyBank, color: 'purple', categorie: 'retraite' },
  'MADELIN': { label: 'Madelin', icon: PiggyBank, color: 'purple', categorie: 'retraite' },
  'ARTICLE_83': { label: 'Article 83', icon: PiggyBank, color: 'purple', categorie: 'retraite' },
  'PREFON': { label: 'Préfon', icon: PiggyBank, color: 'purple', categorie: 'retraite' },
  'COREM': { label: 'Corem', icon: PiggyBank, color: 'purple', categorie: 'retraite' },
  'PERCO': { label: 'PERCO', icon: Briefcase, color: 'purple', categorie: 'retraite' },
  'PERECO': { label: 'PERECO', icon: Briefcase, color: 'purple', categorie: 'retraite' },
  // Placements financiers
  'COMPTE_TITRES': { label: 'Compte-titres', icon: BarChart3, color: 'green', categorie: 'financier' },
  'PEA': { label: 'PEA', icon: TrendingUp, color: 'green', categorie: 'financier' },
  'PEA_PME': { label: 'PEA-PME', icon: TrendingUp, color: 'green', categorie: 'financier' },
  // Épargne salariale
  'PEE': { label: 'PEE', icon: Briefcase, color: 'indigo', categorie: 'financier' },
  'PEG': { label: 'PEG', icon: Briefcase, color: 'indigo', categorie: 'financier' },
  'CET': { label: 'CET', icon: Briefcase, color: 'indigo', categorie: 'financier' },
  'PARTICIPATION': { label: 'Participation', icon: Briefcase, color: 'indigo', categorie: 'financier' },
  'INTERESSEMENT': { label: 'Intéressement', icon: Briefcase, color: 'indigo', categorie: 'financier' },
  'STOCK_OPTIONS': { label: 'Stock-options', icon: Briefcase, color: 'indigo', categorie: 'financier' },
  'ACTIONS_GRATUITES': { label: 'Actions gratuites', icon: Briefcase, color: 'indigo', categorie: 'financier' },
  'BSPCE': { label: 'BSPCE', icon: Briefcase, color: 'indigo', categorie: 'financier' },
  // Bancaire
  'COMPTE_BANCAIRE': { label: 'Compte bancaire', icon: Wallet, color: 'gray', categorie: 'bancaire' },
  'LIVRETS': { label: 'Livret (A, LDDS, LEP)', icon: Wallet, color: 'gray', categorie: 'bancaire' },
  'PEL': { label: 'PEL', icon: Building2, color: 'gray', categorie: 'bancaire' },
  'CEL': { label: 'CEL', icon: Building2, color: 'gray', categorie: 'bancaire' },
  'COMPTE_A_TERME': { label: 'Compte à terme', icon: Wallet, color: 'gray', categorie: 'bancaire' },
  // Assurances (depuis table Contrats)
  'HEALTH_INSURANCE': { label: 'Santé', icon: Heart, color: 'pink', categorie: 'assurance' },
  'HOME_INSURANCE': { label: 'Habitation', icon: Building2, color: 'pink', categorie: 'assurance' },
  'CAR_INSURANCE': { label: 'Auto', icon: Shield, color: 'pink', categorie: 'assurance' },
  'PROFESSIONAL_INSURANCE': { label: 'RC Pro', icon: Briefcase, color: 'pink', categorie: 'assurance' },
  'DEATH_INSURANCE': { label: 'Décès', icon: Heart, color: 'pink', categorie: 'assurance' },
  'DISABILITY_INSURANCE': { label: 'Prévoyance', icon: Heart, color: 'pink', categorie: 'assurance' },
  'OTHER': { label: 'Autre', icon: FileText, color: 'gray', categorie: 'assurance' },
}

const CHART_COLORS = ['#7373FF', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#6366F1']

export function TabContratsComplet({ clientId, client }: TabContratsCompletProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPlacement, setSelectedPlacement] = useState<PlacementUnifie | null>(null)
  
  // ============================================================
  // HARMONISATION : Combiner Actifs financiers + Contrats assurance
  // ============================================================
  
  // 1. Extraire les actifs financiers (AV, PER, PEA, etc.) depuis client.actifs
  const actifsFinanciers: PlacementUnifie[] = useMemo(() => {
    const actifs = client.actifs || []
    return actifs
      .filter((a: { type?: string }) => {
        // Filtrer directement sur le type de l'actif
        const type = a.type || ''
        const included = ACTIF_TYPES_FINANCIERS.includes(type)
        return included
      })
      .map((a: Record<string, unknown>) => {
        const type = (a.type as string) || ''
        const config = TYPE_CONFIG[type]
        return {
          id: (a.id as string) || '',
          source: 'actif' as const,
          categorie: config?.categorie || 'financier',
          type,
          name: (a.name as string) || '',
          company: (a.insurerName as string) || (a.brokerName as string) || '',
          number: (a.contractNumber as string) || (a.accountNumber as string) || '',
          value: Number(a.value) || 0,
          openDate: (a.contractOpenDate as string) || (a.acquisitionDate as string) || '',
          status: 'ACTIF',
          beneficiaires: Array.isArray(a.beneficiaries) 
            ? (a.beneficiaries as unknown[]).map((b: unknown) => {
                const ben = b as { name?: string; percentage?: number }
                return { name: ben.name || '', part: ben.percentage || 0 }
              })
            : [],
          fundsAllocation: a.fundsAllocation as unknown[] | undefined,
          managementMode: a.managementMode as string | undefined,
          surrenderValue: Number(a.surrenderValue) || undefined,
        }
      })
  }, [client.actifs])

  // 2. Extraire les contrats d'assurance (santé, auto, prévoyance) depuis client.contrats
  const contratsAssurance: PlacementUnifie[] = useMemo(() => {
    const contrats = client.contrats || []
    return contrats
      .filter((c: { type?: string }) => CONTRAT_TYPES_ASSURANCE.includes(c.type || ''))
      .map((c: Record<string, unknown>) => {
        const type = (c.type as string) || 'OTHER'
        const config = TYPE_CONFIG[type]
        return {
          id: (c.id as string) || '',
          source: 'contrat' as const,
          categorie: config?.categorie || 'assurance',
          type,
          name: (c.name as string) || '',
          company: (c.provider as string) || '',
          number: (c.contractNumber as string) || '',
          value: Number(c.value) || Number(c.coverage) || 0,
          openDate: (c.startDate as string) || (c.createdAt as string) || '',
          status: (c.status as string) || 'ACTIF',
          beneficiaires: Array.isArray(c.beneficiaries)
            ? (c.beneficiaries as unknown[]).map((b: unknown) => {
                const ben = b as { name?: string; percentage?: number }
                return { name: ben.name || '', part: ben.percentage || 0 }
              })
            : [],
        }
      })
  }, [client.contrats])

  // 3. Combiner tous les placements
  const placements = useMemo(() => {
    return [...actifsFinanciers, ...contratsAssurance]
  }, [actifsFinanciers, contratsAssurance])

  // Stats par catégorie
  const statsByCategorie = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {}
    placements.forEach(p => {
      if (!stats[p.categorie]) stats[p.categorie] = { count: 0, total: 0 }
      stats[p.categorie].count++
      stats[p.categorie].total += p.value
    })
    return stats
  }, [placements])

  const totalValue = placements.reduce((s, p) => s + p.value, 0)
  const epargneTotal = statsByCategorie['epargne']?.total || 0
  const retraiteTotal = statsByCategorie['retraite']?.total || 0
  const financierTotal = statsByCategorie['financier']?.total || 0
  const assuranceCount = statsByCategorie['assurance']?.count || 0

  // Chart data
  const chartData = useMemo(() => {
    const categorieLabels: Record<string, string> = {
      'epargne': 'Assurance-vie',
      'retraite': 'Épargne retraite',
      'financier': 'Placements',
      'bancaire': 'Bancaire',
      'assurance': 'Assurances',
    }
    return Object.entries(statsByCategorie)
      .filter(([, data]) => data.total > 0 || data.count > 0)
      .map(([cat, data], i) => ({
        name: categorieLabels[cat] || cat,
        value: data.total,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
  }, [statsByCategorie])

  // Filtrer les placements par onglet
  const filteredPlacements = useMemo(() => {
    if (activeTab === 'all') return placements
    if (activeTab === 'epargne') return placements.filter(p => p.categorie === 'epargne')
    if (activeTab === 'retraite') return placements.filter(p => p.categorie === 'retraite')
    if (activeTab === 'financier') return placements.filter(p => p.categorie === 'financier')
    if (activeTab === 'assurance') return placements.filter(p => p.categorie === 'assurance')
    if (activeTab === 'bancaire') return placements.filter(p => p.categorie === 'bancaire')
    return placements
  }, [placements, activeTab])

  const handleAddPlacement = async (data: Partial<PlacementUnifie>) => {
    setLoading(true)
    try {
      // Pour les assurances, créer un contrat
      // Pour les produits financiers, créer un actif
      const isAssurance = data.categorie === 'assurance'
      const endpoint = isAssurance 
        ? `/api/advisor/clients/${clientId}/contrats`
        : `/api/advisor/clients/${clientId}/actifs`
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast({ title: isAssurance ? 'Contrat ajouté' : 'Placement ajouté' })
        setShowAddModal(false)
        await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      }
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (placement: PlacementUnifie) => {
    setSelectedPlacement(placement)
    setShowEditModal(true)
  }

  const handleEditPlacement = async (data: Partial<PlacementUnifie>) => {
    if (!selectedPlacement?.id) return
    setLoading(true)
    try {
      const endpoint = selectedPlacement.source === 'contrat'
        ? `/api/advisor/contrats/${selectedPlacement.id}`
        : `/api/advisor/actifs/${selectedPlacement.id}`
      
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      toast({ title: 'Placement mis à jour' })
      setShowEditModal(false)
      setSelectedPlacement(null)
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePlacement = async (placement: PlacementUnifie) => {
    if (!confirm(`Supprimer "${placement.name}" ?`)) return
    setLoading(true)
    try {
      const endpoint = placement.source === 'contrat'
        ? `/api/advisor/contrats/${placement.id}`
        : `/api/advisor/actifs/${placement.id}`
      
      await fetch(endpoint, { method: 'DELETE' })
      await queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
      toast({ title: 'Supprimé' })
      setSelectedPlacement(null)
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['clients', clientId] })
  }

  const getTypeConfig = (type: string) => TYPE_CONFIG[type] || { label: type, icon: FileText, color: 'gray', categorie: 'autre' as const }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#7373FF]/10 rounded-xl">
            <FileText className="h-6 w-6 text-[#7373FF]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Contrats</h2>
            <p className="text-sm text-gray-500">Assurance, épargne et prévoyance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={loading}
            className="border-gray-200 hover:border-gray-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#7373FF] hover:bg-[#5c5ce6]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau contrat
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Assurance-vie</p>
                <p className="text-2xl font-bold text-[#7373FF] mt-1">{formatCurrency(epargneTotal)}</p>
              </div>
              <div className="p-3 bg-[#7373FF]/10 rounded-xl">
                <Shield className="h-6 w-6 text-[#7373FF]" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{statsByCategorie['epargne']?.count || 0} contrat(s)</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Épargne retraite</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(retraiteTotal)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <PiggyBank className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">PER, Madelin, PERP</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Prévoyance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{assuranceCount}</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-xl">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Contrats de protection</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total encours</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalValue)}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{placements.length} placement(s)</p>
          </CardContent>
        </Card>
      </div>

      {/* Répartition graphique */}
      {chartData.length > 0 && (
        <Card className="border border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#7373FF]/10 rounded-lg">
                <BarChart3 className="h-4 w-4 text-[#7373FF]" />
              </div>
              <CardTitle className="text-base">Répartition par type</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div style={{ width: '100%', height: 256 }}>
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" strokeWidth={2} stroke="#fff">
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Legend wrapperStyle={{ paddingTop: '16px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100/80 p-1 rounded-xl">
          <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4 mr-2 text-[#7373FF]" />
            Tous ({placements.length})
          </TabsTrigger>
          <TabsTrigger value="assurance-vie" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Shield className="h-4 w-4 mr-2 text-[#7373FF]" />
            Assurance-vie
          </TabsTrigger>
          <TabsTrigger value="retraite" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <PiggyBank className="h-4 w-4 mr-2 text-[#7373FF]" />
            Retraite
          </TabsTrigger>
          <TabsTrigger value="prevoyance" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Heart className="h-4 w-4 mr-2 text-[#7373FF]" />
            Prévoyance
          </TabsTrigger>
          <TabsTrigger value="bancaire" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Wallet className="h-4 w-4 mr-2 text-[#7373FF]" />
            Bancaire
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredPlacements.length > 0 ? (
            <div className="space-y-4">
              {filteredPlacements.map((placement) => {
                const typeConfig = getTypeConfig(placement.type)
                const TypeIcon = typeConfig.icon
                return (
                  <Card key={placement.id} className="hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group" onClick={() => setSelectedPlacement(placement)}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-gray-100 group-hover:bg-[#7373FF]/10 transition-colors">
                            <TypeIcon className="h-6 w-6 text-gray-600 group-hover:text-[#7373FF] transition-colors" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 group-hover:text-[#7373FF] transition-colors">{placement.name}</h3>
                              <Badge variant="outline" size="sm">{typeConfig.label}</Badge>
                              <Badge variant={placement.source === 'actif' ? 'default' : 'secondary'} size="sm">
                                {placement.source === 'actif' ? 'Placement' : 'Assurance'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{placement.company} {placement.number && `• N° ${placement.number}`}</p>
                            {placement.openDate && <p className="text-xs text-gray-400 mt-1">Ouvert le {formatDate(placement.openDate)}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(placement.value)}</p>
                          {placement.performance !== undefined && (
                            <p className={`text-sm font-medium flex items-center justify-end gap-1 ${placement.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {placement.performance >= 0 ? '+' : ''}{formatPercentage(placement.performance)} YTD
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Bénéficiaires */}
                      {placement.beneficiaires.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <Users className="h-3.5 w-3.5" />Bénéficiaires
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {placement.beneficiaires.map((b, i) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {b.name} <span className="ml-1 text-gray-500">({b.part}%)</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">Aucun placement dans cette catégorie</p>
                <Button onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Placement Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Ajouter un placement</DialogTitle></DialogHeader>
          <AddPlacementForm onAdd={handleAddPlacement} onClose={() => setShowAddModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Placement Detail Modal */}
      <Dialog open={!!selectedPlacement && !showEditModal} onOpenChange={() => setSelectedPlacement(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedPlacement && (
            <PlacementDetail 
              placement={selectedPlacement} 
              onClose={() => setSelectedPlacement(null)} 
              onEdit={() => openEditModal(selectedPlacement)}
              onDelete={() => handleDeletePlacement(selectedPlacement)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Placement Modal */}
      <Dialog open={showEditModal} onOpenChange={(o) => { setShowEditModal(o); if (!o) setSelectedPlacement(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Modifier le placement</DialogTitle></DialogHeader>
          {selectedPlacement && (
            <EditPlacementForm 
              placement={selectedPlacement} 
              onSave={handleEditPlacement} 
              loading={loading}
              onClose={() => { setShowEditModal(false); setSelectedPlacement(null) }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Liste des types pour le formulaire d'ajout (enums FR pour actifs)
const PLACEMENT_TYPES_OPTIONS = [
  { value: 'ASSURANCE_VIE', label: 'Assurance-vie', categorie: 'epargne' },
  { value: 'CONTRAT_CAPITALISATION', label: 'Contrat de capitalisation', categorie: 'epargne' },
  { value: 'PER', label: 'PER', categorie: 'retraite' },
  { value: 'PERP', label: 'PERP', categorie: 'retraite' },
  { value: 'MADELIN', label: 'Madelin', categorie: 'retraite' },
  { value: 'PEA', label: 'PEA', categorie: 'financier' },
  { value: 'PEA_PME', label: 'PEA-PME', categorie: 'financier' },
  { value: 'COMPTE_TITRES', label: 'Compte-titres', categorie: 'financier' },
  { value: 'PEE', label: 'PEE', categorie: 'financier' },
  { value: 'LIVRETS', label: 'Livret (A, LDDS, LEP)', categorie: 'bancaire' },
  { value: 'COMPTE_BANCAIRE', label: 'Compte bancaire', categorie: 'bancaire' },
  { value: 'HEALTH_INSURANCE', label: 'Assurance santé', categorie: 'assurance' },
  { value: 'HOME_INSURANCE', label: 'Assurance habitation', categorie: 'assurance' },
  { value: 'CAR_INSURANCE', label: 'Assurance auto', categorie: 'assurance' },
  { value: 'DEATH_INSURANCE', label: 'Prévoyance décès', categorie: 'assurance' },
  { value: 'DISABILITY_INSURANCE', label: 'Prévoyance invalidité', categorie: 'assurance' },
]

function AddPlacementForm({ onAdd, onClose }: { onAdd: (d: Partial<PlacementUnifie>) => void; onClose: () => void }) {
  const [data, setData] = useState({ type: 'ASSURANCE_VIE', name: '', company: '', number: '', value: '' })
  const selectedType = PLACEMENT_TYPES_OPTIONS.find(t => t.value === data.type)
  
  return (
    <div className="space-y-6 py-4">
      {/* Section: Type et nom */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#7373FF]"></div>
          Informations générales
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Type</Label>
            <Select value={data.type} onValueChange={(v) => setData({...data, type: v})}>
              <SelectTrigger className="h-11 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACEMENT_TYPES_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Nom *</Label>
            <Input 
              value={data.name} 
              onChange={(e) => setData({...data, name: e.target.value})} 
              placeholder="Ex: AV Generali"
              className="h-11 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF]"
            />
          </div>
        </div>
      </div>

      {/* Section: Détails */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#7373FF]"></div>
          Détails
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Compagnie / Assureur</Label>
            <Input 
              value={data.company} 
              onChange={(e) => setData({...data, company: e.target.value})} 
              placeholder="Ex: Generali"
              className="h-11 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Numéro de contrat</Label>
            <Input 
              value={data.number} 
              onChange={(e) => setData({...data, number: e.target.value})} 
              placeholder="Ex: 123456789"
              className="h-11 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF]"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Valeur / Encours</Label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="number" 
              value={data.value} 
              onChange={(e) => setData({...data, value: e.target.value})} 
              placeholder="0"
              className="h-11 pl-10 pr-10 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
          </div>
        </div>
      </div>

      <DialogFooter className="pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onClose} className="border-gray-200">Annuler</Button>
        <Button 
          onClick={() => onAdd({
            ...data, 
            value: Number(data.value),
            categorie: selectedType?.categorie as PlacementUnifie['categorie'] || 'epargne',
            source: selectedType?.categorie === 'assurance' ? 'contrat' : 'actif',
          })} 
          disabled={!data.name}
          className="bg-[#7373FF] hover:bg-[#5c5ce6]"
        >
          Ajouter
        </Button>
      </DialogFooter>
    </div>
  )
}

function PlacementDetail({ placement, onClose, onEdit, onDelete }: { 
  placement: PlacementUnifie
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const typeConfig = TYPE_CONFIG[placement.type] || { label: placement.type, icon: FileText }
  const TypeIcon = typeConfig.icon
  return (
    <div className="space-y-6">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-[#7373FF]/10"><TypeIcon className="h-6 w-6 text-[#7373FF]" /></div>
          <div>
            <DialogTitle>{placement.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">{typeConfig.label} • {placement.company}</p>
          </div>
        </div>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-muted-foreground">Valeur actuelle</p>
          <p className="text-2xl font-bold text-[#7373FF]">{formatCurrency(placement.value)}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-muted-foreground">Numéro</p>
          <p className="font-medium">{placement.number || '-'}</p>
        </div>
        {placement.openDate && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Date d'ouverture</p>
            <p className="font-medium">{formatDate(placement.openDate)}</p>
          </div>
        )}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-muted-foreground">Source</p>
          <Badge variant={placement.source === 'actif' ? 'default' : 'secondary'}>
            {placement.source === 'actif' ? 'Actif patrimoine' : 'Contrat assurance'}
          </Badge>
        </div>
      </div>
      {placement.beneficiaires.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Bénéficiaires</p>
          <div className="space-y-2">
            {placement.beneficiaires.map((b, i) => (
              <div key={i} className="flex justify-between">
                <span>{b.name}</span>
                <span className="font-medium">{b.part}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onDelete} className="text-destructive hover:bg-destructive/10">Supprimer</Button>
        <Button variant="outline" onClick={onClose}>Fermer</Button>
        <Button onClick={onEdit} className="bg-[#7373FF] hover:bg-[#5c5ce6]">
          <Edit className="h-4 w-4 mr-2" />Modifier
        </Button>
      </DialogFooter>
    </div>
  )
}

function EditPlacementForm({ placement, onSave, loading, onClose }: { 
  placement: PlacementUnifie
  onSave: (d: Partial<PlacementUnifie>) => void
  loading: boolean
  onClose: () => void 
}) {
  const [data, setData] = useState({
    type: placement.type,
    name: placement.name,
    company: placement.company,
    number: placement.number,
    value: placement.value.toString(),
    status: placement.status,
  })
  
  return (
    <div className="space-y-6 py-4">
      {/* Section: Type et nom */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#7373FF]"></div>
          Informations générales
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Type</Label>
            <Select value={data.type} onValueChange={(v) => setData({...data, type: v})}>
              <SelectTrigger className="h-11 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACEMENT_TYPES_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Nom *</Label>
            <Input 
              value={data.name} 
              onChange={(e) => setData({...data, name: e.target.value})} 
              className="h-11 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF]"
            />
          </div>
        </div>
      </div>

      {/* Section: Détails */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#7373FF]"></div>
          Détails
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Compagnie</Label>
            <Input 
              value={data.company} 
              onChange={(e) => setData({...data, company: e.target.value})} 
              className="h-11 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Numéro</Label>
            <Input 
              value={data.number} 
              onChange={(e) => setData({...data, number: e.target.value})} 
              className="h-11 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF]"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Valeur</Label>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                type="number" 
                value={data.value} 
                onChange={(e) => setData({...data, value: e.target.value})} 
                className="h-11 pl-10 pr-10 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Statut</Label>
            <Select value={data.status} onValueChange={(v) => setData({...data, status: v})}>
              <SelectTrigger className="h-11 bg-white border-gray-200 hover:border-gray-300 focus:border-[#7373FF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIF">Actif</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CLOSED">Clôturé</SelectItem>
                <SelectItem value="SUSPENDED">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter className="pt-4 border-t border-gray-100">
        <Button variant="outline" onClick={onClose} className="border-gray-200">Annuler</Button>
        <Button 
          onClick={() => onSave({...data, value: Number(data.value)})} 
          disabled={loading || !data.name}
          className="bg-[#7373FF] hover:bg-[#5c5ce6]"
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </div>
  )
}

export default TabContratsComplet
