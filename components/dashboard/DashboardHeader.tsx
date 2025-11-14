'use client'

import { useState } from 'react'
import { Search, Bell, Plus, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { CommandPalette } from './CommandPalette'
import { NotificationCenter } from './NotificationCenter'
import { useUnreadNotificationCount } from '@/hooks/use-api'

interface DashboardHeaderProps {
  presentationMode: boolean
  onTogglePresentationMode: () => void
}

export function DashboardHeader({
  presentationMode,
  onTogglePresentationMode,
}: DashboardHeaderProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false)
  const { data: unreadCount } = useUnreadNotificationCount()

  return (
    <>
      <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher... (Ctrl+K)"
              className="pl-9"
              onFocus={() => setCommandPaletteOpen(true)}
              readOnly
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Add */}
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>

          {/* Presentation Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onTogglePresentationMode}
            title={presentationMode ? 'Désactiver le mode présentation' : 'Activer le mode présentation'}
          >
            {presentationMode ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationCenterOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount && unreadCount.count > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount.count > 9 ? '9+' : unreadCount.count}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />

      {/* Notification Center */}
      <NotificationCenter
        open={notificationCenterOpen}
        onOpenChange={setNotificationCenterOpen}
      />
    </>
  )
}
