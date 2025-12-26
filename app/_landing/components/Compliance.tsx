'use client'

import { ShieldCheck, Lock, FileCheck, Server } from 'lucide-react'

export function Compliance() {
  return (
    <section id="compliance" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            Sécurité & Conformité
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            Vos données sont notre priorité absolue
          </h2>
          <p className="text-lg text-slate-600">
            Aura dépasse les standards de l'industrie pour garantir la sécurité et la confidentialité de vos informations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Security Cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Chiffrement de bout en bout</h3>
              <p className="text-sm text-slate-600">
                Toutes les données sont chiffrées au repos (AES-256) et en transit (TLS 1.3).
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <FileCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Conformité RGPD</h3>
              <p className="text-sm text-slate-600">
                Hébergement 100% français. Droit à l'oubli et portabilité des données garantis.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                <Server className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Sauvegardes Quotidiennes</h3>
              <p className="text-sm text-slate-600">
                Réplication des données sur 3 sites géographiques distincts en France.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Audits Réguliers</h3>
              <p className="text-sm text-slate-600">
                Tests d'intrusion et audits de sécurité effectués par des tiers certifiés.
              </p>
            </div>
          </div>

          {/* Right Content */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 text-slate-900 relative overflow-hidden border border-slate-200 shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#7373FF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <h3 className="text-xl font-bold mb-4 relative z-10">Certification & Standards</h3>
              <ul className="space-y-4 relative z-10">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-600">Conforme DSP2 (Directive Services Paiement)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-600">ISO 27001 (En cours)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-slate-600">Hébergement Certifié HDS</span>
                </li>
              </ul>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <p className="text-sm text-slate-500 mb-4 italic">
                  "La sécurité n'est pas une option chez Aura, c'est le fondement de notre architecture."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7373FF] to-[#5c5ce6] flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                    TR
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Thomas R.</p>
                    <p className="text-xs text-slate-500">Directeur Technique</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
