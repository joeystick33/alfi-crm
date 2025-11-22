import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { Building2, Users, Database, Plus, Eye } from 'lucide-react'

export default async function CabinetsPage() {
  const cabinets = await prisma.cabinet.findMany({
    include: {
      _count: {
        select: {
          users: true,
          clients: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      TRIAL: 'bg-gray-100 text-gray-800',
      STARTER: 'bg-blue-100 text-blue-800',
      BUSINESS: 'bg-green-100 text-green-800',
      PREMIUM: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-orange-100 text-orange-800',
    }
    return colors[plan] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      TRIAL: 'bg-blue-100 text-blue-800',
      TERMINATED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Cabinets</h1>
          <p className="text-muted-foreground mt-1">
            {cabinets.length} cabinet{cabinets.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <Link href="/superadmin/cabinets/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Créer un cabinet
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cabinets actifs</p>
              <p className="text-2xl font-bold">
                {cabinets.filter(c => c.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total utilisateurs</p>
              <p className="text-2xl font-bold">
                {cabinets.reduce((sum, c) => sum + c._count.users, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total clients</p>
              <p className="text-2xl font-bold">
                {cabinets.reduce((sum, c) => sum + c._count.clients, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Building2 className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En période d'essai</p>
              <p className="text-2xl font-bold">
                {cabinets.filter(c => c.status === 'TRIAL').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cabinets Table */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-4 py-3 text-left text-sm font-medium">Cabinet</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Plan</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Utilisateurs</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Clients</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Quotas</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cabinets.map((cabinet) => {
                const quotas = cabinet.quotas as any
                const usage = cabinet.usage as any
                
                return (
                  <tr key={cabinet.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{cabinet.name}</p>
                        <p className="text-sm text-muted-foreground">{cabinet.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getPlanColor(cabinet.plan)}>
                        {cabinet.plan}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getStatusColor(cabinet.status)}>
                        {cabinet.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {usage?.users || 0} / {quotas?.maxUsers || '∞'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {usage?.clients || 0} / {quotas?.maxClients || '∞'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                (usage?.users / quotas?.maxUsers) > 0.8 
                                  ? 'bg-red-500' 
                                  : 'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min((usage?.users / quotas?.maxUsers) * 100, 100)}%` 
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round((usage?.users / quotas?.maxUsers) * 100)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/superadmin/cabinets/${cabinet.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
