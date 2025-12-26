 
/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PARAMÈTRES GESTION BUDGÉTAIRE 2025
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Ce fichier centralise tous les paramètres et seuils pour l'analyse budgétaire.
 * Basé sur les standards français et les meilleures pratiques de gestion financière.
 * 
 * Sources :
 * - Règle budgétaire 50/30/20 (Elizabeth Warren)
 * - Standards bancaires français (taux d'endettement 33-35%)
 * - Recommandations ACPR / Banque de France
 * - INSEE (structure des dépenses des ménages français)
 * 
 * Mise à jour : Décembre 2024
 */

// ══════════════════════════════════════════════════════════════════════════════
// RÈGLE BUDGÉTAIRE 50/30/20
// ══════════════════════════════════════════════════════════════════════════════
export const REGLE_BUDGETAIRE_2025 = {
  // La règle 50/30/20 : référence mondiale de gestion budgétaire
  BESOINS_ESSENTIELS: {
    POURCENTAGE: 50,
    LABEL: 'Besoins essentiels',
    DESCRIPTION: 'Dépenses incompressibles : logement, alimentation, transport, assurances, santé',
    POSTES: ['housing', 'utilities', 'food', 'transportation', 'insurance', 'healthcare'],
    CONSEIL: 'Si vos dépenses essentielles dépassent 50%, identifiez les postes optimisables',
  },
  
  ENVIES: {
    POURCENTAGE: 30,
    LABEL: 'Envies et loisirs',
    DESCRIPTION: 'Dépenses discrétionnaires : loisirs, sorties, abonnements, shopping',
    POSTES: ['entertainment', 'education', 'otherExpenses'],
    CONSEIL: 'Ce budget est flexible et peut être ajusté en cas de besoin',
  },
  
  EPARGNE_INVESTISSEMENT: {
    POURCENTAGE: 20,
    LABEL: 'Épargne et investissement',
    DESCRIPTION: 'Épargne de précaution, placements, remboursement anticipé de dettes',
    POSTES: ['savings'],
    CONSEIL: 'Priorité absolue : épargne de précaution puis investissements',
  },
  
  INFO: 'La règle 50/30/20 est un guide, adaptez-la à votre situation personnelle',
} as const

// ══════════════════════════════════════════════════════════════════════════════
// TAUX D'ENDETTEMENT - Standards bancaires français
// ══════════════════════════════════════════════════════════════════════════════
export const ENDETTEMENT_2025 = {
  // Seuil maximal recommandé par le HCSF (Haut Conseil de Stabilité Financière)
  SEUIL_MAX_HCSF: 35,           // 35% depuis janvier 2022
  SEUIL_STANDARD: 33,          // Seuil historique
  SEUIL_CONFORT: 25,           // Seuil recommandé pour une gestion sereine
  SEUIL_OPTIMAL: 15,           // Seuil idéal
  
  NIVEAUX: [
    { max: 15, label: 'Optimal', color: 'emerald', description: 'Excellente marge de manœuvre financière' },
    { max: 25, label: 'Confortable', color: 'green', description: 'Bonne capacité d\'emprunt restante' },
    { max: 33, label: 'Acceptable', color: 'blue', description: 'Dans les normes, vigilance requise' },
    { max: 35, label: 'Limite HCSF', color: 'amber', description: 'Seuil maximal réglementaire' },
    { max: 40, label: 'Élevé', color: 'orange', description: 'Risque de surendettement' },
    { max: 100, label: 'Critique', color: 'red', description: 'Situation de surendettement' },
  ],
  
  CALCUL: 'Taux d\'endettement = (Total mensualités crédits / Revenus nets mensuels) × 100',
  
  INFO: 'Depuis janvier 2022, le HCSF limite le taux d\'endettement à 35% pour les nouveaux crédits immobiliers',
} as const

// ══════════════════════════════════════════════════════════════════════════════
// ÉPARGNE DE PRÉCAUTION - Recommandations
// ══════════════════════════════════════════════════════════════════════════════
export const EPARGNE_PRECAUTION_2025 = {
  // Nombre de mois de dépenses à conserver en épargne liquide
  PROFILS: {
    FONCTIONNAIRE: {
      MOIS_RECOMMANDES: 3,
      DESCRIPTION: 'Emploi stable, revenus garantis',
      PRIORITE: 'medium' as const,
    },
    CDI_GRANDE_ENTREPRISE: {
      MOIS_RECOMMANDES: 4,
      DESCRIPTION: 'Emploi stable mais non garanti',
      PRIORITE: 'medium' as const,
    },
    CDI_PME: {
      MOIS_RECOMMANDES: 6,
      DESCRIPTION: 'Emploi moins sécurisé',
      PRIORITE: 'high' as const,
    },
    CDD_INTERIM: {
      MOIS_RECOMMANDES: 9,
      DESCRIPTION: 'Emploi précaire, revenus variables',
      PRIORITE: 'critical' as const,
    },
    TNS_INDEPENDANT: {
      MOIS_RECOMMANDES: 12,
      DESCRIPTION: 'Revenus irréguliers, pas de chômage',
      PRIORITE: 'critical' as const,
    },
    RETRAITE: {
      MOIS_RECOMMANDES: 6,
      DESCRIPTION: 'Revenus stables mais fixes',
      PRIORITE: 'high' as const,
    },
  },
  
  PLACEMENTS_RECOMMANDES: [
    { nom: 'Livret A', taux: 3.0, plafond: 22950, liquidite: 'immédiate' },
    { nom: 'LDDS', taux: 3.0, plafond: 12000, liquidite: 'immédiate' },
    { nom: 'LEP', taux: 4.0, plafond: 10000, liquidite: 'immédiate', condition: 'Sous conditions de ressources' },
    { nom: 'Fonds euros', taux: 2.5, plafond: null, liquidite: '72h' },
  ],
  
  INFO: 'L\'épargne de précaution doit être disponible immédiatement sans pénalité',
} as const

// ══════════════════════════════════════════════════════════════════════════════
// CATÉGORIES DE DÉPENSES - Seuils recommandés
// ══════════════════════════════════════════════════════════════════════════════
export const CATEGORIES_DEPENSES_2025 = {
  LOGEMENT: {
    id: 'housing',
    label: 'Logement',
    icon: 'Home',
    SEUIL_RECOMMANDE: 33,      // Maximum 33% des revenus
    SEUIL_ALERTE: 40,
    INCLUT: ['Loyer ou mensualité crédit', 'Charges de copropriété', 'Taxe foncière', 'Assurance habitation'],
    CONSEIL: 'Le logement ne devrait pas dépasser 1/3 des revenus nets',
    COLOR: 'blue',
  },
  
  CHARGES: {
    id: 'utilities',
    label: 'Charges courantes',
    icon: 'Zap',
    SEUIL_RECOMMANDE: 8,
    SEUIL_ALERTE: 12,
    INCLUT: ['Électricité', 'Gaz', 'Eau', 'Internet', 'Téléphone'],
    CONSEIL: 'Comparez les offres et optimisez votre consommation',
    COLOR: 'yellow',
  },
  
  ALIMENTATION: {
    id: 'food',
    label: 'Alimentation',
    icon: 'Utensils',
    SEUIL_RECOMMANDE: 15,
    SEUIL_ALERTE: 20,
    INCLUT: ['Courses alimentaires', 'Restaurants', 'Cantine'],
    CONSEIL: 'Planifier les repas permet d\'économiser jusqu\'à 30%',
    COLOR: 'orange',
  },
  
  TRANSPORT: {
    id: 'transportation',
    label: 'Transport',
    icon: 'Car',
    SEUIL_RECOMMANDE: 15,
    SEUIL_ALERTE: 20,
    INCLUT: ['Carburant', 'Assurance auto', 'Entretien', 'Transports en commun', 'Crédit auto'],
    CONSEIL: 'Évaluez le coût réel de votre véhicule vs transports alternatifs',
    COLOR: 'purple',
  },
  
  ASSURANCES: {
    id: 'insurance',
    label: 'Assurances',
    icon: 'Shield',
    SEUIL_RECOMMANDE: 5,
    SEUIL_ALERTE: 8,
    INCLUT: ['Mutuelle santé', 'Prévoyance', 'Assurance vie'],
    CONSEIL: 'Comparez les contrats et évitez les doublons de garanties',
    COLOR: 'teal',
  },
  
  SANTE: {
    id: 'healthcare',
    label: 'Santé',
    icon: 'Heart',
    SEUIL_RECOMMANDE: 5,
    SEUIL_ALERTE: 10,
    INCLUT: ['Consultations médicales', 'Médicaments', 'Soins dentaires', 'Optique'],
    CONSEIL: 'Vérifiez les remboursements de votre mutuelle',
    COLOR: 'red',
  },
  
  ETUDES: {
    id: 'education',
    label: 'Éducation',
    icon: 'GraduationCap',
    SEUIL_RECOMMANDE: 5,
    SEUIL_ALERTE: 10,
    INCLUT: ['Frais de scolarité', 'Fournitures', 'Activités périscolaires', 'Formations'],
    CONSEIL: 'Exploitez les aides (APL étudiant, bourses, crédit d\'impôt)',
    COLOR: 'indigo',
  },
  
  LOISIRS: {
    id: 'entertainment',
    label: 'Loisirs',
    icon: 'Gamepad2',
    SEUIL_RECOMMANDE: 10,
    SEUIL_ALERTE: 15,
    INCLUT: ['Sorties', 'Abonnements streaming', 'Sport', 'Vacances', 'Hobbies'],
    CONSEIL: 'Budget flexible à ajuster selon vos priorités',
    COLOR: 'pink',
  },
  
  EPARGNE: {
    id: 'savings',
    label: 'Épargne',
    icon: 'PiggyBank',
    SEUIL_RECOMMANDE: 20,
    SEUIL_MINIMUM: 10,
    INCLUT: ['Livrets', 'PEA', 'Assurance-vie', 'PER', 'Investissements'],
    CONSEIL: 'Payez-vous en premier : virez l\'épargne dès réception du salaire',
    COLOR: 'emerald',
  },
  
  AUTRES: {
    id: 'otherExpenses',
    label: 'Autres dépenses',
    icon: 'MoreHorizontal',
    SEUIL_RECOMMANDE: 5,
    SEUIL_ALERTE: 10,
    INCLUT: ['Vêtements', 'Cadeaux', 'Imprévus'],
    CONSEIL: 'Catégorisez ces dépenses pour mieux les contrôler',
    COLOR: 'gray',
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// INDICATEURS DE SANTÉ BUDGÉTAIRE
// ══════════════════════════════════════════════════════════════════════════════
export const SANTE_BUDGETAIRE_2025 = {
  NIVEAUX: {
    EXCELLENT: {
      label: 'Excellente',
      color: 'emerald',
      icon: 'CheckCircle2',
      conditions: {
        tauxEpargne: { min: 20 },
        tauxEndettement: { max: 25 },
        solde: { min: 0 },
      },
      description: 'Gestion exemplaire, patrimoine en croissance',
      conseils: [
        'Continuez sur cette voie',
        'Diversifiez vos investissements',
        'Envisagez des placements plus dynamiques',
      ],
    },
    BONNE: {
      label: 'Bonne',
      color: 'blue',
      icon: 'ThumbsUp',
      conditions: {
        tauxEpargne: { min: 10, max: 20 },
        tauxEndettement: { max: 33 },
        solde: { min: 0 },
      },
      description: 'Équilibre correct, marge de progression',
      conseils: [
        'Augmentez progressivement votre taux d\'épargne',
        'Optimisez vos dépenses discrétionnaires',
        'Constituez une épargne de précaution si ce n\'est pas fait',
      ],
    },
    ATTENTION: {
      label: 'Attention requise',
      color: 'amber',
      icon: 'AlertTriangle',
      conditions: {
        tauxEpargne: { min: 5, max: 10 },
        tauxEndettement: { max: 40 },
        solde: { min: 0 },
      },
      description: 'Budget tendu, vigilance nécessaire',
      conseils: [
        'Réduisez les dépenses non essentielles',
        'Renégociez vos contrats (assurances, abonnements)',
        'Évitez tout nouvel endettement',
      ],
    },
    CRITIQUE: {
      label: 'Critique',
      color: 'red',
      icon: 'AlertOctagon',
      conditions: {
        tauxEpargne: { max: 5 },
        tauxEndettement: { min: 40 },
        solde: { max: 0 },
      },
      description: 'Situation préoccupante, action urgente',
      conseils: [
        '🚨 Consultez un conseiller financier',
        'Restructurez vos dettes si possible',
        'Envisagez la commission de surendettement si nécessaire',
        'Suspendez tout achat non essentiel',
      ],
    },
  },
  
  INDICATEURS: [
    { id: 'tauxEpargne', label: 'Taux d\'épargne', ideal: '≥ 20%', calcul: '(Épargne / Revenus) × 100' },
    { id: 'tauxEndettement', label: 'Taux d\'endettement', ideal: '≤ 33%', calcul: '(Dettes / Revenus) × 100' },
    { id: 'resteAVivre', label: 'Reste à vivre', ideal: '> 0', calcul: 'Revenus - Dépenses - Dettes' },
    { id: 'ratioLogement', label: 'Ratio logement', ideal: '≤ 33%', calcul: '(Logement / Revenus) × 100' },
  ],
} as const

// ══════════════════════════════════════════════════════════════════════════════
// CATÉGORIES DE REVENUS
// ══════════════════════════════════════════════════════════════════════════════
export const CATEGORIES_REVENUS_2025 = {
  SALAIRE: {
    id: 'salary',
    label: 'Salaire net',
    icon: 'Briefcase',
    description: 'Salaire après prélèvements sociaux et impôt à la source',
    COLOR: 'emerald',
  },
  PRIMES: {
    id: 'bonuses',
    label: 'Primes et bonus',
    icon: 'Gift',
    description: '13ème mois, primes exceptionnelles, intéressement, participation',
    CONSEIL: 'Épargnez au moins 50% des primes exceptionnelles',
    COLOR: 'green',
  },
  REVENUS_LOCATIFS: {
    id: 'rentalIncome',
    label: 'Revenus locatifs',
    icon: 'Building',
    description: 'Loyers perçus nets de charges',
    COLOR: 'blue',
  },
  REVENUS_PLACEMENTS: {
    id: 'investmentIncome',
    label: 'Revenus de placements',
    icon: 'TrendingUp',
    description: 'Dividendes, intérêts, plus-values',
    COLOR: 'purple',
  },
  AUTRES_REVENUS: {
    id: 'otherIncome',
    label: 'Autres revenus',
    icon: 'Wallet',
    description: 'Pensions, allocations, revenus accessoires',
    COLOR: 'gray',
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// CATÉGORIES DE DETTES
// ══════════════════════════════════════════════════════════════════════════════
export const CATEGORIES_DETTES_2025 = {
  CREDIT_IMMOBILIER: {
    id: 'mortgage',
    label: 'Crédit immobilier',
    icon: 'Home',
    description: 'Mensualité de prêt immobilier (résidence principale ou locatif)',
    PRIORITE: 'essentielle',
    COLOR: 'blue',
    CONSEIL: 'Première dette à honorer, risque de saisie en cas d\'impayé',
  },
  CREDITS_CONSO: {
    id: 'consumerLoans',
    label: 'Crédits à la consommation',
    icon: 'CreditCard',
    description: 'Prêts personnels, crédits auto, crédits travaux',
    PRIORITE: 'haute',
    COLOR: 'orange',
    CONSEIL: 'Taux souvent élevés, à rembourser en priorité après épargne de précaution',
  },
  CARTES_CREDIT: {
    id: 'creditCards',
    label: 'Cartes de crédit',
    icon: 'CreditCard',
    description: 'Soldes de cartes de crédit revolving',
    PRIORITE: 'critique',
    COLOR: 'red',
    CONSEIL: '⚠️ Taux très élevés (15-20%), à solder en priorité absolue',
  },
  PRET_ETUDIANT: {
    id: 'studentLoans',
    label: 'Prêt étudiant',
    icon: 'GraduationCap',
    description: 'Prêt étudiant garanti par l\'État',
    PRIORITE: 'normale',
    COLOR: 'indigo',
    CONSEIL: 'Taux généralement avantageux, ne pas rembourser par anticipation',
  },
  AUTRES_DETTES: {
    id: 'otherDebts',
    label: 'Autres dettes',
    icon: 'FileText',
    description: 'Dettes familiales, impôts différés, autres',
    PRIORITE: 'variable',
    COLOR: 'gray',
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calcule le taux d'endettement
 */
export function calculerTauxEndettement(dettes: number, revenus: number): {
  taux: number
  niveau: typeof ENDETTEMENT_2025.NIVEAUX[number]
  depassement: number
} {
  if (revenus <= 0) {
    return {
      taux: 100,
      niveau: ENDETTEMENT_2025.NIVEAUX[5],
      depassement: dettes,
    }
  }
  
  const taux = (dettes / revenus) * 100
  const niveau = ENDETTEMENT_2025.NIVEAUX.find(n => taux <= n.max) || ENDETTEMENT_2025.NIVEAUX[5]
  const depassement = Math.max(0, dettes - revenus * (ENDETTEMENT_2025.SEUIL_MAX_HCSF / 100))
  
  return { taux, niveau, depassement }
}

/**
 * Calcule le taux d'épargne
 */
export function calculerTauxEpargne(epargne: number, revenus: number): {
  taux: number
  objectif: number
  ecart: number
  commentaire: string
} {
  if (revenus <= 0) {
    return {
      taux: 0,
      objectif: 0,
      ecart: 0,
      commentaire: 'Revenus insuffisants pour calculer le taux d\'épargne',
    }
  }
  
  const taux = (epargne / revenus) * 100
  const objectif = REGLE_BUDGETAIRE_2025.EPARGNE_INVESTISSEMENT.POURCENTAGE
  const ecart = taux - objectif
  
  let commentaire: string
  if (taux >= 20) {
    commentaire = '✅ Excellent taux d\'épargne, vous construisez votre patrimoine'
  } else if (taux >= 10) {
    commentaire = '👍 Bon taux d\'épargne, essayez d\'atteindre 20%'
  } else if (taux >= 5) {
    commentaire = '⚠️ Taux d\'épargne faible, augmentez si possible'
  } else {
    commentaire = '🚨 Taux d\'épargne critique, réduisez vos dépenses'
  }
  
  return { taux, objectif, ecart, commentaire }
}

/**
 * Calcule l'épargne de précaution recommandée
 */
export function calculerEpargnePrecaution(
  depensesMensuelles: number,
  profilRisque: keyof typeof EPARGNE_PRECAUTION_2025.PROFILS
): {
  montantRecommande: number
  moisRecommandes: number
  priorite: string
  placements: typeof EPARGNE_PRECAUTION_2025.PLACEMENTS_RECOMMANDES
} {
  const profil = EPARGNE_PRECAUTION_2025.PROFILS[profilRisque]
  const montantRecommande = depensesMensuelles * profil.MOIS_RECOMMANDES
  
  return {
    montantRecommande,
    moisRecommandes: profil.MOIS_RECOMMANDES,
    priorite: profil.PRIORITE,
    placements: EPARGNE_PRECAUTION_2025.PLACEMENTS_RECOMMANDES,
  }
}

/**
 * Détermine la santé budgétaire globale
 */
export function determinerSanteBudgetaire(
  tauxEpargne: number,
  tauxEndettement: number,
  solde: number
): {
  niveau: keyof typeof SANTE_BUDGETAIRE_2025.NIVEAUX
  details: typeof SANTE_BUDGETAIRE_2025.NIVEAUX[keyof typeof SANTE_BUDGETAIRE_2025.NIVEAUX]
} {
  const { NIVEAUX } = SANTE_BUDGETAIRE_2025
  
  // Critique si solde négatif ou endettement > 40%
  if (solde < 0 || tauxEndettement > 40) {
    return { niveau: 'CRITIQUE', details: NIVEAUX.CRITIQUE }
  }
  
  // Excellent si épargne >= 20% ET endettement <= 25%
  if (tauxEpargne >= 20 && tauxEndettement <= 25) {
    return { niveau: 'EXCELLENT', details: NIVEAUX.EXCELLENT }
  }
  
  // Bonne si épargne >= 10% ET endettement <= 33%
  if (tauxEpargne >= 10 && tauxEndettement <= 33) {
    return { niveau: 'BONNE', details: NIVEAUX.BONNE }
  }
  
  // Attention sinon
  return { niveau: 'ATTENTION', details: NIVEAUX.ATTENTION }
}

/**
 * Analyse la répartition des dépenses selon la règle 50/30/20
 */
export function analyserRepartition(
  revenus: number,
  depenses: {
    housing: number
    utilities: number
    food: number
    transportation: number
    insurance: number
    healthcare: number
    education: number
    entertainment: number
    savings: number
    otherExpenses: number
  }
): {
  besoins: { montant: number; pourcentage: number; ecart: number; statut: 'ok' | 'warning' | 'alert' }
  envies: { montant: number; pourcentage: number; ecart: number; statut: 'ok' | 'warning' | 'alert' }
  epargne: { montant: number; pourcentage: number; ecart: number; statut: 'ok' | 'warning' | 'alert' }
  recommandations: string[]
} {
  if (revenus <= 0) {
    return {
      besoins: { montant: 0, pourcentage: 0, ecart: 0, statut: 'alert' },
      envies: { montant: 0, pourcentage: 0, ecart: 0, statut: 'alert' },
      epargne: { montant: 0, pourcentage: 0, ecart: 0, statut: 'alert' },
      recommandations: ['Revenus insuffisants pour analyser la répartition'],
    }
  }
  
  const besoinsTotal = depenses.housing + depenses.utilities + depenses.food + 
                       depenses.transportation + depenses.insurance + depenses.healthcare
  const enviesTotal = depenses.education + depenses.entertainment + depenses.otherExpenses
  const epargneTotal = depenses.savings
  
  const besoinsP = (besoinsTotal / revenus) * 100
  const enviesP = (enviesTotal / revenus) * 100
  const epargneP = (epargneTotal / revenus) * 100
  
  const recommandations: string[] = []
  
  // Analyse besoins
  const besoinsEcart = besoinsP - 50
  let besoinsStatut: 'ok' | 'warning' | 'alert' = 'ok'
  if (besoinsP > 60) {
    besoinsStatut = 'alert'
    recommandations.push('🚨 Vos dépenses essentielles dépassent largement 50% - Réduisez le poste logement ou transport')
  } else if (besoinsP > 55) {
    besoinsStatut = 'warning'
    recommandations.push('⚠️ Vos dépenses essentielles sont légèrement élevées')
  }
  
  // Analyse envies
  const enviesEcart = enviesP - 30
  let enviesStatut: 'ok' | 'warning' | 'alert' = 'ok'
  if (enviesP > 40) {
    enviesStatut = 'alert'
    recommandations.push('🚨 Vos dépenses de loisirs sont excessives - Réduisez les abonnements et sorties')
  } else if (enviesP > 35) {
    enviesStatut = 'warning'
    recommandations.push('⚠️ Vos dépenses de loisirs sont un peu élevées')
  }
  
  // Analyse épargne
  const epargneEcart = epargneP - 20
  let epargneStatut: 'ok' | 'warning' | 'alert' = 'ok'
  if (epargneP < 5) {
    epargneStatut = 'alert'
    recommandations.push('🚨 Votre taux d\'épargne est critique - Mettez en place un virement automatique dès réception du salaire')
  } else if (epargneP < 10) {
    epargneStatut = 'warning'
    recommandations.push('⚠️ Votre taux d\'épargne est insuffisant - Objectif : 20%')
  } else if (epargneP >= 20) {
    recommandations.push('✅ Excellent taux d\'épargne ! Diversifiez vos placements')
  }
  
  return {
    besoins: { montant: besoinsTotal, pourcentage: besoinsP, ecart: besoinsEcart, statut: besoinsStatut },
    envies: { montant: enviesTotal, pourcentage: enviesP, ecart: enviesEcart, statut: enviesStatut },
    epargne: { montant: epargneTotal, pourcentage: epargneP, ecart: epargneEcart, statut: epargneStatut },
    recommandations,
  }
}

/**
 * Calcule la capacité d'emprunt restante
 */
export function calculerCapaciteEmprunt(
  revenus: number,
  dettesActuelles: number,
  tauxInteret: number = 0.04,
  duree: number = 20
): {
  mensualiteMax: number
  capaciteRestante: number
  montantEmpruntable: number
  commentaire: string
} {
  const tauxMax = ENDETTEMENT_2025.SEUIL_MAX_HCSF / 100
  const mensualiteMax = revenus * tauxMax
  const capaciteRestante = Math.max(0, mensualiteMax - dettesActuelles)
  
  // Calcul du capital empruntable avec la formule PMT inversée
  const tauxMensuel = tauxInteret / 12
  const nbMois = duree * 12
  let montantEmpruntable = 0
  
  if (tauxMensuel > 0 && capaciteRestante > 0) {
    montantEmpruntable = capaciteRestante * (1 - Math.pow(1 + tauxMensuel, -nbMois)) / tauxMensuel
  } else if (capaciteRestante > 0) {
    montantEmpruntable = capaciteRestante * nbMois
  }
  
  let commentaire: string
  if (capaciteRestante <= 0) {
    commentaire = '❌ Capacité d\'emprunt épuisée'
  } else if (capaciteRestante < mensualiteMax * 0.3) {
    commentaire = '⚠️ Capacité d\'emprunt limitée'
  } else {
    commentaire = '✅ Bonne capacité d\'emprunt disponible'
  }
  
  return {
    mensualiteMax: Math.round(mensualiteMax),
    capaciteRestante: Math.round(capaciteRestante),
    montantEmpruntable: Math.round(montantEmpruntable),
    commentaire,
  }
}

/**
 * Génère des alertes budgétaires
 */
export function genererAlertes(
  revenus: number,
  depenses: Record<string, number>,
  dettes: number
): string[] {
  const alertes: string[] = []
  
  // Vérifier le taux d'endettement
  const tauxEndettement = revenus > 0 ? (dettes / revenus) * 100 : 0
  if (tauxEndettement > 40) {
    alertes.push('🚨 Taux d\'endettement critique (> 40%) - Risque de surendettement')
  } else if (tauxEndettement > 35) {
    alertes.push('⚠️ Taux d\'endettement au-delà de la limite HCSF (35%)')
  }
  
  // Vérifier le ratio logement
  const ratioLogement = revenus > 0 ? (depenses.housing / revenus) * 100 : 0
  if (ratioLogement > 40) {
    alertes.push('🚨 Le logement représente plus de 40% de vos revenus')
  }
  
  // Vérifier l'épargne
  const tauxEpargne = revenus > 0 ? (depenses.savings / revenus) * 100 : 0
  if (tauxEpargne === 0) {
    alertes.push('⚠️ Aucune épargne mensuelle - Constituez une épargne de précaution')
  }
  
  // Vérifier le solde
  const totalDepenses = Object.values(depenses).reduce((a, b) => a + b, 0)
  const solde = revenus - totalDepenses - dettes
  if (solde < 0) {
    alertes.push('🚨 Budget déficitaire - Dépenses supérieures aux revenus')
  }
  
  return alertes
}

/**
 * Génère des recommandations personnalisées
 */
export function genererRecommandations(
  revenus: number,
  depenses: Record<string, number>,
  dettes: number,
  santeBudgetaire: keyof typeof SANTE_BUDGETAIRE_2025.NIVEAUX
): string[] {
  const recommandations: string[] = []
  
  // Recommandations selon la santé budgétaire
  const conseils = SANTE_BUDGETAIRE_2025.NIVEAUX[santeBudgetaire].conseils
  recommandations.push(...conseils)
  
  // Recommandations spécifiques par catégorie
  for (const [_key, cat] of Object.entries(CATEGORIES_DEPENSES_2025)) {
    const id = cat.id as keyof typeof depenses
    const seuilAlerte = 'SEUIL_ALERTE' in cat ? (cat as any).SEUIL_ALERTE : cat.SEUIL_RECOMMANDE * 1.5
    if (depenses[id] && revenus > 0) {
      const ratio = (depenses[id] / revenus) * 100
      if (ratio > seuilAlerte) {
        recommandations.push(`💡 ${cat.label} : ${cat.CONSEIL}`)
      }
    }
  }
  
  return [...new Set(recommandations)] // Dédupliquer
}
