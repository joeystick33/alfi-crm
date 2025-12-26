'use client'

import Link from 'next/link'
import { AuraLogo } from '@/app/_common/components/AuraLogo'
import { Twitter, Linkedin, Github } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-50 text-slate-600 py-16 border-t border-slate-200">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          
          <div className="md:col-span-4 space-y-6">
            <Link href="/" className="inline-block">
              <AuraLogo variant="color" />
            </Link>
            <p className="text-base text-slate-500 leading-relaxed max-w-sm">
              La plateforme de gestion nouvelle génération pour les conseillers en gestion de patrimoine exigeants.
            </p>
          </div>

          <div className="md:col-span-2 md:col-start-7">
            <h4 className="font-bold text-slate-900 mb-6">Produit</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#features" className="hover:text-[#7373FF] transition-colors">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-[#7373FF] transition-colors">Tarifs</a></li>
              <li><a href="#compliance" className="hover:text-[#7373FF] transition-colors">Conformité</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold text-slate-900 mb-6">Société</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-[#7373FF] transition-colors">À propos</a></li>
              <li><a href="#" className="hover:text-[#7373FF] transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-[#7373FF] transition-colors">Carrières</a></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold text-slate-900 mb-6">Légal</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-[#7373FF] transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-[#7373FF] transition-colors">CGU</a></li>
              <li><a href="#" className="hover:text-[#7373FF] transition-colors">Mentions légales</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-slate-500">
            © 2025 Aura CRM. Tous droits réservés.
          </p>
          
          <div className="flex items-center gap-4">
            <SocialLink icon={Twitter} href="#" />
            <SocialLink icon={Linkedin} href="#" />
            <SocialLink icon={Github} href="#" />
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ icon: Icon, href }: { icon: any, href: string }) {
  return (
    <a 
      href={href} 
      className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-[#7373FF] hover:border-[#7373FF] hover:text-white transition-all duration-300 shadow-sm"
    >
      <Icon className="w-4 h-4" />
    </a>
  )
}
