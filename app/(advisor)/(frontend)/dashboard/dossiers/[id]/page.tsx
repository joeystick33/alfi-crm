'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/app/_common/components/ui/Button'
import { 
  ArrowLeft, Loader2, User, FolderOpen, Clock, CheckCircle2, 
  AlertCircle, FileText, BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { DossierWorkspace } from './_components/DossierWorkspace'
import { useToast } from '@/app/_common/hooks/use-toast'
import { cn } from '@/lib/utils'

interface DossierDetail {
  id: string
  reference: string
  nom: string
  description: string | null
  categorie: string
  type: string
  status: string
  etapeActuelle: string
  clientDataSnapshot: Record<string, unknown> | null
  client: {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    mobile?: string
    clientType?: string
  } | null
  simulations: Array<{
    id: string
    simulateurType: string
    nom: string
    parametres: Record<string, unknown>
    resultats: Record<string, unknown>
    selectionne: boolean
  }>
  preconisations: Array<{
    id: string
    titre: string
    description: string
    argumentaire: string | null
    montant: number | null
    statut: string
    priorite?: number
    ordre: number
  }>
  documentsGeneres: Array<{
    id: string
    type: string
    nom: string
    url: string
    createdAt: string
    version: number
  }>
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
  EN_COURS: { label: 'En cours', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: BarChart3 },
  VALIDE: { label: 'Validé', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  ARCHIVE: { label: 'Archivé', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: FolderOpen },
}

const CATEGORIE_CONFIG: Record<string, { label: string; gradient: string }> = {
  PATRIMOINE: { label: 'Bilan Patrimonial', gradient: 'from-indigo-500 to-purple-600' },
  SUCCESSION: { label: 'Succession', gradient: 'from-amber-500 to-orange-600' },
  RETRAITE: { label: 'Retraite', gradient: 'from-emerald-500 to-teal-600' },
  INVESTISSEMENT: { label: 'Investissement', gradient: 'from-blue-500 to-cyan-600' },
  IMMOBILIER: { label: 'Immobilier', gradient: 'from-rose-500 to-pink-600' },
  CREDIT: { label: 'Crédit', gradient: 'from-violet-500 to-purple-600' },
  ASSURANCE_PERSONNES: { label: 'Assurance', gradient: 'from-sky-500 to-blue-600' },
}

export default function DossierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [dossier, setDossier] = useState<DossierDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const dossierId = params.id as string

  const fetchDossier = async () => {
    try {
      const response = await fetch(`/api/advisor/dossiers/${dossierId}`)
      if (response.ok) {
        const json = await response.json()
        setDossier(json.data || json)
      } else {
        toast({ title: 'Erreur', description: 'Dossier non trouvé', variant: 'destructive' })
        router.push('/dashboard/dossiers')
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de charger le dossier', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDossier()
  }, [dossierId])

  const handleEtapeChange = async (etape: string) => {
    try {
      await fetch(`/api/advisor/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapeActuelle: etape })
      })
      fetchDossier()
    } catch (error) {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Chargement du dossier...</p>
      </div>
    )
  }

  if (!dossier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-muted-foreground font-medium">Dossier non trouvé</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/dossiers">Retour aux dossiers</Link>
        </Button>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[dossier.status] || STATUS_CONFIG.BROUILLON
  const StatusIcon = statusConfig.icon
  const catConfig = CATEGORIE_CONFIG[dossier.categorie] || { label: dossier.categorie?.replace(/_/g, ' ') || 'Dossier', gradient: 'from-slate-500 to-slate-600' }

  const clientInitials = dossier.client
    ? `${dossier.client.firstName?.[0] || ''}${dossier.client.lastName?.[0] || ''}`.toUpperCase()
    : '?'

  return (
    <div className="space-y-6">
      {/* Header premium */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        {/* Gradient accent top */}
        <div className={cn('absolute top-0 left-0 right-0 h-1 bg-gradient-to-r', catConfig.gradient)} />

        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Button variant="ghost" size="icon" asChild className="mt-1 shrink-0">
                <Link href="/dashboard/dossiers">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>

              {/* Client avatar */}
              <div className={cn(
                'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shrink-0',
                catConfig.gradient
              )}>
                {clientInitials}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight">{dossier.nom}</h1>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border',
                    statusConfig.color
                  )}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                  {dossier.client && (
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {dossier.client.firstName} {dossier.client.lastName}
                    </span>
                  )}
                  <span className="text-muted-foreground/30">|</span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {catConfig.label}
                  </span>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    {dossier.reference}
                  </span>
                </div>
              </div>
            </div>

            {/* Mini stats */}
            <div className="hidden lg:flex items-center gap-6 text-center shrink-0">
              <div>
                <div className="text-2xl font-bold text-primary">{dossier.simulations.filter(s => s.selectionne).length}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Simulations</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-2xl font-bold text-primary">{dossier.preconisations.length}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Préconisations</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-2xl font-bold text-primary">{dossier.documentsGeneres.length}</div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Documents</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <DossierWorkspace
        dossier={dossier}
        onEtapeChange={handleEtapeChange}
        onRefresh={fetchDossier}
      />
    </div>
  )
}
