'use client'

import Link from 'next/link'
import { ArrowRight, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { AuraLogo } from '@/app/_common/components/AuraLogo'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled
            ? 'bg-[#0f0f2d]/80 backdrop-blur-md border-[#ffffff0d] py-3 shadow-lg shadow-[#0f0f2d]/20'
            : 'bg-transparent border-transparent py-6'
          }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <AuraLogo variant="white" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: 'Fonctionnalités', href: '#features' },
              { label: 'Conformité', href: '#compliance' },
              { label: 'Tarifs', href: '#pricing' }
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-[#7373FF] to-[#8b8bff] text-white text-sm font-medium rounded-lg hover:shadow-lg hover:shadow-[#7373FF]/25 transition-all shadow-md shadow-[#7373FF]/10 flex items-center gap-2 border border-white/10"
            >
              Essai gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[60] bg-white transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-12">
            <AuraLogo variant="color" />
            <button onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>

          <nav className="flex flex-col gap-6 text-xl font-medium text-slate-900">
            {[
              { label: 'Fonctionnalités', href: '#features' },
              { label: 'Conformité', href: '#compliance' },
              { label: 'Tarifs', href: '#pricing' }
            ].map((item) => (
              <a key={item.label} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#7373FF] transition-colors">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-4">
            <Link
              href="/login"
              className="w-full py-4 text-center border border-slate-200 rounded-xl font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="w-full py-4 text-center bg-[#7373FF] text-white rounded-xl font-medium hover:bg-[#5c5ce6] transition-colors shadow-lg shadow-indigo-500/20"
            >
              Démarrer l'essai
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
