'use client'

/**
 * TabActivites Component
 * 
 * Displays client activities with filtering, timeline view, and activity creation.
 * Includes financial and fiscal logs display.
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**
 */

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { LoadingState } from '@/app/_common/components/ui/LoadingState'
import { ErrorState } from '@/app/_common/components/ui/ErrorState'
import { formatDate, getRelativeTime } from '@/app/_common/lib/utils'
import { useClientActivities, useCreateActivity } from '@/app/(advisor)/(frontend)/hooks/use-activities'
import type { TabActivitesProps, Activity, ActivityType } from '@/app/_common/types/client360'
import {
  Clock,
  Phone,
  Mail,
  Calendar,
  Activity as ActivityIcon,
  FileText,
  Filter,
  Plus,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Calculator,
  User,
  RefreshCw,
} from 'lucide-react'

// Activity type configuration with icons and colors
const activityTypeConfig: Record<ActivityType, { label: string; icon: typeof Clock; color: string }> = {
  CALL: { label: 'Appel', icon: Phone, color: 'bg-blue-500' },
  EMAIL: { label: 'Email', icon: Mail, color: 'bg-green-500' },
  MEETING: { label: 'Rendez-vous', icon: Calendar, color: 'bg-purple-500' },
  ACTION: { label: 'Action', icon: ActivityIcon, color: 'bg-orange-500' },
  LOG: { label: 'Log système', icon: FileText, color: 'bg-gray-500' },
}

interface CreateActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { type: ActivityType; title: string; description: string }) => void
  isLoading: boolean
}

