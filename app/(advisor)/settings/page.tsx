import { Card } from '@/components/ui/Card'
import { Settings, User, CreditCard, Key, Bell } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const settingsLinks = [
    {
      title: 'Mon profil',
      description: 'Informations personnelles et mot de passe',
      icon: User,
      href: '/dashboard/settings/profil',
    },
    {
      title: 'Abonnement & Quotas',
      description: 'Gérez votre abonnement et quotas',
      icon: CreditCard,
      href: '/dashboard/settings/abonnement',
    },
    {
      title: 'Gestion des accès',
      description: 'Rôles et permissions',
      icon: Key,
      href: '/dashboard/settings/acces',
    },
    {
      title: 'Notifications',
      description: 'Préférences de notifications',
      icon: Bell,
      href: '/dashboard/notifications',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">Gérez vos préférences et paramètres</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <link.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
