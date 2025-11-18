'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  FolderOpen,
  ShieldCheck,
  RefreshCw,
  FileWarning,
  Paperclip,
  Link,
  Unlink,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  DOCUMENT_CATEGORIES,
  calculateDocumentCompleteness,
  getAllDocumentTypes,
  getDocumentTypeDetails,
} from '@/lib/utils/document-categories'

const STATUS_BADGE = {
  COMPLETE: 'bg-emerald-600 hover:bg-emerald-600 text-white',
  GOOD: 'bg-sky-600 hover:bg-sky-600 text-white',
  MEDIUM: 'bg-amber-500 hover:bg-amber-500 text-white',
  INCOMPLETE: 'bg-rose-600 hover:bg-rose-600 text-white',
}

const SECTION_GRADIENT = {
  COMPLETE: 'bg-gradient-to-br from-emerald-50 via-white to-emerald-100 border border-emerald-100',
  GOOD: 'bg-gradient-to-br from-sky-50 via-white to-sky-100 border border-sky-100',
  MEDIUM: 'bg-gradient-to-br from-amber-50 via-white to-amber-100 border border-amber-100',
  INCOMPLETE: 'bg-gradient-to-br from-rose-50 via-white to-rose-100 border border-rose-100',
}

function formatDate(value: any) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR')
}

function resolveDocumentUrl(doc: any) {
  return doc?.downloadUrl || doc?.previewUrl || doc?.signedUrl || doc?.fileUrl || null
}

interface TabDocumentsProps {
  clientId: string
  client?: any
}

