'use client'

import { 
  Calculator, 
  ShieldCheck, 
  PieChart, 
  Users, 
  Building2, 
  FileText 
} from 'lucide-react'

const features = [
  {
    title: "Simulateurs Fiscaux",
    description: "IR, IFI, prévoyance TNS, PER — barèmes à jour intégrés. Visualisez l'impact fiscal des stratégies patrimoniales.",
    icon: Calculator,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    title: "Fiche Client 360°",
    description: "Patrimoine, budget, famille, objectifs — toutes les informations client centralisées. Particuliers et professionnels.",
    icon: Users,
    color: "text-indigo-600",
    bg: "bg-indigo-50"
  },
  {
    title: "Conformité & KYC",
    description: "Génération automatisée des documents réglementaires. Profils de risque, DER, questionnaires MIF II.",
    icon: ShieldCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  {
    title: "Enrichissement SIRENE",
    description: "Création de fiches clients professionnels via le numéro SIREN. Import automatique des données entreprise.",
    icon: Building2,
    color: "text-amber-600",
    bg: "bg-amber-50"
  },
  {
    title: "Simulateurs Immobiliers",
    description: "LMNP, Pinel, location nue, SCI — projections de cash-flows et fiscalité sur la durée de l'investissement.",
    icon: PieChart,
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  {
    title: "Portail Client & GED",
    description: "Espace sécurisé pour vos clients : dépôt de documents, consultation patrimoine, signature électronique.",
    icon: FileText,
    color: "text-rose-600",
    bg: "bg-rose-50"
  }
]

export function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            Une plateforme complète pour votre activité
          </h2>
          <p className="text-lg text-slate-600">
            Tous les outils essentiels du CGP, réunis dans une interface unique et intuitive.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-8 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300 bg-white group"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
