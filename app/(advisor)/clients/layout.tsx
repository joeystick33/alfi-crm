'use client'

import { PageTabs } from '@/components/ui/PageTabs'
import { Users, Zap, Lightbulb } from 'lucide-react'

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    {
      label: 'Liste Clients',
      href: '/dashboard/clients',
      icon: Users,
    },
    {
      label: 'Actions Commerciales',
      href: '/dashboard/clients/actions',
      icon: Zap,
    },
    {
      label: 'Opportunités Détectées',
      href: '/dashboard/clients/opportunites',
      icon: Lightbulb,
    },
  ]

  return (
    <div>
      <PageTabs tabs={tabs} basePath="/dashboard/clients" />
      <div className="p-6">{children}</div>
    </div>
  )
}
