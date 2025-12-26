'use client'

import { usePathname } from 'next/navigation'
import { PageTabs } from '@/app/_common/components/ui/PageTabs'
import { Users, Zap, Lightbulb } from 'lucide-react'

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Ne pas afficher les tabs sur les pages de détail client (ex: /dashboard/clients/[id])
  const isDetailPage = /^\/dashboard\/clients\/[^/]+$/.test(pathname) && 
    !['actions', 'opportunites', 'nouveau'].includes(pathname.split('/').pop() || '')

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

  if (isDetailPage) {
    return <>{children}</>
  }

  return (
    <>
      <PageTabs tabs={tabs} basePath="/dashboard/clients" />
      <div className="p-6">{children}</div>
    </>
  )
}
