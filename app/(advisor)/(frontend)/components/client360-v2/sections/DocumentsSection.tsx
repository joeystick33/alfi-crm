'use client'

/**
 * DocumentsSection - Section Documents & Conformité du Client360 V2
 * 
 * UTILISE LES VRAIES APIS
 */

import { useMemo, type ElementType } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { cn } from '@/app/_common/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Progress } from '@/app/_common/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { useToast } from '@/app/_common/hooks/use-toast'
import { api } from '@/app/_common/lib/api-client'
import type { ClientDetail, WealthSummary, Document } from '@/app/_common/lib/api-types'
import {
  FileText,
  Shield,
  FileCheck,
  Download,
  Upload,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileImage,
  File,
  ExternalLink,
} from 'lucide-react'

interface DocumentsSectionProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
  activeItem?: string
  onNavigate: (sectionId: string, itemId?: string) => void
}

type KycSectionApi = {
  id: string
  label: string
  status: 'complete' | 'partial' | 'warning'
  progress: number
}

type KycApiData = {
  completionScore?: number
  score?: number
  lastUpdate?: string
  updatedAt?: string
  nextReviewDate?: string
  nextReview?: string
  sections?: KycSectionApi[]
}

// =============================================================================
// Hooks pour les appels API
// =============================================================================

function useClientDocuments(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'documents'],
    queryFn: async () => {
      const response = await api.get<{ data: Document[] } | Document[]>(`/advisor/clients/${clientId}/documents`)
      return Array.isArray(response) ? response : response?.data || []
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
  })
}

function useClientKYC(clientId: string) {
  return useQuery<KycApiData | null>({
    queryKey: ['clients', clientId, 'kyc'],
    queryFn: async (): Promise<KycApiData | null> => {
      const response = await api.get<{ data?: Record<string, unknown> } | Record<string, unknown>>(`/advisor/clients/${clientId}/kyc`)

      const raw = (response && typeof response === 'object' && 'data' in response)
        ? ((response as { data?: unknown }).data ?? null)
        : response

      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return null
      }

      const obj = raw as Record<string, unknown>

      const sectionsRaw = obj.sections
      const sections: KycSectionApi[] | undefined = Array.isArray(sectionsRaw)
        ? (sectionsRaw as Array<Record<string, unknown>>).map((s, idx) => ({
            id: typeof s.id === 'string' ? s.id : `section-${idx}`,
            label: typeof s.label === 'string' ? s.label : 'Section',
            status:
              s.status === 'complete' || s.status === 'partial' || s.status === 'warning'
                ? (s.status as KycSectionApi['status'])
                : 'partial',
            progress: typeof s.progress === 'number' ? s.progress : Number(s.progress) || 0,
          }))
        : undefined

      const toNumber = (value: unknown): number => {
        if (typeof value === 'number') return Number.isFinite(value) ? value : 0
        const n = Number(value)
        return Number.isFinite(n) ? n : 0
      }

      return {
        completionScore: toNumber(obj.completionScore),
        score: toNumber(obj.score),
        lastUpdate: typeof obj.lastUpdate === 'string' ? obj.lastUpdate : undefined,
        updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
        nextReviewDate: typeof obj.nextReviewDate === 'string' ? obj.nextReviewDate : undefined,
        nextReview: typeof obj.nextReview === 'string' ? obj.nextReview : undefined,
        sections,
      }
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
  })
}

// =============================================================================
// Helpers
// =============================================================================

 
function normalizeArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value
  if (value?.data && Array.isArray(value.data)) return value.data
  if (value?.items && Array.isArray(value.items)) return value.items
  if (value && typeof value === 'object') {
    const vals = Object.values(value)
    if (vals.every(v => typeof v === 'object')) return vals as T[]
  }
  return []
}

function toDateSafe(value: unknown): Date | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function getDocumentStatus(doc: Document): 'valid' | 'expiring' | 'missing' | 'expired' {
  if (!doc.signedAt && !doc.createdAt && !(doc as Record<string, unknown>).createdAt) return 'missing'
  
  const expiresAt = (doc as Record<string, unknown>).expiresAt || (doc as Record<string, unknown>).expirationDate
  if (expiresAt) {
    const expDate = toDateSafe(expiresAt)
    if (!expDate) return 'valid'
    const now = new Date()
    const diffDays = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays < 0) return 'expired'
    if (diffDays < 60) return 'expiring'
  }
  return 'valid'
}

