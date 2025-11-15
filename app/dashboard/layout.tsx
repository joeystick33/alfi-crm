'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { NavigationSidebar } from '@/components/dashboard/NavigationSidebar'
import { ServicesSidebar } from '@/components/dashboard/ServicesSidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { CommandPalette } from '@/components/dashboard/CommandPalette'
import { NotificationCenter } from '@/components/dashboard/NotificationCenter'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { cn } from '@/lib/utils'
import { EyeOff, X } from 'lucide-react'

// Create QueryClient outside component to avoid recreating on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(false)
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false)
  const [presentationMode, setPresentationMode] = useState(false)
  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false)

  // Load presentation mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('presentationMode')
    if (saved) setPresentationMode(saved === 'true')
  }, [])

  // Save presentation mode to localStorage
  useEffect(() => {
    localStorage.setItem('presentationMode', String(presentationMode))
  }, [presentationMode])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N / Cmd+N - Quick Actions
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setQuickActionsOpen(true)
      }

      // Ctrl+K / Cmd+K - Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }

      // Ctrl+H / Cmd+H - Toggle Presentation Mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault()
        setPresentationMode((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-primary/8 via-primary/4 to-transparent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-radial from-primary/6 via-primary/3 to-transparent blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/4 to-transparent blur-3xl" />
        </div>

        {/* Left Navigation Sidebar */}
        <NavigationSidebar
          expanded={leftSidebarExpanded}
          onExpandedChange={setLeftSidebarExpanded}
        />

        {/* Main Content Area */}
        <div
          className={cn(
            'flex-1 flex flex-col transition-all duration-300',
            leftSidebarExpanded ? 'ml-0' : 'ml-0',
            rightSidebarExpanded ? 'xl:mr-0' : 'xl:mr-0'
          )}
        >
          {/* Header */}
          <DashboardHeader
            presentationMode={presentationMode}
            onTogglePresentationMode={() => setPresentationMode(!presentationMode)}
            onOpenQuickActions={() => setQuickActionsOpen(true)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenNotifications={() => setNotificationCenterOpen(true)}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6 relative">
            <div className="max-w-[1600px] mx-auto">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>

        {/* Right Services Sidebar */}
        <ServicesSidebar
          expanded={rightSidebarExpanded}
          onExpandedChange={setRightSidebarExpanded}
        />

        {/* Presentation Mode Indicator */}
        <AnimatePresence>
          {presentationMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40"
            >
              <EyeOff className="h-5 w-5" />
              <div>
                <p className="font-bold text-sm">Mode Présentation Client</p>
                <p className="text-xs opacity-90">Données sensibles masquées • Ctrl+H pour désactiver</p>
              </div>
              <button
                onClick={() => setPresentationMode(false)}
                className="ml-2 hover:bg-primary-foreground/20 rounded-lg p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions Modal */}
        <QuickActions open={quickActionsOpen} onOpenChange={setQuickActionsOpen} />

        {/* Command Palette */}
        <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

        {/* Notification Center */}
        <NotificationCenter open={notificationCenterOpen} onOpenChange={setNotificationCenterOpen} />
      </div>
    </QueryClientProvider>
  )
}
