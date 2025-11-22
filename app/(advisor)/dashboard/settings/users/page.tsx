import { requireAuth } from '@/lib/supabase/auth-helpers'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CreateUserButton } from '@/components/cabinet/CreateUserButton'
import { UsersList } from '@/components/cabinet/UsersList'
import { Badge } from '@/components/ui/Badge'
import { Users, AlertTriangle } from 'lucide-react'

export default async function CabinetUsersPage() {
  const user = await requireAuth()
  
  // Vérifier que l'utilisateur est ADMIN
  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  if (!user.cabinetId) {
    return <div>Erreur: Aucun cabinet associé</div>
  }

  // Récupérer le cabinet avec ses quotas et utilisateurs
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: user.cabinetId },
    include: {
      users: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!cabinet) {
    return <div>Erreur: Cabinet introuvable</div>
  }

  const quotas = cabinet.quotas as any
  const usage = cabinet.usage as any
  const quotaReached = usage.users >= quotas.maxUsers

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-muted-foreground mt-1">
            Cabinet: {cabinet.name}
          </p>
        </div>
        <CreateUserButton 
          cabinetId={cabinet.id} 
          quotaReached={quotaReached}
          currentUsers={usage.users}
          maxUsers={quotas.maxUsers}
        />
      </div>

      {/* Quotas Card */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Quotas d'Utilisateurs</h2>
          <Badge className={
            quotaReached 
              ? 'bg-red-100 text-red-800' 
              : (usage.users / quotas.maxUsers) > 0.8
                ? 'bg-orange-100 text-orange-800'
                : 'bg-green-100 text-green-800'
          }>
            {usage.users} / {quotas.maxUsers}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                quotaReached 
                  ? 'bg-red-500' 
                  : (usage.users / quotas.maxUsers) > 0.8
                    ? 'bg-orange-500'
                    : 'bg-green-500'
              }`}
              style={{ 
                width: `${Math.min((usage.users / quotas.maxUsers) * 100, 100)}%` 
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {quotaReached 
              ? 'Quota atteint. Contactez-nous pour augmenter votre plan.'
              : `Vous pouvez encore créer ${quotas.maxUsers - usage.users} utilisateur(s).`
            }
          </p>
        </div>

        {quotaReached && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">
              Votre quota d'utilisateurs est atteint. Passez à un plan supérieur pour ajouter plus d'utilisateurs.
            </p>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            Utilisateurs ({cabinet.users.length})
          </h2>
        </div>
        <UsersList users={cabinet.users} currentUserId={user.id} />
      </div>

      {/* Plan Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Votre Plan Actuel: {cabinet.plan}</h3>
        <p className="text-sm text-blue-800">
          Pour augmenter vos quotas, contactez-nous ou passez à un plan supérieur dans 
          <a href="/dashboard/settings/abonnement" className="underline ml-1">Abonnement & Quotas</a>
        </p>
      </div>
    </div>
  )
}
