'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { formatDate } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { api } from '@/app/_common/lib/api-client'
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  Clock,
  FileWarning,
  ShieldCheck,
  FolderOpen,
  Paperclip,
} from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_common/components/ui/Dialog'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { DOCUMENT_CATEGORIES, getAllDocumentTypes } from '@/app/_common/lib/utils/document-categories'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Progress } from '@/app/_common/components/ui/Progress'

interface TabDocumentsProps {
  clientId: string
  client: ClientDetail
}

const STATUS_BADGE: Record<string, string> = {
  COMPLETE: 'bg-emerald-600 hover:bg-emerald-600 text-white',
  GOOD: 'bg-sky-600 hover:bg-sky-600 text-white',
  MEDIUM: 'bg-amber-500 hover:bg-amber-500 text-white',
  INCOMPLETE: 'bg-rose-600 hover:bg-rose-600 text-white',
}

const SECTION_GRADIENT: Record<string, string> = {
  COMPLETE: 'bg-gradient-to-br from-emerald-50 via-white to-emerald-100 border border-emerald-100',
  GOOD: 'bg-gradient-to-br from-sky-50 via-white to-sky-100 border border-sky-100',
  MEDIUM: 'bg-gradient-to-br from-amber-50 via-white to-amber-100 border border-amber-100',
  INCOMPLETE: 'bg-gradient-to-br from-rose-50 via-white to-rose-100 border border-rose-100',
}

// Risk profile status badge colors
const RISK_PROFILE_STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'bg-emerald-600 hover:bg-emerald-600 text-white',
  PENDING: 'bg-amber-500 hover:bg-amber-500 text-white',
  EXPIRED: 'bg-rose-600 hover:bg-rose-600 text-white',
}

// Compliance status badge colors
const COMPLIANCE_STATUS_BADGE: Record<string, string> = {
  COMPLIANT: 'bg-emerald-600 hover:bg-emerald-600 text-white',
  PENDING: 'bg-amber-500 hover:bg-amber-500 text-white',
  NON_COMPLIANT: 'bg-rose-600 hover:bg-rose-600 text-white',
}

interface DocumentItem {
  id: string
  name: string
  type: string
  category: string
  description?: string
  fileUrl: string
  createdAt: string
  uploadedAt?: string
}

interface CompletenessData {
  score: number
  status: string
  completed: number
  totalRequired: number
  missing: number
  missingDocs: Array<{ id?: string; label: string; description?: string; expired?: boolean }>
  expiringDocs: Array<{ id: string; label: string; daysRemaining: number }>
}

interface RiskProfileData {
  status: string
  score: number
  category: string
  lastAssessment: string
}

interface ComplianceData {
  lcbFtStatus: string
  declarations: Array<{ type: string; status: string; date: string }>
}

interface DocTypeConfig {
  id: string
  label: string
  description?: string
  required?: boolean
  threshold?: number
}

interface DocCategoryConfig {
  label: string
  description?: string
  required?: boolean
  types: DocTypeConfig[]
}

interface DocTypeOption {
  value: string
  label: string
  required?: boolean
}

type _UploadFormState = { type: string; name: string; description: string; category: string }

