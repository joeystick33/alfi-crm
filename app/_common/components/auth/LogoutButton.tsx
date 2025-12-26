'use client'

import { useAuth } from '@/app/_common/hooks/use-auth'
import { Button } from '@/app/_common/components/ui/Button'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link' | 'success' | 'warning'
    size?: 'sm' | 'md' | 'lg' | 'icon'
    showIcon?: boolean
    showText?: boolean
    className?: string
    callbackUrl?: string
}

export function LogoutButton({
    variant = 'ghost',
    size = 'sm',
    showIcon = true,
    showText = true,
    className,
    callbackUrl
}: LogoutButtonProps) {
    const { logout, isLoading } = useAuth()

    return (
        <Button
            variant={variant}
            size={size}
            onClick={() => logout()}
            disabled={isLoading}
            className={className}
        >
            {showIcon && <LogOut className={`h-4 w-4 ${showText ? 'mr-2' : ''}`} />}
            {showText && 'Déconnexion'}
        </Button>
    )
}
