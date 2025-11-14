'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDate, formatPercentage } from '@/lib/utils'
import {
  Plus,
  Search,
  Folder,
  TrendingUp,
  Calendar,
  DollarSign,
} from 'lucide-react'

export default function ProjetsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: '',
  })

  // TODO: Replace with real API call
  const isLoading = false
  const projets: any[] = []

  const statusConfig = {
    PLANNED: { label: 'Planifié', variant: 'outline' as const },
    IN_PROGRESS: { label: 'En cours', variant: 'info' as const },
    COMPLETED: { label: 'Terminé', variant: 'success' as const },
    CANCELLED: { label: 'Annulé', variant: 'destructive' as const },
    ON_HOLD: { label: 'En pause', variant: 'warning' as const },
  }

  const typeLabels = {
    REAL_ESTATE_PURCHASE: 'Achat immobilier',
    BUSINESS_CREATION: 'Création entreprise',
    RETIREMENT_PREPARATION: 'Préparation retraite',
    WEALTH_RESTRUCTURING: 'Restructuration patrimoniale',
    TAX_OPTIMIZATION: 'Optimisation fiscale',
    SUCCESSION_PLANNING: 'Planification succession',
    OTHER: 'Autre',
  }

  const filteredProjets = projets.filter((projet) => {
    const matchesStatus = filters.status === 'all' || projet.status === filters.status
    const matchesType = filters.type === 'all' || projet.type === filters.type
    const matchesSearch =
      !filters.search ||
      projet.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      projet.description?.toLowerCase().includes(filters.search.toLowerCase())
    return matchesStatus && matchesType && matchesSearch
  })

  // Calculate stats
  const stats = {
    total: projets.length,
    inProgress: projets.filter((p) => p.status === 'IN_PROGRESS').length,
    completed: projets.filter((p) => p.status === 'COMPLETED').length,
    totalBudget: projets.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projets</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos projets clients et suivez leur avancement
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau projet
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Terminés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un projet..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PLANNED">Planifié</SelectItem>
                <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                <SelectItem value="COMPLETED">Terminé</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
                <SelectItem value="ON_HOLD">En pause</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="REAL_ESTATE_PURCHASE">Achat immobilier</SelectItem>
                <SelectItem value="BUSINESS_CREATION">Création entreprise</SelectItem>
                <SelectItem value="RETIREMENT_PREPARATION">Préparation retraite</SelectItem>
                <SelectItem value="WEALTH_RESTRUCTURING">Restructuration</SelectItem>
                <SelectItem value="TAX_OPTIMIZATION">Optimisation fiscale</SelectItem>
                <SelectItem value="SUCCESSION_PLANNING">Planification succession</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredProjets.length > 0 ? (
          filteredProjets.map((projet) => {
            const statusConf = statusConfig[projet.status as keyof typeof statusConfig]
            const progress = projet.progress || 0

            return (
              <Card
                key={projet.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                onClick={() => router.push(`/dashboard/projets/${projet.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-1">{projet.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {typeLabels[projet.type as keyof typeof typeLabels] || projet.type}
                      </Badge>
                    </div>
                    <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {projet.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {projet.description}
                    </p>
                  )}

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Avancement</span>
                      <span className="font-medium">{formatPercentage(progress)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          progress >= 100
                            ? 'bg-success'
                            : progress >= 50
                            ? 'bg-primary'
                            : 'bg-info'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget */}
                  {projet.estimatedBudget && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Budget</span>
                      <span className="font-medium">
                        {formatCurrency(projet.estimatedBudget)}
                      </span>
                    </div>
                  )}

                  {/* Dates */}
                  {projet.targetDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Échéance: {formatDate(projet.targetDate)}</span>
                    </div>
                  )}

                  {/* Client */}
                  {projet.client && (
                    <div className="text-xs text-muted-foreground">
                      Client: {projet.client.firstName} {projet.client.lastName}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucun projet trouvé
              </p>
              <Button className="mt-4" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier projet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