export function TabDocuments({ clientId, client }: TabDocumentsProps) {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [completeness, setCompleteness] = useState<CompletenessData | null>(null)
  const [_kycStatus, _setKycStatus] = useState<string | null>(null)
  const [riskProfile, setRiskProfile] = useState<RiskProfileData | null>(null)
  const [compliance, setCompliance] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({ type: '', name: '', description: '', category: '' })
  const [activeTab, setActiveTab] = useState('ENTREE_RELATION')
  const [dragActive, setDragActive] = useState(false)
  const [_searchQuery, _setSearchQuery] = useState('')
  const [_selectedCategory, _setSelectedCategory] = useState<string | null>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load documents from API
  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{
        documents: DocumentItem[]
        completeness: CompletenessData
        kycStatus: string
        riskProfile: RiskProfileData
        compliance: ComplianceData
      }>(`/advisor/clients/${clientId}/documents`)
      
      setDocuments(data.documents || [])
      setCompleteness(data.completeness || null)
      _setKycStatus(data.kycStatus || null)
      setRiskProfile(data.riskProfile || null)
      setCompliance(data.compliance || null)
    } catch (error: unknown) {
      console.error('Error loading documents:', error)
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de récupérer les documents pour l\'instant.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [clientId, toast])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // Upload handlers
  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedFile || !uploadForm.type) {
      toast({
        title: 'Informations manquantes',
        description: 'Sélectionnez un fichier et son type avant de continuer.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', uploadForm.type)
      formData.append('name', uploadForm.name || selectedFile.name)
      formData.append('description', uploadForm.description || '')
      formData.append('category', uploadForm.category || '')

      await api.post(`/advisor/clients/${clientId}/documents`, formData)

      toast({
        title: 'Document ajouté',
        description: `${selectedFile.name} a été importé avec succès`,
      })

      resetUploadState()
      setShowUploadModal(false)
      await loadDocuments()
    } catch (error: unknown) {
      console.error('Error uploading document:', error)
      toast({
        title: 'Échec de l\'import',
        description: 'Vérifiez le format du fichier puis réessayez.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (doc: DocumentItem) => {
    if (!doc?.id) return
    if (!window.confirm('Supprimer définitivement ce document ?')) return

    try {
      await api.delete(`/advisor/documents/${doc.id}`)
      toast({
        title: 'Document supprimé',
        description: `${doc.name || doc.type} a été supprimé du dossier.`,
      })
      await loadDocuments()
    } catch (error: unknown) {
      console.error('Error deleting document:', error)
      toast({
        title: 'Suppression impossible',
        description: 'Contactez un administrateur si le problème persiste.',
        variant: 'destructive',
      })
    }
  }

  const handlePreview = (doc: DocumentItem) => {
    const url = doc?.fileUrl
    if (!url) {
      toast({
        title: 'Aperçu indisponible',
        description: 'Aucun lien de visualisation n\'est disponible pour ce document.',
        variant: 'destructive',
      })
      return
    }
    window.open(url, '_blank', 'noopener')
  }

  const handleDownload = (doc: DocumentItem) => {
    const url = doc?.fileUrl
    if (!url) {
      toast({
        title: 'Téléchargement indisponible',
        description: 'Le fichier ne dispose pas de lien téléchargeable.',
        variant: 'destructive',
      })
      return
    }
    window.open(url, '_blank', 'noopener')
  }

  const resetUploadState = () => {
    setSelectedFile(null)
    setUploadForm({ type: '', name: '', description: '', category: '' })
    setDragActive(false)
  }

  const openUploadModal = (typeId = '') => {
    setUploadForm((prev) => ({ ...prev, type: typeId }))
    setShowUploadModal(true)
  }

  // Drag and drop handlers
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(true)
  }, [])

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.target === dropZoneRef.current) {
      setDragActive(false)
    }
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    const file = event.dataTransfer?.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setUploadForm((prev) => ({ ...prev, name: prev.name || file.name }))
    setShowUploadModal(true)
  }, [])

  // Group documents by type
  const documentsByType = documents.reduce<Record<string, DocumentItem[]>>((acc, doc) => {
    if (!doc?.type) return acc
    if (!acc[doc.type]) acc[doc.type] = []
    acc[doc.type].push(doc)
    return acc
  }, {})

  // Calculate category stats
  const wealthData = client.wealth as { netWealth?: number } | undefined
  const clientPatrimoine = wealthData?.netWealth || 0
  const categoryStats = Object.entries(DOCUMENT_CATEGORIES).reduce<Record<string, { present: number; total: number; requiredMissing: number }>>((acc, [key, category]) => {
    const catTyped = category as DocCategoryConfig
    const total = catTyped.types.length
    const present = catTyped.types.filter((type) => (documentsByType[type.id] || []).length > 0).length
    const requiredMissing = catTyped.types.filter((type) => {
      const isRequired = type.required && (!type.threshold || clientPatrimoine >= type.threshold)
      return isRequired && (documentsByType[type.id] || []).length === 0
    }).length
    acc[key] = { present, total, requiredMissing }
    return acc
  }, {})

  const allDocumentTypes = getAllDocumentTypes()

  const _filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(_searchQuery.toLowerCase())
    const matchesCategory = !_selectedCategory || doc.category === _selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <RefreshCw className="mb-3 h-6 w-6 animate-spin" />
        Chargement des documents…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-slate-600" />
            Dossier documentaire
          </h2>
          <p className="text-sm text-muted-foreground">
            Suivi des pièces réglementaires, expirations et complétude du dossier client.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadDocuments} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
          <Button onClick={() => openUploadModal()} className="gap-2">
            <Upload className="h-4 w-4" />
            Importer un document
          </Button>
        </div>
      </header>

      {/* Completeness Score */}
      {completeness && (
        <section className={`rounded-xl p-6 shadow-sm ${SECTION_GRADIENT[completeness.status]}`}>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-slate-600">Complétude globale</p>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-4xl font-semibold text-slate-900">{completeness.score}%</span>
                <Badge className={STATUS_BADGE[completeness.status]}>
                  Statut {completeness.status}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {completeness.completed} documents requis sur {completeness.totalRequired} sont présents.
              </p>
            </div>
            <div className="flex-1">
              <Progress value={completeness.score} className="h-2" />
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground md:grid-cols-4">
                <StatsTile
                  icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
                  label="Obligatoires présents"
                  value={completeness.completed}
                />
                <StatsTile
                  icon={<FileWarning className="h-4 w-4 text-rose-600" />}
                  label="Obligatoires manquants"
                  value={completeness.missing}
                  highlight
                />
                <StatsTile
                  icon={<Clock className="h-4 w-4 text-amber-500" />}
                  label="Expire bientôt"
                  value={completeness.expiringDocs?.length || 0}
                />
                <StatsTile
                  icon={<FolderOpen className="h-4 w-4 text-slate-500" />}
                  label="Total documents"
                  value={documents.length}
                />
              </div>
            </div>
          </div>
          {completeness.missingDocs && completeness.missingDocs.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {completeness.missingDocs.slice(0, 6).map((doc, index) => (
                <Badge
                  key={doc.id || `${doc.label}-${index}`}
                  variant="outline"
                  className="border-rose-200 bg-rose-50 text-rose-700"
                >
                  {doc.label}
                </Badge>
              ))}
              {completeness.missingDocs.length > 6 && (
                <Badge variant="secondary">+{completeness.missingDocs.length - 6} autres</Badge>
              )}
            </div>
          )}
        </section>
      )}

      {/* Drag and Drop Upload Area */}
      <section
        ref={dropZoneRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`transition-all ${dragActive
            ? 'border-emerald-400 bg-emerald-50/80 shadow-lg'
            : 'border-dashed border-slate-200 bg-white'
          } rounded-xl border-2 p-6`}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <Paperclip className={`h-6 w-6 ${dragActive ? 'text-emerald-600' : 'text-slate-400'}`} />
          {dragActive ? (
            <>
              <p className="text-sm font-medium text-emerald-700">Déposez votre fichier ici</p>
              <p className="text-xs">Accrochez-le, nous nous chargeons du reste.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">
                Glissez-déposez vos documents ou utilisez le bouton ci-dessous
              </p>
              <p className="text-xs">Formats acceptés: PDF, PNG, JPG, DOCX (max 10 Mo)</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => openUploadModal()}>
                <Upload className="mr-2 h-4 w-4" />
                Sélectionner un fichier
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Expiring Documents Alert */}
      {completeness?.expiringDocs && completeness.expiringDocs.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="space-y-2 text-amber-800">
            <p className="font-semibold">Documents arrivant à expiration</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {completeness.expiringDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-slate-700">{doc.label}</span>
                  <span className="text-amber-600">Expire dans {doc.daysRemaining} jour(s)</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Missing Documents Alert */}
      {completeness?.missingDocs && completeness.missingDocs.length > 0 && (
        <Alert className="border-rose-200 bg-rose-50">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <AlertDescription className="space-y-2 text-rose-800">
            <p className="font-semibold">Documents obligatoires manquants</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {completeness.missingDocs.map((doc) => (
                <li key={doc.id} className="rounded-md bg-white/70 px-3 py-2 text-xs">
                  <span className="font-medium text-slate-700">{doc.label}</span>
                  <span className="block text-slate-500">{doc.description}</span>
                  {doc.expired && <span className="text-rose-600">Document expiré</span>}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Risk Profile & Compliance Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Risk Profile Section - Requirements 10.5 */}
        {riskProfile && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50/60 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#7373FF]" />
                  Profil de Risque MIFID
                </CardTitle>
                <Badge className={RISK_PROFILE_STATUS_BADGE[riskProfile.status] || 'bg-slate-500'}>
                  {riskProfile.status === 'TERMINE' ? 'Complété' : 
                   riskProfile.status === 'EN_ATTENTE' ? 'En attente' : 'Expiré'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Score</p>
                  <p className="text-2xl font-bold text-slate-900">{riskProfile.score}/10</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Catégorie</p>
                  <p className="text-lg font-semibold text-slate-900">{riskProfile.category}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Dernière évaluation: {formatDate(riskProfile.lastAssessment)}</p>
              </div>
              {riskProfile.status === 'EXPIRE' && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-xs">
                    Le questionnaire de profil de risque doit être renouvelé.
                  </AlertDescription>
                </Alert>
              )}
              {riskProfile.status === 'EN_ATTENTE' && (
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <FileText className="h-4 w-4" />
                  Compléter le questionnaire MIFID
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Compliance Section - Requirements 10.2 */}
        {compliance && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b bg-slate-50/60 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Conformité LCB-FT
                </CardTitle>
                <Badge className={COMPLIANCE_STATUS_BADGE[compliance.lcbFtStatus] || 'bg-slate-500'}>
                  {compliance.lcbFtStatus === 'COMPLIANT' ? 'Conforme' : 
                   compliance.lcbFtStatus === 'EN_ATTENTE' ? 'En cours' : 'Non conforme'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Déclarations réglementaires</p>
                <ul className="space-y-2">
                  {compliance.declarations?.map((declaration, index) => (
                    <li 
                      key={`${declaration.type}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        {declaration.status === 'SIGNE' ? (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="text-sm text-slate-700">{declaration.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={declaration.status === 'SIGNE' 
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                            : 'border-amber-200 bg-amber-50 text-amber-700'}
                        >
                          {declaration.status === 'SIGNE' ? 'Signé' : 'En attente'}
                        </Badge>
                        {declaration.status === 'SIGNE' && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(declaration.date)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {compliance.lcbFtStatus === 'NON_COMPLIANT' && (
                <Alert className="border-rose-200 bg-rose-50">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <AlertDescription className="text-rose-800 text-xs">
                    Des documents de conformité sont manquants. Veuillez compléter le dossier.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Documents by Category Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => {
            const catTyped = category as DocCategoryConfig
            const stats = categoryStats[key]
            return (
              <Button
                key={key}
                variant={activeTab === key ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(key)}
                className="flex flex-col gap-1 whitespace-nowrap"
              >
                <span className="font-semibold">{catTyped.label}</span>
                <span className="text-[10px]">
                  {stats.present}/{stats.total} • {stats.requiredMissing} requis manquants
                </span>
              </Button>
            )
          })}
        </div>

        {Object.entries(DOCUMENT_CATEGORIES).map(([catKey, category]) => {
          if (activeTab !== catKey) return null
          const catTyped = category as DocCategoryConfig

          return (
            <Card key={catKey} className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-col gap-2 border-b bg-slate-50/60">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    {catTyped.label}
                  </CardTitle>
                  {catTyped.required && <Badge variant="destructive">Obligatoire</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {catTyped.description ||
                    'Vérifiez la présence des documents requis pour cette catégorie réglementaire.'}
                </p>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 p-0">
                {catTyped.types.map((docType) => {
                  const docsForType = documentsByType[docType.id] || []
                  const isRequired =
                    docType.required && (!docType.threshold || clientPatrimoine >= docType.threshold)

                  return (
                    <DocumentRow
                      key={docType.id}
                      docType={docType}
                      documents={docsForType}
                      onUpload={() => openUploadModal(docType.id)}
                      onPreview={handlePreview}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                      isRequired={isRequired}
                    />
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Upload Modal */}
      <Dialog
        open={showUploadModal}
        onOpenChange={(open) => {
          setShowUploadModal(open)
          if (!open) resetUploadState()
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Uploader un document</DialogTitle>
            <DialogDescription>
              Sélectionnez le type, ajoutez une description si nécessaire et importez votre fichier.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label>Type de document *</Label>
              <Select
                value={uploadForm.type}
                onValueChange={(value) => setUploadForm((prev) => ({ ...prev, type: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {(allDocumentTypes as DocTypeOption[]).map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} {type.required ? '⭐' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(value) => setUploadForm((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      {(cat as DocCategoryConfig).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fichier *</Label>
              <div
                className="group flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <>
                    <Paperclip className="h-6 w-6 text-emerald-600" />
                    <p className="mt-2 font-medium text-slate-700">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">Cliquez pour remplacer le fichier</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-slate-400" />
                    <p className="mt-2 font-medium text-slate-700">
                      Glissez-déposez ou cliquez pour parcourir
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, PNG, JPG, DOCX (max 10 Mo)</p>
                  </>
                )}
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    setSelectedFile(file)
                    setUploadForm((prev) => ({ ...prev, name: prev.name || file.name }))
                  }}
                  required={!selectedFile}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nom du document</Label>
              <Input
                value={uploadForm.name}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setUploadForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Nom interne ou titre du document"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={uploadForm.description}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setUploadForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Notes ou contexte sur ce document"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={uploading} className="gap-2">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Import en cours…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Uploader
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper components
function StatsTile({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-2 shadow-sm ${highlight ? 'border-rose-200 text-rose-700' : 'border-slate-200 text-slate-600'
        }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-base font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function DocumentRow({
  docType,
  documents,
  onUpload,
  onPreview,
  onDownload,
  onDelete,
  isRequired,
}: {
  docType: DocTypeConfig
  documents: DocumentItem[]
  onUpload: () => void
  onPreview: (doc: DocumentItem) => void
  onDownload: (doc: DocumentItem) => void
  onDelete: (doc: DocumentItem) => void
  isRequired: boolean
}) {
  const docsArray = Array.isArray(documents) ? [...documents] : []
  docsArray.sort((a, b) => {
    const dateA = new Date(a?.uploadedAt || a?.createdAt || 0).getTime()
    const dateB = new Date(b?.uploadedAt || b?.createdAt || 0).getTime()
    return dateB - dateA
  })

  const hasDocs = docsArray.length > 0
  const statusIcon = hasDocs ? (
    <CheckCircle className="h-5 w-5 text-emerald-600" />
  ) : isRequired ? (
    <AlertCircle className="h-5 w-5 text-rose-500" />
  ) : (
    <FileText className="h-5 w-5 text-slate-300" />
  )

  return (
    <div className="space-y-4 px-5 py-4 transition-colors hover:bg-slate-50">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            {statusIcon}
          </span>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800">{docType.label}</h3>
              {isRequired && <Badge variant="destructive">Requis</Badge>}
              {docType.threshold && (
                <Badge variant="outline">
                  Patrimoine ≥ {docType.threshold.toLocaleString('fr-FR')}€
                </Badge>
              )}
              {hasDocs && (
                <Badge variant="outline">
                  {docsArray.length} document{docsArray.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{docType.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={onUpload}>
            <Upload className="h-4 w-4" />
            Importer
          </Button>
        </div>
      </div>

      {hasDocs ? (
        <ul className="space-y-3">
          {docsArray.map((doc) => {
            const docKey = doc?.id || `${docType.id}-${doc?.uploadedAt || doc?.createdAt}`
            const docName = doc?.name || docType.label

            return (
              <li key={docKey} className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{docName}</span>
                      <Badge variant="outline">Interne</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ajouté le {formatDate(doc?.uploadedAt || doc?.createdAt)}
                      {doc?.description && <span> • {doc.description}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => onPreview(doc)}
                    >
                      <Eye className="h-4 w-4" />
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => onDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                      Télécharger
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-rose-600"
                      onClick={() => onDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
          Aucun document n'est encore associé. Utilisez l'import pour compléter cette section.
        </div>
      )}
    </div>
  )
}
