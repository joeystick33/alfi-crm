'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface LogoutButtonProps {
  variant?: 'outline' | 'ghost' | 'destructive' | 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showText?: boolean
  className?: string
  callbackUrl?: string
}

export function LogoutButton({
  variant = 'outline',
  size = 'md',
  showIcon = true,
  showText = true,
  className = '',
  callbackUrl = '/login',
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      // Appel à l'API de déconnexion Supabase
      await fetch('/api/auth/logout', { method: 'POST' })
      // Redirection manuelle
      router.push(callbackUrl)
      // Rafraîchir pour nettoyer le cache
      router.refresh()
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        showIcon && <LogOut className="h-4 w-4" />
      )}
      {showText && <span>{isLoading ? 'Déconnexion...' : 'Se déconnecter'}</span>}
    </Button>
  )
}