// Export types config
const exportTypes = [
  { id: '1', name: 'Rapport patrimonial complet', format: 'PDF', icon: FileText },
  { id: '2', name: 'Synthèse client', format: 'PDF', icon: FileText },
  { id: '3', name: 'Export données', format: 'Excel', icon: File },
  { id: '4', name: 'Fiche KYC', format: 'PDF', icon: Shield },
]

// =============================================================================
// Composants internes
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

function EmptyState({ message, icon: Icon }: { message: string; icon: ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 bg-gray-100 rounded-full mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  )
}

interface DocumentRowData {
  id: string
  name: string
  type?: string
  status: 'valid' | 'expiring' | 'expired' | 'missing'
  createdAt?: string | Date | null
  expiresAt?: string | Date | null
}

function DocumentRow({ doc }: { doc: DocumentRowData }) {
  const statusConfig = {
    valid: { label: 'Valide', color: 'success', icon: CheckCircle2 },
    expiring: { label: 'Expire bientôt', color: 'warning', icon: AlertTriangle },
    expired: { label: 'Expiré', color: 'error', icon: AlertTriangle },
    missing: { label: 'Manquant', color: 'error', icon: AlertTriangle },
  }
  
  const status = statusConfig[doc.status]
  const StatusIcon = status.icon
  
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <FileImage className="h-5 w-5 text-gray-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
        <p className="text-xs text-gray-500">
          {doc.createdAt ? `Ajouté le ${new Date(doc.createdAt).toLocaleDateString('fr-FR')}` : 'Non fourni'}
        </p>
      </div>
      <Badge variant={status.color as any} size="xs" className="gap-1">
        <StatusIcon className="h-3 w-3" />
        {status.label}
      </Badge>
      <div className="flex items-center gap-1">
        {doc.status !== 'missing' && (
          <>
            <button className="p-1.5 rounded hover:bg-gray-200 text-gray-500">
              <Eye className="h-4 w-4" />
            </button>
            <button className="p-1.5 rounded hover:bg-gray-200 text-gray-500">
              <Download className="h-4 w-4" />
            </button>
          </>
        )}
        {doc.status === 'missing' && (
          <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
            <Upload className="h-3 w-3" />
            Ajouter
          </Button>
        )}
      </div>
    </div>
  )
}

interface KYCSectionData {
  id: string
  label: string
  status: 'complete' | 'partial' | 'warning'
  progress: number
}

function KYCSection({ section }: { section: KYCSectionData }) {
  const statusConfig = {
    complete: { color: 'emerald', icon: CheckCircle2 },
    partial: { color: 'amber', icon: Clock },
    warning: { color: 'red', icon: AlertTriangle },
  }
  
  const status = statusConfig[section.status as keyof typeof statusConfig]
  const StatusIcon = status.icon
  
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <StatusIcon className={cn('h-5 w-5', `text-${status.color}-600`)} />
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{section.label}</p>
      </div>
      <div className="w-24">
        <Progress value={section.progress} className="h-1.5" />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8 text-right">{section.progress}%</span>
    </div>
  )
}

