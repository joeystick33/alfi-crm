/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SERVICE CONVENTIONS COLLECTIVES & OBLIGATIONS SOCIALES
 * Source : code.travail.gouv.fr
 * Données officielles sur les conventions et obligations sociales
 * ══════════════════════════════════════════════════════════════════════════════
 */

// API Code du Travail - endpoint public
const CODE_TRAVAIL_API = 'https://code.travail.gouv.fr/api/v1'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface ConventionCollective {
  id: string
  idcc: string // ex: "0044", "1090"
  titre: string
  titreCourt: string
  url?: string
  texteDeBase?: {
    id: string
    cid: string
  }
}

export interface ObligationsSociales {
  prevoyance: ObligationDetail
  sante: ObligationDetail
  epargneSalariale: ObligationDetail
  retraiteSupplementaire: ObligationDetail
}

export interface ObligationDetail {
  obligatoire: boolean
  niveau: 'legal' | 'conventionnel' | 'facultatif'
  description: string
  minimums?: string[]
  source?: string
}

export interface AnalyseCommerciale {
  score: number // 0-100
  qualification: 'HOT' | 'WARM' | 'COLD'
  pitch: string
  opportunites: OpportuniteDetectee[]
  alertes: AlerteObligatoire[]
}

export interface OpportuniteDetectee {
  type: 'PREVOYANCE' | 'SANTE' | 'EPARGNE' | 'RETRAITE' | 'RC_PRO'
  priorite: 'haute' | 'moyenne' | 'basse'
  titre: string
  description: string
  potentielEstime?: number
}

export interface AlerteObligatoire {
  niveau: 'critical' | 'warning' | 'info'
  titre: string
  description: string
  echeance?: string
}

export interface ProfilSocialComplet {
  convention?: ConventionCollective
  obligations: ObligationsSociales
  analyse: AnalyseCommerciale
}

// ══════════════════════════════════════════════════════════════════════════════
// MAPPING NAF → CONVENTIONS (données courantes)
// Source: Légifrance / Code du travail
// ══════════════════════════════════════════════════════════════════════════════

const NAF_TO_IDCC: Record<string, string[]> = {
  // Bureaux d'études
  '70.22Z': ['1486'], // SYNTEC
  '71.12B': ['1486'], // Ingénierie
  '62.01Z': ['1486'], // Programmation informatique
  '62.02A': ['1486'], // Conseil en systèmes
  '62.09Z': ['1486'], // Autres activités informatiques
  
  // BTP
  '41.20A': ['1597'], // Construction de bâtiments résidentiels
  '41.20B': ['1597'], // Construction de bâtiments non résidentiels
  '43.21A': ['1597'], // Travaux d'installation électrique
  '43.22A': ['1597'], // Plomberie
  
  // Commerce
  '47.11A': ['2216'], // Commerce alimentaire
  '47.11B': ['2216'], // Commerce non alimentaire
  '46.90Z': ['0573'], // Commerce de gros
  
  // Hôtellerie-Restauration
  '55.10Z': ['1979'], // Hôtels
  '56.10A': ['1979'], // Restauration traditionnelle
  '56.10B': ['1979'], // Cafétérias
  '56.30Z': ['1979'], // Débits de boissons
  
  // Services
  '69.10Z': ['2121'], // Activités juridiques
  '69.20Z': ['0787'], // Comptabilité
  '86.21Z': ['1147'], // Médecins généralistes
  '86.22A': ['1147'], // Médecins spécialistes
  
  // Industrie
  '25.62A': ['0054'], // Métallurgie
  '25.62B': ['0054'], // Usinage
  
  // Transport
  '49.41A': ['0016'], // Transport routier
  '49.41B': ['0016'], // Transport routier interurbain
}

