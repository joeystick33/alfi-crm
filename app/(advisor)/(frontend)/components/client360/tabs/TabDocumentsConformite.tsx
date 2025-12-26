'use client'

/**
 * TabDocumentsConformite - Documents & Conformité COMPLET
 * Fusion de TabDocuments + TabKYC avec TOUTES les fonctionnalités
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { cn, formatDate } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { api } from '@/app/_common/lib/api-client'
import { DOCUMENT_CATEGORIES, getAllDocumentTypes } from '@/app/_common/lib/utils/document-categories'
import { FolderOpen, Shield, FileText, Upload, Download, Eye, Trash2, CheckCircle, AlertCircle, AlertTriangle, Clock, RefreshCw, Loader2, FileWarning, ShieldCheck, Paperclip, Scale, Target, CheckCircle2, Plus, Pencil } from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'

// ============================================================================
// Local Types for Documents & Conformity
// ============================================================================

interface TabDocumentsConformiteProps { clientId: string; client: ClientDetail }

interface DocumentItem {
  id: string
  type?: string
  name?: string
  description?: string
  fileUrl?: string
  category?: string
  uploadedAt?: string
  createdAt?: string
}

interface CompletenessData {
  score: number
  status: string
  completed: number
  missing: number
  totalRequired: number
  expiringDocs?: Array<{ id: string; label: string; daysRemaining: number }>
  missingDocs?: Array<{ id: string; label: string; description?: string }>
}

interface RiskProfileData {
  score: number
  category: string
  status: string
  lastAssessment?: string
}

interface ComplianceData {
  lcbFtStatus: string
  declarations?: Array<{ id?: string; type: string; status: string; date?: string }>
}

interface MifidData {
  riskProfile?: string
  investmentHorizon?: string
  investmentKnowledge?: number
  financialCapacity?: number
  riskTolerance?: string
  investmentObjectives?: string[]
  overallScore?: number
  recommendation?: string
  lastAssessment?: string
}

interface LcbftData {
  isPEP?: boolean
  pepDetails?: string
  originOfFunds?: string
  sourceOfWealth?: string
  enhancedDueDiligence?: boolean
  riskLevel?: string
  notes?: string
  lastReview?: string
}

interface KycStatusData {
  status?: string
  completionRate?: number
}

type DocumentCompletenessApi = {
  score: number
  status: 'COMPLETE' | 'GOOD' | 'MOYENNE' | 'INCOMPLETE'
  completed: number
  missing: number
  totalRequired: number
  expiringDocs: Array<{ type: string; label: string; daysRemaining: number }>
  missingDocs: Array<{ type: string; label: string; description?: string }>
}

type DocumentsApiDocument = {
  id: string
  type?: string
  name?: string
  description?: string
  fileUrl?: string
  category?: string
  uploadedAt?: string
  createdAt?: string
  uploadDate?: string
}

type DocumentsApiResponse = {
  documents?: DocumentsApiDocument[]
  completeness?: DocumentCompletenessApi
  riskProfile?: RiskProfileData
  compliance?: ComplianceData
}

type KycApiResponse = {
  status: string
  completionRate: number
  alerts: AlertItem[]
  missingDocs: Array<{ label: string; description: string }>
  documents: Array<{ id: string; label: string; status: string; expiresAt?: string | null }>
  mifid?: {
    riskProfile?: string | null
    investmentHorizon?: string | null
    investmentGoals?: string[] | null
    investmentKnowledge?: number | null
    investmentExperience?: number | null
  } | null
  lcbft?: {
    isPEP?: boolean
    originOfFunds?: string | null
    riskLevel?: string | null
    enhancedDueDiligence?: boolean
  } | null
  nextReviewDate?: string | null
}

interface AlertItem {
  severity: string
  message: string
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

const STATUS_BADGE: Record<string, string> = { COMPLETE: 'bg-emerald-600 text-white', GOOD: 'bg-sky-600 text-white', MEDIUM: 'bg-amber-500 text-white', INCOMPLETE: 'bg-rose-600 text-white' }
const SECTION_GRADIENT: Record<string, string> = { COMPLETE: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-100', GOOD: 'bg-gradient-to-br from-sky-50 to-sky-100 border-sky-100', MEDIUM: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-100', INCOMPLETE: 'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-100' }
const RISK_PROFILE_STATUS_BADGE: Record<string, string> = { COMPLETED: 'bg-emerald-600 text-white', PENDING: 'bg-amber-500 text-white', EXPIRED: 'bg-rose-600 text-white', TERMINE: 'bg-emerald-600 text-white', EN_ATTENTE: 'bg-amber-500 text-white', EXPIRE: 'bg-rose-600 text-white' }
const COMPLIANCE_STATUS_BADGE: Record<string, string> = { COMPLIANT: 'bg-emerald-600 text-white', PENDING: 'bg-amber-500 text-white', EN_ATTENTE: 'bg-amber-500 text-white', NON_COMPLIANT: 'bg-rose-600 text-white' }
const RISK_PROFILE_CONFIG: Record<string, { label: string; color: string }> = { PRUDENT: { label: 'Prudent', color: 'bg-green-100 text-green-800' }, EQUILIBRE: { label: 'Équilibré', color: 'bg-blue-100 text-blue-800' }, DYNAMIQUE: { label: 'Dynamique', color: 'bg-orange-100 text-orange-800' }, OFFENSIF: { label: 'Offensif', color: 'bg-red-100 text-red-800' } }
const LCBFT_RISK_CONFIG: Record<string, { label: string; color: string }> = { BASSE: { label: 'Faible', color: 'bg-green-100 text-green-800' }, MOYENNE: { label: 'Moyen', color: 'bg-orange-100 text-orange-800' }, HAUTE: { label: 'Élevé', color: 'bg-red-100 text-red-800' } }

export function TabDocumentsConformite({ clientId, client }: TabDocumentsConformiteProps) {
  const { toast } = useToast()
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Data states
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [completeness, setCompleteness] = useState<CompletenessData | null>(null)
  const [riskProfile, setRiskProfile] = useState<RiskProfileData | null>(null)
  const [compliance, setCompliance] = useState<ComplianceData | null>(null)
  const [mifid, setMifid] = useState<MifidData | null>(null)
  const [lcbft, setLcbft] = useState<LcbftData | null>(null)
  const [kycStatus, setKycStatus] = useState<KycStatusData | null>(null)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  
  // UI states
  const [activeMainTab, setActiveMainTab] = useState('documents')
  const [activeDocCategory, setActiveDocCategory] = useState('ENTREE_RELATION')
  const [dragActive, setDragActive] = useState(false)
  
  // Modal states - Documents
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditDocModal, setShowEditDocModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({ type: '', name: '', description: '', category: '' })
  
  // Modal states - MIFID
  const [showMifidModal, setShowMifidModal] = useState(false)
  const [mifidForm, setMifidForm] = useState({
    riskProfile: 'EQUILIBRE',
    investmentHorizon: 'MOYEN_TERME',
    investmentKnowledge: 50,
    financialCapacity: 50,
    riskTolerance: 'MODERATE',
    investmentObjectives: [] as string[],
  })
  
  // Modal states - LCB-FT
  const [showLcbftModal, setShowLcbftModal] = useState(false)
  const [lcbftForm, setLcbftForm] = useState({
    isPEP: false,
    pepDetails: '',
    originOfFunds: '',
    sourceOfWealth: '',
    enhancedDueDiligence: false,
    riskLevel: 'BASSE',
    notes: '',
  })
  
  // Modal states - Declarations (currently unused but reserved for future modal implementation)
  const [_showDeclarationModal, _setShowDeclarationModal] = useState(false)
  const [_selectedDeclaration, _setSelectedDeclaration] = useState<NonNullable<ComplianceData['declarations']>[number] | null>(null)
  
  // Refs
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      const docData = await api.get<DocumentsApiResponse>(`/advisor/clients/${clientId}/documents`)

      const mappedDocuments: DocumentItem[] = (docData.documents ?? []).map((doc) => ({
        id: doc.id,
        type: doc.type,
        name: doc.name,
        description: doc.description,
        fileUrl: doc.fileUrl,
        category: doc.category,
        uploadedAt: doc.uploadedAt ?? doc.uploadDate,
        createdAt: doc.createdAt,
      }))

      const mappedCompleteness: CompletenessData | null = docData.completeness
        ? {
            score: docData.completeness.score,
            status: docData.completeness.status === 'MOYENNE' ? 'MEDIUM' : docData.completeness.status,
            completed: docData.completeness.completed,
            missing: docData.completeness.missing,
            totalRequired: docData.completeness.totalRequired,
            expiringDocs: (docData.completeness.expiringDocs ?? []).map((d) => ({
              id: d.type,
              label: d.label,
              daysRemaining: d.daysRemaining,
            })),
            missingDocs: (docData.completeness.missingDocs ?? []).map((d) => ({
              id: d.type,
              label: d.label,
              description: d.description,
            })),
          }
        : null

      setDocuments(mappedDocuments)
      setCompleteness(mappedCompleteness)
      setRiskProfile(docData.riskProfile || null)
      setCompliance(docData.compliance || null)
      try {
        const kycData = await api.get<KycApiResponse>(`/advisor/clients/${clientId}/kyc`)

        setKycStatus(kycData)

        const mifidFromApi = kycData.mifid
        setMifid(mifidFromApi ? {
          riskProfile: mifidFromApi.riskProfile ?? undefined,
          investmentHorizon: mifidFromApi.investmentHorizon ?? undefined,
          investmentKnowledge: mifidFromApi.investmentKnowledge ?? undefined,
          investmentObjectives: mifidFromApi.investmentGoals ?? undefined,
          overallScore: (
            typeof mifidFromApi.investmentKnowledge === 'number' && typeof mifidFromApi.investmentExperience === 'number'
              ? Math.round((mifidFromApi.investmentKnowledge + mifidFromApi.investmentExperience) / 2)
              : undefined
          ),
        } : null)

        const lcbftFromApi = kycData.lcbft
        setLcbft(lcbftFromApi ? {
          isPEP: lcbftFromApi.isPEP ?? false,
          originOfFunds: lcbftFromApi.originOfFunds ?? undefined,
          enhancedDueDiligence: lcbftFromApi.enhancedDueDiligence ?? false,
          riskLevel: lcbftFromApi.riskLevel ?? undefined,
        } : null)

        setAlerts(kycData.alerts || [])
      } catch (_kycError) {
        // KYC optionnel - ne pas bloquer si erreur
        console.warn('KYC data not available')
      }
    } catch (_e) { toast({ title: 'Erreur de chargement', variant: 'destructive' }) }
    finally { setLoading(false) }
  }, [clientId, toast])

  useEffect(() => { loadAllData() }, [loadAllData])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !uploadForm.type) { toast({ title: 'Informations manquantes', variant: 'destructive' }); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', uploadForm.type)
      formData.append('name', uploadForm.name || selectedFile.name)
      formData.append('description', uploadForm.description || '')
      formData.append('category', uploadForm.category || '')
      await api.post(`/advisor/clients/${clientId}/documents`, formData)
      toast({ title: 'Document ajouté' })
      setSelectedFile(null); setUploadForm({ type: '', name: '', description: '', category: '' }); setShowUploadModal(false)
      await loadAllData()
    } catch { toast({ title: 'Échec de l\'import', variant: 'destructive' }) }
    finally { setUploading(false) }
  }

  // Document handlers
  const handleDelete = async (doc: DocumentItem) => { 
    if (!doc?.id || !confirm('Supprimer ce document ?')) return
    try { 
      await api.delete(`/advisor/documents/${doc.id}`)
      toast({ title: 'Document supprimé' })
      await loadAllData() 
    } catch { 
      toast({ title: 'Erreur de suppression', variant: 'destructive' }) 
    } 
  }
  
  const handlePreview = (doc: DocumentItem) => { if (doc?.fileUrl) window.open(doc.fileUrl, '_blank') }
  const handleDownload = (doc: DocumentItem) => { if (doc?.fileUrl) window.open(doc.fileUrl, '_blank') }
  
  const openUploadModal = (typeId = '') => { 
    setUploadForm(p => ({ ...p, type: typeId }))
    setShowUploadModal(true) 
  }
  
  const openEditDocModal = (doc: DocumentItem) => {
    setSelectedDocument(doc)
    setUploadForm({ type: doc.type || '', name: doc.name || '', description: doc.description || '', category: doc.category || '' })
    setShowEditDocModal(true)
  }
  
  const handleUpdateDocument = async () => {
    if (!selectedDocument?.id) return
    setSaving(true)
    try {
      await api.put(`/advisor/documents/${selectedDocument.id}`, {
        name: uploadForm.name,
        description: uploadForm.description,
        category: uploadForm.category,
      })
      toast({ title: 'Document mis à jour' })
      setShowEditDocModal(false)
      setSelectedDocument(null)
      await loadAllData()
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }
  
  // MIFID handlers
  const openMifidModal = () => {
    if (mifid) {
      setMifidForm({
        riskProfile: mifid.riskProfile || 'EQUILIBRE',
        investmentHorizon: mifid.investmentHorizon || 'MOYEN_TERME',
        investmentKnowledge: mifid.investmentKnowledge || 50,
        financialCapacity: mifid.financialCapacity || 50,
        riskTolerance: mifid.riskTolerance || 'MODERATE',
        investmentObjectives: mifid.investmentObjectives || [],
      })
    }
    setShowMifidModal(true)
  }
  
  const handleSaveMifid = async () => {
    setSaving(true)
    try {
      await api.put(`/advisor/clients/${clientId}/kyc/mifid`, mifidForm)
      toast({ title: 'Profil MIF II mis à jour' })
      setShowMifidModal(false)
      await loadAllData()
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }
  
  // LCB-FT handlers
  const openLcbftModal = () => {
    if (lcbft) {
      setLcbftForm({
        isPEP: lcbft.isPEP || false,
        pepDetails: lcbft.pepDetails || '',
        originOfFunds: lcbft.originOfFunds || '',
        sourceOfWealth: lcbft.sourceOfWealth || '',
        enhancedDueDiligence: lcbft.enhancedDueDiligence || false,
        riskLevel: lcbft.riskLevel || 'BASSE',
        notes: lcbft.notes || '',
      })
    }
    setShowLcbftModal(true)
  }
  
  const handleSaveLcbft = async () => {
    setSaving(true)
    try {
      await api.put(`/advisor/clients/${clientId}/kyc/lcbft`, lcbftForm)
      toast({ title: 'LCB-FT mis à jour' })
      setShowLcbftModal(false)
      await loadAllData()
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }
  
  // Declaration handlers
  const handleSignDeclaration = async (declaration: NonNullable<ComplianceData['declarations']>[number]) => {
    if (!declaration?.id) return
    setSaving(true)
    try {
      await api.post(`/advisor/clients/${clientId}/declarations/${declaration.id}/sign`, {})
      toast({ title: 'Déclaration signée' })
      await loadAllData()
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }
  
  const handleCreateDeclaration = async (type: string) => {
    setSaving(true)
    try {
      await api.post(`/advisor/clients/${clientId}/declarations`, { type })
      toast({ title: 'Déclaration créée' })
      await loadAllData()
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }
  
  // Drag & Drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragActive(true) }, [])
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); if (e.target === dropZoneRef.current) setDragActive(false) }, [])
  const onDrop = useCallback((e: React.DragEvent) => { 
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) { 
      setSelectedFile(file)
      setUploadForm(p => ({ ...p, name: p.name || file.name }))
      setShowUploadModal(true) 
    } 
  }, [])

  const documentsByType = useMemo(() => documents.reduce<Record<string, DocumentItem[]>>((acc, doc) => { if (doc?.type) { if (!acc[doc.type]) acc[doc.type] = []; acc[doc.type].push(doc) } return acc }, {}), [documents])
  const categoryStats = useMemo(() => {
    const wealthData = client.wealth as { netWealth?: number } | undefined
    const patrimoine = wealthData?.netWealth || 0
    return Object.entries(DOCUMENT_CATEGORIES).reduce<Record<string, { present: number; total: number; requiredMissing: number }>>((acc, [key, cat]) => {
      const catTyped = cat as DocCategoryConfig
      const present = catTyped.types.filter((t) => (documentsByType[t.id] || []).length > 0).length
      const requiredMissing = catTyped.types.filter((t) => t.required && (!t.threshold || patrimoine >= t.threshold) && !(documentsByType[t.id] || []).length).length
      acc[key] = { present, total: catTyped.types.length, requiredMissing }
      return acc
    }, {})
  }, [documentsByType, client.wealth])
  const allDocumentTypes = useMemo(() => getAllDocumentTypes(), [])

  if (loading) return <div className="flex items-center justify-center py-24"><RefreshCw className="h-6 w-6 animate-spin mr-2" />Chargement…</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <FolderOpen className="h-6 w-6 text-primary-600" />
            </div>
            Documents & Conformité
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-14">Gestion documentaire, KYC, MIFID II et LCB-FT</p>
        </div>
        <div className="flex gap-3"><Button variant="outline" onClick={loadAllData}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button><Button onClick={() => openUploadModal()}><Upload className="h-4 w-4 mr-2" />Importer</Button></div>
      </header>

      {/* Alerts */}
      {alerts.map((a, i) => <Alert key={i} className={cn('border-l-4', a.severity === 'CRITIQUE' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500')}><AlertTriangle className="w-5 h-5" /><AlertDescription className="ml-2">{a.message}</AlertDescription></Alert>)}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Target className="w-5 h-5 text-blue-600" /><span className="text-sm text-gray-600">Complétude</span></div><div className="text-2xl font-bold">{completeness?.score || 0}%</div><Progress value={completeness?.score || 0} className="h-2 mt-2" /><p className="text-xs text-muted-foreground mt-1">{completeness?.completed || 0}/{completeness?.totalRequired || 0} docs requis</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Shield className="w-5 h-5 text-green-600" /><span className="text-sm text-gray-600">Statut KYC</span></div><Badge className={cn(kycStatus?.status === 'TERMINE' ? 'bg-green-100 text-green-800' : kycStatus?.status === 'EXPIRE' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800')}>{kycStatus?.status === 'TERMINE' ? 'Vérifié' : kycStatus?.status === 'EXPIRE' ? 'Expiré' : 'En attente'}</Badge><Progress value={kycStatus?.completionRate || 0} className="h-2 mt-2" /></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Scale className="w-5 h-5 text-purple-600" /><span className="text-sm text-gray-600">Score MIF II</span></div><div className="text-2xl font-bold">{mifid?.overallScore || 0}/100</div>{mifid?.riskProfile && <Badge className={cn('text-xs mt-1', RISK_PROFILE_CONFIG[mifid.riskProfile]?.color)}>{RISK_PROFILE_CONFIG[mifid.riskProfile]?.label}</Badge>}</CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><FileWarning className="w-5 h-5 text-orange-600" /><span className="text-sm text-gray-600">Risque LCB-FT</span></div>{lcbft?.riskLevel && <Badge className={cn(LCBFT_RISK_CONFIG[lcbft.riskLevel]?.color)}>{LCBFT_RISK_CONFIG[lcbft.riskLevel]?.label}</Badge>}{lcbft?.isPEP && <Badge className="ml-2 bg-red-100 text-red-800 text-xs">PEP</Badge>}</CardContent></Card>
      </div>

      {/* Completeness Score */}
      {completeness && (
        <section className={`rounded-xl p-6 border ${SECTION_GRADIENT[completeness.status]}`}>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div><p className="text-sm font-medium">Complétude globale</p><div className="mt-1 flex items-baseline gap-3"><span className="text-4xl font-semibold">{completeness.score}%</span><Badge className={STATUS_BADGE[completeness.status]}>{completeness.status}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{completeness.completed} documents requis sur {completeness.totalRequired}</p></div>
            <div className="flex-1"><Progress value={completeness.score} className="h-2" /><div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4"><StatsTile icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />} label="Présents" value={completeness.completed} /><StatsTile icon={<FileWarning className="h-4 w-4 text-rose-600" />} label="Manquants" value={completeness.missing} highlight /><StatsTile icon={<Clock className="h-4 w-4 text-amber-500" />} label="Expire bientôt" value={completeness.expiringDocs?.length || 0} /><StatsTile icon={<FolderOpen className="h-4 w-4" />} label="Total" value={documents.length} /></div></div>
          </div>
          {completeness.missingDocs?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{completeness.missingDocs.slice(0, 6).map((d, i) => <Badge key={i} variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">{d.label}</Badge>)}{completeness.missingDocs.length > 6 && <Badge variant="secondary">+{completeness.missingDocs.length - 6}</Badge>}</div>}
        </section>
      )}

      {/* Drag & Drop */}
      <section ref={dropZoneRef} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} className={`transition-all rounded-xl border-2 p-6 ${dragActive ? 'border-emerald-400 bg-emerald-50' : 'border-dashed border-slate-200 bg-white'}`}>
        <div className="flex flex-col items-center text-center text-sm text-muted-foreground"><Paperclip className={`h-6 w-6 ${dragActive ? 'text-emerald-600' : 'text-slate-400'}`} />{dragActive ? <p className="text-emerald-700 font-medium mt-2">Déposez votre fichier ici</p> : <><p className="font-medium mt-2">Glissez-déposez vos documents</p><p className="text-xs">PDF, PNG, JPG, DOCX (max 10 Mo)</p><Button variant="secondary" size="sm" className="mt-3" onClick={() => openUploadModal()}><Upload className="mr-2 h-4 w-4" />Sélectionner</Button></>}</div>
      </section>

      {/* Alerts for expiring/missing */}
      {completeness?.expiringDocs?.length > 0 && <Alert className="border-amber-200 bg-amber-50"><Clock className="h-4 w-4 text-amber-600" /><AlertDescription className="text-amber-800"><p className="font-semibold">Documents arrivant à expiration</p><ul className="grid gap-2 sm:grid-cols-2 mt-2">{completeness.expiringDocs.map((d) => <li key={d.id} className="flex justify-between rounded bg-white/70 px-3 py-2 text-xs"><span>{d.label}</span><span className="text-amber-600">{d.daysRemaining}j</span></li>)}</ul></AlertDescription></Alert>}
      {completeness?.missingDocs?.length > 0 && <Alert className="border-rose-200 bg-rose-50"><AlertCircle className="h-4 w-4 text-rose-600" /><AlertDescription className="text-rose-800"><p className="font-semibold">Documents obligatoires manquants</p><ul className="grid gap-2 sm:grid-cols-2 mt-2">{completeness.missingDocs.slice(0, 8).map((d) => <li key={d.id} className="rounded bg-white/70 px-3 py-2 text-xs"><span className="font-medium">{d.label}</span>{d.description && <span className="block text-slate-500">{d.description}</span>}</li>)}</ul></AlertDescription></Alert>}

      {/* Tabs */}
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
        <TabsList className="bg-white border"><TabsTrigger value="documents"><FileText className="h-4 w-4 mr-2" />Documents</TabsTrigger><TabsTrigger value="mifid"><Scale className="h-4 w-4 mr-2" />MIF II</TabsTrigger><TabsTrigger value="lcbft"><Shield className="h-4 w-4 mr-2" />LCB-FT</TabsTrigger><TabsTrigger value="compliance"><ShieldCheck className="h-4 w-4 mr-2" />Déclarations</TabsTrigger></TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6 space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {riskProfile && <Card><CardHeader className="border-b bg-slate-50/60"><div className="flex justify-between"><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#7373FF]" />Profil MIFID</CardTitle><Badge className={RISK_PROFILE_STATUS_BADGE[riskProfile.status]}>{riskProfile.status === 'TERMINE' ? 'Complété' : riskProfile.status === 'EN_ATTENTE' ? 'En attente' : 'Expiré'}</Badge></div></CardHeader><CardContent className="p-5 space-y-4"><div className="grid grid-cols-2 gap-4"><div className="rounded-lg border bg-slate-50 p-4"><p className="text-xs text-muted-foreground">Score</p><p className="text-2xl font-bold">{riskProfile.score}/10</p></div><div className="rounded-lg border bg-slate-50 p-4"><p className="text-xs text-muted-foreground">Catégorie</p><p className="text-lg font-semibold">{riskProfile.category}</p></div></div><p className="text-xs text-muted-foreground">Dernière évaluation: {formatDate(riskProfile.lastAssessment)}</p>{riskProfile.status === 'EXPIRE' && <Alert className="border-amber-200 bg-amber-50"><AlertDescription className="text-amber-800 text-xs">Le questionnaire doit être renouvelé.</AlertDescription></Alert>}{riskProfile.status === 'EN_ATTENTE' && <Button variant="outline" size="sm" className="w-full"><FileText className="h-4 w-4 mr-2" />Compléter le questionnaire</Button>}</CardContent></Card>}
            {compliance && <Card><CardHeader className="border-b bg-slate-50/60"><div className="flex justify-between"><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" />Conformité LCB-FT</CardTitle><Badge className={COMPLIANCE_STATUS_BADGE[compliance.lcbFtStatus]}>{compliance.lcbFtStatus === 'COMPLIANT' ? 'Conforme' : compliance.lcbFtStatus === 'EN_ATTENTE' ? 'En cours' : 'Non conforme'}</Badge></div></CardHeader><CardContent className="p-5 space-y-4"><p className="text-sm font-medium">Déclarations</p><ul className="space-y-2">{compliance.declarations?.map((d, i) => <li key={i} className="flex justify-between rounded-lg border px-4 py-3"><div className="flex items-center gap-3">{d.status === 'SIGNE' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Clock className="h-4 w-4 text-amber-500" />}<span className="text-sm">{d.type}</span></div><Badge variant="outline" className={d.status === 'SIGNE' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}>{d.status === 'SIGNE' ? 'Signé' : 'En attente'}</Badge></li>)}</ul>{compliance.lcbFtStatus === 'NON_COMPLIANT' && <Alert className="border-rose-200 bg-rose-50"><AlertDescription className="text-rose-800 text-xs">Des documents sont manquants.</AlertDescription></Alert>}</CardContent></Card>}
          </div>
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2">{Object.entries(DOCUMENT_CATEGORIES).map(([key, cat]) => { const catTyped = cat as DocCategoryConfig; const s = categoryStats[key]; return <Button key={key} variant={activeDocCategory === key ? 'default' : 'outline'} size="sm" onClick={() => setActiveDocCategory(key)} className="flex flex-col gap-1 h-auto py-2 whitespace-nowrap"><span className="font-semibold">{catTyped.label}</span><span className="text-[10px] opacity-80">{s?.present || 0}/{s?.total || 0} • {s?.requiredMissing || 0} manquants</span></Button> })}</div>
            {Object.entries(DOCUMENT_CATEGORIES).map(([catKey, cat]) => { if (activeDocCategory !== catKey) return null; const catTyped = cat as DocCategoryConfig; return <Card key={catKey}><CardHeader className="border-b bg-slate-50/60"><div className="flex justify-between"><CardTitle>{catTyped.label}</CardTitle>{catTyped.required && <Badge variant="destructive">Obligatoire</Badge>}</div><p className="text-xs text-muted-foreground">{catTyped.description || 'Vérifiez les documents requis.'}</p></CardHeader><CardContent className="divide-y p-0">{catTyped.types.map((docType) => { const docs = documentsByType[docType.id] || []; const wealthData = client.wealth as { netWealth?: number } | undefined; const patrimoine = wealthData?.netWealth || 0; const isReq = docType.required && (!docType.threshold || patrimoine >= docType.threshold); return <DocumentRow key={docType.id} docType={docType} documents={docs} onUpload={() => openUploadModal(docType.id)} onPreview={handlePreview} onDownload={handleDownload} onEdit={openEditDocModal} onDelete={handleDelete} isRequired={isReq} /> })}</CardContent></Card> })}
          </div>
        </TabsContent>

        {/* MIF II Tab */}
        <TabsContent value="mifid" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-600" />Profil MIF II
                  </CardTitle>
                  <CardDescription>Évaluation du profil investisseur selon MIF II</CardDescription>
                </div>
                <Button onClick={openMifidModal}>
                  <FileText className="h-4 w-4 mr-2" />{mifid ? 'Modifier' : 'Compléter'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {mifid ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Profil de risque</p>
                      <Badge className={cn('mt-1', RISK_PROFILE_CONFIG[mifid.riskProfile]?.color)}>
                        {RISK_PROFILE_CONFIG[mifid.riskProfile]?.label || mifid.riskProfile}
                      </Badge>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Horizon d'investissement</p>
                      <p className="font-medium mt-1">{mifid.investmentHorizon || '-'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Tolérance au risque</p>
                      <p className="font-medium mt-1">{mifid.riskTolerance || '-'}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600">Score global</p>
                      <p className="text-2xl font-bold text-purple-600">{mifid.overallScore || 0}/100</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Connaissance des marchés financiers</span>
                        <span className="font-medium">{mifid.investmentKnowledge || 0}%</span>
                      </div>
                      <Progress value={mifid.investmentKnowledge || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Capacité financière</span>
                        <span className="font-medium">{mifid.financialCapacity || 0}%</span>
                      </div>
                      <Progress value={mifid.financialCapacity || 0} className="h-2" />
                    </div>
                  </div>
                  
                  {mifid.investmentObjectives?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Objectifs d'investissement</p>
                      <div className="flex flex-wrap gap-2">
                        {mifid.investmentObjectives.map((obj: string, i: number) => (
                          <Badge key={i} variant="outline">{obj}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {mifid.recommendation && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <h4 className="font-medium text-purple-900 mb-2">Recommandation</h4>
                      <p className="text-sm text-purple-800">{mifid.recommendation}</p>
                    </div>
                  )}
                  
                  {mifid.lastAssessment && (
                    <p className="text-xs text-muted-foreground">
                      Dernière évaluation : {formatDate(mifid.lastAssessment)}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Profil MIF II non complété</p>
                  <Button onClick={openMifidModal}>
                    <FileText className="h-4 w-4 mr-2" />Compléter le questionnaire
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LCB-FT Tab */}
        <TabsContent value="lcbft" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileWarning className="w-5 h-5 text-orange-600" />LCB-FT
                  </CardTitle>
                  <CardDescription>Lutte contre le blanchiment de capitaux et le financement du terrorisme</CardDescription>
                </div>
                <Button onClick={openLcbftModal}>
                  <FileText className="h-4 w-4 mr-2" />{lcbft ? 'Modifier' : 'Compléter'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {lcbft ? (
                <>
                  {lcbft.isPEP && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <AlertDescription className="ml-2 font-medium text-red-900">
                        PEP détecté - Vigilance renforcée obligatoire
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {lcbft.enhancedDueDiligence && !lcbft.isPEP && (
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <span className="text-orange-800 font-medium">Vigilance renforcée requise</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Niveau de risque</p>
                      <Badge className={cn('mt-1', LCBFT_RISK_CONFIG[lcbft.riskLevel]?.color)}>
                        {LCBFT_RISK_CONFIG[lcbft.riskLevel]?.label || lcbft.riskLevel}
                      </Badge>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Statut PEP</p>
                      <Badge className={lcbft.isPEP ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {lcbft.isPEP ? 'Oui' : 'Non'}
                      </Badge>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Vigilance</p>
                      <Badge className={lcbft.enhancedDueDiligence ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                        {lcbft.enhancedDueDiligence ? 'Renforcée' : 'Standard'}
                      </Badge>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Dernière revue</p>
                      <p className="font-medium text-sm">{lcbft.lastReview ? formatDate(lcbft.lastReview) : 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-600 mb-2">Origine des fonds</p>
                      <p className="font-medium">{lcbft.originOfFunds || 'Non renseigné'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-600 mb-2">Source du patrimoine</p>
                      <p className="font-medium">{lcbft.sourceOfWealth || 'Non renseigné'}</p>
                    </div>
                  </div>
                  
                  {lcbft.pepDetails && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-sm font-medium text-red-900 mb-1">Détails PEP</p>
                      <p className="text-sm text-red-800">{lcbft.pepDetails}</p>
                    </div>
                  )}
                  
                  {lcbft.notes && (
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-gray-600">{lcbft.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <FileWarning className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Évaluation LCB-FT non complétée</p>
                  <Button onClick={openLcbftModal}>
                    <FileText className="h-4 w-4 mr-2" />Compléter l'évaluation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Declarations Tab */}
        <TabsContent value="compliance" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-600" />Déclarations réglementaires
                  </CardTitle>
                  <CardDescription>Gestion des déclarations et consentements clients</CardDescription>
                </div>
                <Button variant="outline" onClick={() => handleCreateDeclaration('CONSENTEMENT_RGPD')}>
                  <Plus className="h-4 w-4 mr-2" />Nouvelle déclaration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {compliance?.declarations?.length > 0 ? (
                <div className="space-y-3">
                  {compliance.declarations.map((d, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-4">
                        {d.status === 'SIGNE' ? (
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-orange-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{d.type}</p>
                          {d.status === 'SIGNE' && d.date && (
                            <p className="text-sm text-gray-500">Signé le {formatDate(d.date)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={d.status === 'SIGNE' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                          {d.status === 'SIGNE' ? 'Signé' : 'En attente'}
                        </Badge>
                        {d.status === 'EN_ATTENTE' && (
                          <Button size="sm" onClick={() => handleSignDeclaration(d)} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Faire signer'}
                          </Button>
                        )}
                        {d.status === 'SIGNE' && (
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />Voir
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShieldCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Aucune déclaration enregistrée</p>
                  <Button onClick={() => handleCreateDeclaration('CONSENTEMENT_RGPD')}>
                    <Plus className="h-4 w-4 mr-2" />Créer une déclaration
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={(o) => { setShowUploadModal(o); if (!o) { setSelectedFile(null); setUploadForm({ type: '', name: '', description: '', category: '' }) } }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Uploader un document</DialogTitle><DialogDescription>Sélectionnez le type et importez votre fichier.</DialogDescription></DialogHeader><form onSubmit={handleUpload} className="space-y-4"><div className="space-y-2"><Label>Type de document *</Label><Select value={uploadForm.type} onValueChange={(v) => setUploadForm(p => ({ ...p, type: v }))}><SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent className="max-h-80">{(allDocumentTypes as DocTypeOption[]).map((t) => <SelectItem key={t.value} value={t.value}>{t.label} {t.required ? '⭐' : ''}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Catégorie</Label><Select value={uploadForm.category} onValueChange={(v) => setUploadForm(p => ({ ...p, category: v }))}><SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger><SelectContent>{Object.entries(DOCUMENT_CATEGORIES).map(([k, c]) => <SelectItem key={k} value={k}>{(c as DocCategoryConfig).label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Fichier *</Label><div className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed p-6 text-center text-sm hover:border-slate-300" onClick={() => fileInputRef.current?.click()}>{selectedFile ? <><Paperclip className="h-6 w-6 text-emerald-600" /><p className="mt-2 font-medium">{selectedFile.name}</p></> : <><Upload className="h-6 w-6 text-slate-400" /><p className="mt-2 font-medium">Cliquez pour parcourir</p></>}<Input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setSelectedFile(f); setUploadForm(p => ({ ...p, name: p.name || f.name })) } }} /></div></div><div className="space-y-2"><Label>Nom</Label><Input value={uploadForm.name} onChange={(e) => setUploadForm(p => ({ ...p, name: e.target.value }))} placeholder="Nom du document" /></div><div className="space-y-2"><Label>Description</Label><Input value={uploadForm.description} onChange={(e) => setUploadForm(p => ({ ...p, description: e.target.value }))} placeholder="Notes" /></div><DialogFooter className="border-t pt-4"><Button type="button" variant="outline" onClick={() => setShowUploadModal(false)}>Annuler</Button><Button type="submit" disabled={uploading || !selectedFile || !uploadForm.type}>{uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Import…</> : <><Upload className="h-4 w-4 mr-2" />Uploader</>}</Button></DialogFooter></form></DialogContent></Dialog>
      {/* MIFID Modal */}
      <Dialog open={showMifidModal} onOpenChange={setShowMifidModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-purple-600" />
              {mifid ? 'Modifier le profil MIF II' : 'Compléter le profil MIF II'}
            </DialogTitle>
            <DialogDescription>
              Évaluation du profil investisseur selon la directive MIF II
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Profil de risque *</Label>
                <Select 
                  value={mifidForm.riskProfile} 
                  onValueChange={(v) => setMifidForm(p => ({ ...p, riskProfile: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRUDENT">Prudent</SelectItem>
                    <SelectItem value="EQUILIBRE">Équilibré</SelectItem>
                    <SelectItem value="DYNAMIQUE">Dynamique</SelectItem>
                    <SelectItem value="OFFENSIF">Offensif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horizon d'investissement *</Label>
                <Select 
                  value={mifidForm.investmentHorizon} 
                  onValueChange={(v) => setMifidForm(p => ({ ...p, investmentHorizon: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COURT_TERME">Court terme (&lt; 2 ans)</SelectItem>
                    <SelectItem value="MOYEN_TERME">Moyen terme (2-5 ans)</SelectItem>
                    <SelectItem value="LONG_TERME">Long terme (5-10 ans)</SelectItem>
                    <SelectItem value="TRES_LONG_TERME">Très long terme (&gt; 10 ans)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tolérance au risque *</Label>
                <Select 
                  value={mifidForm.riskTolerance} 
                  onValueChange={(v) => setMifidForm(p => ({ ...p, riskTolerance: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSERVATIVE">Conservateur - Préservation du capital</SelectItem>
                    <SelectItem value="MODERATE">Modéré - Croissance stable</SelectItem>
                    <SelectItem value="AGGRESSIVE">Agressif - Recherche de performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Connaissance des marchés (%)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={mifidForm.investmentKnowledge}
                  onChange={(e) => setMifidForm(p => ({ ...p, investmentKnowledge: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Capacité financière (%)</Label>
              <Input 
                type="number" 
                min="0" 
                max="100" 
                value={mifidForm.financialCapacity}
                onChange={(e) => setMifidForm(p => ({ ...p, financialCapacity: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">
                Capacité à supporter des pertes financières
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Objectifs d'investissement</Label>
              <div className="grid grid-cols-2 gap-2">
                {['Préparation retraite', 'Constitution patrimoine', 'Revenus complémentaires', 'Transmission', 'Projet immobilier', 'Épargne de précaution'].map((obj) => (
                  <label key={obj} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={mifidForm.investmentObjectives.includes(obj)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setMifidForm(p => ({ ...p, investmentObjectives: [...p.investmentObjectives, obj] }))
                        } else {
                          setMifidForm(p => ({ ...p, investmentObjectives: p.investmentObjectives.filter(o => o !== obj) }))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    {obj}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowMifidModal(false)}>Annuler</Button>
            <Button onClick={handleSaveMifid} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enregistrement...</> : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LCB-FT Modal */}
      <Dialog open={showLcbftModal} onOpenChange={setShowLcbftModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5 text-orange-600" />
              {lcbft ? 'Modifier l\'évaluation LCB-FT' : 'Compléter l\'évaluation LCB-FT'}
            </DialogTitle>
            <DialogDescription>
              Lutte contre le blanchiment de capitaux et le financement du terrorisme
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Niveau de risque *</Label>
                <Select 
                  value={lcbftForm.riskLevel} 
                  onValueChange={(v) => setLcbftForm(p => ({ ...p, riskLevel: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Faible</SelectItem>
                    <SelectItem value="MEDIUM">Moyen</SelectItem>
                    <SelectItem value="HIGH">Élevé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut PEP</Label>
                <div className="flex items-center gap-4 h-10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={lcbftForm.isPEP}
                      onChange={(e) => setLcbftForm(p => ({ ...p, isPEP: e.target.checked, enhancedDueDiligence: e.target.checked ? true : p.enhancedDueDiligence }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Personne Politiquement Exposée</span>
                  </label>
                </div>
              </div>
            </div>
            
            {lcbftForm.isPEP && (
              <div className="space-y-2">
                <Label>Détails PEP</Label>
                <Input 
                  value={lcbftForm.pepDetails}
                  onChange={(e) => setLcbftForm(p => ({ ...p, pepDetails: e.target.value }))}
                  placeholder="Fonction, mandat, période..."
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origine des fonds *</Label>
                <Select 
                  value={lcbftForm.originOfFunds} 
                  onValueChange={(v) => setLcbftForm(p => ({ ...p, originOfFunds: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALAIRE">Salaire / Revenus professionnels</SelectItem>
                    <SelectItem value="HERITAGE">Héritage / Donation</SelectItem>
                    <SelectItem value="VENTE_IMMOBILIER">Vente immobilière</SelectItem>
                    <SelectItem value="VENTE_ENTREPRISE">Cession d'entreprise</SelectItem>
                    <SelectItem value="EPARGNE">Épargne accumulée</SelectItem>
                    <SelectItem value="AUTRE">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source du patrimoine *</Label>
                <Select 
                  value={lcbftForm.sourceOfWealth} 
                  onValueChange={(v) => setLcbftForm(p => ({ ...p, sourceOfWealth: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVITE_PROFESSIONNELLE">Activité professionnelle</SelectItem>
                    <SelectItem value="INVESTISSEMENTS">Investissements</SelectItem>
                    <SelectItem value="HERITAGE">Héritage</SelectItem>
                    <SelectItem value="IMMOBILIER">Immobilier</SelectItem>
                    <SelectItem value="ENTREPRISE">Entreprise</SelectItem>
                    <SelectItem value="AUTRE">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={lcbftForm.enhancedDueDiligence}
                  onChange={(e) => setLcbftForm(p => ({ ...p, enhancedDueDiligence: e.target.checked }))}
                  className="rounded border-gray-300"
                  disabled={lcbftForm.isPEP}
                />
                <span className="text-sm">Vigilance renforcée requise</span>
              </label>
              <p className="text-xs text-muted-foreground ml-6">
                Automatiquement activé pour les PEP
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Notes complémentaires</Label>
              <Input 
                value={lcbftForm.notes}
                onChange={(e) => setLcbftForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Informations complémentaires..."
              />
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowLcbftModal(false)}>Annuler</Button>
            <Button onClick={handleSaveLcbft} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enregistrement...</> : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Modal */}
      <Dialog open={showEditDocModal} onOpenChange={(o) => { setShowEditDocModal(o); if (!o) setSelectedDocument(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier le document</DialogTitle>
            <DialogDescription>Modifier les informations du document</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du document</Label>
              <Input 
                value={uploadForm.name}
                onChange={(e) => setUploadForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nom du document"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={uploadForm.description}
                onChange={(e) => setUploadForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Description ou notes"
              />
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select 
                value={uploadForm.category} 
                onValueChange={(v) => setUploadForm(p => ({ ...p, category: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_CATEGORIES).map(([k, c]) => (
                    <SelectItem key={k} value={k}>{(c as DocCategoryConfig).label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowEditDocModal(false)}>Annuler</Button>
            <Button onClick={handleUpdateDocument} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enregistrement...</> : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper Components
function StatsTile({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: number | string; highlight?: boolean }) {
  return <div className={`flex items-center gap-3 rounded-lg border bg-white px-3 py-2 ${highlight ? 'border-rose-200 text-rose-700' : 'border-slate-200'}`}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">{icon}</span><div><p className="text-xs uppercase text-muted-foreground">{label}</p><p className="text-base font-semibold">{value}</p></div></div>
}

function DocumentRow({ docType, documents, onUpload, onPreview, onDownload, onEdit, onDelete, isRequired }: { 
  docType: DocTypeConfig
  documents: DocumentItem[]
  onUpload: () => void
  onPreview: (d: DocumentItem) => void
  onDownload: (d: DocumentItem) => void
  onEdit: (d: DocumentItem) => void
  onDelete: (d: DocumentItem) => void
  isRequired: boolean 
}) {
  const docs = [...(documents || [])].sort((a, b) => new Date(b?.uploadedAt || b?.createdAt || 0).getTime() - new Date(a?.uploadedAt || a?.createdAt || 0).getTime())
  const hasDocs = docs.length > 0
  const statusIcon = hasDocs ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : isRequired ? <AlertCircle className="h-5 w-5 text-rose-500" /> : <FileText className="h-5 w-5 text-slate-300" />
  
  return (
    <div className="space-y-4 px-5 py-4 hover:bg-slate-50">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">{statusIcon}</span>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{docType.label}</h3>
              {isRequired && <Badge variant="destructive">Requis</Badge>}
              {docType.threshold && <Badge variant="outline">≥ {docType.threshold.toLocaleString('fr-FR')}€</Badge>}
              {hasDocs && <Badge variant="outline">{docs.length} doc{docs.length > 1 ? 's' : ''}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{docType.description}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onUpload}>
          <Upload className="h-4 w-4 mr-1" />Importer
        </Button>
      </div>
      {hasDocs ? (
        <ul className="space-y-3">
          {docs.map((doc) => (
            <li key={doc.id} className="rounded-lg border bg-white px-4 py-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{doc.name || docType.label}</span>
                    <Badge variant="outline">Interne</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ajouté le {formatDate(doc.uploadedAt || doc.createdAt)}
                    {doc.description && ` • ${doc.description}`}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => onPreview(doc)}>
                    <Eye className="h-4 w-4 mr-1" />Voir
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDownload(doc)}>
                    <Download className="h-4 w-4 mr-1" />Télécharger
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onEdit(doc)}>
                    <Pencil className="h-4 w-4 mr-1" />Modifier
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => onDelete(doc)}>
                    <Trash2 className="h-4 w-4 mr-1" />Supprimer
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border-dashed border bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
          Aucun document. Utilisez l'import.
        </div>
      )}
    </div>
  )
}

export default TabDocumentsConformite
