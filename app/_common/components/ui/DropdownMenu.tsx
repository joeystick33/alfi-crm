
'use client'

import * as React from 'react'
import { cn } from '@/app/_common/lib/utils'

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined)

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('useDropdownMenu must be used within DropdownMenu')
  }
  return context
}

export interface DropdownMenuProps {
  children: React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdownMenu()

  const handleClick = () => {
    setOpen(!open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      'aria-expanded': open,
      'aria-haspopup': 'true',
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="true"
      className="inline-flex items-center justify-center"
    >
      {children}
    </button>
  )
}

export interface DropdownMenuContentProps {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function DropdownMenuContent({
  children,
  align = 'start',
  className,
}: DropdownMenuContentProps) {
  const { open, setOpen } = useDropdownMenu()
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, setOpen])

  if (!open) return null

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-lg border border-border bg-background shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        alignmentClasses[align],
        className
      )}
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

export interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  className?: string
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled,
  className,
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenu()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && onClick) {
      onClick(event)
      setOpen(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none',
        'transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  )
}

export interface DropdownMenuSeparatorProps {
  className?: string
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <div className={cn('my-1 h-px bg-border', className)} />
}

export interface DropdownMenuLabelProps {
  children: React.ReactNode
  className?: string
}

export function DropdownMenuLabel({ children, className }: DropdownMenuLabelProps) {
  return (
    <div className={cn('px-3 py-2 text-sm font-semibold text-foreground', className)}>
      {children}
    </div>
  )
}

/* Compatibility for Dropdown.jsx users */

export const DropdownItem = DropdownMenuItem
export const DropdownSeparator = DropdownMenuSeparator

interface SimpleDropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right' | 'center'
  className?: string
}

export default function SimpleDropdown({ trigger, children, align = 'left', className }: SimpleDropdownProps) {
  const mapAlign = {
    left: 'start',
    right: 'end',
    center: 'center',
  } as const

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={mapAlign[align]} className={className}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
