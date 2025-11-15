'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'

interface Tab {
  label: string
  href: string
  icon?: LucideIcon
  count?: number
}

interface PageTabsProps {
  tabs: Tab[]
  basePath?: string
}

export function PageTabs({ tabs, basePath }: PageTabsProps) {
  const pathname = usePathname()

  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                }
              `}
            >
              {Icon && (
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
                  `}
                  aria-hidden="true"
                />
              )}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`
                    ml-3 rounded-full py-0.5 px-2.5 text-xs font-medium
                    ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
