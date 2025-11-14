'use client'

import { useState } from 'react'
import { NavigationSidebar } from '@/components/dashboard/NavigationSidebar'
import { ServicesSidebar } from '@/components/dashboard/ServicesSidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(false)
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false)
  const [presentationMode, setPresentationMode] = useState(false)

  // Toggle presentation mode with Ctrl+H
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault()
      setPresentationMode(!presentationMode)
    }
  }

  // Add keyboard listener
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown as any)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Navigation Sidebar */}
      <NavigationSidebar
        expanded={leftSidebarExpanded}
        onExpandedChange={setLeftSidebarExpanded}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader
          presentationMode={presentationMode}
          onTogglePresentationMode={() => setPresentationMode(!presentationMode)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className={presentationMode ? 'blur-sm' : ''}>
            {children}
          </div>
        </main>
      </div>

      {/* Right Services Sidebar */}
      <ServicesSidebar
        expanded={rightSidebarExpanded}
        onExpandedChange={setRightSidebarExpanded}
      />

      {/* Presentation Mode Indicator */}
      {presentationMode && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-warning px-4 py-2 text-sm font-medium text-warning-foreground shadow-lg">
          Mode Présentation Actif (Ctrl+H pour désactiver)
        </div>
      )}
    </div>
  )
}
