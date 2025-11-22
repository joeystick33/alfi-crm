import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { Building2, Users, Database, TrendingUp, Activity } from 'lucide-react'

export default async function SuperAdminDashboard() {
  // Stats globales
  const [cabinets, totalUsers, totalClients] = await Promise.all([
    prisma.cabinet.findMany({
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
          }
        }
      }
    }),
    prisma.user.count(),
    prisma.client.count(),
  ])

  const activeCabinets = cabinets.filter(c => c.status === 'ACTIVE').length
  const trialCabinets = cabinets.filter(c => c.status === 'TRIAL').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SuperAdmin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble de la plateforme ALFI CRM
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold">{cabinets.length}</p>
          <p className="text-sm text-muted-foreground">Total Cabinets</p>
          <div className="flex gap-2 mt-2">
            <Badge className="bg-green-100 text-green-800 text-xs">
              {activeCabinets} actifs
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 text-xs">
              {trialCabinets} essai
            </Badge>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <Activity className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold">{totalUsers}</p>
          <p className="text-sm text-muted-foreground">Total Utilisateurs</p>
          <p className="text-xs text-muted-foreground mt-2">
            Moyenne: {Math.round(totalUsers / (cabinets.length || 1))} par cabinet
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="h-6 w-6 text-green-600" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold">{totalClients}</p>
          <p className="text-sm text-muted-foreground">Total Clients</p>
          <p className="text-xs text-muted-foreground mt-2">
            Moyenne: {Math.round(totalClients / (cabinets.length || 1))} par cabinet
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <Badge className="bg-green-100 text-green-800 text-xs">+12%</Badge>
          </div>
          <p className="text-2xl font-bold">
            {Math.round((activeCabinets / cabinets.length) * 100)}%
          </p>
          <p className="text-sm text-muted-foreground">Taux d'activation</p>
        </div>
      </div>

      {/* Recent Cabinets */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Derniers Cabinets Créés</h2>
          <Link href="/superadmin/cabinets">
            <span className="text-sm text-primary hover:underline">Voir tous</span>
          </Link>
        </div>
        <div className="divide-y">
          {cabinets.slice(0, 5).map((cabinet) => (
            <Link 
              key={cabinet.id} 
              href={`/superadmin/cabinets/${cabinet.id}`}
              className="p-4 hover:bg-slate-50 block transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{cabinet.name}</p>
                  <p className="text-sm text-muted-foreground">{cabinet.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{cabinet.plan}</Badge>
                  <Badge className={
                    cabinet.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }>
                    {cabinet.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">{cabinet._count.users} users</p>
                    <p className="text-xs text-muted-foreground">{cabinet._count.clients} clients</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/superadmin/cabinets/create" className="block">
          <div className="bg-white p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer">
            <Building2 className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Créer un Cabinet</h3>
            <p className="text-sm text-muted-foreground">
              Ajouter un nouveau cabinet sur la plateforme
            </p>
          </div>
        </Link>

        <Link href="/superadmin/users" className="block">
          <div className="bg-white p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer">
            <Users className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Gérer les Utilisateurs</h3>
            <p className="text-sm text-muted-foreground">
              Voir tous les utilisateurs de la plateforme
            </p>
          </div>
        </Link>

        <Link href="/superadmin/stats" className="block">
          <div className="bg-white p-6 rounded-lg border hover:border-primary transition-colors cursor-pointer">
            <Activity className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Statistiques</h3>
            <p className="text-sm text-muted-foreground">
              Analyser les performances globales
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
