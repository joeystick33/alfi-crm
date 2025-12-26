"use client"

import Link from 'next/link'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { Badge } from '@/app/_common/components/ui/Badge'
import { cn } from '@/app/_common/lib/utils'
import { 
  User, 
  CreditCard, 
  Users, 
  Lock, 
  ChevronRight,
  Bell,
  Palette,
  Globe,
  Database,
  Key,
  Info
} from 'lucide-react'

interface SettingsCardProps {
  href: string
  icon: React.ElementType
  title: string
  description: string
  badge?: string
  badgeVariant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'
  disabled?: boolean
  iconColor?: string
  iconBg?: string
}

function SettingsCard({ 
  href, 
  icon: Icon, 
  title, 
  description, 
  badge, 
  badgeVariant = 'default',
  disabled = false,
  iconColor = 'text-indigo-600',
  iconBg = 'bg-indigo-50'
}: SettingsCardProps) {
  if (disabled) {
    return (
      <div className="relative p-5 rounded-xl border border-gray-100 bg-gray-50/50 cursor-not-allowed">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-gray-100">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-400">{title}</h3>
              {badge && (
                <Badge variant={badgeVariant} size="xs">{badge}</Badge>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link href={href} className="group block">
      <div className="relative p-5 rounded-xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-200">
        <div className="flex items-start gap-4">
          <div className={cn('p-2.5 rounded-xl transition-colors', iconBg, 'group-hover:scale-105 transition-transform')}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                {title}
              </h3>
              {badge && (
                <Badge variant={badgeVariant} size="xs">{badge}</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all mt-0.5" />
        </div>
      </div>
    </Link>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez votre profil, votre sécurité et les paramètres de votre cabinet
        </p>
      </div>

      {/* Section: Compte personnel */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Compte personnel</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SettingsCard
            href="/dashboard/settings/profil"
            icon={User}
            title="Mon profil"
            description="Informations personnelles et photo de profil"
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
          <SettingsCard
            href="/dashboard/settings/securite"
            icon={Lock}
            title="Sécurité"
            description="Mot de passe et sessions actives"
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
          />
          <SettingsCard
            href="/dashboard/settings/notifications"
            icon={Bell}
            title="Notifications"
            description="Préférences email et alertes"
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />
        </div>
      </div>

      {/* Section: Mon équipe (Conseillers only - assistant management) */}
      {user?.role === 'ADVISOR' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mon équipe</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsCard
              href="/dashboard/settings/assistant"
              icon={User}
              title="Mon assistant"
              description="Gérez l'accès de votre assistant à vos données"
              iconColor="text-slate-600"
              iconBg="bg-slate-50"
            />
          </div>
        </div>
      )}

      {/* Section: Cabinet (Admin only) */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gestion du cabinet</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsCard
              href="/dashboard/settings/users"
              icon={Users}
              title="Équipe"
              description="Gérez les comptes conseillers et assistants"
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
            />
            <SettingsCard
              href="/dashboard/settings/acces"
              icon={Key}
              title="Permissions"
              description="Rôles et accès des membres"
              iconColor="text-violet-600"
              iconBg="bg-violet-50"
            />
            <SettingsCard
              href="/dashboard/settings/abonnement"
              icon={CreditCard}
              title="Abonnement"
              description="Plan actuel et quotas d'utilisation"
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50"
            />
            <SettingsCard
              href="/dashboard/integrations"
              icon={Globe}
              title="Intégrations"
              description="Services externes et connexions"
              badge="Beta"
              badgeVariant="warning"
              iconColor="text-sky-600"
              iconBg="bg-sky-50"
            />
          </div>
        </div>
      )}

      {/* Section: Bientôt disponible */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bientôt disponible</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsCard
            href="#"
            icon={Palette}
            title="Apparence"
            description="Thème et personnalisation visuelle"
            badge="Bientôt"
            disabled
          />
          <SettingsCard
            href="#"
            icon={Database}
            title="Export des données"
            description="Exportez vos données clients"
            badge="Bientôt"
            disabled
          />
        </div>
      </div>

      {/* Info footer */}
      <div className="pt-6 border-t border-gray-100">
        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <Info className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-slate-900">Besoin d'aide ?</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Consultez notre <a href="#" className="text-indigo-600 hover:underline">documentation</a> ou contactez le support pour toute question.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
