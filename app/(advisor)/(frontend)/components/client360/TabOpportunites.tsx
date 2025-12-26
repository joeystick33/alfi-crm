'use client'

/**
 * TabOpportunites Component
 * 
 * Displays opportunities with category filtering, detailed analysis,
 * and objective matching for the Client 360 view.
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 12.1, 12.2, 12.3, 12.4**
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { formatCurrency } from '@/app/_common/lib/utils'
import {
  Lightbulb,
  Plus,
  Target,
  TrendingUp,
  Calculator,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { CreateOpportuniteModal } from './CreateOpportuniteModal'
import { UpdateOpportuniteModal } from './UpdateOpportuniteModal'
import { useToast } from '@/app/_common/hooks/use-toast'
import type {
  Opportunity,
  ObjectiveMatch,
  OpportunityCategory,
  OpportunityStatus,
  ClientDetail,
} from '@/app/_common/types/client360'

interface TabOpportunitesProps {
  clientId: string
  client: ClientDetail
}

const categoryConfig: Record<OpportunityCategory, { label: string; icon: React.ElementType; color: string }> = {
  FISCAL: { label: 'Fiscal', icon: Calculator, color: 'bg-blue-500' },
  INVESTMENT: { label: 'Investissement', icon: TrendingUp, color: 'bg-green-500' },
  REORGANIZATION: { label: 'Réorganisation', icon: RefreshCw, color: 'bg-purple-500' },
}

const statusConfig: Record<OpportunityStatus, { label: string; variant: string; icon: React.ElementType }> = {
  NEW: { label: 'Nouvelle', variant: 'outline', icon: Lightbulb },
  DETECTEE: { label: 'Détectée', variant: 'secondary', icon: FileText },
  ACCEPTEE: { label: 'Acceptée', variant: 'success', icon: CheckCircle },
  REJETEE: { label: 'Rejetée', variant: 'destructive', icon: XCircle },
}

const complexityConfig: Record<string, { label: string; color: string }> = {
  BASSE: { label: 'Faible', color: 'text-green-600' },
  MOYENNE: { label: 'Moyenne', color: 'text-yellow-600' },
  HAUTE: { label: 'Élevée', color: 'text-red-600' },
}

export function TabOpportunites({ clientId, client: _client }: TabOpportunitesProps) {
  const { toast } = useToast()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [matchedObjectives, setMatchedObjectives] = useState<ObjectiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [detecting, setDetecting] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [expandedOpportunity, setExpandedOpportunity] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/advisor/clients/${clientId}/opportunities`)
      if (!response.ok) throw new Error('Failed to fetch opportunities')
      const result = await response.json()
      setOpportunities(result.data?.opportunities || [])
      setMatchedObjectives(result.data?.matchedObjectives || [])
    } catch (error: unknown) {
      console.error('Error fetching opportunities:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les opportunités',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const detectOpportunities = async () => {
    try {
      setDetecting(true)
      const response = await fetch(`/api/advisor/clients/${clientId}/opportunities/detect`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to detect opportunities')

      toast({
        title: 'Détection terminée',
        description: 'Les opportunités ont été analysées',
      })

      await fetchOpportunities()
    } catch (error: unknown) {
      console.error('Error detecting opportunities:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de détecter les opportunités',
        variant: 'destructive',
      })
    } finally {
      setDetecting(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()
  }, [clientId])

  // Filter opportunities by category
  const filteredOpportunities = useMemo(() => {
    if (activeCategory === 'all') return opportunities
    return opportunities.filter(o => o.category === activeCategory)
  }, [opportunities, activeCategory])

  // Group opportunities by category for display
  const opportunitiesByCategory = useMemo(() => {
    return {
      FISCAL: opportunities.filter(o => o.category === 'FISCAL'),
      INVESTMENT: opportunities.filter(o => o.category === 'INVESTMENT'),
      REORGANIZATION: opportunities.filter(o => o.category === 'REORGANIZATION'),
    }
  }, [opportunities])

  // Calculate stats
  const stats = useMemo(() => {
    const totalPotentialImpact = opportunities.reduce((sum, o) => sum + o.potentialImpact, 0)
    const avgScore = opportunities.length > 0
      ? Math.round(opportunities.reduce((sum, o) => sum + o.relevanceScore, 0) / opportunities.length)
      : 0
    return {
      total: opportunities.length,
      totalPotentialImpact,
      avgScore,
      byStatus: {
        new: opportunities.filter(o => o.status === 'NEW').length,
        reviewed: opportunities.filter(o => o.status === 'DETECTEE').length,
        accepted: opportunities.filter(o => o.status === 'ACCEPTEE').length,
        rejected: opportunities.filter(o => o.status === 'REJETEE').length,
      },
    }
  }, [opportunities])

  const toggleExpanded = (id: string) => {
    setExpandedOpportunity(expandedOpportunity === id ? null : id)
  }

  // Find matched objectives for an opportunity
  const getMatchedObjectivesForOpportunity = (opportunityId: string) => {
    return matchedObjectives.filter(m => m.opportunityIds.includes(opportunityId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Chargement des opportunités...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total opportunités
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.byStatus.new} nouvelles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impact potentiel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPotentialImpact)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Gains estimés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Score moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore}/100</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pertinence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Objectifs liés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchedObjectives.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Correspondances
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Opportunités détectées
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={detectOpportunities}
            disabled={detecting}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${detecting ? 'animate-spin' : ''}`} />
            {detecting ? 'Analyse...' : 'Détecter'}
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle opportunité
          </Button>
        </div>
      </div>


      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          <TabsTrigger value="all">
            Toutes ({opportunities.length})
          </TabsTrigger>
          <TabsTrigger value="FISCAL">
            <Calculator className="h-4 w-4 mr-1" />
            Fiscal ({opportunitiesByCategory.FISCAL.length})
          </TabsTrigger>
          <TabsTrigger value="INVESTMENT">
            <TrendingUp className="h-4 w-4 mr-1" />
            Investissement ({opportunitiesByCategory.INVESTMENT.length})
          </TabsTrigger>
          <TabsTrigger value="REORGANIZATION">
            <RefreshCw className="h-4 w-4 mr-1" />
            Réorganisation ({opportunitiesByCategory.REORGANIZATION.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          {filteredOpportunities.length > 0 ? (
            <div className="space-y-4">
              {filteredOpportunities.map((opportunity) => {
                const catConfig = categoryConfig[opportunity.category]
                const statConfig = statusConfig[opportunity.status]
                const isExpanded = expandedOpportunity === opportunity.id
                const relatedObjectives = getMatchedObjectivesForOpportunity(opportunity.id)
                const StatusIcon = statConfig.icon
                const CategoryIcon = catConfig.icon

                return (
                  <Card key={opportunity.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Main Row */}
                      <div
                        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleExpanded(opportunity.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-1.5 rounded ${catConfig.color}`}>
                                <CategoryIcon className="h-4 w-4 text-white" />
                              </div>
                              <h4 className="font-semibold">{opportunity.title}</h4>
                              <Badge variant={(statConfig.variant as any)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statConfig.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {opportunity.description}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-4">
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-600">
                                {formatCurrency(opportunity.potentialImpact)}
                              </p>
                              <p className="text-xs text-muted-foreground">Impact potentiel</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                Score: {opportunity.relevanceScore}/100
                              </Badge>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick Info */}
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {opportunity.analysis.timeline}
                          </span>
                          <span className={`flex items-center gap-1 ${complexityConfig[opportunity.analysis.complexity].color}`}>
                            <AlertTriangle className="h-3 w-3" />
                            Complexité: {complexityConfig[opportunity.analysis.complexity].label}
                          </span>
                          {relatedObjectives.length > 0 && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Target className="h-3 w-3" />
                              {relatedObjectives.length} objectif(s) lié(s)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t bg-muted/30 p-4 space-y-4">
                          {/* Analysis Section */}
                          <div className="grid gap-4 md:grid-cols-2">
                            {/* Pros */}
                            <div>
                              <h5 className="font-medium text-sm mb-2 flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Avantages
                              </h5>
                              <ul className="space-y-1">
                                {opportunity.analysis.pros.map((pro, idx) => (
                                  <li key={idx} className="text-sm flex items-start gap-2">
                                    <span className="text-green-500 mt-1">•</span>
                                    {pro}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Cons */}
                            <div>
                              <h5 className="font-medium text-sm mb-2 flex items-center gap-1 text-red-600">
                                <XCircle className="h-4 w-4" />
                                Inconvénients
                              </h5>
                              <ul className="space-y-1">
                                {opportunity.analysis.cons.map((con, idx) => (
                                  <li key={idx} className="text-sm flex items-start gap-2">
                                    <span className="text-red-500 mt-1">•</span>
                                    {con}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Requirements */}
                          <div>
                            <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              Prérequis
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {opportunity.analysis.requirements.map((req, idx) => (
                                <Badge key={idx} variant="outline">
                                  {req}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Matched Objectives */}
                          {relatedObjectives.length > 0 && (
                            <div>
                              <h5 className="font-medium text-sm mb-2 flex items-center gap-1 text-blue-600">
                                <Target className="h-4 w-4" />
                                Objectifs correspondants
                              </h5>
                              <div className="space-y-2">
                                {relatedObjectives.map((match) => (
                                  <div
                                    key={match.objectiveId}
                                    className="flex items-center justify-between p-2 bg-blue-50 rounded"
                                  >
                                    <span className="text-sm font-medium">{match.objectiveTitle}</span>
                                    <Badge variant="secondary">
                                      Score: {match.matchScore}%
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedOpportunity(opportunity)
                                setShowUpdateModal(true)
                              }}
                            >
                              Modifier
                            </Button>
                            {opportunity.status === 'NEW' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Mark as reviewed
                                }}
                              >
                                Marquer comme évaluée
                              </Button>
                            )}
                            {opportunity.status === 'DETECTEE' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Accept opportunity
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Accepter
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Reject opportunity
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Rejeter
                                </Button>
                              </>
                            )}
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
              <CardContent className="py-8 text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {activeCategory === 'all'
                    ? 'Aucune opportunité détectée'
                    : `Aucune opportunité ${categoryConfig[activeCategory as OpportunityCategory]?.label.toLowerCase()}`}
                </p>
                <Button size="sm" onClick={detectOpportunities} disabled={detecting}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${detecting ? 'animate-spin' : ''}`} />
                  Lancer la détection
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Objective Matching Summary */}
      {matchedObjectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Correspondance avec les objectifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matchedObjectives.map((match) => (
                <div
                  key={match.objectiveId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{match.objectiveTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {match.opportunityIds.length} opportunité(s) correspondante(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">Score de correspondance</p>
                      <p className="text-lg font-bold text-blue-600">{match.matchScore}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateOpportuniteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        clientId={clientId}
        onSuccess={fetchOpportunities}
      />

      <UpdateOpportuniteModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false)
          setSelectedOpportunity(null)
        }}
        opportunite={selectedOpportunity}
        onSuccess={fetchOpportunities}
      />
    </div>
  )
}