function CreateActivityModal({ isOpen, onClose, onSubmit, isLoading }: CreateActivityModalProps) {
  const [type, setType] = useState<ActivityType>('ACTION')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({ type, title: title.trim(), description: description.trim() })
    setTitle('')
    setDescription('')
    setType('ACTION')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nouvelle activité</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type d'activité</label>
            <div className="grid grid-cols-3 gap-2">
              {(['CALL', 'EMAIL', 'MEETING', 'ACTION', 'LOG'] as ActivityType[]).map((t) => {
                const config = activityTypeConfig[t]
                const Icon = config.icon
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
                      type === t 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs">{config.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Titre *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de l'activité"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description détaillée..."
              className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function TabActivites({ clientId, client: _client }: TabActivitesProps) {
  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [showFinancialLogs, setShowFinancialLogs] = useState(false)
  const [showFiscalLogs, setShowFiscalLogs] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Build filters object
  const filters = useMemo(() => ({
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
    startDate: dateRange.start || undefined,
    endDate: dateRange.end || undefined,
    search: searchQuery || undefined,
    limit: 50,
  }), [selectedTypes, dateRange, searchQuery])

  // Fetch activities
  const { data, isLoading, isError, error, refetch } = useClientActivities(clientId, filters)
  const createActivityMutation = useCreateActivity()

  // Handle type filter toggle
  const toggleTypeFilter = useCallback((type: ActivityType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }, [])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedTypes([])
    setSearchQuery('')
    setDateRange({ start: '', end: '' })
  }, [])

  // Handle activity creation
  const handleCreateActivity = useCallback(async (data: { type: ActivityType; title: string; description: string }) => {
    try {
      await createActivityMutation.mutateAsync({
        clientId,
        ...data,
      })
      setIsCreateModalOpen(false)
    } catch (err) {
      console.error('Failed to create activity:', err)
    }
  }, [clientId, createActivityMutation])

  // Filter activities for financial/fiscal logs view
  const financialLogs = useMemo(() => 
    data?.data?.activities?.filter((a: Activity) => a.metadata?.isFinancialLog) || [],
    [data]
  )

  const fiscalLogs = useMemo(() => 
    data?.data?.activities?.filter((a: Activity) => a.metadata?.isFiscalLog) || [],
    [data]
  )

  const hasActiveFilters = selectedTypes.length > 0 || searchQuery || dateRange.start || dateRange.end

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState variant="spinner" message="Chargement des activités..." />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <ErrorState
          error={error as Error}
          variant="default"
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const activities = data?.data?.activities || []
  const stats = data?.data?.stats || { totalActivities: 0, byType: {}, recentCount: 0, financialLogsCount: 0, fiscalLogsCount: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Activités & Historique</h2>
          <p className="text-sm text-muted-foreground">
            {stats.totalActivities} activités • {stats.recentCount} ces 30 derniers jours
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle activité
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <ActivityIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalActivities}</p>
                <p className="text-sm text-muted-foreground">Total activités</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.recentCount}</p>
                <p className="text-sm text-muted-foreground">30 derniers jours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => setShowFinancialLogs(!showFinancialLogs)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-100">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.financialLogsCount}</p>
                <p className="text-sm text-muted-foreground">Logs financiers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => setShowFiscalLogs(!showFiscalLogs)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Calculator className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.fiscalLogsCount}</p>
                <p className="text-sm text-muted-foreground">Logs fiscaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Logs Section */}
      {showFinancialLogs && financialLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Logs Financiers
              <Badge variant="secondary">{financialLogs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {financialLogs.slice(0, 10).map((activity: Activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-emerald-100">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.title}</p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(activity.timestamp)} • {activity.performedBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fiscal Logs Section */}
      {showFiscalLogs && fiscalLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-purple-600" />
              Logs Fiscaux
              <Badge variant="secondary">{fiscalLogs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fiscalLogs.slice(0, 10).map((activity: Activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-purple-100">
                    <Calculator className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.title}</p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(activity.timestamp)} • {activity.performedBy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Effacer
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans les activités..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type filters */}
            <div>
              <label className="block text-sm font-medium mb-2">Type d'activité</label>
              <div className="flex flex-wrap gap-2">
                {(['CALL', 'EMAIL', 'MEETING', 'ACTION', 'LOG'] as ActivityType[]).map((type) => {
                  const config = activityTypeConfig[type]
                  const count = stats.byType[type] || 0
                  const isSelected = selectedTypes.includes(type)
                  
                  return (
                    <Button
                      key={type}
                      variant={isSelected ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => toggleTypeFilter(type)}
                      className="gap-2"
                    >
                      {config.label}
                      <Badge variant="secondary" className="ml-1">
                        {count}
                      </Badge>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date de début</label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date de fin</label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        )}

        {/* Quick filter badges */}
        {!showFilters && hasActiveFilters && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {selectedTypes.map(type => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {activityTypeConfig[type].label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => toggleTypeFilter(type)}
                  />
                </Badge>
              ))}
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Recherche: {searchQuery}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              {(dateRange.start || dateRange.end) && (
                <Badge variant="secondary" className="gap-1">
                  Période: {dateRange.start || '...'} - {dateRange.end || '...'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setDateRange({ start: '', end: '' })}
                  />
                </Badge>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Activities Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historique des activités
            {activities.length > 0 && (
              <Badge variant="secondary">{activities.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

              {/* Activities */}
              <div className="space-y-6">
                {activities.map((activity: Activity) => {
                  const config = activityTypeConfig[activity.type] || activityTypeConfig.ACTION
                  const Icon = config.icon

                  return (
                    <div key={activity.id} className="relative flex gap-4">
                      {/* Icon */}
                      <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${config.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 rounded-lg border p-4 bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{activity.title}</h4>
                            <Badge variant="outline" className="mt-1">
                              {config.label}
                            </Badge>
                            {activity.metadata?.isFinancialLog && (
                              <Badge variant="secondary" className="ml-2 mt-1">
                                Financier
                              </Badge>
                            )}
                            {activity.metadata?.isFiscalLog && (
                              <Badge variant="secondary" className="ml-2 mt-1">
                                Fiscal
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {formatDate(activity.timestamp)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getRelativeTime(activity.timestamp)}
                            </p>
                          </div>
                        </div>

                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {activity.description}
                          </p>
                        )}

                        {activity.linkedDocuments && activity.linkedDocuments.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              <span>{activity.linkedDocuments.length} document(s) lié(s)</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>Par {activity.performedBy}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'Aucune activité ne correspond aux filtres'
                  : 'Aucune activité enregistrée'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter la première activité
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateActivity}
        isLoading={createActivityMutation.isPending}
      />
    </div>
  )
}
