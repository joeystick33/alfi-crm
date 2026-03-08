'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import {
  Home, Sofa, Briefcase, HardHat, Hammer, Wrench, Landmark,
  Castle, Building2, Calendar, Palmtree, Users, Lightbulb,
  BarChart3, FileText, Target, Wallet, TrendingUp,
} from 'lucide-react'

type Mecanisme = {
  id: string
  icon: ReactNode
  titre: string
  sousTitre: string
  description: string
  avantages: string[]
  fiscalite: string
  href: string
  disponible: boolean
  bientot?: boolean
}

const MECANISMES: Mecanisme[] = [
  {
    id: 'location-nue',
    icon: <Home className="w-8 h-8 text-blue-600" />,
    titre: 'Location Nue',
    sousTitre: 'Revenus fonciers classiques',
    description: 'Location non meublée avec fiscalité au régime micro-foncier (abattement 30%) ou réel (charges déductibles). Possibilité de déficit foncier.',
    avantages: ['Simplicité de gestion', 'Déficit foncier imputable', 'Pas de contrainte mobilier'],
    fiscalite: 'IR + PS 17.2%',
    href: '/dashboard/simulateurs/immobilier/location-nue',
    disponible: true,
  },
  {
    id: 'lmnp',
    icon: <Sofa className="w-8 h-8 text-blue-600" />,
    titre: 'LMNP',
    sousTitre: 'Loueur Meublé Non Professionnel',
    description: 'Location meublée avec amortissement du bien et du mobilier. Régime micro-BIC (50%) ou réel. Fiscalité avantageuse grâce aux amortissements.',
    avantages: ['Amortissement comptable', 'Revenus peu/pas imposés', 'Report des déficits'],
    fiscalite: 'BIC + PS 17.2%',
    href: '/dashboard/simulateurs/immobilier/lmnp',
    disponible: true,
  },
  {
    id: 'lmp',
    icon: <Briefcase className="w-8 h-8 text-blue-600" />,
    titre: 'LMP',
    sousTitre: 'Loueur Meublé Professionnel',
    description: 'Statut professionnel si recettes > 23 000 €/an ET supérieures aux autres revenus du foyer. Cotisations SSI mais déficit imputable sur revenu global.',
    avantages: ['Déficit sur revenu global', 'Exonération PV après 5 ans', 'Droits retraite'],
    fiscalite: 'BIC + SSI (~45%)',
    href: '/dashboard/simulateurs/immobilier/lmp',
    disponible: true,
  },
  {
    id: 'jeanbrun',
    icon: <HardHat className="w-8 h-8 text-emerald-600" />,
    titre: 'Jeanbrun (PLF 2026)',
    sousTitre: 'Amortissement neuf — Remplace Pinel',
    description: 'Nouveau dispositif remplaçant le Pinel. Amortissement fiscal du bien neuf (2% à 3,5%/an) avec engagement locatif 6/9/12 ans en zone tendue. Location nue, loyers plafonnés.',
    avantages: ['Amortissement déductible', 'Cumul déficit foncier', 'Pas de plafond niches'],
    fiscalite: 'Amortissement + IR',
    href: '/dashboard/simulateurs/immobilier/jeanbrun',
    disponible: true,
  },
  {
    id: 'pinel',
    icon: <HardHat className="w-8 h-8 text-amber-600" />,
    titre: 'Pinel / Pinel+',
    sousTitre: 'Expiré le 31/12/2024',
    description: 'Dispositif expiré. Simulateur conservé pour les biens acquis avant fin 2024. Pour un nouvel investissement, utilisez le dispositif Jeanbrun.',
    avantages: ['Réduction IR directe', 'Bien neuf aux normes', 'Revenus garantis'],
    fiscalite: 'Réduction IR',
    href: '/dashboard/simulateurs/immobilier/pinel',
    disponible: true,
  },
  {
    id: 'denormandie',
    icon: <Hammer className="w-8 h-8 text-blue-600" />,
    titre: 'Denormandie',
    sousTitre: 'Ancien avec travaux',
    description: 'Réduction d\'impôt pour rénovation en centre-ville dégradé. Travaux minimum 25% du coût total. Mêmes avantages que Pinel sur de l\'ancien.',
    avantages: ['Réduction IR', 'Ancien rénové', 'Zones revitalisées'],
    fiscalite: 'Réduction IR',
    href: '/dashboard/simulateurs/immobilier/denormandie',
    disponible: true,
  },
  {
    id: 'deficit-foncier',
    icon: <Wrench className="w-8 h-8 text-blue-600" />,
    titre: 'Déficit Foncier',
    sousTitre: 'Travaux déductibles',
    description: 'Stratégie de travaux importants pour créer un déficit imputable sur le revenu global (10 700 €/an, doublé pour rénovation énergétique).',
    avantages: ['Imputation sur RG', 'Report 10 ans', 'Rénovation valorisante'],
    fiscalite: 'Économie IR immédiate',
    href: '/dashboard/simulateurs/immobilier/deficit-foncier',
    disponible: true,
  },
  {
    id: 'malraux',
    icon: <Landmark className="w-8 h-8 text-blue-600" />,
    titre: 'Malraux',
    sousTitre: 'Secteur sauvegardé',
    description: 'Réduction d\'impôt de 22% ou 30% des travaux de restauration en secteur patrimonial remarquable. Plafond 400 000 € sur 4 ans. Hors plafond niches.',
    avantages: ['Hors plafond niches', 'Fort avantage fiscal', 'Patrimoine d\'exception'],
    fiscalite: 'Réduction IR 22-30%',
    href: '/dashboard/simulateurs/immobilier/malraux',
    disponible: true,
  },
  {
    id: 'monuments-historiques',
    icon: <Castle className="w-8 h-8 text-blue-600" />,
    titre: 'Monuments Historiques',
    sousTitre: 'Bien classé ou inscrit',
    description: '100% des travaux déductibles du revenu global sans plafond. Engagement de conservation 15 ans. Ouverture au public requise pour déduction totale.',
    avantages: ['Déduction 100%', 'Sans plafond', 'Prestige patrimonial'],
    fiscalite: 'Déduction RG totale',
    href: '/dashboard/simulateurs/immobilier/monuments-historiques',
    disponible: true,
  },
  {
    id: 'scpi',
    icon: <Building2 className="w-8 h-8 text-blue-600" />,
    titre: 'SCPI',
    sousTitre: 'Pierre-papier',
    description: 'Investissement mutualisé via parts de Sociétés Civiles de Placement Immobilier. Possibilité en pleine propriété, nue-propriété ou usufruit.',
    avantages: ['Mutualisation', 'Pas de gestion', 'Ticket d\'entrée faible'],
    fiscalite: 'Revenus fonciers',
    href: '/dashboard/simulateurs/immobilier/scpi',
    disponible: true,
  },
  {
    id: 'nue-propriete',
    icon: <Calendar className="w-8 h-8 text-blue-600" />,
    titre: 'Nue-Propriété',
    sousTitre: 'Démembrement temporaire',
    description: 'Acquisition de la nue-propriété avec usufruit locatif social. Pas de revenus pendant le démembrement mais récupération de la pleine propriété sans fiscalité.',
    avantages: ['Hors IFI', 'Pas d\'IR pendant', 'Décote à l\'achat'],
    fiscalite: 'Aucune pendant',
    href: '/dashboard/simulateurs/immobilier/nue-propriete',
    disponible: true,
  },
  {
    id: 'saisonnier',
    icon: <Palmtree className="w-8 h-8 text-blue-600" />,
    titre: 'Location Saisonnière',
    sousTitre: 'Airbnb / Tourisme',
    description: 'Location de courte durée type Airbnb. Meublé tourisme classé (abattement 50%) ou non classé (30%). Limite 120 jours/an pour résidence principale.',
    avantages: ['Rendement élevé', 'Flexibilité', 'Usage personnel possible'],
    fiscalite: 'Micro-BIC ou réel',
    href: '/dashboard/simulateurs/immobilier/saisonnier',
    disponible: true,
  },
  {
    id: 'colocation',
    icon: <Users className="w-8 h-8 text-blue-600" />,
    titre: 'Colocation',
    sousTitre: 'Multi-baux',
    description: 'Location à plusieurs locataires avec baux individuels ou solidaires. Rendement optimisé par chambre. Peut être meublé (LMNP) ou nu.',
    avantages: ['Rendement optimisé', 'Risque réparti', 'Forte demande'],
    fiscalite: 'Selon meublé/nu',
    href: '/dashboard/simulateurs/immobilier/colocation',
    disponible: true,
  },
]

