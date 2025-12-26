'use client'

import { useRef, useState, MouseEvent } from 'react'
import { motion } from 'framer-motion'

export function MagneticButton({
  children,
  className = "",
  onClick
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current!.getBoundingClientRect()
    
    const x = clientX - (left + width / 2)
    const y = clientY - (top + height / 2)
    
    setPosition({ x, y })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  const { x, y } = position

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: x * 0.3, y: y * 0.3 }} // Magnetic effect strength
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`${className} relative overflow-hidden`}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}
