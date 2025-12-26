import { prisma } from '@/app/_common/lib/prisma'
import { Badge } from '@/app/_common/components/ui/Badge'
import Link from 'next/link'
import { Building2, Users, Database, TrendingUp, Activity, CreditCard, Settings, ArrowUpRight, ChevronRight, Zap, Mail, Calendar, Clock, UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SuperAdminDashboard() {
  // Stats globales
  const [cabinets, totalUsers, totalClients, recentEvents, recentAuditLogs] = await Promise.all([
    prisma.cabinet.findMany({
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count(),
    prisma.client.count(),
    // Événements récents (agenda SuperAdmin)
    prisma.event.findMany({
      take: 5,
      orderBy: { startDate: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        cabinet: { select: { name: true } },
      }
    }),
    // Derniers logs d'audit
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        superAdmin: { select: { firstName: true, lastName: true } },
        user: { select: { firstName: true, lastName: true } },
        cabinet: { select: { name: true } },
      }
    }),
  ])

  const activeCabinets = cabinets.filter(c => c.status === 'ACTIVE').length
  const trialCabinets = cabinets.filter(c => c.status === 'TRIALING').length

  // Calculer le MRR estimé
  const planPrices: Record<string, number> = { TRIAL: 0, STARTER: 59, BUSINESS: 99, PREMIUM: 199 }
  const mrr = cabinets.reduce((sum, c) => sum + (planPrices[c.plan] || 0), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">Vue d'ensemble de la plateforme Aura CRM</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/superadmin/cabinets/create" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7373FF] hover:bg-[#5c5ce6] text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow-md">
            <Building2 className="h-4 w-4" />
            Nouveau cabinet
          </Link>
        </div>
      </div>

      {/* Stats Cards - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cabinets */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
              <TrendingUp className="h-3 w-3" />
              +{trialCabinets} en essai
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{cabinets.length}</p>
          <p className="text-sm text-gray-500 mt-1">Cabinets</p>
          <div className="flex gap-2 mt-3">
            <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs">{activeCabinets} actifs</Badge>
            <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">{trialCabinets} essai</Badge>
          </div>
        </div>

        {/* Utilisateurs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-1 text-violet-600 text-xs font-medium">
              <Activity className="h-3 w-3" />
              Actifs
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
          <p className="text-sm text-gray-500 mt-1">Utilisateurs</p>
          <p className="text-xs text-gray-400 mt-3">Moyenne: {Math.round(totalUsers / (cabinets.length || 1))} par cabinet</p>
        </div>

        {/* Clients */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-1 text-blue-600 text-xs font-medium">
              <TrendingUp className="h-3 w-3" />
              Croissance
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalClients.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Clients gérés</p>
          <p className="text-xs text-gray-400 mt-3">Moyenne: {Math.round(totalClients / (cabinets.length || 1))} par cabinet</p>
        </div>

        {/* MRR */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <Badge className="bg-emerald-50 text-emerald-700 border-0 text-xs">MRR</Badge>
          </div>
          <p className="text-3xl font-bold text-gray-900">{mrr.toLocaleString()} €</p>
          <p className="text-sm text-gray-500 mt-1">Revenu mensuel</p>
          <p className="text-xs text-gray-400 mt-3">Taux d'activation: {cabinets.length > 0 ? Math.round((activeCabinets / cabinets.length) * 100) : 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cabinets */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Derniers Cabinets</h2>
              <p className="text-sm text-gray-500 mt-0.5">Cabinets récemment créés</p>
            </div>
            <Link href="/superadmin/cabinets" className="inline-flex items-center gap-1 text-sm text-[#7373FF] hover:text-[#5c5ce6] font-medium transition-colors">
              Voir tous <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {cabinets.slice(0, 5).map((cabinet) => (
              <Link key={cabinet.id} href={`/superadmin/cabinets/${cabinet.id}`} className="p-4 hover:bg-gray-50/50 block transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7373FF]/10 to-[#7373FF]/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-[#7373FF]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-[#7373FF] transition-colors">{cabinet.name}</p>
                      <p className="text-sm text-gray-500">{cabinet.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <Badge className={cabinet.plan === 'PREMIUM' ? 'bg-amber-50 text-amber-700 border-0' : cabinet.plan === 'BUSINESS' ? 'bg-blue-50 text-blue-700 border-0' : 'bg-gray-100 text-gray-600 border-0'}>{cabinet.plan}</Badge>
                        <Badge className={cabinet.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-0' : 'bg-blue-50 text-blue-700 border-0'}>{cabinet.status === 'ACTIVE' ? 'Actif' : 'Essai'}</Badge>
                      </div>
                      <p className="text-xs text-gray-400">{cabinet._count.users} users · {cabinet._count.clients} clients</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-[#7373FF] transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
            {cabinets.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Building2 className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p>Aucun cabinet pour le moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Actions rapides</h2>
            <p className="text-sm text-gray-500 mt-0.5">Raccourcis administration</p>
          </div>
          <div className="p-3 space-y-2">
            <Link href="/superadmin/cabinets/create" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">Créer un Cabinet</p>
                <p className="text-xs text-gray-500">Ajouter un nouveau cabinet</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
            
            <Link href="/superadmin/users" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">Gérer les Utilisateurs</p>
                <p className="text-xs text-gray-500">Voir tous les utilisateurs</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
            
            <Link href="/superadmin/billing" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">Facturation</p>
                <p className="text-xs text-gray-500">Gérer les abonnements</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
            
            <Link href="/superadmin/integrations" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">Intégrations</p>
                <p className="text-xs text-gray-500">Configurer les services</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
            
            <Link href="/superadmin/config" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                <Settings className="h-5 w-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">Configuration</p>
                <p className="text-xs text-gray-500">Paramètres système</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>

            <Link href="/superadmin/clients" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                <UserPlus className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">Clients (Maintenance)</p>
                <p className="text-xs text-gray-500">Gérer les clients des cabinets</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      {/* Section Activité & Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité récente */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-violet-500" />
                Activité récente
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Dernières actions sur la plateforme</p>
            </div>
            <Link href="/superadmin/activity" className="inline-flex items-center gap-1 text-sm text-[#7373FF] hover:text-[#5c5ce6] font-medium transition-colors">
              Voir tout <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentAuditLogs.map((log) => {
              const actorName = log.superAdmin 
                ? `${log.superAdmin.firstName} ${log.superAdmin.lastName}` 
                : log.user 
                  ? `${log.user.firstName} ${log.user.lastName}`
                  : 'Système'
              const actionLabels: Record<string, string> = {
                CREATION: 'a créé',
                MODIFICATION: 'a modifié',
                SUPPRESSION: 'a supprimé',
                LOGIN: 's\'est connecté',
              }
              return (
                <div key={log.id} className="p-4 hover:bg-gray-50/50 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{actorName}</span>{' '}
                        <span className="text-gray-600">{actionLabels[log.action] || log.action}</span>{' '}
                        <span className="text-gray-500">{log.entityType}</span>
                        {log.cabinet && (
                          <span className="text-blue-600 ml-1">({log.cabinet.name})</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            {recentAuditLogs.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Activity className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p>Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>

        {/* Agenda global */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Agenda global
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">Événements récents sur tous les cabinets</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {recentEvents.map((event) => (
              <div key={event.id} className="p-4 hover:bg-gray-50/50 transition-all">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {event.cabinet && (
                        <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">{event.cabinet.name}</Badge>
                      )}
                      {event.user && (
                        <span className="text-xs text-gray-500">{event.user.firstName} {event.user.lastName}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(event.startDate).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {recentEvents.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                <p>Aucun événement récent</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
