 
"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar as CalendarIcon, TrendingUp, FileText, Mail, Phone, User, Activity as ActivityIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_common/components/ui/Card"
import { Badge } from "@/app/_common/components/ui/Badge"
import { ScrollArea } from "@/app/_common/components/ui/Scroll-area"
import { apiCall } from "@/app/_common/lib/api-client"
import { usePresentationMode } from "@/app/(advisor)/(frontend)/components/dashboard/PresentationModeContext"
import { ActivityFilters, type ActivityFilterState } from "@/app/(advisor)/(frontend)/components/activity/ActivityFilters"

interface ActivityItem {
  id: string
  type: string
  title: string
  description?: string | null
  clientName?: string | null
  createdAt: string
}

export default function ActivityPage() {
  const router = useRouter()
  const presentationMode = usePresentationMode()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ActivityFilterState>({
    types: [],
    startDate: null,
    endDate: null,
    createdBy: null,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Construire les query params
      const params = new URLSearchParams()
      params.append('limit', '200')
      params.append('offset', '0')
      params.append('sortBy', filters.sortBy)
      params.append('sortOrder', filters.sortOrder)
      
      // Ajouter filtres de type
      filters.types.forEach(type => {
        params.append('type', type)
      })
      
      // Ajouter filtres de dates
      if (filters.startDate) {
        params.append('startDate', new Date(filters.startDate).toISOString())
      }
      if (filters.endDate) {
        params.append('endDate', new Date(filters.endDate).toISOString())
      }
      
      // Ajouter filtre conseiller
      if (filters.createdBy) {
        params.append('createdBy', filters.createdBy)
      }
      
      const data: any = await apiCall(`/api/advisor/activity?${params.toString()}`)
      const list = data?.activities || []
      const total = data?.total || 0
      
      setActivities(Array.isArray(list) ? list : [])
      setTotalResults(total)
    } catch (e: any) {
      console.error("Erreur chargement activités:", e)
      setError("Impossible de charger les activités")
      setActivities([])
      setTotalResults(0)
    } finally {
      setLoading(false)
    }
  }, [filters])
  
  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  const grouped = useMemo(() => {
    const byDate: Record<string, ActivityItem[]> = {}
    activities.forEach((a) => {
      const d = new Date(a.createdAt)
      const key = d.toISOString().slice(0, 10)
      if (!byDate[key]) byDate[key] = []
      byDate[key].push(a)
    })
    // sort activities per day descending
    Object.keys(byDate).forEach((k) => {
      byDate[k].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    })
    return byDate
  }, [activities])

  const stats = useMemo(() => {
    let meetings = 0
    let documents = 0
    let contacts = 0
    let opportunities = 0

    activities.forEach((a) => {
      switch (a.type) {
        case "MEETING_HELD":
          meetings += 1
          break
        case "DOCUMENT_SIGNED":
        case "CONTRACT_SIGNED":
          documents += 1
          break
        case "EMAIL_SENT":
          contacts += 1
          break
        case "OPPORTUNITY_CONVERTED":
          opportunities += 1
          break
        default:
          break
      }
    })

    return { meetings, documents, contacts, opportunities }
  }, [activities])

  const formatDateLabel = (dateKey: string) => {
    const d = new Date(dateKey)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()

    if (sameDay(d, today)) return "Aujourd'hui"
    if (sameDay(d, yesterday)) return "Hier"
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
  }

  const getIconAndColor = (type: string) => {
    switch (type) {
      case "MEETING_HELD":
        return { Icon: CalendarIcon, gradient: "from-blue-600 to-blue-800" }
      case "DOCUMENT_SIGNED":
      case "CONTRACT_SIGNED":
        return { Icon: FileText, gradient: "from-purple-600 to-slate-900" }
      case "EMAIL_SENT":
        return { Icon: Mail, gradient: "from-cyan-600 to-blue-800" }
      case "OPPORTUNITY_CONVERTED":
        return { Icon: TrendingUp, gradient: "from-emerald-600 to-emerald-800" }
      default:
        return { Icon: ActivityIcon, gradient: "from-slate-600 to-slate-900" }
    }
  }

  const maskClient = (name?: string | null) => {
    if (!name) return "Client" 
    if (!presentationMode) return name
    return "Client masqué"
  }

  const maskDescription = (desc?: string | null) => {
    if (!desc) return ""
    if (!presentationMode) return desc
    return "Détail masqué en mode présentation"
  }

  return (
    <div className="space-y-6 pb-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 shadow-sm"
            aria-label="Retour au tableau de bord"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ActivityIcon className="h-6 w-6 text-blue-600" />
              Flux d'activités
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Historique complet de vos interactions clients (rendez-vous, documents, emails, opportunités).
            </p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <ActivityFilters
        onFiltersChange={setFilters}
        totalResults={totalResults}
        advisors={[]}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Rendez-vous tenus"
          value={stats.meetings}
          Icon={CalendarIcon}
          gradient="from-blue-600 to-blue-800"
          bg="from-blue-50 to-blue-100"
        />
        <StatCard
          label="Documents signés"
          value={stats.documents}
          Icon={FileText}
          gradient="from-purple-600 to-slate-900"
          bg="from-purple-50 to-slate-100"
        />
        <StatCard
          label="Contacts"
          value={stats.contacts}
          Icon={Phone}
          gradient="from-cyan-600 to-blue-800"
          bg="from-cyan-50 to-blue-100"
        />
        <StatCard
          label="Opportunités gagnées"
          value={stats.opportunities}
          Icon={TrendingUp}
          gradient="from-emerald-600 to-emerald-800"
          bg="from-emerald-50 to-emerald-100"
        />
      </div>

      {/* Activity Feed */}
      <Card className="border-slate-200 bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-slate-700 to-slate-900 shadow-lg shadow-slate-800/30 animate-pulse" />
            <CardTitle className="group-hover:bg-gradient-to-r group-hover:from-slate-700 group-hover:to-slate-900 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500">
              Toutes les activités
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Chargement des activités…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : activities.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune activité récente.</p>
          ) : (
            <ScrollArea className="h-[700px] pr-4">
              <div className="space-y-6">
                {Object.keys(grouped)
                  .sort((a, b) => (a < b ? 1 : -1))
                  .map((dateKey) => (
                    <div key={dateKey}>
                      <div className="sticky top-0 bg-white py-2 mb-4">
                        <h3 className="text-slate-900 capitalize text-sm font-semibold">
                          {formatDateLabel(dateKey)}
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {grouped[dateKey].map((activity) => {
                          const { Icon, gradient } = getIconAndColor(activity.type)
                          const clientLabel = maskClient(activity.clientName)
                          const desc = maskDescription(activity.description)
                          const created = new Date(activity.createdAt)
                          const time = created.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })

                          return (
                            <div
                              key={activity.id}
                              className="group/item flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-white hover:shadow-lg hover:shadow-slate-200/30 hover:border-slate-300 transition-all duration-300 cursor-pointer hover:scale-[1.01]"
                            >
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 bg-gradient-to-br ${gradient} shadow-lg transition-all duration-300 group-hover/item:scale-110 group-hover/item:rotate-3`}
                              >
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <User className="h-4 w-4 text-slate-400" />
                                  <span className="text-sm text-slate-900 truncate">
                                    {clientLabel}
                                  </span>
                                  <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">
                                    {mapTypeLabel(activity.type)}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-700 mb-1 truncate">
                                  {activity.title}
                                </p>
                                {desc && (
                                  <p className="text-xs text-slate-500 line-clamp-2">
                                    {desc}
                                  </p>
                                )}
                                <p className="text-[11px] text-slate-400 mt-1">{time}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ label, value, Icon, gradient, bg }: any) {
  const gradients = `from-slate-50 to-slate-100` // fallback
  const bgClasses = bg || gradients

  return (
    <Card className="group border-slate-200 bg-white hover:shadow-xl transition-all duration-500 hover:scale-[1.02] cursor-pointer overflow-hidden relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgClasses} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">{label}</p>
            <p className={`text-slate-900 bg-gradient-to-r ${gradient} bg-clip-text group-hover:text-transparent transition-all duration-500`}>
              {value}
            </p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg shadow-slate-900/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function mapTypeLabel(type: string) {
  switch (type) {
    case "CLIENT_CREATED":
      return "Nouveau client"
    case "MEETING_HELD":
      return "Rendez-vous"
    case "DOCUMENT_SIGNED":
    case "CONTRACT_SIGNED":
      return "Document / contrat"
    case "ASSET_ADDED":
      return "Actif ajouté"
    case "GOAL_ACHIEVED":
      return "Objectif atteint"
    case "KYC_UPDATED":
      return "KYC mis à jour"
    case "SIMULATION_SHARED":
      return "Simulation partagée"
    case "EMAIL_SENT":
      return "Email"
    case "OPPORTUNITY_CONVERTED":
      return "Opportunité gagnée"
    default:
      return "Autre"
  }
}
