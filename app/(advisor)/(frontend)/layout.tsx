 
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ServicesSidebar } from '@/app/(advisor)/(frontend)/components/dashboard/ServicesSidebar'
import { DashboardHeader } from '@/app/(advisor)/(frontend)/components/dashboard/DashboardHeader'
import { QuickActions } from '@/app/(advisor)/(frontend)/components/dashboard/QuickActions'
import { CommandPalette } from '@/app/(advisor)/(frontend)/components/dashboard/CommandPalette'
import { NotificationCenter } from '@/app/(advisor)/(frontend)/components/dashboard/NotificationCenter'
import { NavigationSidebar } from '@/app/(advisor)/(frontend)/components/dashboard/NavigationSidebar'
import { ErrorBoundary } from '@/app/_common/components/ErrorBoundary'
import { cn } from '@/app/_common/lib/utils'
import { EyeOff, X } from 'lucide-react'
import { PresentationModeProvider } from '@/app/(advisor)/(frontend)/components/dashboard/PresentationModeContext'

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
  const _router = useRouter()

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
        setPresentationMode((prev: any) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-[#f8fafc]">

        {/* Left Navigation Sidebar - Fond légèrement plus clair */}
        <NavigationSidebar />

        {/* Main Content Area */}
        <div
          className={cn(
            'flex-1 min-w-0 flex flex-col transition-all duration-300'
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
          <main className="flex-1 min-h-0 overflow-auto bg-[#f1f5f9]">
            <div className="max-w-[1600px] mx-auto px-6 py-6">
              <PresentationModeProvider value={presentationMode}>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </PresentationModeProvider>
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
              className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-xl bg-blue-600 px-4 py-3 text-white shadow-lg shadow-blue-400/40"
            >
              <EyeOff className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Mode Présentation Client</p>
                <p className="text-xs text-white/80">Données sensibles masquées • Ctrl+H pour désactiver</p>
              </div>
              <button
                onClick={() => setPresentationMode(false)}
                className="ml-2 rounded-lg p-1 hover:bg-white/20 transition-colors"
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