export default function ImmobilierHubPage() {
  return (
    <SimulatorGate simulator="IMMOBILIER" showTeaser>
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <Link href="/dashboard/simulateurs" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1">
            ← Retour aux simulateurs
          </Link>

          {/* Header */}
          <div className="hub-card mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Home className="w-10 h-10 text-blue-700" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Simulateurs Investissement Immobilier</h1>
                <p className="text-gray-600 text-lg">Choisissez le mécanisme d'investissement adapté à votre situation</p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Comment choisir ?</h3>
              <p className="text-blue-700 text-sm">
                Chaque mécanisme a ses propres règles fiscales, conditions d'éligibilité et avantages. 
                Sélectionnez celui qui correspond à votre projet et votre situation patrimoniale. 
                Le simulateur adaptera automatiquement les paramètres et calculs.
              </p>
            </div>
          </div>

          {/* Grille des mécanismes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MECANISMES.map((m) => (
              <div
                key={m.id}
                className={`mecanisme-card group ${!m.disponible ? 'opacity-70' : ''}`}
              >
                {m.bientot && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      Bientôt
                    </span>
                  </div>
                )}
                {m.id === 'pinel' && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      Expiré
                    </span>
                  </div>
                )}
                {m.id === 'jeanbrun' && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                      Nouveau 2026
                    </span>
                  </div>
                )}
                
                <div className="flex items-start gap-4 mb-4">
                  {m.icon}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {m.titre}
                    </h3>
                    <p className="text-sm text-gray-500">{m.sousTitre}</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {m.description}
                </p>
                
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Avantages clés</p>
                  <div className="flex flex-wrap gap-2">
                    {m.avantages.map((a, i) => (
                      <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                        ✓ {a}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <span className="text-xs font-medium text-gray-500">
                    Fiscalité : <span className="text-gray-700">{m.fiscalite}</span>
                  </span>
                  
                  {m.disponible ? (
                    <Link 
                      href={m.href}
                      className="btn-primary-sm"
                    >
                      Simuler →
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-400">Prochainement</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Aide au choix */}
          <div className="hub-card mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Aide au choix selon votre profil</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="profil-card">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2"><Target className="w-4 h-4" /> Je veux réduire mes impôts</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>→ <strong>Jeanbrun/Denormandie</strong> : amortissement neuf</li>
                  <li>→ <strong>Déficit foncier</strong> : travaux déductibles</li>
                  <li>→ <strong>Malraux/MH</strong> : très hauts revenus</li>
                </ul>
              </div>
              
              <div className="profil-card">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2"><Wallet className="w-4 h-4" /> Je veux des revenus nets</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>→ <strong>LMNP réel</strong> : amortissement = peu d'impôt</li>
                  <li>→ <strong>Nue-propriété</strong> : capitalisation</li>
                  <li>→ <strong>SCPI</strong> : revenus passifs</li>
                </ul>
              </div>
              
              <div className="profil-card">
                <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Je veux du rendement</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>→ <strong>Colocation</strong> : optimisation par chambre</li>
                  <li>→ <strong>Saisonnier</strong> : Airbnb si zone touristique</li>
                  <li>→ <strong>LMNP étudiant</strong> : demande forte</li>
                </ul>
              </div>
              
              <div className="profil-card">
                <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Je prépare ma retraite</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>→ <strong>LMNP</strong> : revenus peu fiscalisés</li>
                  <li>→ <strong>LMP</strong> : cotisations retraite</li>
                  <li>→ <strong>Nue-propriété</strong> : récupération tardive</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Comparatif fiscal rapide */}
          <div className="hub-card mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Comparatif fiscal simplifié</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-2">Mécanisme</th>
                    <th className="text-center py-3 px-2">Imposition revenus</th>
                    <th className="text-center py-3 px-2">Charges déductibles</th>
                    <th className="text-center py-3 px-2">Amortissement</th>
                    <th className="text-center py-3 px-2">Déficit imputable RG</th>
                    <th className="text-center py-3 px-2">PS / Cotisations</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">Location nue micro</td>
                    <td className="text-center py-3 px-2">IR (TMI)</td>
                    <td className="text-center py-3 px-2">Forfait 30%</td>
                    <td className="text-center py-3 px-2">Non</td>
                    <td className="text-center py-3 px-2">Non</td>
                    <td className="text-center py-3 px-2">17.2%</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">Location nue réel</td>
                    <td className="text-center py-3 px-2">IR (TMI)</td>
                    <td className="text-center py-3 px-2 text-emerald-600">Réelles</td>
                    <td className="text-center py-3 px-2">Non</td>
                    <td className="text-center py-3 px-2 text-emerald-600">10 700€/an</td>
                    <td className="text-center py-3 px-2">17.2%</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50 bg-green-50">
                    <td className="py-3 px-2 font-medium">LMNP micro-BIC</td>
                    <td className="text-center py-3 px-2">IR (TMI)</td>
                    <td className="text-center py-3 px-2">Forfait 50%</td>
                    <td className="text-center py-3 px-2">Non</td>
                    <td className="text-center py-3 px-2">Non</td>
                    <td className="text-center py-3 px-2">17.2%</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50 bg-green-50">
                    <td className="py-3 px-2 font-medium">LMNP réel</td>
                    <td className="text-center py-3 px-2">IR (TMI)</td>
                    <td className="text-center py-3 px-2 text-emerald-600">Réelles</td>
                    <td className="text-center py-3 px-2 text-emerald-600">Bien + mobilier</td>
                    <td className="text-center py-3 px-2">Report BIC</td>
                    <td className="text-center py-3 px-2">17.2%</td>
                  </tr>
                  <tr className="border-b hover:bg-gray-50 bg-orange-50">
                    <td className="py-3 px-2 font-medium">LMP</td>
                    <td className="text-center py-3 px-2">IR (TMI)</td>
                    <td className="text-center py-3 px-2 text-emerald-600">Réelles</td>
                    <td className="text-center py-3 px-2 text-emerald-600">Bien + mobilier</td>
                    <td className="text-center py-3 px-2 text-emerald-600">Sans limite</td>
                    <td className="text-center py-3 px-2">~45% SSI</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              TMI = Tranche Marginale d'Imposition • PS = Prélèvements Sociaux • RG = Revenu Global • 
              SSI = Sécurité Sociale des Indépendants
            </p>
          </div>

        </main>
      </div>

      <style jsx global>{`
        .hub-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        
        .mecanisme-card {
          position: relative;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          min-height: 320px;
        }
        
        .mecanisme-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.15);
          transform: translateY(-4px);
        }
        
        .profil-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
        }
        
        .btn-primary-sm {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }
        
        .btn-primary-sm:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </SimulatorGate>
  )
}
