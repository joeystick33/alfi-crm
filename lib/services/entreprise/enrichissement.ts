/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SERVICE D'ENRICHISSEMENT ENTREPRISE
 * Scoring, alertes, analyse financière
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { APISirene, type Entreprise } from './api-sirene'

// ══════════════════════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface ScoreFinancier {
  score: number // 0-100
  niveau: 'excellent' | 'bon' | 'moyen' | 'faible' | 'critique' | 'inconnu'
  couleur: string
  indicateurs: {
    label: string
    valeur: string | number
    statut: 'positif' | 'neutre' | 'negatif'
  }[]
  recommandations: string[]
}

export interface AlerteEntreprise {
  type: 'cessation' | 'changement_dirigeant' | 'baisse_ca' | 'resultat_negatif' | 'effectifs'
  niveau: 'info' | 'warning' | 'danger'
  titre: string
  message: string
  date?: string
}

export interface AnalyseSectorielle {
  secteur: string
  libelleSecteur: string
  codeAPE: string
  libelleAPE: string
  risqueSectoriel: 'faible' | 'moyen' | 'eleve'
}

export interface ProfilEntreprise {
  entreprise: Entreprise
  score: ScoreFinancier
  alertes: AlerteEntreprise[]
  analyse: AnalyseSectorielle
  labels: string[]
  derniereMiseAJour: string
}

// ══════════════════════════════════════════════════════════════════════════════
// SCORING FINANCIER
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calculer le score financier d'une entreprise
 */
