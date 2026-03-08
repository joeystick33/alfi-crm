 
/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PARAMÈTRES CAPACITÉ D'EMPRUNT 2025
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Ce fichier centralise tous les paramètres pour le calcul de capacité d'emprunt.
 * Basé sur les normes HCSF (Haut Conseil de Stabilité Financière) et les 
 * pratiques bancaires françaises.
 * 
 * Sources :
 * - Décision HCSF D-2021-10 (taux d'endettement 35%)
 * - Recommandation HCSF R-2019-1 (durée maximale 25 ans)
 * - Code de la consommation (calcul TAEG)
 * 
 * Mise à jour : Décembre 2024
 */

// ══════════════════════════════════════════════════════════════════════════════
// NORMES HCSF - Décision D-2021-10
// ══════════════════════════════════════════════════════════════════════════════
export const NORMES_HCSF_2025 = {
  // Taux d'endettement maximal
  TAUX_ENDETTEMENT_MAX: 35,          // 35% depuis janvier 2022
  TAUX_ENDETTEMENT_DEROATION: 20,    // % de dérogations autorisées par banque
  
  // Durée maximale de crédit
  DUREE_MAX_RESIDENCE_PRINCIPALE: 25, // 25 ans pour RP
  DUREE_MAX_INVESTISSEMENT: 25,       // 25 ans pour investissement locatif
  DUREE_MAX_AVEC_TRAVAUX: 27,         // +2 ans si travaux > 10% du prêt
  
  // Reste à vivre minimum (recommandations bancaires)
  RESTE_A_VIVRE: {
    MINIMUM_PERSONNE_SEULE: 700,      // €/mois minimum
    MINIMUM_COUPLE: 1000,             // €/mois minimum
    PAR_ENFANT: 150,                  // €/mois par enfant
  },
  
  INFO: 'Les normes HCSF s\'appliquent à tous les crédits immobiliers depuis janvier 2022',
} as const

// ══════════════════════════════════════════════════════════════════════════════
// TAUX DE RÉFÉRENCE 2025
// ══════════════════════════════════════════════════════════════════════════════
export const TAUX_REFERENCE_2025 = {
  // Taux moyens du marché (indicatifs, varient selon profil)
  CREDIT_IMMOBILIER: {
    DUREE_10_ANS: 3.20,
    DUREE_15_ANS: 3.35,
    DUREE_20_ANS: 3.50,
    DUREE_25_ANS: 3.65,
  },
  
  // Taux d'usure (plafonds légaux - mis à jour mensuellement)
  TAUX_USURE: {
    PRET_MOINS_10_ANS: 4.47,
    PRET_10_A_20_ANS: 5.27,
    PRET_PLUS_20_ANS: 5.50,
  },
  
  // Assurance emprunteur (taux moyens)
  ASSURANCE_EMPRUNTEUR: {
    JEUNE_MOINS_30: 0.10,             // % du capital
    STANDARD_30_45: 0.25,
    SENIOR_45_55: 0.36,
    SENIOR_PLUS_55: 0.50,
  },
  
  INFO: 'Taux indicatifs susceptibles de varier selon profil et établissement',
} as const

// ══════════════════════════════════════════════════════════════════════════════
// TYPES DE REVENUS - Coefficients de pondération bancaires
// ══════════════════════════════════════════════════════════════════════════════
export const REVENUS_PONDERATION_2025 = {
  SALAIRE_CDI: {
    id: 'salaire_cdi',
    label: 'Salaire CDI',
    coefficient: 1.00,                // Pris en compte à 100%
    description: 'Salaire net après impôt, ancienneté > 1 an',
    conditions: ['CDI confirmé', 'Ancienneté > 1 an', 'Hors période d\'essai'],
  },
  SALAIRE_CDD: {
    id: 'salaire_cdd',
    label: 'Salaire CDD',
    coefficient: 0.70,                // Pris en compte à 70%
    description: 'Revenus moyens sur 2 ans',
    conditions: ['Historique sur 2 ans', 'Contrats réguliers'],
  },
  BENEFICES_TNS: {
    id: 'benefices_tns',
    label: 'Bénéfices TNS',
    coefficient: 0.85,                // Moyenne 3 dernières années
    description: 'Moyenne des 3 derniers exercices',
    conditions: ['Bilan sur 3 ans', 'Revenus stables ou croissants'],
  },
  REVENUS_LOCATIFS_EXISTANTS: {
    id: 'revenus_locatifs',
    label: 'Revenus locatifs existants',
    coefficient: 0.70,                // 70% des loyers bruts
    description: '70% des loyers bruts',
    conditions: ['Baux en cours', 'Loyers déclarés'],
  },
  REVENUS_LOCATIFS_FUTURS: {
    id: 'revenus_locatifs_futurs',
    label: 'Revenus locatifs futurs',
    coefficient: 0.70,                // Pour investissement locatif
    description: '70% du loyer prévisionnel',
    conditions: ['Estimation réaliste', 'Zone tendue'],
  },
  PENSION_RETRAITE: {
    id: 'pension',
    label: 'Pension / Retraite',
    coefficient: 1.00,                // Revenus garantis
    description: 'Revenus stables et garantis',
    conditions: ['Attestation caisse retraite'],
  },
  DIVIDENDES: {
    id: 'dividendes',
    label: 'Dividendes',
    coefficient: 0.50,                // Très variable
    description: '50% (revenus variables)',
    conditions: ['Historique 3 ans', 'Société solvable'],
  },
  ALLOCATIONS: {
    id: 'allocations',
    label: 'Allocations familiales',
    coefficient: 0.00,                // Non prises en compte
    description: 'Non prises en compte',
    conditions: ['Revenus non garantis dans le temps'],
  },
  AUTRE: {
    id: 'autre',
    label: 'Autres revenus',
    coefficient: 0.50,
    description: 'Évaluation au cas par cas',
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// TYPES DE CHARGES - Prise en compte bancaire
// ══════════════════════════════════════════════════════════════════════════════
export const CHARGES_TYPES_2025 = {
  LOYER_ACTUEL: {
    id: 'loyer',
    label: 'Loyer actuel',
    inclus: true,
    description: 'Remplacé par la mensualité du nouveau crédit',
    note: 'Peut être supprimé si achat RP',
  },
  CREDIT_IMMOBILIER: {
    id: 'credit_immo',
    label: 'Crédit immobilier en cours',
    inclus: true,
    description: 'Mensualités existantes',
  },
  CREDIT_CONSOMMATION: {
    id: 'credit_conso',
    label: 'Crédit consommation',
    inclus: true,
    description: 'Si durée restante > 6 mois',
  },
  CREDIT_AUTO: {
    id: 'credit_auto',
    label: 'Crédit auto',
    inclus: true,
    description: 'LOA, LLD, prêt auto',
  },
  PENSION_ALIMENTAIRE: {
    id: 'pension_alim',
    label: 'Pension alimentaire versée',
    inclus: true,
    description: 'Si fixée par jugement',
  },
  AUTRE_CHARGE: {
    id: 'autre',
    label: 'Autre charge récurrente',
    inclus: true,
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// FRAIS D'ACQUISITION
// ══════════════════════════════════════════════════════════════════════════════
export const FRAIS_ACQUISITION_2025 = {
  // Frais de notaire
  NOTAIRE: {
    ANCIEN: 0.08,                     // 7-8% pour l'ancien
    NEUF: 0.03,                       // 2-3% pour le neuf
    VEFA: 0.03,                       // VEFA = neuf
  },
  
  // Autres frais
  FRAIS_DOSSIER_BANQUE: {
    MONTANT_FIXE: 500,                // Forfait moyen
    POURCENTAGE_MAX: 0.01,            // Max 1% du prêt
    PLAFOND: 1500,
  },
  
  FRAIS_COURTAGE: {
    POURCENTAGE: 0.01,                // ~1% du prêt
    MINIMUM: 1500,
    MAXIMUM: 4000,
  },
  
  FRAIS_GARANTIE: {
    HYPOTHEQUE: 0.015,                // 1.5% du prêt
    CAUTION_CREDIT_LOGEMENT: 0.012,   // ~1.2% du prêt
    CAUTION_SACCEF: 0.008,            // Fonctionnaires
  },
  
  INFO: 'Les frais d\'acquisition sont généralement financés par l\'apport personnel',
} as const

// ══════════════════════════════════════════════════════════════════════════════
// TYPES DE CRÉDIT
// ══════════════════════════════════════════════════════════════════════════════
export const TYPES_CREDIT_2025 = {
  AMORTISSABLE: {
    id: 'amortissable',
    label: 'Crédit amortissable classique',
    description: 'Mensualités constantes, capital + intérêts',
  },
  IN_FINE: {
    id: 'in_fine',
    label: 'Crédit in fine',
    description: 'Intérêts seuls, capital remboursé à échéance',
    conditions: 'Épargne en garantie obligatoire',
  },
  PRET_RELAIS: {
    id: 'relais',
    label: 'Prêt relais',
    description: 'En attente de vente d\'un bien',
    dureeMax: 24,
  },
  PTZ: {
    id: 'ptz',
    label: 'Prêt à Taux Zéro',
    description: 'Primo-accédants sous conditions de ressources',
    taux: 0,
  },
  PRET_PATRONAL: {
    id: 'patronal',
    label: 'Prêt 1% patronal (Action Logement)',
    description: 'Salariés d\'entreprises cotisantes',
    tauxMax: 1,
    plafond: 40000,
  },
  PRET_FAMILIAL: {
    id: 'familial',
    label: 'Prêt familial',
    description: 'Prêt entre particuliers (famille)',
    note: 'Doit être déclaré et contractualisé',
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calcule la mensualité d'un crédit amortissable
 */
export function calculerMensualite(
  capital: number,
  tauxAnnuel: number,
  dureeAnnees: number
): number {
  const tauxMensuel = tauxAnnuel / 100 / 12
  const nbMensualites = dureeAnnees * 12
  
  if (tauxMensuel === 0) {
    return capital / nbMensualites
  }
  
  return capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) / 
         (Math.pow(1 + tauxMensuel, nbMensualites) - 1)
}

/**
 * Calcule le capital empruntable à partir d'une mensualité
 */
export function calculerCapitalEmpruntable(
  mensualiteMax: number,
  tauxAnnuel: number,
  dureeAnnees: number
): number {
  const tauxMensuel = tauxAnnuel / 100 / 12
  const nbMensualites = dureeAnnees * 12
  
  if (tauxMensuel === 0) {
    return mensualiteMax * nbMensualites
  }
  
  return mensualiteMax * (Math.pow(1 + tauxMensuel, nbMensualites) - 1) / 
         (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites))
}

/**
 * Calcule le taux d'endettement
 */
export function calculerTauxEndettement(
  totalCharges: number,
  totalRevenus: number
): number {
  if (totalRevenus <= 0) return 100
  return (totalCharges / totalRevenus) * 100
}

/**
 * Calcule les revenus pondérés selon type
 */
export function calculerRevenusPonderes(
  revenus: Array<{ type: string; montant: number }>
): number {
  return revenus.reduce((total, revenu) => {
    const config = Object.values(REVENUS_PONDERATION_2025).find(r => r.id === revenu.type)
    const coef = config?.coefficient ?? 0.5
    return total + (revenu.montant * coef)
  }, 0)
}

/**
 * Calcule le reste à vivre minimum recommandé
 */
export function calculerResteAVivreMinimum(
  situationFamiliale: 'seul' | 'couple',
  nbEnfants: number
): number {
  const base = situationFamiliale === 'couple' 
    ? NORMES_HCSF_2025.RESTE_A_VIVRE.MINIMUM_COUPLE 
    : NORMES_HCSF_2025.RESTE_A_VIVRE.MINIMUM_PERSONNE_SEULE
  
  return base + (nbEnfants * NORMES_HCSF_2025.RESTE_A_VIVRE.PAR_ENFANT)
}

/**
 * Calcule les frais de notaire
 */
export function calculerFraisNotaire(prixBien: number, typeAchat: 'ancien' | 'neuf'): number {
  const taux = typeAchat === 'neuf' ? FRAIS_ACQUISITION_2025.NOTAIRE.NEUF : FRAIS_ACQUISITION_2025.NOTAIRE.ANCIEN
  return Math.round(prixBien * taux)
}

/**
 * Calcule le coût total du crédit
 */
export function calculerCoutTotal(
  capital: number,
  mensualite: number,
  dureeAnnees: number,
  assuranceMensuelle: number = 0
): {
  coutInterets: number
  coutAssurance: number
  coutTotal: number
  mensualiteTotale: number
} {
  const nbMensualites = dureeAnnees * 12
  const mensualiteTotale = mensualite + assuranceMensuelle
  const totalRembourse = mensualiteTotale * nbMensualites
  const coutInterets = (mensualite * nbMensualites) - capital
  const coutAssurance = assuranceMensuelle * nbMensualites
  
  return {
    coutInterets: Math.round(coutInterets),
    coutAssurance: Math.round(coutAssurance),
    coutTotal: Math.round(totalRembourse - capital),
    mensualiteTotale: Math.round(mensualiteTotale),
  }
}

/**
 * Détermine le taux d'assurance selon l'âge
 */
export function getTauxAssuranceParAge(age: number): number {
  if (age < 30) return TAUX_REFERENCE_2025.ASSURANCE_EMPRUNTEUR.JEUNE_MOINS_30
  if (age < 45) return TAUX_REFERENCE_2025.ASSURANCE_EMPRUNTEUR.STANDARD_30_45
  if (age < 55) return TAUX_REFERENCE_2025.ASSURANCE_EMPRUNTEUR.SENIOR_45_55
  return TAUX_REFERENCE_2025.ASSURANCE_EMPRUNTEUR.SENIOR_PLUS_55
}

/**
 * Détermine le taux de référence selon la durée
 */
export function getTauxParDuree(dureeAnnees: number): number {
  const taux = TAUX_REFERENCE_2025.CREDIT_IMMOBILIER
  if (dureeAnnees <= 10) return taux.DUREE_10_ANS
  if (dureeAnnees <= 15) return taux.DUREE_15_ANS
  if (dureeAnnees <= 20) return taux.DUREE_20_ANS
  return taux.DUREE_25_ANS
}

/**
 * Vérifie la faisabilité d'un projet
 */
export function verifierFaisabilite(
  tauxEndettement: number,
  resteAVivre: number,
  resteAVivreMinimum: number
): {
  faisable: boolean
  alertes: string[]
  recommandations: string[]
} {
  const alertes: string[] = []
  const recommandations: string[] = []
  
  // Vérification taux d'endettement
  if (tauxEndettement > 35) {
    alertes.push(`🚨 Taux d'endettement (${tauxEndettement.toFixed(1)}%) supérieur au seuil HCSF de 35%`)
    recommandations.push('Augmentez votre apport personnel ou réduisez le montant emprunté')
    recommandations.push('Allongez la durée du prêt pour réduire les mensualités')
  } else if (tauxEndettement > 33) {
    alertes.push(`⚠️ Taux d'endettement (${tauxEndettement.toFixed(1)}%) proche du seuil HCSF`)
  }
  
  // Vérification reste à vivre
  if (resteAVivre < resteAVivreMinimum) {
    alertes.push(`🚨 Reste à vivre (${resteAVivre.toFixed(0)}€) insuffisant (minimum: ${resteAVivreMinimum}€)`)
    recommandations.push('Réduisez le montant du projet ou augmentez vos revenus')
  } else if (resteAVivre < resteAVivreMinimum * 1.2) {
    alertes.push(`⚠️ Reste à vivre (${resteAVivre.toFixed(0)}€) juste au-dessus du minimum`)
  }
  
  const faisable = tauxEndettement <= 35 && resteAVivre >= resteAVivreMinimum
  
  if (faisable) {
    recommandations.push('✅ Votre projet est finançable selon les normes bancaires')
    if (tauxEndettement <= 30) {
      recommandations.push('💡 Marge de négociation favorable pour le taux')
    }
  }
  
  return { faisable, alertes, recommandations }
}

/**
 * Génère le tableau d'amortissement
 */
export function genererTableauAmortissement(
  capital: number,
  tauxAnnuel: number,
  dureeAnnees: number,
  assuranceMensuelle: number = 0
): Array<{
  annee: number
  capitalRestant: number
  capitalRembourse: number
  interets: number
  assurance: number
  total: number
}> {
  const mensualite = calculerMensualite(capital, tauxAnnuel, dureeAnnees)
  const tauxMensuel = tauxAnnuel / 100 / 12
  const nbMensualites = dureeAnnees * 12
  
  const tableau: Array<any> = []
  let capitalRestant = capital
  
  for (let annee = 1; annee <= dureeAnnees; annee++) {
    let capitalAnnee = 0
    let interetsAnnee = 0
    
    for (let mois = 0; mois < 12; mois++) {
      const interetsMois = capitalRestant * tauxMensuel
      const capitalMois = mensualite - interetsMois
      
      capitalAnnee += capitalMois
      interetsAnnee += interetsMois
      capitalRestant = Math.max(0, capitalRestant - capitalMois)
    }
    
    const assuranceAnnee = assuranceMensuelle * 12
    
    tableau.push({
      annee,
      capitalRestant: Math.round(capitalRestant),
      capitalRembourse: Math.round(capitalAnnee),
      interets: Math.round(interetsAnnee),
      assurance: Math.round(assuranceAnnee),
      total: Math.round(capitalAnnee + interetsAnnee + assuranceAnnee),
    })
  }
  
  return tableau
}