export default function TabDocuments({ clientId, client }: TabDocumentsProps) {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({ type: '', name: '', description: '' })
  const [activeTab, setActiveTab] = useState('ENTREE_RELATION')
  const [dragActive, setDragActive] = useState(false)
  const [externalSources, setExternalSources] = useState<any>(null)
  const [gedLibrary, setGedLibrary] = useState<any[]>([])
  const [gedLoading, setGedLoading] = useState(false)
  const [showGedModal, setShowGedModal] = useState(false)
  const [gedFilterType, setGedFilterType] = useState<string | null>(null)
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/advisor/clients/${clientId}/documents`)
      if (!response.ok) throw new Error('Failed to load documents')
      
      const data = await response.json()
      setDocuments(data?.documents || [])
      setExternalSources(data?.externalSources || null)
    } catch (error: any) {
      console.error('Erreur chargement documents:', error)
      toast({
        title: 'Chargement impossible',
        description: "Impossible de récupérer les documents pour l'instant.",
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [clientId, toast])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const clientPatrimoine = client?.netWealth || client?.totalAssets || 0
  const allDocumentTypes = useMemo(() => getAllDocumentTypes(), [])
  
  const completeness = useMemo(
    () => calculateDocumentCompleteness(documents, clientPatrimoine),
    [documents, clientPatrimoine]
  )
  
  const statsGridCols = externalSources ? 'md:grid-cols-5' : 'md:grid-cols-4'

  const loadGedLibrary = useCallback(async () => {
    setGedLoading(true)
    try {
      const response = await fetch(`/api/advisor/clients/${clientId}/documents/ged`)
      if (!response.ok) throw new Error('Failed to load GED')
      
      const data = await response.json()
      setGedLibrary(data?.documents || [])
    } catch (error: any) {
      console.error('Erreur chargement GED:', error)
      toast({
        title: 'GED indisponible',
        description: 'Impossible de récupérer la bibliothèque GED pour le moment.',
        variant: 'destructive',
      })
    } finally {
      setGedLoading(false)
    }
  }, [clientId, toast])

  useEffect(() => {
    if (showGedModal) {
      loadGedLibrary()
    }
  }, [showGedModal, loadGedLibrary])

  const handleLinkGed = useCallback(
    async (externalId: string) => {
      if (!externalId) return
      setLinkingId(externalId)
      try {
        const response = await fetch(`/api/advisor/clients/${clientId}/documents/ged/link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ externalId }),
        })
        
        if (!response.ok) throw new Error('Failed to link document')
        
        toast({
          title: 'Document associé',
          description: 'Le document GED est désormais lié au dossier client.',
        })
        await loadDocuments()
        await loadGedLibrary()
      } catch (error: any) {
        console.error('Erreur association GED:', error)
        toast({
          title: 'Association impossible',
          description: "Impossible d'associer ce document GED.",
          variant: 'destructive',
        })
      } finally {
        setLinkingId(null)
      }
    },
    [clientId, loadDocuments, loadGedLibrary, toast]
  )

  const handleUnlinkGed = useCallback(
    async (doc: any) => {
      const externalId = doc?.externalId
      if (!externalId) return
      setUnlinkingId(externalId)
      try {
        const response = await fetch(`/api/advisor/clients/${clientId}/documents/ged/unlink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ externalId }),
        })
        
        if (!response.ok) throw new Error('Failed to unlink document')
        
        toast({
          title: 'Document dissocié',
          description: `${doc?.name || 'Document'} a été retiré du dossier.`,
        })
        await loadDocuments()
        await loadGedLibrary()
      } catch (error: any) {
        console.error('Erreur dissociation GED:', error)
        toast({
          title: 'Dissociation impossible',
          description: 'Impossible de dissocier ce document GED.',
          variant: 'destructive',
        })
      } finally {
        setUnlinkingId(null)
      }
    },
    [clientId, loadDocuments, loadGedLibrary, toast]
  )

  const openGedModal = useCallback((typeId: string = 'ALL') => {
    setGedFilterType(typeId || 'ALL')
    setShowGedModal(true)
  }, [])

  const filteredGedDocs = useMemo(() => {
    if (!gedFilterType || gedFilterType === 'ALL') return gedLibrary
    return gedLibrary.filter((doc: any) => doc.type === gedFilterType)
  }, [gedLibrary, gedFilterType])

  const documentsByType = useMemo(() => {
    return documents.reduce((acc: any, doc) => {
      if (!doc?.type) return acc
      if (!acc[doc.type]) acc[doc.type] = []
      acc[doc.type].push(doc)
      return acc
    }, {})
  }, [documents])

  const categoryStats = useMemo(() => {
    return Object.entries(DOCUMENT_CATEGORIES).reduce((acc: any, [key, category]) => {
      const total = category.types.length
      const present = category.types.filter((type: any) => (documentsByType[type.id] || []).length > 0).length
      const requiredMissing = category.types.filter((type: any) => {
        const isRequired = type.required && (!type.threshold || clientPatrimoine >= type.threshold)
        return isRequired && (documentsByType[type.id] || []).length === 0
      }).length
      acc[key] = { present, total, requiredMissing }
      return acc
    }, {})
  }, [documentsByType, clientPatrimoine])

  const openUploadModal = (typeId: string = '') => {
    setUploadForm((prev: any) => ({ ...prev, type: typeId }))
    setShowUploadModal(true)
  }

  const resetUploadState = () => {
    setSelectedFile(null)
    setUploadForm({ type: '', name: '', description: '' })
    setDragActive(false)
  }

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

      const response = await fetch(`/api/advisor/clients/${clientId}/documents`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      toast({
        title: 'Document ajouté',
        description: `${selectedFile.name} a été importé avec succès`,
      })

      resetUploadState()
      setShowUploadModal(false)
      await loadDocuments()
    } catch (error: any) {
      console.error('Erreur upload', error)
      toast({
        title: 'Échec de l\'import',
        description: 'Vérifiez le format du fichier puis réessayez.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (doc: any) => {
    if (!doc?.id) return
    if (!window.confirm('Supprimer définitivement ce document ?')) return

    try {
      const response = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Delete failed')
      
      toast({
        title: 'Document supprimé',
        description: `${doc.name || doc.type} a été supprimé du dossier.`,
      })
      await loadDocuments()
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      toast({
        title: 'Suppression impossible',
        description: 'Contactez un administrateur si le problème persiste.',
        variant: 'destructive',
      })
    }
  }

  const handlePreview = (doc: any) => {
    const url = resolveDocumentUrl(doc)
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

  const handleDownload = (doc: any) => {
    const url = resolveDocumentUrl(doc)
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

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      event.stopPropagation()
      setDragActive(false)
      const file = event.dataTransfer?.files?.[0]
      if (!file) return
      setSelectedFile(file)
      setUploadForm((prev: any) => ({ ...prev, name: prev.name || file.name }))
      setShowUploadModal(true)
    },
    []
  )

  const renderMissingBadges = () => {
    if (!completeness.missingDocs.length) return null
    return (
      <div className="flex flex-wrap gap-2">
        {completeness.missingDocs.slice(0, 6).map((doc: any, index: number) => {
          const badgeKey = doc.id || `${doc.label}-${index}`
          return (
            <Badge key={badgeKey} variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
              {doc.label}
            </Badge>
          )
        })}
        {completeness.missingDocs.length > 6 && (
          <Badge variant="secondary">+{completeness.missingDocs.length - 6} autres</Badge>
        )}
      </div>
    )
  }

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
          {externalSources && (
            <Button variant="secondary" onClick={() => openGedModal('ALL')} className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Bibliothèque GED
            </Button>
          )}
          <Button onClick={() => openUploadModal()} className="gap-2">
            <Upload className="h-4 w-4" />
            Importer un document
          </Button>
        </div>
      </header>

      <section className={`rounded-xl p-6 shadow-sm ${SECTION_GRADIENT[completeness.status]}`}>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-slate-600">Complétude globale</p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-4xl font-semibold text-slate-900">{completeness.score}%</span>
              <Badge className={STATUS_BADGE[completeness.status]}>Statut {completeness.status}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {completeness.completed} documents requis sur {completeness.totalRequired} sont présents.
            </p>
          </div>
          <div className="flex-1">
            <Progress value={completeness.score} className="h-2" />
            <div className={`mt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground ${statsGridCols}`}>
              <StatsTile icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />} label="Obligatoires présents" value={completeness.completed} />
              <StatsTile icon={<FileWarning className="h-4 w-4 text-rose-600" />} label="Obligatoires manquants" value={completeness.missing} highlight />
              <StatsTile icon={<Clock className="h-4 w-4 text-amber-500" />} label="Expire bientôt" value={completeness.expiringDocs.length} />
              <StatsTile icon={<FolderOpen className="h-4 w-4 text-slate-500" />} label="Total documents" value={documents.length} />
              {externalSources && (
                <StatsTile
                  icon={<Link className="h-4 w-4 text-slate-600" />}
                  label="Docs GED liés"
                  value={`${externalSources.gedLinked || 0}/${externalSources.gedTotal || 0}`}
                />
              )}
            </div>
          </div>
        </div>
        {renderMissingBadges()}
      </section>

      <section
        ref={dropZoneRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`transition-all ${dragActive ? 'border-emerald-400 bg-emerald-50/80 shadow-lg' : 'border-dashed border-slate-200 bg-white'} rounded-xl border-2 p-6`}
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
              <p className="text-sm font-medium">Glissez-déposez vos documents ou utilisez le bouton ci-dessous</p>
              <p className="text-xs">Formats acceptés: PDF, PNG, JPG, DOCX (max 10 Mo)</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => openUploadModal()}>
                <Upload className="mr-2 h-4 w-4" />Sélectionner un fichier
              </Button>
            </>
          )}
        </div>
      </section>

      {completeness.expiringDocs.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="space-y-2 text-amber-800">
            <p className="font-semibold">Documents arrivant à expiration</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {completeness.expiringDocs.map((doc: any) => (
                <li key={doc.id} className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2 text-xs">
                  <span className="font-medium text-slate-700">{doc.label}</span>
                  <span className="text-amber-600">Expire dans {doc.daysRemaining} jour(s)</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {completeness.missingDocs.length > 0 && (
        <Alert className="border-rose-200 bg-rose-50">
          <AlertTriangle className="h-4 w-4 text-rose-600" />
          <AlertDescription className="space-y-2 text-rose-800">
            <p className="font-semibold">Documents obligatoires manquants</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {completeness.missingDocs.map((doc: any) => (
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

      {/* Upload Modal */}
      <Dialog
        open={showUploadModal}
        onOpenChange={(open: any) => {
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
                onValueChange={(value: any) => setUploadForm((prev: any) => ({ ...prev, type: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {getAllDocumentTypes().map((type: any) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} {type.required ? '⭐' : ''}
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
                    <p className="mt-2 font-medium text-slate-700">Glissez-déposez ou cliquez pour parcourir</p>
                    <p className="text-xs text-muted-foreground">PDF, PNG, JPG, DOCX (max 10 Mo)</p>
                  </>
                )}
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(event: any) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    setSelectedFile(file)
                    setUploadForm((prev: any) => ({ ...prev, name: prev.name || file.name }))
                  }}
                  required={!selectedFile}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nom du document</Label>
              <Input
                value={uploadForm.name}
                onChange={(event: any) => setUploadForm((prev: any) => ({ ...prev, name: event.target.value }))}
                placeholder="Nom interne ou titre du document"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={uploadForm.description}
                onChange={(event: any) => setUploadForm((prev: any) => ({ ...prev, description: event.target.value }))}
                placeholder="Notes ou contexte sur ce document"
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={uploading} className="gap-2">
                <Upload className="h-4 w-4" />
                {uploading ? 'Import en cours…' : 'Uploader'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatsTile({ icon, label, value, highlight = false }: any) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-2 shadow-sm ${
        highlight ? 'border-rose-200 text-rose-700' : 'border-slate-200 text-slate-600'
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-base font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  )
}
