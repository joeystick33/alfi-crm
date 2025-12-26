'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto bg-[#7373FF] rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-xl shadow-indigo-500/20">
          
          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Testez Aura gratuitement
            </h2>
            <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
              14 jours pour découvrir comment Aura peut s'intégrer à votre activité. 
              Sans engagement, sans carte bancaire.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/register" 
                className="w-full sm:w-auto px-8 py-4 bg-white text-[#7373FF] text-lg font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                Commencer maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-8 py-4 bg-indigo-700/50 text-white border border-indigo-400/30 text-lg font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Déjà un compte ?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
