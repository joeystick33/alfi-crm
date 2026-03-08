
'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/app/_common/lib/utils'

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerEl: HTMLElement | null
  setTriggerEl: (el: HTMLElement | null) => void
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
  const [triggerEl, setTriggerEl] = React.useState<HTMLElement | null>(null)

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerEl, setTriggerEl }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen, setTriggerEl } = useDropdownMenu()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setTriggerEl(event.currentTarget)
    setOpen(!open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        handleClick(event)
        ;(children as any).props?.onClick?.(event)
      },
      'aria-expanded': open,
      'aria-haspopup': 'true',
    })
  }

  return (
    <button
      type="button"
      onClick={(event) => handleClick(event as unknown as React.MouseEvent<HTMLElement>)}
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
  const { open, setOpen, triggerEl } = useDropdownMenu()
  const ref = React.useRef<HTMLDivElement>(null)
  const [style, setStyle] = React.useState<React.CSSProperties | null>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (ref.current && ref.current.contains(target)) return
      if (triggerEl && triggerEl.contains(target)) return
      if (ref.current && !ref.current.contains(target)) {
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
  }, [open, setOpen, triggerEl])

  const computePosition = () => {
    if (!triggerEl) return
    const triggerRect = triggerEl.getBoundingClientRect()
    const contentEl = ref.current
    if (!contentEl) return

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const contentRect = contentEl.getBoundingClientRect()

    let left = triggerRect.left
    const top = Math.min(triggerRect.bottom + 8, viewportHeight - 8)

    if (align === 'center') {
      left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2
    }
    if (align === 'end') {
      left = triggerRect.right - contentRect.width
    }

    const minLeft = 8
    const maxLeft = viewportWidth - contentRect.width - 8
    left = Math.max(minLeft, Math.min(left, maxLeft))

    setStyle({
      position: 'fixed',
      top,
      left,
      zIndex: 9999,
    })
  }

  React.useLayoutEffect(() => {
    if (!open) return
    setStyle({ position: 'fixed', top: 0, left: 0, zIndex: 9999, visibility: 'hidden' })
  }, [open])

  React.useLayoutEffect(() => {
    if (!open) return
    computePosition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align, triggerEl])

  React.useEffect(() => {
    if (!open) return
    const onScroll = () => computePosition()
    const onResize = () => computePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align, triggerEl])

  if (!open) return null

  return createPortal(
    <div
      ref={ref}
      style={style ?? undefined}
      className={cn(
        'min-w-[12rem] overflow-hidden rounded-lg border border-border bg-background shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
    >
      <div className="p-1">{children}</div>
    </div>,
    document.body
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

export interface DropdownMenuCheckboxItemProps {
  children: React.ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function DropdownMenuCheckboxItem({
  children,
  checked = false,
  onCheckedChange,
  disabled,
  className,
}: DropdownMenuCheckboxItemProps) {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked)
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
      <span className={cn(
        'mr-2 flex h-4 w-4 items-center justify-center rounded border',
        checked ? 'bg-primary border-primary' : 'border-gray-300'
      )}>
        {checked && (
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {children}
    </button>
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
