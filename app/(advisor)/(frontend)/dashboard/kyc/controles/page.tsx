
'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/app/_common/lib/utils'
import { Card } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/app/_common/components/ui/DropdownMenu'
import {
  Shield, Plus, Search, AlertTriangle, CheckCircle2, Clock,
  MoreVertical, Eye, Trash2, FileCheck, Info, Activity
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/_common/components/ui/Dialog'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Slider } from '@/app/_common/components/ui/Slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import {
  useKYCChecks,
  useCompleteKYCCheck,
  useDeleteKYCCheck
} from '@/app/_common/hooks/use-api'
import type { KYCCheckFilters, KYCCheckStatus, KYCCheckType, KYCCheckPriority } from '@/app/_common/lib/api-types'
import Link from 'next/link'
import { useToast } from '@/app/_common/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUS_LABELS: Record<KYCCheckStatus, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  TERMINE: 'Complété',
  ECHOUE: 'Échoué',
  ACTION_REQUISE: 'Action requise',
  ESCALADE: 'Escaladé'
}

const STATUS_COLORS: Record<KYCCheckStatus, 'default' | 'secondary' | 'success' | 'destructive' | 'warning'> = {
  EN_ATTENTE: 'secondary',
  EN_COURS: 'default',
  TERMINE: 'success',
  ECHOUE: 'destructive',
  ACTION_REQUISE: 'warning',
  ESCALADE: 'warning'
}

const TYPE_LABELS: Record<KYCCheckType, string> = {
  VERIFICATION_IDENTITE: 'Vérification identité',
  VERIFICATION_ADRESSE: 'Vérification adresse',
  SITUATION_FINANCIERE: 'Situation financière',
  CONNAISSANCE_INVESTISSEMENT: 'Connaissance investissement',
  PROFIL_RISQUE: 'Profil de risque',
  ORIGINE_PATRIMOINE: 'Origine patrimoine',
  PERSONNE_EXPOSEE: 'PPE',
  CRIBLAGE_SANCTIONS: 'Screening sanctions',
  REVUE_PERIODIQUE: 'Revue périodique',
  AUTRE: 'Autre'
}

const PRIORITY_LABELS: Record<KYCCheckPriority, string> = {
  BASSE: 'Basse',
  MOYENNE: 'Moyenne',
  HAUTE: 'Haute',
  URGENTE: 'Urgente'
}

const PRIORITY_COLORS: Record<KYCCheckPriority, string> = {
  BASSE: 'text-green-600',
  MOYENNE: 'text-blue-600',
  HAUTE: 'text-orange-600',
  URGENTE: 'text-red-600'
}

const RISK_LABELS: Record<string, string> = {
  BASSE: 'Faible',
  MODEREE: 'Modéré',
  ELEVEE: 'Élevé',
  CRITIQUE: 'Critique'
}

const RISK_COLORS: Record<string, string> = {
  BASSE: 'success',
  MODEREE: 'secondary',
  ELEVEE: 'warning',
  CRITIQUE: 'destructive'
}

const RISK_BG_COLORS: Record<string, string> = {
  BASSE: 'bg-green-500',
  MODEREE: 'bg-blue-500',
  ELEVEE: 'bg-orange-500',
  CRITIQUE: 'bg-red-500'
}

