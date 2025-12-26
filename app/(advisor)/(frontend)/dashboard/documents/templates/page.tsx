 
"use client"

import { useState, useMemo } from 'react'
import { Button } from '@/app/_common/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { ErrorState, getErrorVariant } from '@/app/_common/components/ui/ErrorState'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_common/components/ui/Dialog'
import {
  useDocumentTemplates,
  useDocumentTemplateStats,
  useCreateDocumentTemplate,
  useDeleteDocumentTemplate,
  useGenerateDocumentFromTemplate,
} from '@/app/_common/hooks/use-api'
import { getAllDocumentTypes } from '@/app/_common/lib/utils/document-categories'
import type { DocumentTemplateListItem, CreateDocumentTemplateRequest, GenerateDocumentFromTemplateRequest } from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { BookTemplate, Plus, FileText, Trash2, Search, RefreshCw } from 'lucide-react'

export default function DocumentsTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [activeFilter, setActiveFilter] = useState<string>('ALL')

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateDocumentTemplateRequest>({
    name: '',
    description: '',
    type: '' as any,
    category: undefined,
    tags: [],
    variables: {},
  })

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateListItem | null>(null)
  const [generateForm, setGenerateForm] = useState<{
    documentName: string
    variableValues: Record<string, any>
  }>({
    documentName: '',
    variableValues: {},
  })

  const { data: stats, isLoading: statsLoading } = useDocumentTemplateStats()

  const effectiveFilters = useMemo(() => {
    const base: { search?: string; type?: string; isActive?: boolean } = {}

    if (searchTerm) {
      base.search = searchTerm
    }
    if (typeFilter && typeFilter !== 'ALL') {
      base.type = typeFilter
    }
    if (activeFilter === 'ACTIF') {
      base.isActive = true
    } else if (activeFilter === 'INACTIF') {
      base.isActive = false
    }

    return base
  }, [searchTerm, typeFilter, activeFilter])

  const {
    data: templatesResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useDocumentTemplates(effectiveFilters)

  const templates: DocumentTemplateListItem[] = templatesResponse?.data || []

  const createMutation = useCreateDocumentTemplate()
  const deleteMutation = useDeleteDocumentTemplate()
  const generateMutation = useGenerateDocumentFromTemplate()

  const documentTypes = useMemo(() => getAllDocumentTypes(), [])

  const handleResetFilters = () => {
    setSearchTerm('')
    setTypeFilter('ALL')
    setActiveFilter('ALL')
  }

  const handleOpenCreate = () => {
    setCreateDialogOpen(true)
  }

  const handleCloseCreate = () => {
    setCreateDialogOpen(false)
    setCreateForm({
      name: '',
      description: '',
      type: '' as any,
      category: undefined,
      tags: [],
      variables: {},
    })
  }

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!createForm.name || !createForm.type) {
      toast({
        title: 'Informations manquantes',
        description: 'Le nom et le type sont obligatoires.',
        variant: 'destructive',
      })
      return
    }

    try {
      await createMutation.mutateAsync(createForm)
      handleCloseCreate()
    } catch {
      // Toast géré par le hook
    }
  }

  const handleDelete = async (template: DocumentTemplateListItem) => {
    if (!template.id) return
    if (!window.confirm(`Supprimer définitivement le template "${template.name}" ?`)) return

    try {
      await deleteMutation.mutateAsync(template.id)
    } catch {
      // Toast géré par le hook
    }
  }

  const handleOpenGenerate = (template: DocumentTemplateListItem) => {
    setSelectedTemplate(template)
    setGenerateForm({
      documentName: `${template.name} - ${new Date().toLocaleDateString('fr-FR')}`,
      variableValues: {},
    })
    setGenerateDialogOpen(true)
  }

  const handleCloseGenerate = () => {
    setGenerateDialogOpen(false)
    setSelectedTemplate(null)
    setGenerateForm({ documentName: '', variableValues: {} })
  }

  const handleGenerateSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!selectedTemplate?.id) return

    const payload: GenerateDocumentFromTemplateRequest = {
      templateId: selectedTemplate.id,
      documentName: generateForm.documentName || selectedTemplate.name,
      variableValues: generateForm.variableValues,
    }

    try {
      await generateMutation.mutateAsync({ id: selectedTemplate.id, data: payload })
      handleCloseGenerate()
    } catch {
      // Toast géré par le hook
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookTemplate className="h-7 w-7 text-slate-600" />
            Templates de documents
          </h1>
          <p className="text-muted-foreground mt-1">
            Modèles prêts à l'emploi pour générer des documents rapidement.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Templates totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{stats?.totalTemplates ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Templates actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{stats?.activeTemplates ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Templates inactifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{stats?.inactiveTemplates ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom..."
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <Select
                  value={typeFilter}
                  onValueChange={value => setTypeFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les types</SelectItem>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Select
                  value={activeFilter}
                  onValueChange={value => setActiveFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous</SelectItem>
                    <SelectItem value="ACTIVE">Actifs</SelectItem>
                    <SelectItem value="INACTIVE">Inactifs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="gap-2"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste de templates */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="h-5 w-5 mb-2 animate-spin" />
          <span>Chargement des templates…</span>
        </div>
      ) : isError ? (
        <ErrorState
          error={error as Error}
          variant={getErrorVariant(error as Error)}
          onRetry={() => refetch()}
        />
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10">
            <EmptyState
              icon={BookTemplate}
              title="Aucun template"
              description="Créez des templates pour générer des documents récurrents rapidement."
              action={{
                label: 'Créer un template',
                onClick: handleOpenCreate,
                icon: Plus,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {templates.length} template{templates.length > 1 ? 's' : ''} trouvé{templates.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium text-muted-foreground">Nom</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Type</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Catégorie</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Statut</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Créé le</th>
                    <th className="py-2 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(template => (
                    <tr
                      key={template.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-2 pr-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{template.name}</span>
                          {template.description && (
                            <span className="text-xs text-muted-foreground">
                              {template.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline">{String(template.type)}</Badge>
                      </td>
                      <td className="py-2 pr-4">
                        {template.category ? (
                          <Badge variant="secondary">{template.category}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {template.isActive ? (
                          <Badge variant="default">Actif</Badge>
                        ) : (
                          <Badge variant="outline">Inactif</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {new Date(template.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-2 pl-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenGenerate(template)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Générer
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(template)}
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de création */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={open => {
          if (!open) {
            handleCloseCreate()
          } else {
            setCreateDialogOpen(true)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un template</DialogTitle>
            <DialogDescription>
              Définissez les caractéristiques du nouveau template de document.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <Input
                value={createForm.name}
                onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom du template"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type *</label>
              <Select
                value={String(createForm.type)}
                onValueChange={value => setCreateForm(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={createForm.description}
                onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du template"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">URL du fichier template (optionnel)</label>
              <Input
                value={createForm.fileUrl || ''}
                onChange={e => setCreateForm(prev => ({ ...prev, fileUrl: e.target.value }))}
                placeholder="URL du fichier template"
              />
            </div>

            <DialogFooter className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseCreate}>
                Annuler
              </Button>
              <Button type="submit" className="gap-2">
                <Plus className="h-4 w-4" />
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de génération */}
      <Dialog
        open={generateDialogOpen}
        onOpenChange={open => {
          if (!open) {
            handleCloseGenerate()
          } else {
            setGenerateDialogOpen(true)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Générer un document</DialogTitle>
            <DialogDescription>
              Générer un nouveau document à partir du template "{selectedTemplate?.name}".
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerateSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom du document</label>
              <Input
                value={generateForm.documentName}
                onChange={e => setGenerateForm(prev => ({ ...prev, documentName: e.target.value }))}
                placeholder="Nom du document généré"
              />
            </div>

            <DialogFooter className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseGenerate}>
                Annuler
              </Button>
              <Button type="submit" className="gap-2">
                <FileText className="h-4 w-4" />
                Générer le document
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
