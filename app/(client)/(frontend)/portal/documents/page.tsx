 
'use client'

/**
 * Client Portal - Mes Documents
 * 
 * Liste des documents partagés avec le client:
 * - Filtrage par catégorie/type
 * - Recherche
 * - Téléchargement
 */

import { useState, useMemo } from 'react'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { useClientDocuments } from '@/app/_common/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import {
  FileText,
  Download,
  Eye,
  Search,
  Calendar,
  Folder,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'


const CATEGORY_LABELS: Record<string, string> = {
  FINANCIER: 'Financier',
  PATRIMOINE: 'Patrimoine',
  FISCAL: 'Fiscal',
  CONTRAT: 'Contrat',
  COMMERCIAL: 'Commercial',
}

const TYPE_LABELS: Record<string, string> = {
  RELEVE: 'Relevé',
  BILAN: 'Bilan',
  ATTESTATION: 'Attestation',
  CONTRAT: 'Contrat',
  PROPOSITION: 'Proposition',
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data: apiData, isLoading } = useClientDocuments(
    user?.id || '',
    { 
      search: search || undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      page 
    }
  )

  const documents = useMemo(() => {
    if (apiData?.documents) return apiData.documents
    return []
  }, [apiData])

  const hasData = apiData !== null && apiData !== undefined

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    return '📎'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes Documents</h1>
        <p className="text-gray-500 mt-1">
          Consultez et téléchargez vos documents
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              <p className="text-sm text-gray-500">Documents</p>
            </div>
          </CardContent>
        </Card>
        {apiData?.filters?.categories?.slice(0, 3).map((cat: any) => (
          <Card key={cat.value}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Folder className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{cat.count}</p>
                <p className="text-sm text-gray-500">{CATEGORY_LABELS[cat.value] || cat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Liste des documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun document trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_LABELS[doc.category] || doc.category}
                        </Badge>
                        <span>{formatFileSize(doc.size)}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(doc.sharedAt || doc.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {apiData?.pagination && apiData.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Précédent
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} sur {apiData.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === apiData.pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}