// Conventions avec leurs obligations spécifiques
const CONVENTIONS_DATA: Record<string, Partial<ConventionCollective> & { obligations: Partial<ObligationsSociales> }> = {
  '1486': {
    idcc: '1486',
    titre: 'Convention collective nationale des bureaux d\'études techniques, des cabinets d\'ingénieurs-conseils et des sociétés de conseils',
    titreCourt: 'SYNTEC',
    obligations: {
      prevoyance: {
        obligatoire: true,
        niveau: 'conventionnel',
        description: 'Prévoyance obligatoire pour tous les salariés',
        minimums: [
          'Décès: 350% du salaire annuel',
          'ITT: 80% du salaire après 90 jours',
          'Invalidité: 80% du salaire'
        ],
        source: 'Accord prévoyance SYNTEC du 13/12/2001'
      },
      sante: {
        obligatoire: true,
        niveau: 'conventionnel',
        description: 'Mutuelle obligatoire avec panier de soins supérieur à l\'ANI',
        minimums: [
          'Hospitalisation: 100% BR',
          'Optique: 150€/verre',
          'Dentaire: 150% BR'
        ],
        source: 'Accord santé SYNTEC'
      }
    }
  },
  '1597': {
    idcc: '1597',
    titre: 'Convention collective nationale des bâtiments: ouvriers',
    titreCourt: 'Bâtiment',
    obligations: {
      prevoyance: {
        obligatoire: true,
        niveau: 'conventionnel',
        description: 'Prévoyance obligatoire BTP-Prévoyance',
        minimums: [
          'Décès: 100% à 400% selon ancienneté',
          'ITT: 90% du salaire net'
        ],
        source: 'Accord BTP-Prévoyance'
      }
    }
  },
  '1979': {
    idcc: '1979',
    titre: 'Convention collective nationale des hôtels, cafés restaurants (HCR)',
    titreCourt: 'HCR',
    obligations: {
      prevoyance: {
        obligatoire: true,
        niveau: 'conventionnel',
        description: 'Régime de prévoyance HCR obligatoire',
        minimums: [
          'Décès: capital selon ancienneté',
          'Invalidité/Incapacité: barème conventionnel'
        ]
      }
    }
  },
  '0787': {
    idcc: '0787',
    titre: 'Convention collective nationale des cabinets d\'experts-comptables et de commissaires aux comptes',
    titreCourt: 'Experts-comptables',
    obligations: {
      prevoyance: {
        obligatoire: true,
        niveau: 'conventionnel',
        description: 'Prévoyance conventionnelle obligatoire',
        minimums: [
          'Décès: 150% à 300% du salaire',
          'ITT: 80% après franchise'
        ]
      }
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS PRINCIPALES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Rechercher la convention collective par code NAF
 */
export function rechercherConventionParNAF(codeNAF: string): ConventionCollective | null {
  const cleanNAF = codeNAF.replace(/\./g, '').toUpperCase()
  const nafWithDot = `${cleanNAF.slice(0, 2)}.${cleanNAF.slice(2)}`
  
  const idccList = NAF_TO_IDCC[nafWithDot] || NAF_TO_IDCC[cleanNAF]
  
  if (!idccList || idccList.length === 0) return null
  
  const idcc = idccList[0]
  const conventionData = CONVENTIONS_DATA[idcc]
  
  if (!conventionData) {
    return {
      id: idcc,
      idcc,
      titre: `Convention collective IDCC ${idcc}`,
      titreCourt: `IDCC ${idcc}`
    }
  }
  
  return {
    id: idcc,
    idcc: conventionData.idcc!,
    titre: conventionData.titre!,
    titreCourt: conventionData.titreCourt!
  }
}

/**
 * Calculer les obligations sociales selon la convention et l'effectif
 */
export function calculerObligations(
  convention: ConventionCollective | null,
  effectif: number
): ObligationsSociales {
  // Obligations de base (légales)
  const obligations: ObligationsSociales = {
    prevoyance: {
      obligatoire: effectif >= 1,
      niveau: 'legal',
      description: 'Maintien de salaire employeur obligatoire (loi de mensualisation)',
      source: 'Code du travail Art. L1226-1'
    },
    sante: {
      obligatoire: true, // ANI 2016
      niveau: 'legal',
      description: 'Mutuelle obligatoire pour tous les salariés (ANI 2016)',
      minimums: [
        'Consultation: 30% de la base de remboursement',
        'Hospitalisation: forfait journalier',
        'Dentaire: 125% BR',
        'Optique: 100€ verres simples / 150€ verres complexes'
      ],
      source: 'Accord National Interprofessionnel du 11 janvier 2013'
    },
    epargneSalariale: {
      obligatoire: effectif >= 50,
      niveau: effectif >= 50 ? 'legal' : 'facultatif',
      description: effectif >= 50 
        ? 'Participation obligatoire (entreprise ≥50 salariés)' 
        : 'Épargne salariale facultative mais avantageuse fiscalement',
      source: effectif >= 50 ? 'Code du travail Art. L3322-2' : undefined
    },
    retraiteSupplementaire: {
      obligatoire: false,
      niveau: 'facultatif',
      description: 'PER Collectif / Article 83 facultatif',
    }
  }
  
  // Enrichir avec les obligations conventionnelles
  if (convention) {
    const convData = CONVENTIONS_DATA[convention.idcc]
    if (convData?.obligations) {
      if (convData.obligations.prevoyance) {
        obligations.prevoyance = {
          ...obligations.prevoyance,
          ...convData.obligations.prevoyance,
          niveau: 'conventionnel',
          obligatoire: true
        }
      }
      if (convData.obligations.sante) {
        obligations.sante = {
          ...obligations.sante,
          ...convData.obligations.sante
        }
      }
    }
  }
  
  return obligations
}

/**
 * Générer l'analyse commerciale complète
 */
export function genererAnalyseCommerciale(
  effectif: number,
  convention: ConventionCollective | null,
  obligations: ObligationsSociales,
  equipementsExistants?: {
    hasPrevoyance?: boolean
    hasMutuelle?: boolean
    hasEpargneSalariale?: boolean
    hasRetraite?: boolean
  }
): AnalyseCommerciale {
  let score = 50 // Score de base
  const opportunites: OpportuniteDetectee[] = []
  const alertes: AlerteObligatoire[] = []
  
  // Scoring basé sur l'effectif (plus d'effectif = plus de potentiel)
  if (effectif >= 100) score += 25
  else if (effectif >= 50) score += 20
  else if (effectif >= 20) score += 15
  else if (effectif >= 10) score += 10
  else if (effectif >= 5) score += 5
  
  // Bonus si convention identifiée
  if (convention) {
    score += 10
  }
  
  // Analyse des équipements manquants
  const equip = equipementsExistants || {}
  
  // Prévoyance
  if (obligations.prevoyance.obligatoire && !equip.hasPrevoyance) {
    score += 15 // Opportunité forte
    alertes.push({
      niveau: 'critical',
      titre: 'Prévoyance obligatoire non détectée',
      description: `La convention ${convention?.titreCourt || 'applicable'} impose une prévoyance obligatoire`
    })
    opportunites.push({
      type: 'PREVOYANCE',
      priorite: 'haute',
      titre: 'Mise en place prévoyance collective',
      description: obligations.prevoyance.description,
      potentielEstime: effectif * 500 // ~500€/salarié/an
    })
  }
  
  // Mutuelle (toujours obligatoire)
  if (!equip.hasMutuelle) {
    score += 10
    alertes.push({
      niveau: 'critical',
      titre: 'Mutuelle ANI obligatoire',
      description: 'Mutuelle obligatoire depuis le 1er janvier 2016 (ANI)'
    })
    opportunites.push({
      type: 'SANTE',
      priorite: 'haute',
      titre: 'Mise en conformité mutuelle ANI',
      description: 'Panier de soins ANI minimum obligatoire',
      potentielEstime: effectif * 400
    })
  }
  
  // Épargne salariale
  if (effectif >= 50 && !equip.hasEpargneSalariale) {
    score += 10
    alertes.push({
      niveau: 'warning',
      titre: 'Participation obligatoire',
      description: 'Entreprise de 50+ salariés: participation aux bénéfices obligatoire'
    })
    opportunites.push({
      type: 'EPARGNE',
      priorite: 'haute',
      titre: 'Mise en place participation + PEE',
      description: 'Participation obligatoire + PEE recommandé',
      potentielEstime: effectif * 2000
    })
  } else if (effectif >= 10 && !equip.hasEpargneSalariale) {
    opportunites.push({
      type: 'EPARGNE',
      priorite: 'moyenne',
      titre: 'Épargne salariale facultative',
      description: 'PEE + Intéressement pour fidéliser et motiver',
      potentielEstime: effectif * 1500
    })
  }
  
  // Retraite supplémentaire
  if (effectif >= 20 && !equip.hasRetraite) {
    opportunites.push({
      type: 'RETRAITE',
      priorite: 'moyenne',
      titre: 'PER Collectif ou Article 83',
      description: 'Retraite supplémentaire pour les cadres et dirigeants',
      potentielEstime: effectif * 1000
    })
  }
  
  // RC Pro (toujours à vérifier)
  opportunites.push({
    type: 'RC_PRO',
    priorite: 'basse',
    titre: 'Audit RC Professionnelle',
    description: 'Vérification des garanties et mise en concurrence',
    potentielEstime: undefined
  })
  
  // Calcul de la qualification
  let qualification: 'HOT' | 'WARM' | 'COLD'
  let pitch: string
  
  if (score >= 80) {
    qualification = 'HOT'
    pitch = `🔥 LEAD QUALIFIÉ - ${opportunites.length} opportunités détectées`
  } else if (score >= 60) {
    qualification = 'WARM'
    pitch = `✅ Potentiel confirmé - ${convention?.titreCourt || 'à analyser'}`
  } else {
    qualification = 'COLD'
    pitch = '⏳ Entreprise à qualifier davantage'
  }
  
  // Enrichir le pitch avec la convention
  if (convention && alertes.length > 0) {
    pitch = `${pitch} | ${alertes.length} alertes conformité`
  }
  
  return {
    score: Math.min(100, Math.max(0, score)),
    qualification,
    pitch,
    opportunites: opportunites.sort((a, b) => 
      a.priorite === 'haute' ? -1 : b.priorite === 'haute' ? 1 : 0
    ),
    alertes
  }
}

/**
 * Générer le profil social complet d'une entreprise
 */
export function genererProfilSocial(
  codeNAF: string,
  effectif: number,
  equipementsExistants?: {
    hasPrevoyance?: boolean
    hasMutuelle?: boolean
    hasEpargneSalariale?: boolean
    hasRetraite?: boolean
  }
): ProfilSocialComplet {
  const convention = rechercherConventionParNAF(codeNAF)
  const obligations = calculerObligations(convention, effectif)
  const analyse = genererAnalyseCommerciale(effectif, convention, obligations, equipementsExistants)
  
  return {
    convention: convention || undefined,
    obligations,
    analyse
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// API CODE DU TRAVAIL (appels réseau)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Rechercher une convention via l'API Code du Travail
 * Note: API publique, pas de clé requise pour la recherche
 */
export async function rechercherConventionAPI(query: string): Promise<ConventionCollective[]> {
  try {
    const response = await fetch(
      `${CODE_TRAVAIL_API}/search?q=${encodeURIComponent(query)}&type=conventions_collectives&size=5`
    )
    
    if (!response.ok) {
      console.warn('API Code du Travail indisponible, utilisation des données locales')
      return []
    }
    
    const data = await response.json()
    
    return (data.documents || []).map((doc: Record<string, unknown>) => ({
      id: doc.id as string,
      idcc: doc.idcc as string || '',
      titre: doc.title as string || '',
      titreCourt: doc.shortTitle as string || doc.title as string || '',
      url: doc.url as string
    }))
  } catch (error) {
    console.warn('Erreur API Code du Travail:', error)
    return []
  }
}

/**
 * Obtenir les détails d'une convention par IDCC
 */
export async function getConventionByIDCC(idcc: string): Promise<ConventionCollective | null> {
  try {
    const response = await fetch(
      `${CODE_TRAVAIL_API}/convention/${idcc}`
    )
    
    if (!response.ok) {
      // Fallback sur les données locales
      const local = CONVENTIONS_DATA[idcc]
      if (local) {
        return {
          id: idcc,
          idcc: local.idcc!,
          titre: local.titre!,
          titreCourt: local.titreCourt!
        }
      }
      return null
    }
    
    const data = await response.json()
    return {
      id: data.id,
      idcc: data.num,
      titre: data.title,
      titreCourt: data.shortTitle || data.title
    }
  } catch {
    return null
  }
}

export default {
  rechercherConventionParNAF,
  calculerObligations,
  genererAnalyseCommerciale,
  genererProfilSocial,
  rechercherConventionAPI,
  getConventionByIDCC
}
