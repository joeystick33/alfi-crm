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
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils'
import {
  Plus,
  Search,
  CheckSquare,
  Clock,
  AlertCircle,
  Filter,
} from 'lucide-react'

export default function TachesPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: '',
  })

  // TODO: Replace with real API call
  const isLoading = false
  const taches: any[] = []

  const statusConfig = {
    TODO: { label: 'À faire', variant: 'outline' as const, icon: Clock },
    IN_PROGRESS: { label: 'En cours', variant: 'info' as const, icon: Clock },
    COMPLETED: { label: 'Terminée', variant: 'success' as const, icon: CheckSquare },
    CANCELLED: { label: 'Annulée', variant: 'destructive' as const, icon: AlertCircle },
  }

  const priorityConfig = {
    LOW: { label: 'Basse', variant: 'outline' as const },
    MEDIUM: { label: 'Moyenne', variant: 'secondary' as const },
    HIGH: { label: 'Haute', variant: 'warning' as const },
    URGENT: { label: 'Urgente', variant: 'destructive' as const },
  }

  const columns: Column<any>[] = [
    {
      key: 'title',
      label: 'Titre',
      sortable: true,
      render: (tache) => (
        <div>
          <p className="font-medium">{tache.title}</p>
          {tache.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {tache.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (tache) => <Badge variant="outline">{tache.type}</Badge>,
    },
    {
      key: 'priority',
      label: 'Priorité',
      sortable: true,
      render: (tache) => {
        const config = priorityConfig[tache.priority as keyof typeof priorityConfig]
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (tache) => {
        const config = statusConfig[tache.status as keyof typeof statusConfig]
        const Icon = config.icon
        return (
          <Badge variant={config.variant}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        )
      },
    },
    {
      key: 'dueDate',
      label: 'Échéance',
      sortable: true,
      render: (tache) => {
        if (!tache.dueDate) return '-'
        const isOverdue = new Date(tache.dueDate) < new Date() && tache.status !== 'COMPLETED'
        return (
          <span className={isOverdue ? 'text-destructive font-medium' : ''}>
            {formatDate(tache.dueDate)}
          </span>
        )
      },
    },
    {
      key: 'client',
      label: 'Client',
      render: (tache) =>
        tache.client ? `${tache.client.firstName} ${tache.client.lastName}` : '-',
    },
  ]

  const filteredTaches = taches.filter((tache) => {
    const matchesStatus = filters.status === 'all' || tache.status === filters.status
    const matchesPriority = filters.priority === 'all' || tache.priority === filters.priority
    const matchesSearch =
      !filters.search ||
      tache.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      tache.description?.toLowerCase().includes(filters.search.toLowerCase())
    return matchesStatus && matchesPriority && matchesSearch
  })

  // Calculate stats
  const stats = {
    total: taches.length,
    todo: taches.filter((t) => t.status === 'TODO').length,
    inProgress: taches.filter((t) => t.status === 'IN_PROGRESS').length,
    overdue: taches.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
    ).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tâches</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos tâches et suivez votre activité
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              À faire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.todo}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
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
                  placeholder="Rechercher une tâche..."
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
                <SelectItem value="TODO">À faire</SelectItem>
                <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                <SelectItem value="COMPLETED">Terminée</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.priority}
              onValueChange={(value) => setFilters({ ...filters, priority: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="LOW">Basse</SelectItem>
                <SelectItem value="MEDIUM">Moyenne</SelectItem>
                <SelectItem value="HIGH">Haute</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des tâches</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              data={filteredTaches}
              columns={columns}
              emptyMessage="Aucune tâche trouvée"
              onRowClick={(tache) => {
                // Navigate to task detail or open modal
                console.log('Task clicked:', tache)
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