export default function DocumentsSection({
  clientId,
  client,
  wealth,
  activeItem = 'documents',
  onNavigate,
}: DocumentsSectionProps) {
  const { toast } = useToast()
  
  // Appels API réels
  const { data: rawDocuments, isLoading: isLoadingDocs, refetch: refetchDocs } = useClientDocuments(clientId)
  const { data: kycData, isLoading: isLoadingKYC } = useClientKYC(clientId)
  
  // Normaliser les documents
  const documents = useMemo(() => normalizeArray<Document>(rawDocuments), [rawDocuments])
  
  // Transformer les documents API en format affichable
  const formattedDocs: DocumentRowData[] = useMemo(() => {
    return documents
      .filter((doc): doc is Document => doc !== null && doc !== undefined && typeof doc === 'object' && 'id' in doc)
      .map((doc: Document) => ({
        id: doc.id,
        name: doc.name || (doc as any).type || 'Document',
        type: (doc as any).type,
        status: getDocumentStatus(doc),
        createdAt: doc.createdAt,
        expiresAt: (doc as Record<string, unknown>).expiresAt as string | undefined,
      }))
  }, [documents])
  
  // Stats calculées depuis les vraies données
  const stats = useMemo(() => {
    return {
      total: formattedDocs.length,
      valid: formattedDocs.filter(d => d.status === 'valid').length,
      expiring: formattedDocs.filter(d => d.status === 'expiring').length,
      missing: formattedDocs.filter(d => d.status === 'missing').length,
    }
  }, [formattedDocs])
  
  // KYC data avec fallback
  const kyc = useMemo(() => {
    if (kycData) {
      return {
        score: kycData.completionScore || kycData.score || 0,
        lastUpdate: kycData.lastUpdate || kycData.updatedAt || new Date().toISOString(),
        nextReview: kycData.nextReviewDate || kycData.nextReview || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        sections: kycData.sections || [
          { id: 'identite', label: 'Identité', status: 'complete' as const, progress: 100 },
          { id: 'situation', label: 'Situation professionnelle', status: 'complete' as const, progress: 100 },
          { id: 'patrimoine', label: 'Connaissance patrimoine', status: 'partial' as const, progress: 75 },
          { id: 'objectifs', label: 'Objectifs d\'investissement', status: 'partial' as const, progress: 50 },
          { id: 'risque', label: 'Profil de risque', status: 'complete' as const, progress: 100 },
        ],
      }
    }
    // Fallback basé sur le client
    const kycStatus = client.kycStatus
    const score = kycStatus === 'COMPLETE' ? 100 : kycStatus === 'EN_ATTENTE' ? 50 : 0
    return {
      score,
      lastUpdate: client.updatedAt?.toString() || new Date().toISOString(),
      nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      sections: [
        { id: 'identite', label: 'Identité', status: 'partial' as const, progress: score },
      ],
    }
  }, [kycData, client])

  if (isLoadingDocs && isLoadingKYC) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-600">Documents</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.valid}</p>
            <p className="text-xs text-gray-600">Valides</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.expiring}</p>
            <p className="text-xs text-gray-600">À renouveler</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.missing}</p>
            <p className="text-xs text-gray-600">Manquants</p>
          </CardContent>
        </Card>
      </div>

      {/* Lien vers la page documents complète */}
      <div className="flex items-center justify-end mb-4">
        <Link 
          href="/dashboard/documents"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ouvrir la gestion documents complète
        </Link>
      </div>

      <Tabs value={activeItem} onValueChange={(v) => onNavigate('documents', v)}>
        <TabsList>
          <TabsTrigger value="documents">
            Documents
            <Badge variant="default" size="xs" className="ml-2">{documents.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="kyc">KYC / LAB</TabsTrigger>
          <TabsTrigger value="conformite">Conformité</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pièces justificatives</CardTitle>
                <Button size="sm" className="gap-1 bg-indigo-600 hover:bg-indigo-700">
                  <Upload className="h-3.5 w-3.5" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formattedDocs.length === 0 ? (
                <EmptyState message="Aucun document enregistré" icon={FileText} />
              ) : (
                <div className="space-y-2">
                  {formattedDocs.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="kyc" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    Connaissance Client (KYC)
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    Dernière mise à jour: {new Date(kyc.lastUpdate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-indigo-600">{kyc.score}%</p>
                  <p className="text-xs text-gray-500">Score de complétude</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={kyc.score} className="h-2 mb-6" />
              <div className="space-y-2">
                {kyc.sections.map((section: KYCSectionData) => (
                  <KYCSection key={section.id} section={section} />
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4 gap-2">
                <FileCheck className="h-4 w-4" />
                Compléter le questionnaire KYC
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conformite" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Obligations réglementaires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-900">Questionnaire d'adéquation</p>
                      <p className="text-xs text-gray-600">
                        {client.riskProfile ? 'Complété' : 'Non complété'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-amber-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Revue annuelle KYC</p>
                      <p className="text-xs text-gray-600">
                        Prévue le {new Date(kyc.nextReview).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">Planifier</Button>
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-900">Lettre de mission</p>
                      <p className="text-xs text-gray-600">
                        {client.createdAt ? `Créée le ${new Date(client.createdAt).toLocaleDateString('fr-FR')}` : 'Non définie'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="exports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Générer un document</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exportTypes.map((exp) => {
                  const Icon = exp.icon
                  return (
                    <button
                      key={exp.id}
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                      onClick={() => toast({ title: 'Export', description: `Génération de ${exp.name}...` })}
                    >
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Icon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{exp.name}</p>
                        <p className="text-xs text-gray-500">{exp.format}</p>
                      </div>
                      <Download className="h-4 w-4 text-gray-400" />
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