export function calculerScoreFinancier(entreprise: Entreprise): ScoreFinancier {
  const indicateurs: ScoreFinancier['indicateurs'] = []
  const recommandations: string[] = []
  let scoreTotal = 50 // Score de base
  
  // 1. Ancienneté de l'entreprise (max +15 points)
  if (entreprise.date_creation) {
    const annees = new Date().getFullYear() - new Date(entreprise.date_creation).getFullYear()
    if (annees >= 10) {
      scoreTotal += 15
      indicateurs.push({ label: 'Ancienneté', valeur: `${annees} ans`, statut: 'positif' })
    } else if (annees >= 5) {
      scoreTotal += 10
      indicateurs.push({ label: 'Ancienneté', valeur: `${annees} ans`, statut: 'positif' })
    } else if (annees >= 2) {
      scoreTotal += 5
      indicateurs.push({ label: 'Ancienneté', valeur: `${annees} ans`, statut: 'neutre' })
    } else {
      indicateurs.push({ label: 'Ancienneté', valeur: `${annees} an(s)`, statut: 'negatif' })
      recommandations.push('Entreprise récente - historique limité')
    }
  }
  
  // 2. Taille de l'entreprise (max +10 points)
  if (entreprise.categorie_entreprise) {
    switch (entreprise.categorie_entreprise) {
      case 'GE':
        scoreTotal += 10
        indicateurs.push({ label: 'Taille', valeur: 'Grande Entreprise', statut: 'positif' })
        break
      case 'ETI':
        scoreTotal += 8
        indicateurs.push({ label: 'Taille', valeur: 'ETI', statut: 'positif' })
        break
      case 'PME':
        scoreTotal += 5
        indicateurs.push({ label: 'Taille', valeur: 'PME', statut: 'neutre' })
        break
    }
  }
  
  // 3. État administratif (critique si cessée)
  if (entreprise.etat_administratif === 'C') {
    scoreTotal = Math.max(0, scoreTotal - 50)
    indicateurs.push({ label: 'État', valeur: 'Cessée', statut: 'negatif' })
    recommandations.push('⚠️ ATTENTION : Entreprise cessée')
  } else {
    indicateurs.push({ label: 'État', valeur: 'Active', statut: 'positif' })
  }
  
  // 4. Données financières (max +25 points)
  if (entreprise.finances) {
    const annees = Object.keys(entreprise.finances).sort().reverse()
    const dernierExercice = annees[0]
    const avantDernier = annees[1]
    
    if (dernierExercice && entreprise.finances[dernierExercice]) {
      const finance = entreprise.finances[dernierExercice]
      
      // CA
      if (finance.ca !== undefined) {
        const caFormate = new Intl.NumberFormat('fr-FR', { 
          style: 'currency', 
          currency: 'EUR',
          maximumFractionDigits: 0 
        }).format(finance.ca)
        
        if (finance.ca > 10000000) {
          scoreTotal += 10
          indicateurs.push({ label: `CA ${dernierExercice}`, valeur: caFormate, statut: 'positif' })
        } else if (finance.ca > 1000000) {
          scoreTotal += 7
          indicateurs.push({ label: `CA ${dernierExercice}`, valeur: caFormate, statut: 'positif' })
        } else if (finance.ca > 100000) {
          scoreTotal += 4
          indicateurs.push({ label: `CA ${dernierExercice}`, valeur: caFormate, statut: 'neutre' })
        } else {
          indicateurs.push({ label: `CA ${dernierExercice}`, valeur: caFormate, statut: 'negatif' })
        }
        
        // Évolution CA
        if (avantDernier && entreprise.finances[avantDernier]?.ca) {
          const evolution = ((finance.ca - entreprise.finances[avantDernier].ca!) / entreprise.finances[avantDernier].ca!) * 100
          if (evolution > 10) {
            scoreTotal += 5
            indicateurs.push({ label: 'Évolution CA', valeur: `+${evolution.toFixed(1)}%`, statut: 'positif' })
          } else if (evolution < -10) {
            scoreTotal -= 5
            indicateurs.push({ label: 'Évolution CA', valeur: `${evolution.toFixed(1)}%`, statut: 'negatif' })
            recommandations.push('Baisse significative du chiffre d\'affaires')
          } else {
            indicateurs.push({ label: 'Évolution CA', valeur: `${evolution > 0 ? '+' : ''}${evolution.toFixed(1)}%`, statut: 'neutre' })
          }
        }
      }
      
      // Résultat net
      if (finance.resultat_net !== undefined) {
        const resultatFormate = new Intl.NumberFormat('fr-FR', { 
          style: 'currency', 
          currency: 'EUR',
          maximumFractionDigits: 0 
        }).format(finance.resultat_net)
        
        if (finance.resultat_net > 0) {
          scoreTotal += 10
          indicateurs.push({ label: `Résultat ${dernierExercice}`, valeur: resultatFormate, statut: 'positif' })
        } else {
          scoreTotal -= 10
          indicateurs.push({ label: `Résultat ${dernierExercice}`, valeur: resultatFormate, statut: 'negatif' })
          recommandations.push('Résultat net négatif - surveiller la rentabilité')
        }
        
        // Marge nette si CA disponible
        if (finance.ca && finance.ca > 0) {
          const marge = (finance.resultat_net / finance.ca) * 100
          if (marge > 5) {
            indicateurs.push({ label: 'Marge nette', valeur: `${marge.toFixed(1)}%`, statut: 'positif' })
          } else if (marge > 0) {
            indicateurs.push({ label: 'Marge nette', valeur: `${marge.toFixed(1)}%`, statut: 'neutre' })
          } else {
            indicateurs.push({ label: 'Marge nette', valeur: `${marge.toFixed(1)}%`, statut: 'negatif' })
          }
        }
      }
    }
  } else {
    recommandations.push('Données financières non disponibles')
  }
  
  // 5. Labels et certifications (bonus)
  if (entreprise.complements) {
    if (entreprise.complements.est_rge) {
      scoreTotal += 3
      indicateurs.push({ label: 'Label RGE', valeur: 'Oui', statut: 'positif' })
    }
    if (entreprise.complements.est_qualiopi) {
      scoreTotal += 3
      indicateurs.push({ label: 'Qualiopi', valeur: 'Oui', statut: 'positif' })
    }
    if (entreprise.complements.est_bio) {
      scoreTotal += 2
    }
    if (entreprise.complements.est_ess) {
      scoreTotal += 2
      indicateurs.push({ label: 'ESS', valeur: 'Oui', statut: 'positif' })
    }
  }
  
  // Normaliser le score entre 0 et 100
  const scoreFinal = Math.max(0, Math.min(100, scoreTotal))
  
  // Déterminer le niveau
  let niveau: ScoreFinancier['niveau']
  let couleur: string
  
  if (scoreFinal >= 80) {
    niveau = 'excellent'
    couleur = 'text-green-600'
  } else if (scoreFinal >= 65) {
    niveau = 'bon'
    couleur = 'text-emerald-600'
  } else if (scoreFinal >= 50) {
    niveau = 'moyen'
    couleur = 'text-yellow-600'
  } else if (scoreFinal >= 30) {
    niveau = 'faible'
    couleur = 'text-orange-600'
  } else {
    niveau = 'critique'
    couleur = 'text-red-600'
  }
  
  return {
    score: scoreFinal,
    niveau,
    couleur,
    indicateurs,
    recommandations,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// DÉTECTION D'ALERTES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Détecter les alertes sur une entreprise
 */
export function detecterAlertes(
  entreprise: Entreprise,
  entreprisePrecedente?: Entreprise
): AlerteEntreprise[] {
  const alertes: AlerteEntreprise[] = []
  
  // 1. Cessation d'activité
  if (entreprise.etat_administratif === 'C') {
    alertes.push({
      type: 'cessation',
      niveau: 'danger',
      titre: 'Entreprise cessée',
      message: `L'entreprise ${entreprise.nom_complet} a cessé son activité${entreprise.date_fermeture ? ` le ${new Date(entreprise.date_fermeture).toLocaleDateString('fr-FR')}` : ''}.`,
      date: entreprise.date_fermeture,
    })
  }
  
  // 2. Changement de dirigeant (si données précédentes disponibles)
  if (entreprisePrecedente?.dirigeants && entreprise.dirigeants) {
    const anciensDirigeants = entreprisePrecedente.dirigeants
      .filter(d => d.type_dirigeant === 'personne physique')
      .map(d => `${(d as any).nom}-${(d as any).prenoms}`)
    
    const nouveauxDirigeants = entreprise.dirigeants
      .filter(d => d.type_dirigeant === 'personne physique')
      .filter(d => !anciensDirigeants.includes(`${(d as any).nom}-${(d as any).prenoms}`))
    
    if (nouveauxDirigeants.length > 0) {
      alertes.push({
        type: 'changement_dirigeant',
        niveau: 'warning',
        titre: 'Nouveaux dirigeants',
        message: `${nouveauxDirigeants.length} nouveau(x) dirigeant(s) détecté(s) : ${nouveauxDirigeants.map(d => `${(d as any).prenoms} ${(d as any).nom}`).join(', ')}`,
      })
    }
  }
  
  // 3. Baisse du CA
  if (entreprise.finances) {
    const annees = Object.keys(entreprise.finances).sort().reverse()
    if (annees.length >= 2) {
      const ca1 = entreprise.finances[annees[0]]?.ca
      const ca2 = entreprise.finances[annees[1]]?.ca
      
      if (ca1 !== undefined && ca2 !== undefined && ca2 > 0) {
        const evolution = ((ca1 - ca2) / ca2) * 100
        if (evolution < -20) {
          alertes.push({
            type: 'baisse_ca',
            niveau: 'warning',
            titre: 'Baisse significative du CA',
            message: `Le chiffre d'affaires a baissé de ${Math.abs(evolution).toFixed(1)}% entre ${annees[1]} et ${annees[0]}.`,
          })
        }
      }
    }
  }
  
  // 4. Résultat négatif
  if (entreprise.finances) {
    const annees = Object.keys(entreprise.finances).sort().reverse()
    const dernierExercice = annees[0]
    if (dernierExercice) {
      const resultat = entreprise.finances[dernierExercice]?.resultat_net
      if (resultat !== undefined && resultat < 0) {
        alertes.push({
          type: 'resultat_negatif',
          niveau: 'warning',
          titre: 'Résultat net négatif',
          message: `L'exercice ${dernierExercice} affiche un résultat négatif de ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(resultat)}.`,
        })
      }
    }
  }
  
  return alertes
}

// ══════════════════════════════════════════════════════════════════════════════
// ANALYSE SECTORIELLE
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Secteurs à risque élevé
 */
const SECTEURS_RISQUE_ELEVE = ['I', 'R', 'N'] // Hôtellerie-restauration, Arts-spectacles, Services admin

/**
 * Secteurs à risque faible
 */
const SECTEURS_RISQUE_FAIBLE = ['K', 'O', 'Q', 'D', 'E'] // Finance, Administration, Santé, Énergie

/**
 * Analyser le secteur d'activité
 */
export function analyserSecteur(entreprise: Entreprise): AnalyseSectorielle {
  const section = entreprise.section_activite_principale || ''
  const codeAPE = entreprise.activite_principale || ''
  
  const SECTIONS: Record<string, string> = {
    'A': 'Agriculture, sylviculture et pêche',
    'B': 'Industries extractives',
    'C': 'Industrie manufacturière',
    'D': 'Production et distribution d\'électricité',
    'E': 'Production et distribution d\'eau',
    'F': 'Construction',
    'G': 'Commerce',
    'H': 'Transports et entreposage',
    'I': 'Hébergement et restauration',
    'J': 'Information et communication',
    'K': 'Activités financières et d\'assurance',
    'L': 'Activités immobilières',
    'M': 'Activités spécialisées, scientifiques',
    'N': 'Activités de services administratifs',
    'O': 'Administration publique',
    'P': 'Enseignement',
    'Q': 'Santé humaine et action sociale',
    'R': 'Arts, spectacles et activités récréatives',
    'S': 'Autres activités de services',
  }
  
  let risqueSectoriel: 'faible' | 'moyen' | 'eleve' = 'moyen'
  if (SECTEURS_RISQUE_ELEVE.includes(section)) {
    risqueSectoriel = 'eleve'
  } else if (SECTEURS_RISQUE_FAIBLE.includes(section)) {
    risqueSectoriel = 'faible'
  }
  
  return {
    secteur: section,
    libelleSecteur: SECTIONS[section] || 'Autre',
    codeAPE,
    libelleAPE: codeAPE, // À enrichir avec une base de codes APE
    risqueSectoriel,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EXTRACTION DES LABELS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Extraire tous les labels d'une entreprise
 */
export function extraireLabels(entreprise: Entreprise): string[] {
  const labels: string[] = []
  
  if (entreprise.complements) {
    if (entreprise.complements.est_rge) labels.push('RGE')
    if (entreprise.complements.est_bio) labels.push('Bio')
    if (entreprise.complements.est_qualiopi) labels.push('Qualiopi')
    if (entreprise.complements.est_ess) labels.push('ESS')
    if (entreprise.complements.est_societe_mission) labels.push('Société à mission')
    if (entreprise.complements.est_patrimoine_vivant) labels.push('EPV')
    if (entreprise.complements.est_entrepreneur_spectacle) labels.push('Spectacle')
    if (entreprise.complements.est_organisme_formation) labels.push('OF')
    if (entreprise.complements.est_association) labels.push('Association')
    if (entreprise.complements.est_service_public) labels.push('Service public')
    if (entreprise.complements.est_achats_responsables) labels.push('RFAR')
    if (entreprise.complements.bilan_ges_renseigne) labels.push('Bilan GES')
    if (entreprise.complements.est_siae) labels.push('SIAE')
  }
  
  return labels
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFIL COMPLET
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Générer le profil complet d'une entreprise
 */
export async function genererProfilEntreprise(
  siren: string,
  entreprisePrecedente?: Entreprise
): Promise<ProfilEntreprise | null> {
  try {
    const entreprise = await APISirene.rechercherParSiren(siren)
    
    if (!entreprise) {
      return null
    }
    
    return {
      entreprise,
      score: calculerScoreFinancier(entreprise),
      alertes: detecterAlertes(entreprise, entreprisePrecedente),
      analyse: analyserSecteur(entreprise),
      labels: extraireLabels(entreprise),
      derniereMiseAJour: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Enrichissement] Erreur:', error)
    return null
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════════════════════

export const EnrichissementService = {
  calculerScoreFinancier,
  detecterAlertes,
  analyserSecteur,
  extraireLabels,
  genererProfilEntreprise,
}

export default EnrichissementService
