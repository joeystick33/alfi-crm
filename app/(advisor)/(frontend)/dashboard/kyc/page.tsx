'use client'

import { useState } from 'react'
import { Card } from '@/app/_common/components/ui/Card'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Progress } from '@/app/_common/components/ui/Progress'
import Avatar from '@/app/_common/components/ui/Avatar'
import {
  FileCheck, AlertTriangle, Clock, CheckCircle2, RefreshCw,
  ArrowUpRight, ListTodo, History, ShieldAlert, Activity,
  Search, ExternalLink, Mail, Phone, Plus, Info
} from 'lucide-react'
import { useKYCStats, useKYCDocuments, useKYCChecks } from '@/app/_common/hooks/use-api'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/app/_common/lib/utils'

export default function KYCPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: stats, isLoading: statsLoading, error, refetch } = useKYCStats()

  // Fetch recent data for activity/alerts
  const { data: recentDocsData, isLoading: docsLoading } = useKYCDocuments({ status: 'EN_ATTENTE' })
  const { data: overdueChecksData, isLoading: checksLoading } = useKYCChecks({ status: 'ACTION_REQUISE' })

  const documentStats = stats?.documents
  const checkStats = stats?.checks
  const isLoading = statsLoading || docsLoading || checksLoading

  const recentDocuments = (recentDocsData?.data || []).slice(0, 5)
  const criticalChecks = (overdueChecksData?.data || []).slice(0, 3)

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">KYC & Conformité</h1>
          <p className="text-muted-foreground">Gestion de la conformité clients</p>
        </div>
        <Card className="p-6">
          <EmptyState
            icon={AlertTriangle}
            title="Erreur de chargement"
            description={error.message}
            action={{
              label: 'Réessayer',
              onClick: () => refetch(),
              icon: RefreshCw,
            }}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-2">
      {/* Header with quick stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b">
        <div className="space-y-1">
          <Badge variant="secondary" className="mb-2 bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1 w-fit">
            <ShieldAlert className="h-3 w-3" />
            Conformité ACPR & KYC
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight">Tableau de Bord Compliance</h1>
          <p className="text-muted-foreground text-lg">
            Supervisez la conformité globale et gérez les risques réglementaires en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Actualiser
          </Button>
          <Link href="/dashboard/kyc/controles/nouveau">
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Contrôle
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Document Completion Rate */}
        <Card className="p-6 relative overflow-hidden group hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <FileCheck className="h-24 w-24 text-blue-600" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="p-2 bg-blue-50 rounded-lg w-fit">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Taux de Complétion KYC</p>
              <div className="flex items-end gap-2 mt-1">
                <h3 className="text-4xl font-extrabold">{documentStats?.completionRate?.toFixed(1) || 0}%</h3>
                <span className="text-green-600 text-sm font-bold flex items-center mb-1">
                  <ArrowUpRight className="h-4 w-4" />
                  +2.4%
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Progress value={documentStats?.completionRate || 0} className="h-2 bg-blue-100" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{documentStats?.completed || 0} validés</span>
                <span>{documentStats?.total || 0} total</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pending Approval */}
        <Card className="p-6 relative overflow-hidden group hover:border-orange-400 transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Clock className="h-24 w-24 text-orange-600" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="p-2 bg-orange-50 rounded-lg w-fit">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">En attente / Revue</p>
              <h3 className="text-4xl font-extrabold mt-1">
                {(documentStats?.pending || 0) + (documentStats?.inProgress || 0)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Documents nécessitant votre action</p>
            </div>
            <Link href="/dashboard/kyc/manquants">
              <Button variant="ghost" size="sm" className="w-full mt-2 text-orange-700 hover:bg-orange-50 hover:text-orange-800 p-0 h-auto py-1">
                Traiter maintenant <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* ACPR Mandatory Checks */}
        <Card className="p-6 relative overflow-hidden group hover:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <ShieldAlert className="h-24 w-24 text-indigo-600" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="p-2 bg-indigo-50 rounded-lg w-fit">
              <FileCheck className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Audits ACPR</p>
              <h3 className="text-4xl font-extrabold mt-1">{checkStats?.acprMandatory || 0}</h3>
              <p className="text-xs text-muted-foreground mt-1">Contrôles réglementaires à jour</p>
            </div>
            <Link href="/dashboard/kyc/controles">
              <Button variant="ghost" size="sm" className="w-full mt-2 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 p-0 h-auto py-1">
                Gérer les audits <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Critical Alerts */}
        <Card className="p-6 relative overflow-hidden group hover:border-red-400 bg-red-50/10 transition-all duration-300 shadow-sm hover:shadow-md border-red-100">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <AlertTriangle className="h-24 w-24 text-red-600" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="p-2 bg-red-100 rounded-lg w-fit">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-800 uppercase tracking-wider font-bold">Alertes Critiques</p>
              <h3 className="text-4xl font-extrabold mt-1 text-red-600">
                {(documentStats?.expired || 0) + (checkStats?.overdue || 0)}
              </h3>
              <p className="text-xs text-red-700 mt-1 font-medium">Expirations ou retards majeurs</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Alerts & High Priority */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-none shadow-lg">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-400" />
                <h3 className="font-bold text-lg">Alertes de Conformité Prioritaires</h3>
              </div>
              <Badge className="bg-red-500 text-white border-none">{criticalChecks.length + (documentStats?.expired || 0)} alertes</Badge>
            </div>
            <div className="p-0">
              {criticalChecks.length === 0 && (documentStats?.expired || 0) === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2 opacity-20" />
                  <p>Aucune alerte critique à signaler.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {/* Urgent Checks */}
                  {criticalChecks.map((check: any) => (
                    <div key={check.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Contrôle {check.type} en retard</p>
                          <p className="text-xs text-muted-foreground">Client: {check.client.firstName} {check.client.lastName}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant="destructive" className="text-[10px] h-5">URGENT</Badge>
                        <p className="text-[10px] text-muted-foreground">Limite: {format(new Date(check.dueDate), 'dd MMM', { locale: fr })}</p>
                      </div>
                    </div>
                  ))}

                  {/* Expired Documents could be fetched or simulated */}
                  {(documentStats?.expired || 0) > 0 && (
                    <div className="p-4 flex items-center justify-between bg-red-50/30">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <History className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{documentStats.expired} documents KYC expirés</p>
                          <p className="text-xs text-muted-foreground">Nécessite une relance client immédiate</p>
                        </div>
                      </div>
                      <Link href="/dashboard/kyc/manquants">
                        <Button variant="outline" size="sm" className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50">
                          Traiter
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Activity Feed Placeholder */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Activity className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-lg">Activité Récente</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">Voir tout</Button>
            </div>

            <div className="space-y-6">
              {docsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : recentDocuments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Aucune activité récente.</p>
              ) : (
                recentDocuments.map((doc: any) => (
                  <div key={doc.id} className="relative pl-6 pb-6 last:pb-0 border-l border-slate-100 last:border-0">
                    <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-bold">Document en attente de validation</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.type} pour <span className="font-medium text-slate-900">{doc.client.firstName} {doc.client.lastName}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] h-5 py-0">NOUVEAU</Badge>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(doc.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                        </div>
                      </div>
                      <Link href="/dashboard/kyc/manquants">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Quick Explorer & Resources */}
        <div className="space-y-6">
          {/* Direct Search Card */}
          <Card className="p-6 bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-[-20px] right-[-20px] h-32 w-32 bg-white/5 rounded-full blur-3xl" />
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-400" />
              Recherche Rapide Compliance
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Client, dossier, document..."
                className="bg-slate-800 border-slate-700 text-white pl-9 placeholder:text-slate-500 focus:ring-blue-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-center">
              Appuyez sur <kbd className="bg-slate-800 px-1 rounded border border-slate-700">⌘K</kbd> pour la recherche globale
            </p>
          </Card>

          {/* Resource Access */}
          <Card className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-indigo-600" />
              Actions de Conformité
            </h3>
            <div className="space-y-3">
              <Link href="/dashboard/kyc/manquants" className="block p-3 rounded-lg border hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <Mail className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Relancer les documents</p>
                      <p className="text-[10px] text-muted-foreground">Envoyez des rappels aux clients</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                </div>
              </Link>

              <Link href="/dashboard/kyc/controles" className="block p-3 rounded-lg border hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <ShieldAlert className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Contrôles ACPR</p>
                      <p className="text-[10px] text-muted-foreground">Rapports d'audit et conformité</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
                </div>
              </Link>

              <div className="block p-3 rounded-lg border border-dashed text-center text-muted-foreground cursor-not-allowed">
                <p className="text-sm">Exporter rapport annuel (TRACFIN)</p>
                <p className="text-[10px]">Bientôt disponible</p>
              </div>
            </div>
          </Card>

          {/* Client Support / Fast Info */}
          <Card className="p-4 bg-indigo-600 text-white relative overflow-hidden">
            <div className="absolute bottom-[-10px] right-[-10px] opacity-10">
              <ShieldAlert className="h-24 w-24" />
            </div>
            <div className="space-y-3 relative z-10">
              <h4 className="font-bold flex items-center gap-2">
                <Info className="h-4 w-4" />
                Besoin d'aide ?
              </h4>
              <p className="text-xs text-indigo-100">
                Une question sur la réglementation ACPR ou un document suspicieux ?
              </p>
              <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 h-8 text-xs font-bold">
                Consulter la base de connaissance
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
