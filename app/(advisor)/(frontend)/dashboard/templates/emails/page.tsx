 
'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Badge } from '@/app/_common/components/ui/Badge'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { 
  useEmailTemplates, 
  useEmailTemplateStats,
  useEmailTemplateCategories,
  useDeleteEmailTemplate,
  useDuplicateEmailTemplate,
  useArchiveEmailTemplate,
  useUnarchiveEmailTemplate
} from '@/app/_common/hooks/use-api'
import { 
  Mail, 
  Plus, 
  Search, 
  FileText, 
  Copy, 
  Eye,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  MoreVertical,
  Tag
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/app/_common/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/app/_common/components/ui/DropdownMenu'

export default function TemplatesEmailsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    category: 'ALL',
    isActive: 'ALL',
    isArchived: 'false',
    search: '',
  })

  const apiFilters = useMemo(() => {
    const f: any = {}
    if (filters.category !== 'ALL') f.category = filters.category
    if (filters.isActive !== 'ALL') f.isActive = filters.isActive === 'true'
    f.isArchived = filters.isArchived === 'true'
    if (filters.search) f.search = filters.search
    return f
  }, [filters])

  const { data, isLoading, error, refetch } = useEmailTemplates(apiFilters)
  const { data: statsData } = useEmailTemplateStats()
  const { data: categoriesData } = useEmailTemplateCategories()
  const deleteMutation = useDeleteEmailTemplate()
  const duplicateMutation = useDuplicateEmailTemplate()
  const archiveMutation = useArchiveEmailTemplate()
  const unarchiveMutation = useUnarchiveEmailTemplate()

  const templates = data?.data || []
  const stats = statsData || {
    total: 0,
    active: 0,
    inactive: 0,
    archived: 0,
    system: 0,
  }
  const categories = categoriesData?.categories || []

  const handleResetFilters = () => {
    setFilters({ category: 'ALL', isActive: 'ALL', isArchived: 'false', search: '' })
  }

  const handleDuplicateTemplate = async (id: string, name: string) => {
    await duplicateMutation.mutateAsync({ 
      id, 
      data: { newName: `${name} (copie)` } 
    })
  }

  const handleArchiveTemplate = async (id: string) => {
    if (confirm('Voulez-vous vraiment archiver ce template ?')) {
      await archiveMutation.mutateAsync(id)
    }
  }

  const handleUnarchiveTemplate = async (id: string) => {
    await unarchiveMutation.mutateAsync(id)
  }

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce template ? Cette action est irréversible.')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates emails</h1>
          <p className="text-muted-foreground mt-1">Bibliothèque de modèles emails réutilisables</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({ ...prev, isArchived: prev.isArchived === 'true' ? 'false' : 'true' }))}
          >
            {filters.isArchived === 'true' ? (
              <><ArchiveRestore className="h-4 w-4 mr-2" />Templates actifs</>
            ) : (
              <><Archive className="h-4 w-4 mr-2" />Archives</>
            )}
          </Button>
          <Button onClick={() => router.push('/dashboard/templates/emails/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau template
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total templates</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Templates actifs</p>
              <p className="text-2xl font-bold mt-1">{stats.active}</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10">
              <FileText className="h-5 w-5 text-success" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Templates archivés</p>
              <p className="text-2xl font-bold mt-1">{stats.archived}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <Archive className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Templates système</p>
              <p className="text-2xl font-bold mt-1">{stats.system}</p>
            </div>
            <div className="p-3 rounded-lg bg-info/10">
              <Tag className="h-5 w-5 text-info" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, sujet..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.isActive} onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="État" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous états</SelectItem>
              <SelectItem value="true">Actifs</SelectItem>
              <SelectItem value="false">Inactifs</SelectItem>
            </SelectContent>
          </Select>

          {(filters.search || filters.category !== 'ALL' || filters.isActive !== 'ALL') && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center text-destructive">
            <p>Erreur lors du chargement des templates</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-4">Réessayer</Button>
          </div>
        </Card>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Aucun template"
          description={
            filters.search || filters.category !== 'ALL' || filters.isActive !== 'ALL'
              ? 'Aucun template ne correspond à vos critères.'
              : filters.isArchived === 'true'
              ? 'Aucun template archivé.'
              : 'Créez votre premier template email.'
          }
          action={
            !filters.search && filters.category === 'ALL' && filters.isArchived === 'false'
              ? { label: 'Créer un template', onClick: () => router.push('/dashboard/templates/emails/new'), icon: Plus }
              : undefined
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Catégorie</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Sujet</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Variables</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Utilisations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Modifié le</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">État</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {templates.map((template: any) => {
                  const usageCount = (template._count?.campaigns || 0) + (template._count?.scenarios || 0)
                  return (
                    <tr key={template.id} className="hover:bg-muted">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{template.name}</p>
                          {template.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {template.category || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {template.subject}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {template.variables.length > 0 ? (
                          <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">
                            {template.variables.length} var.
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground font-medium">
                        {usageCount > 0 ? (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {usageCount} usage{usageCount > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Non utilisé</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(template.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {template.isSystem && (
                            <Badge variant="info" className="text-xs">
                              Système
                            </Badge>
                          )}
                          {template.isArchived ? (
                            <Badge variant="secondary" className="text-xs">
                              Archivé
                            </Badge>
                          ) : template.isActive ? (
                            <Badge variant="success" className="text-xs">
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-xs">
                              Inactif
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/templates/emails/${template.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            
                            {!template.isSystem && !template.isArchived && (
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/templates/emails/${template.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem onClick={() => handleDuplicateTemplate(template.id, template.name)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>

                            {!template.isSystem && (
                              template.isArchived ? (
                                <DropdownMenuItem onClick={() => handleUnarchiveTemplate(template.id)}>
                                  <ArchiveRestore className="h-4 w-4 mr-2" />
                                  Restaurer
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleArchiveTemplate(template.id)}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archiver
                                </DropdownMenuItem>
                              )
                            )}

                            {!template.isSystem && usageCount === 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteTemplate(template.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
