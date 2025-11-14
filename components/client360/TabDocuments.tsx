'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { formatDate, formatPercentage } from '@/lib/utils'
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import type { ClientDetail } from '@/lib/api-types'

interface TabDocumentsProps {
  clientId: string
  client: ClientDetail
}

const documentCategories = [
  { value: 'IDENTITE', label: 'Identité', required: true },
  { value: 'FISCAL', label: 'Fiscal', required: true },
  { value: 'PATRIMOINE', label: 'Patrimoine', required: false },
  { value: 'REGLEMENTAIRE', label: 'Réglementaire', required: true },
  { value: 'COMMERCIAL', label: 'Commercial', required: false },
  { value: 'AUTRE', label: 'Autre', required: false },
]

export function TabDocuments({ clientId, client }: TabDocumentsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Calculate document completeness score
  const calculateCompletenessScore = () => {
    if (!client.documents || client.documents.length === 0) return 0
    
    const requiredCategories = documentCategories.filter(c => c.required)
    const completedCategories = requiredCategories.filter(cat =>
      client.documents?.some((doc: any) => doc.category === cat.value)
    )
    
    return Math.round((completedCategories.length / requiredCategories.length) * 100)
  }

  const completenessScore = calculateCompletenessScore()

  // Documents columns
  const documentsColumns: Column<any>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      render: (doc) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{doc.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (doc) => <Badge variant="outline">{doc.type}</Badge>,
    },
    {
      key: 'category',
      label: 'Catégorie',
      sortable: true,
      render: (doc) => {
        const category = documentCategories.find(c => c.value === doc.category)
        return <Badge variant="secondary">{category?.label || doc.category}</Badge>
      },
    },
    {
      key: 'uploadedAt',
      label: 'Date d\'upload',
      sortable: true,
      render: (doc) => formatDate(doc.uploadedAt),
    },
    {
      key: 'fileSize',
      label: 'Taille',
      sortable: true,
      render: (doc) => {
        const sizeInMB = doc.fileSize / (1024 * 1024)
        return sizeInMB < 1
          ? `${Math.round(doc.fileSize / 1024)} KB`
          : `${sizeInMB.toFixed(2)} MB`
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (doc) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Prévisualiser">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Télécharger">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Supprimer">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const filteredDocuments = client.documents?.filter((doc: any) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || doc.category === selectedCategory
    return matchesSearch && matchesCategory
  }) || []

  return (
    <div className="space-y-6">
      {/* Document Completeness Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Score de complétude documentaire</span>
            <Badge
              variant={
                completenessScore >= 80
                  ? 'success'
                  : completenessScore >= 50
                  ? 'warning'
                  : 'destructive'
              }
            >
              {completenessScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all ${
                  completenessScore >= 80
                    ? 'bg-success'
                    : completenessScore >= 50
                    ? 'bg-warning'
                    : 'bg-destructive'
                }`}
                style={{ width: `${completenessScore}%` }}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {documentCategories.map((category) => {
                const hasDocument = client.documents?.some(
                  (doc: any) => doc.category === category.value
                )
                
                return (
                  <div
                    key={category.value}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      {hasDocument ? (
                        <CheckCircle className="h-4 w-4 text-success" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">{category.label}</span>
                    </div>
                    {category.required && !hasDocument && (
                      <Badge variant="destructive" className="text-xs">
                        Requis
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un document..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedCategory ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Tous
          </Button>
          {documentCategories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? 'secondary' : 'outline'}
              size="sm"
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === category.value ? null : category.value
                )
              }
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Glissez-déposez vos fichiers ici</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ou cliquez pour sélectionner des fichiers
            </p>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Sélectionner des fichiers
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Formats acceptés: PDF, JPG, PNG, DOCX (max 10 MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Documents
              {client.documents && (
                <Badge variant="secondary" className="ml-2">
                  {filteredDocuments.length}
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredDocuments}
            columns={documentsColumns}
            emptyMessage="Aucun document trouvé"
          />
        </CardContent>
      </Card>

      {/* Expiring Documents Alert */}
      {client.documents?.some((doc: any) => {
        // Check if document is expiring within 30 days
        return false // TODO: implement expiry check
      }) && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Documents expirant bientôt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Certains documents arrivent à expiration dans les 30 prochains jours
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
