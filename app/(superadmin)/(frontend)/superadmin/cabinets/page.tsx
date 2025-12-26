'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/app/_common/components/ui/Badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, Users, Database, Plus, Sparkles, Settings, ArrowUpRight, Filter, Loader2 } from 'lucide-react'

interface CabinetData {
  id: string
  name: string
  email: string
  plan: string
  status: string
  quotas: Record<string, number> | null
  usage: Record<string, number> | null
  _count: { users: number; clients: number }
}

export default function CabinetsPage() {
  const router = useRouter()
  const [cabinets, setCabinets] = useState<CabinetData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/superadmin/cabinets')
      .then(res => res.json())
      .then(data => {
        setCabinets(data.cabinets || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getPlanStyle = (plan: string) => {
    const styles: Record<string, string> = {
      TRIAL: 'bg-gray-50 text-gray-600 border-0',
      STARTER: 'bg-blue-50 text-blue-700 border-0',
      BUSINESS: 'bg-emerald-50 text-emerald-700 border-0',
      PREMIUM: 'bg-amber-50 text-amber-700 border-0',
    }
    return styles[plan] || 'bg-gray-50 text-gray-600 border-0'
  }

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-0',
      SUSPENDED: 'bg-rose-50 text-rose-700 border-0',
      TRIALING: 'bg-blue-50 text-blue-700 border-0',
      TERMINATED: 'bg-gray-50 text-gray-600 border-0',
    }
    return styles[status] || 'bg-gray-50 text-gray-600 border-0'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Actif',
      SUSPENDED: 'Suspendu',
      TRIALING: 'Essai',
      TERMINATED: 'Résilié',
    }
    return labels[status] || status
  }

  const totalUsers = cabinets.reduce((sum, c) => sum + c._count.users, 0)
  const totalClients = cabinets.reduce((sum, c) => sum + c._count.clients, 0)
  const activeCabinets = cabinets.filter(c => c.status === 'ACTIVE').length
  const trialCabinets = cabinets.filter(c => c.status === 'TRIALING').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Cabinets</h1>
          <p className="text-gray-500 mt-1">{cabinets.length} cabinet{cabinets.length > 1 ? 's' : ''} enregistré{cabinets.length > 1 ? 's' : ''}</p>
        </div>
        <Link href="/superadmin/cabinets/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7373FF] hover:bg-[#5c5ce6] text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md">
          <Plus className="h-4 w-4" />
          Nouveau cabinet
        </Link>
      </div>

      {/* Stats Cards - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cabinets actifs</p>
              <p className="text-2xl font-bold text-gray-900">{activeCabinets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total clients</p>
              <p className="text-2xl font-bold text-gray-900">{totalClients.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En période d'essai</p>
              <p className="text-2xl font-bold text-gray-900">{trialCabinets}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cabinets List - Card Style */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Liste des cabinets</h2>
            <p className="text-sm text-gray-500 mt-0.5">Tous les cabinets de la plateforme</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="h-4 w-4" />
              Filtrer
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 mx-auto text-gray-400 animate-spin" />
              <p className="text-gray-500 mt-2">Chargement...</p>
            </div>
          ) : cabinets.map((cabinet) => {
            const quotas = cabinet.quotas
            const usage = cabinet.usage
            const usagePercent = quotas?.maxUsers ? Math.round(((usage?.users || 0) / quotas.maxUsers) * 100) : 0

            return (
              <div
                key={cabinet.id}
                className="p-4 hover:bg-gray-50/50 transition-all group cursor-pointer"
                onClick={() => router.push(`/superadmin/cabinets/${cabinet.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#7373FF]/10 to-[#7373FF]/20 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-[#7373FF]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-[#7373FF] transition-colors">{cabinet.name}</p>
                      <p className="text-sm text-gray-500">{cabinet.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{cabinet._count.users}</p>
                        <p className="text-xs text-gray-500">Users</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{cabinet._count.clients}</p>
                        <p className="text-xs text-gray-500">Clients</p>
                      </div>
                      {quotas?.maxUsers && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{usagePercent}%</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Badges */}
                    <div className="flex items-center gap-2">
                      <Badge className={getPlanStyle(cabinet.plan)}>{cabinet.plan}</Badge>
                      <Badge className={getStatusStyle(cabinet.status)}>{getStatusLabel(cabinet.status)}</Badge>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/superadmin/cabinets/${cabinet.id}/features`)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Gérer les features"
                      >
                        <Sparkles className="h-4 w-4 text-amber-500" />
                      </button>
                      <button
                        onClick={() => router.push(`/superadmin/cabinets/${cabinet.id}/edit`)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Modifier"
                      >
                        <Settings className="h-4 w-4 text-gray-400" />
                      </button>
                      <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-[#7373FF] transition-colors ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          
          {!loading && cabinets.length === 0 && (
            <div className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun cabinet</h3>
              <p className="text-gray-500 mb-4">Commencez par créer votre premier cabinet</p>
              <Link href="/superadmin/cabinets/create" className="inline-flex items-center gap-2 px-4 py-2 bg-[#7373FF] hover:bg-[#5c5ce6] text-white text-sm font-medium rounded-xl transition-all">
                <Plus className="h-4 w-4" />
                Créer un cabinet
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
