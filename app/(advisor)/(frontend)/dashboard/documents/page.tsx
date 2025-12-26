"use client"

import { useState, useMemo, useCallback } from 'react'
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
import FileUpload from '@/app/_common/components/ui/FileUpload'
import { useDocuments, useDocumentStats, useUploadDocument, useDeleteDocument } from '@/app/_common/hooks/use-api'
import { DOCUMENT_CATEGORIES, getAllDocumentTypes } from '@/app/_common/lib/utils/document-categories'
import type { DocumentListItem, DocumentFilters, UploadDocumentRequest } from '@/app/_common/lib/api-types'
import { toast } from '@/app/_common/hooks/use-toast'
import { FileText, Upload, Trash2, Search, Filter, RefreshCw } from 'lucide-react'

export default function DocumentsPage() {
  const [filters, setFilters] = useState<Partial<DocumentFilters>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState<{
    name: string
    description: string
    type: string
    category: string
  }>({
    name: '',
    description: '',
    type: '',
    category: '',
  })

  const { data: stats, isLoading: statsLoading } = useDocumentStats()

  const effectiveFilters = useMemo(() => {
     
    const base: any = {
      ...filters,
    }

    if (searchTerm) {
      base.search = searchTerm
    }
    if (typeFilter && typeFilter !== 'ALL') {
      base.type = typeFilter
    }
    if (categoryFilter && categoryFilter !== 'ALL') {
      base.category = categoryFilter
    }

    return base as DocumentFilters
  }, [filters, searchTerm, typeFilter, categoryFilter])

  const {
    data: documentsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useDocuments(effectiveFilters)

  const documents: DocumentListItem[] = documentsResponse?.data || []

  const uploadMutation = useUploadDocument()
  const deleteMutation = useDeleteDocument()

  const documentTypes = useMemo(() => getAllDocumentTypes(), [])
  const categoryOptions = useMemo(
    () =>
      Object.entries(DOCUMENT_CATEGORIES).map(([key, value]: [string, { label: string }]) => ({
        id: key,
        label: value.label,
      })),
    []
  )

  const handleResetFilters = () => {
    setFilters({})
    setSearchTerm('')
    setTypeFilter('ALL')
    setCategoryFilter('ALL')
  }

  const handleOpenUpload = () => {
    setUploadDialogOpen(true)
  }

  const handleCloseUpload = () => {
    setUploadDialogOpen(false)
    setSelectedFile(null)
    setUploadForm({ name: '', description: '', type: '', category: '' })
  }

  const handleFileUpload = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return

    setSelectedFile(file)
    setUploadForm(prev => ({
      ...prev,
      name: prev.name || file.name,
    }))
  }, [])

  const handleUploadSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!selectedFile || !uploadForm.type) {
      toast({
        title: 'Informations manquantes',
        description: 'Sélectionnez un fichier et un type de document.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const uploadResponse = await fetch('/api/advisor/documents/upload', {
        method: 'POST',
        body: formData,
      })

       
      let uploadBody: any = null
      try {
        uploadBody = await uploadResponse.json()
      } catch {
        uploadBody = null
      }

      if (!uploadResponse.ok) {
        const message = uploadBody?.error || 'Erreur lors du téléversement du fichier.'
        toast({
          title: 'Erreur upload',
          description: message,
          variant: 'destructive',
        })
        return
      }

      const uploadMeta = uploadBody?.data
      if (!uploadMeta?.fileUrl) {
        toast({
          title: 'Erreur upload',
          description: 'Métadonnées de fichier manquantes dans la réponse serveur.',
          variant: 'destructive',
        })
        return
      }

      const payload: UploadDocumentRequest = {
        name: uploadForm.name || selectedFile.name,
        description: uploadForm.description || undefined,
        type: uploadForm.type as any,
        category: uploadForm.category ? (uploadForm.category as any) : undefined,
        fileUrl: uploadMeta.fileUrl,
        fileSize: uploadMeta.fileSize,
        mimeType: uploadMeta.mimeType,
        checksum: uploadMeta.checksum,
        storageProvider: uploadMeta.storageProvider,
        storageBucket: uploadMeta.storageBucket,
        storageKey: uploadMeta.storageKey,
        storageRegion: uploadMeta.storageRegion,
        metadata: {},
      }

      await uploadMutation.mutateAsync(payload)
      handleCloseUpload()
    } catch (err: any) {
      console.error('Erreur pipeline upload GED:', err)
      toast({
        title: 'Erreur',
        description: err?.message || "Impossible de terminer l'import du document.",
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handlePreview = (doc: DocumentListItem) => {
    const url = doc.fileUrl
    if (!url) {
      toast({
        title: 'Aperçu indisponible',
        description: "Aucun lien de visualisation disponible pour ce document.",
        variant: 'destructive',
      })
      return
    }
    window.open(url, '_blank', 'noopener')
  }

  const handleDelete = async (doc: DocumentListItem) => {
    if (!doc.id) return
    if (!window.confirm('Supprimer définitivement ce document de la GED ?')) return

    try {
      await deleteMutation.mutateAsync(doc.id)
    } catch {
      // Les toasts d'erreur sont gérés par le hook useDeleteDocument
    }
  }

  const totalSizeLabel = stats ? `${(stats.totalSize / (1024 * 1024)).toFixed(1)} Mo` : '--'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-slate-600" />
            Documents & GED
          </h1>
          <p className="text-muted-foreground mt-1">
            Bibliothèque centralisée de tous les documents du cabinet.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button onClick={handleOpenUpload} className="gap-2">
            <Upload className="h-4 w-4" />
            Importer un document
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{stats?.totalDocuments ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volume stocké
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-semibold">{totalSizeLabel}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Confidentiels
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-semibold">{stats?.confidential ?? 0}</p>
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
                placeholder="Rechercher par nom ou description..."
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
                  value={categoryFilter}
                  onValueChange={value => setCategoryFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Toutes les catégories</SelectItem>
                    {categoryOptions.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste de documents */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="h-5 w-5 mb-2 animate-spin" />
          <span>Chargement des documents…</span>
        </div>
      ) : isError ? (
        <ErrorState
          error={error as Error}
          variant={getErrorVariant(error as Error)}
          onRetry={() => refetch()}
        />
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10">
            <EmptyState
              icon={FileText}
              title="Aucun document"
              description="Importez vos premiers documents pour alimenter la GED du cabinet."
              action={{
                label: 'Importer un document',
                onClick: handleOpenUpload,
                icon: Upload,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {documents.length} document
              {documents.length > 1 ? 's' : ''} trouvé
              {documents.length > 1 ? 's' : ''}
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
                    <th className="py-2 text-left font-medium text-muted-foreground">Taille</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Ajouté le</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Confidentialité</th>
                    <th className="py-2 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr
                      key={doc.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="py-2 pr-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{doc.name}</span>
                          {doc.description && (
                            <span className="text-xs text-muted-foreground">
                              {doc.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline">{String(doc.type)}</Badge>
                      </td>
                      <td className="py-2 pr-4">
                        {doc.category ? (
                          <Badge variant="secondary">{doc.category}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {(doc.fileSize / 1024).toFixed(1)} Ko
                      </td>
                      <td className="py-2 pr-4">
                        {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-2 pr-4">
                        {doc.isConfidential ? (
                          <Badge variant="destructive">Confidentiel</Badge>
                        ) : (
                          <Badge variant="outline">Standard</Badge>
                        )}
                      </td>
                      <td className="py-2 pl-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePreview(doc)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(doc)}
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

      {/* Modal d'upload */}
      <Dialog
        open={uploadDialogOpen}
        onOpenChange={open => {
          if (!open) {
            handleCloseUpload()
          } else {
            setUploadDialogOpen(true)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importer un document</DialogTitle>
            <DialogDescription>
              Téléversez le fichier et renseignez ses principales caractéristiques.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de document *</label>
              <Select
                value={uploadForm.type}
                onValueChange={value => setUploadForm(prev => ({ ...prev, type: value }))}
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
              <label className="text-sm font-medium">Catégorie</label>
              <Select
                value={uploadForm.category}
                onValueChange={value => setUploadForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {categoryOptions.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fichier *</label>
              <FileUpload
                multiple={false}
                onUpload={handleFileUpload}
                className="border-0"
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Fichier sélectionné : {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} Ko)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nom</label>
              <Input
                value={uploadForm.name}
                onChange={e => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nom interne du document"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={uploadForm.description}
                onChange={e =>
                  setUploadForm(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Notes ou contexte"
              />
            </div>

            <DialogFooter className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseUpload}>
                Annuler
              </Button>
              <Button
                type="submit"
                className="gap-2"
                disabled={uploading}
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Import en cours…' : 'Importer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
