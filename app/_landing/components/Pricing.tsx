'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const plans = [
  {
    name: "Solo",
    description: "Pour les CGP indépendants qui lancent leur activité.",
    price: { monthly: 89, yearly: 79 },
    features: [
      "CRM Client 360°",
      "Simulateurs Fiscaux à jour",
      "Conformité & KYC basique",
      "50 dossiers clients",
      "Support par email"
    ],
    cta: "Essai gratuit 14 jours",
    href: "/register?plan=solo",
    popular: false
  },
  {
    name: "Cabinet",
    description: "La solution complète pour les cabinets en croissance.",
    price: { monthly: 149, yearly: 129 },
    features: [
      "Tout du plan Solo",
      "Dossiers clients illimités",
      "Agrégation bancaire & SIRENE",
      "GED illimitée & sécurisée",
      "Marque blanche (Logo & Couleurs)",
      "Support prioritaire"
    ],
    cta: "Commencer maintenant",
    href: "/register?plan=cabinet",
    popular: true
  },
  {
    name: "Entreprise",
    description: "Pour les réseaux et grandes structures.",
    price: { monthly: "Sur devis", yearly: "Sur devis" },
    features: [
      "Tout du plan Cabinet",
      "API & Intégrations sur mesure",
      "Sso & Sécurité avancée",
      "Formation & Onboarding dédié",
      "Contrat SLA"
    ],
    cta: "Contacter les ventes",
    href: "mailto:sales@aura.fr",
    popular: false
  }
]

export function Pricing() {
  const [isYearly, setIsYearly] = useState(true)

  return (
    <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-200">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            Des tarifs simples et transparents
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Choisissez l'offre adaptée à la taille de votre cabinet. <br />
            Aucun frais caché, sans engagement.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>Mensuel</span>
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-7 bg-slate-200 rounded-full p-1 transition-colors hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7373FF] focus:ring-offset-2"
            >
              <div 
                className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isYearly ? 'translate-x-7' : 'translate-x-0'}`} 
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
              Annuel <span className="text-[#7373FF] text-xs font-bold ml-1">-20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative bg-white rounded-2xl p-8 border ${
                plan.popular 
                  ? 'border-[#7373FF] shadow-xl shadow-indigo-500/10 scale-105 z-10' 
                  : 'border-slate-200 shadow-sm hover:border-slate-300'
              } transition-all duration-300 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#7373FF] text-white px-4 py-1 rounded-full text-sm font-medium shadow-sm whitespace-nowrap">
                  Le plus populaire
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-500 text-sm h-10">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  {typeof plan.price.monthly === 'number' ? (
                    <>
                      <span className="text-4xl font-bold text-slate-900">
                        {isYearly ? plan.price.yearly : plan.price.monthly}€
                      </span>
                      <span className="text-slate-500">/mois</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-slate-900">Sur devis</span>
                  )}
                </div>
                {typeof plan.price.monthly === 'number' && typeof plan.price.yearly === 'number' && isYearly && (
                  <p className="text-sm text-[#7373FF] font-medium mt-2">
                    Facturé {plan.price.yearly * 12}€ par an
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#7373FF] shrink-0" />
                    <span className="text-slate-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-center transition-all ${
                  plan.popular
                    ? 'bg-[#7373FF] text-white hover:bg-[#5c5ce6] shadow-md hover:shadow-lg'
                    : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
