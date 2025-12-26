import React from 'react'

interface AuraLogoProps {
  className?: string
  variant?: 'color' | 'white' | 'dark'
  withText?: boolean
}

export function AuraLogo({ className = '', variant = 'color', withText = true }: AuraLogoProps) {
  // Brand colors: Primary #7373FF, Dark #0F172A
  const primaryColor = '#7373FF'
  const darkColor = '#0F172A'
  
  const textColor = variant === 'white' ? '#FFFFFF' : darkColor
  const iconColor = variant === 'white' ? '#FFFFFF' : primaryColor

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <path
          d="M16 2L2 9L16 16L30 9L16 2Z"
          fill={iconColor}
          fillOpacity="0.2"
        />
        <path
          d="M2 23L16 30L30 23V9L16 16L2 9V23Z"
          stroke={iconColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 30V16"
          stroke={iconColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30 9L16 16L2 9"
          stroke={iconColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {withText && (
        <span 
          className="font-bold text-xl tracking-tight"
          style={{ color: textColor, fontFamily: 'var(--font-outfit), sans-serif' }}
        >
          Aura
        </span>
      )}
    </div>
  )
}