export default function KYCControlesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<KYCCheckStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<KYCCheckType | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<KYCCheckPriority | 'all'>('all')
  const [showOnlyACPR, setShowOnlyACPR] = useState(false)
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false)

  // State for Complete Check Modal
  const [selectedCheck, setSelectedCheck] = useState<any | null>(null)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [findings, setFindings] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [riskScore, setRiskScore] = useState(10)
  const [riskLevel, setRiskLevel] = useState('BASSE')

  const filters = useMemo<KYCCheckFilters>(() => {
    const f: KYCCheckFilters = {}
    if (statusFilter !== 'all') f.status = statusFilter
    if (typeFilter !== 'all') f.type = typeFilter
    if (priorityFilter !== 'all') f.priority = priorityFilter
    if (showOnlyACPR) f.isACPRMandatory = true
    if (showOnlyOverdue) f.dueBefore = new Date().toISOString()
    return f
  }, [statusFilter, typeFilter, priorityFilter, showOnlyACPR, showOnlyOverdue])

  const { data: checksData, isLoading } = useKYCChecks(filters)
  const completeCheck = useCompleteKYCCheck()
  const deleteCheck = useDeleteKYCCheck()
  const { toast } = useToast()

  const checks = checksData?.data || []

  // Filtrage local par recherche textuelle
  const filteredChecks = useMemo(() => {
    if (!search) return checks
    const searchLower = search.toLowerCase()
    return checks.filter(check =>
      check.client.firstName.toLowerCase().includes(searchLower) ||
      check.client.lastName.toLowerCase().includes(searchLower) ||
      check.client.email.toLowerCase().includes(searchLower) ||
      check.description?.toLowerCase().includes(searchLower)
    )
  }, [checks, search])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contrôles ACPR</h1>
          <p className="text-muted-foreground">Audits réglementaires et conformité</p>
        </div>
        <Link href="/dashboard/kyc/controles/nouveau">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau contrôle
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total Contrôles</p>
          </div>
          <p className="text-2xl font-bold">{checks.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileCheck className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-muted-foreground">ACPR Obligatoires</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {checks.filter(c => c.isACPRMandatory).length}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-muted-foreground">En retard</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {checks.filter(c => c.dueDate && new Date(c.dueDate) < new Date() && c.status !== 'TERMINE').length}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-sm text-muted-foreground">Complétés</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {checks.filter(c => c.status === 'TERMINE').length}
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par client, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
            <option value="all">Tous les types</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Select value={priorityFilter} onValueChange={(v: any) => setPriorityFilter(v)}>
            <option value="all">Toutes priorités</option>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
          <Button
            variant={showOnlyACPR ? 'primary' : 'outline'}
            onClick={() => setShowOnlyACPR(!showOnlyACPR)}
            size="sm"
          >
            <Shield className="h-4 w-4 mr-2" />
            ACPR seuls
          </Button>
          <Button
            variant={showOnlyOverdue ? 'primary' : 'outline'}
            onClick={() => setShowOnlyOverdue(!showOnlyOverdue)}
            size="sm"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            En retard
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChecks.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Shield}
              title="Aucun contrôle"
              description="Aucun contrôle ne correspond à vos critères"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Client</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">Priorité</th>
                  <th className="text-left p-4 font-medium">ACPR</th>
                  <th className="text-left p-4 font-medium">Risque</th>
                  <th className="text-left p-4 font-medium">Date limite</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChecks.map((check) => {
                  const isOverdue = check.dueDate && new Date(check.dueDate) < new Date() && check.status !== 'TERMINE'

                  return (
                    <tr key={check.id} className={cn(
                      "border-b hover:bg-muted/50 transition-colors",
                      check.isACPRMandatory && check.status !== 'TERMINE' && "bg-blue-50/30"
                    )}>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">
                            {check.client.firstName} {check.client.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{check.client.email}</p>
                          <Badge variant="secondary" className="mt-1">
                            KYC: {check.client.kycStatus}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-sm">{TYPE_LABELS[check.type]}</p>
                        {check.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {check.description}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant={STATUS_COLORS[check.status]}>
                          {STATUS_LABELS[check.status]}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${PRIORITY_COLORS[check.priority]}`}>
                          {PRIORITY_LABELS[check.priority]}
                        </span>
                      </td>
                      <td className="p-4">
                        {check.isACPRMandatory ? (
                          <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                            <Shield className="h-3 w-3 mr-1" />
                            ACPR
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        {check.riskLevel ? (
                          <Badge variant={RISK_COLORS[check.riskLevel] as any}>
                            {RISK_LABELS[check.riskLevel]}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Non évalué</span>
                        )}
                      </td>
                      <td className="p-4">
                        {check.dueDate ? (
                          <div>
                            <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                              {format(new Date(check.dueDate), 'dd MMM yyyy', { locale: fr })}
                            </p>
                            {isOverdue && (
                              <Badge variant="destructive" className="mt-1">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Retard
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            {check.status !== 'TERMINE' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCheck(check)
                                  setIsCompleteModalOpen(true)
                                  setFindings(check.findings || '')
                                  setRecommendations(check.recommendations || '')
                                  setRiskScore(check.score || 10)
                                  setRiskLevel(check.riskLevel || 'BASSE')
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Compléter le contrôle
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm('Supprimer ce contrôle ?')) {
                                  deleteCheck.mutate(check.id)
                                }
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Complete Check Modal */}
      <Dialog open={isCompleteModalOpen} onOpenChange={setIsCompleteModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              Finaliser le contrôle KYC
            </DialogTitle>
            <DialogDescription>
              Enregistrez les conclusions de l'audit pour {selectedCheck?.client.firstName} {selectedCheck?.client.lastName}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="findings" className="font-bold">Conclusions et observations (obligatoire)</Label>
              <Textarea
                id="findings"
                placeholder="Détaillez les points vérifiés et les conclusions..."
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="recommendations">Recommandations</Label>
              <Textarea
                id="recommendations"
                placeholder="Actions correctives ou points de vigilance..."
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  Score de risque (0-100)
                </Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[riskScore]}
                    onValueChange={(v) => {
                      setRiskScore(v[0])
                      // Auto-update risk level based on score
                      if (v[0] < 30) setRiskLevel('BASSE')
                      else if (v[0] < 60) setRiskLevel('MODEREE')
                      else if (v[0] < 85) setRiskLevel('ELEVEE')
                      else setRiskLevel('CRITIQUE')
                    }}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="font-bold text-lg min-w-[3ch]">{riskScore}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Niveau de risque final</Label>
                <Select value={riskLevel} onValueChange={(v: any) => setRiskLevel(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Niveau de risque" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RISK_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 text-xs flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${RISK_BG_COLORS[riskLevel]}`} />
                  Evaluation basée sur le score: {RISK_LABELS[riskLevel]}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (!findings.trim()) {
                  toast({ title: 'Erreur', description: 'Les conclusions sont obligatoires', variant: 'destructive' })
                  return
                }

                completeCheck.mutate({
                  id: selectedCheck.id,
                  data: {
                    findings,
                    recommendations,
                    score: riskScore,
                    riskLevel: riskLevel as any
                  }
                }, {
                  onSuccess: () => {
                    setIsCompleteModalOpen(false)
                    toast({ title: 'Contrôle finalisé', variant: 'success' })
                  }
                })
              }}
              loading={completeCheck.isPending}
            >
              Enregistrer et Fermer le contrôle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
