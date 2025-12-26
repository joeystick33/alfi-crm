/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PARAMÈTRES FISCAUX IFI 2025 (patrimoine au 1er janvier 2025)
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Ce fichier centralise tous les paramètres de l'Impôt sur la Fortune Immobilière.
 * À mettre à jour chaque année lors de la publication du PLF.
 * 
 * Sources :
 * - CGI art. 964 à 983 (IFI)
 * - CGI art. 977 (barème)
 * - CGI art. 978 (réductions)
 * - CGI art. 979 (plafonnement)
 * - BOI-PAT-IFI
 * 
 * Mise à jour : Décembre 2024 pour patrimoine 2025
 */

// ══════════════════════════════════════════════════════════════════════════════
// SEUIL D'IMPOSITION - CGI art. 964
// ══════════════════════════════════════════════════════════════════════════════
export const SEUIL_IFI_2025 = {
  SEUIL_IMPOSITION: 1300000,         // Seuil d'assujettissement
  SEUIL_DECLARATION: 1300000,        // Obligation déclarative
  
  INFO: 'L\'IFI est dû si le patrimoine immobilier net taxable dépasse 1 300 000 € au 1er janvier',
} as const

// ══════════════════════════════════════════════════════════════════════════════
// BARÈME IFI 2025 - CGI art. 977
// ══════════════════════════════════════════════════════════════════════════════
export const BAREME_IFI_2025 = [
  { min: 0, max: 800000, taux: 0, label: 'Non taxable' },
  { min: 800000, max: 1300000, taux: 0.50, label: 'Tranche 0.50%' },
  { min: 1300000, max: 2570000, taux: 0.70, label: 'Tranche 0.70%' },
  { min: 2570000, max: 5000000, taux: 1.00, label: 'Tranche 1.00%' },
  { min: 5000000, max: 10000000, taux: 1.25, label: 'Tranche 1.25%' },
  { min: 10000000, max: Infinity, taux: 1.50, label: 'Tranche 1.50%' },
] as const

// ══════════════════════════════════════════════════════════════════════════════
// DÉCOTE IFI - CGI art. 977
// ══════════════════════════════════════════════════════════════════════════════
export const DECOTE_IFI_2025 = {
  SEUIL_MIN: 1300000,                // Début décote
  SEUIL_MAX: 1400000,                // Fin décote
  COEFFICIENT: 1.25,                  // % du patrimoine
  MONTANT_FIXE: 17500,               // Montant de référence
  
  // Formule : Décote = 17 500 € - (1.25% × Patrimoine net taxable)
  // S'applique uniquement si patrimoine entre 1.3M et 1.4M
  calculer: (patrimoineNet: number): number => {
    if (patrimoineNet < 1300000 || patrimoineNet >= 1400000) return 0
    return Math.max(0, 17500 - patrimoineNet * 0.0125)
  },
  
  INFO: 'La décote lisse l\'entrée dans l\'IFI pour les patrimoines entre 1.3M et 1.4M €',
} as const

// ══════════════════════════════════════════════════════════════════════════════
// ABATTEMENTS ET EXONÉRATIONS - CGI art. 965, 966, 975, 976
// ══════════════════════════════════════════════════════════════════════════════
export const ABATTEMENTS_IFI_2025 = {
  // ─────────────────────────────────────────────────────────────────────────────
  // RÉSIDENCE PRINCIPALE - CGI art. 973
  // ─────────────────────────────────────────────────────────────────────────────
  RESIDENCE_PRINCIPALE: {
    TAUX: 30,                         // Abattement de 30%
    CONDITIONS: [
      'Habitation principale du foyer fiscal',
      'Pas de plafond de valeur',
      'Applicable sur la valeur vénale',
    ],
    INFO: 'L\'abattement de 30% s\'applique sur la valeur vénale de la résidence principale',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // BIENS PROFESSIONNELS - CGI art. 975
  // ─────────────────────────────────────────────────────────────────────────────
  BIENS_PROFESSIONNELS: {
    EXONERATION: 100,                 // Exonération totale
    CONDITIONS: [
      'Affectés à l\'exercice d\'une activité professionnelle principale',
      'Exploitation personnelle effective',
      'Activité industrielle, commerciale, artisanale, agricole ou libérale',
    ],
    EXEMPLES: [
      'Locaux professionnels utilisés pour l\'activité',
      'Terres agricoles exploitées personnellement',
      'Cabinet médical, étude notariale...',
    ],
    INFO: 'Les biens professionnels sont totalement exonérés d\'IFI',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // BIENS RURAUX LOUÉS - CGI art. 976
  // ─────────────────────────────────────────────────────────────────────────────
  BIENS_RURAUX: {
    EXONERATION_75: {
      PLAFOND: 101897,                // Exonération 75% jusqu'à ce montant
      TAUX: 75,
    },
    EXONERATION_50: {
      AU_DELA: 101897,                // Exonération 50% au-delà
      TAUX: 50,
    },
    CONDITIONS: [
      'Bail rural à long terme (18 ans minimum)',
      'Groupements fonciers agricoles (GFA)',
      'Groupements forestiers',
    ],
    INFO: 'Exonération partielle pour les biens ruraux loués par bail à long terme',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // BOIS ET FORÊTS - CGI art. 976
  // ─────────────────────────────────────────────────────────────────────────────
  BOIS_FORETS: {
    EXONERATION_75: {
      PLAFOND: 101897,
      TAUX: 75,
    },
    EXONERATION_50: {
      AU_DELA: 101897,
      TAUX: 50,
    },
    CONDITIONS: [
      'Engagement d\'exploitation pendant 30 ans',
      'Plan Simple de Gestion (PSG) agréé',
      'Groupements forestiers',
    ],
    INFO: 'Les bois et forêts bénéficient d\'une exonération partielle',
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// PASSIF DÉDUCTIBLE - CGI art. 974
// ══════════════════════════════════════════════════════════════════════════════
export const PASSIF_DEDUCTIBLE_IFI_2025 = {
  // ─────────────────────────────────────────────────────────────────────────────
  // DETTES DÉDUCTIBLES
  // ─────────────────────────────────────────────────────────────────────────────
  DETTES_ADMISES: [
    {
      type: 'Emprunts immobiliers',
      description: 'Capital restant dû au 1er janvier',
      conditions: 'Affectés à l\'acquisition, la construction, l\'amélioration de biens taxables',
    },
    {
      type: 'Travaux',
      description: 'Dettes pour travaux d\'amélioration, construction, reconstruction',
      conditions: 'Sur biens taxables',
    },
    {
      type: 'Droits de succession/donation',
      description: 'Si payés en différé sur biens immobiliers',
      conditions: 'Uniquement la part afférente aux biens taxables',
    },
    {
      type: 'Impôts',
      description: 'IFI de l\'année en cours',
      conditions: 'Estimé au 1er janvier',
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAFONNEMENT DES DETTES - CGI art. 974 II
  // ─────────────────────────────────────────────────════════════════════════════
  PLAFONNEMENT: {
    SEUIL: 5000000,                   // Au-delà de 5M€ de patrimoine brut
    CALCUL: 'Si patrimoine brut > 5M€, déduction limitée à 50% des dettes > 60% patrimoine',
    
    // Mécanisme anti-abus
    calculerPlafond: (patrimoineBrut: number, dettes: number): number => {
      if (patrimoineBrut <= 5000000) return dettes
      
      const ratio60 = patrimoineBrut * 0.60
      if (dettes <= ratio60) return dettes
      
      // Au-delà de 60%, seule la moitié est déductible
      return ratio60 + (dettes - ratio60) * 0.50
    },
    
    INFO: 'Ce mécanisme limite l\'optimisation par endettement excessif',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DETTES NON DÉDUCTIBLES
  // ─────────────────────────────────────────────────────────────────────────────
  DETTES_EXCLUES: [
    'Prêts familiaux sans acte authentique',
    'Emprunts sur biens exonérés (professionnels)',
    'Découverts bancaires non affectés',
    'Dettes entre époux/partenaires',
  ],
} as const

// ══════════════════════════════════════════════════════════════════════════════
// RÉDUCTIONS D'IFI - CGI art. 978
// ══════════════════════════════════════════════════════════════════════════════
export const REDUCTIONS_IFI_2025 = {
  // ─────────────────────────────────────────────────────────────────────────────
  // DONS AUX ORGANISMES - CGI art. 978
  // ─────────────────────────────────────────────────────────────────────────────
  DONS: {
    TAUX: 75,                         // 75% du don
    PLAFOND_REDUCTION: 50000,         // Réduction max par an
    PLAFOND_DON: 66667,               // Don max ouvrant droit à réduction (66667 × 75% = 50000)
    
    ORGANISMES_ELIGIBLES: [
      'Fondations reconnues d\'utilité publique',
      'Établissements de recherche ou d\'enseignement supérieur',
      'Établissements d\'enseignement artistique agréés',
      'Fondation du patrimoine (sous conditions)',
      'Entreprises d\'insertion',
    ],
    
    ORGANISMES_EXCLUS: [
      'Associations non reconnues d\'utilité publique',
      'Partis politiques',
      'Organismes collecteurs',
    ],
    
    INFO: 'La réduction IFI-dons est plus avantageuse que la réduction IR-dons (75% vs 66%)',
    ASTUCE: 'Privilégiez les dons IFI si vous êtes assujetti (meilleur rendement fiscal)',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // INVESTISSEMENT PME (supprimé depuis 2018)
  // ─────────────────────────────────────────────────────────────────────────────
  INVESTISSEMENT_PME: {
    STATUT: 'SUPPRIMÉ',
    DATE_FIN: '2018-01-01',
    INFO: 'L\'ancienne réduction ISF-PME n\'existe plus pour l\'IFI',
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// PLAFONNEMENT GLOBAL - CGI art. 979
// ══════════════════════════════════════════════════════════════════════════════
export const PLAFONNEMENT_IFI_2025 = {
  // Le total IR + IFI ne peut dépasser 75% des revenus
  TAUX_PLAFONNEMENT: 75,              // % des revenus
  
  REVENUS_PRIS_EN_COMPTE: [
    'Revenus nets de frais professionnels',
    'Plus-values imposables',
    'Revenus exonérés d\'IR (dividendes de sociétés à l\'IS étrangères...)',
    'Revenus des bons/contrats de capitalisation',
  ],
  
  REVENUS_EXCLUS: [
    'Revenus exceptionnels (indemnités de licenciement...)',
    'Plus-values en report d\'imposition',
  ],
  
  // Mécanisme
  calculerPlafonnement: (ir: number, ifi: number, revenus: number): {
    plafonnement: number
    ifiDu: number
    message: string
  } => {
    const plafond = revenus * 0.75
    const total = ir + ifi
    
    if (total <= plafond) {
      return {
        plafonnement: 0,
        ifiDu: ifi,
        message: 'Pas de plafonnement applicable',
      }
    }
    
    const depassement = total - plafond
    const ifiReduit = Math.max(0, ifi - depassement)
    
    return {
      plafonnement: depassement,
      ifiDu: ifiReduit,
      message: `Plafonnement : IR + IFI limités à 75% des revenus (${plafond.toLocaleString('fr-FR')} €)`,
    }
  },
  
  INFO: 'Le plafonnement protège contre une imposition confiscatoire',
  ATTENTION: 'Les revenus pris en compte incluent certains revenus non imposables à l\'IR',
} as const

// ══════════════════════════════════════════════════════════════════════════════
// ÉVALUATION DES BIENS - Règles pratiques
// ══════════════════════════════════════════════════════════════════════════════
export const EVALUATION_BIENS_2025 = {
  // ─────────────────────────────────────────────────────────────────────────────
  // PRINCIPES D'ÉVALUATION
  // ─────────────────────────────────────────────────────────────────────────────
  PRINCIPE: {
    BASE: 'Valeur vénale réelle au 1er janvier',
    METHODE: 'Prix que le bien trouverait sur le marché dans des conditions normales',
    
    ELEMENTS: [
      'Comparaison avec transactions similaires',
      'Situation géographique',
      'État du bien',
      'Servitudes et contraintes',
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DÉCOTES ADMISES
  // ─────────────────────────────────────────────────────────────────────────────
  DECOTES_ADMISES: {
    OCCUPATION: {
      LOCATAIRE_BAIL_HABITATION: { min: 10, max: 20, description: 'Bien occupé par locataire' },
      LOCATAIRE_BAIL_COMMERCIAL: { min: 15, max: 30, description: 'Bail commercial en cours' },
      INDIVISION: { min: 10, max: 30, description: 'Bien en indivision' },
      DEMEMBREMENT_USUFRUIT: { min: 0, max: 100, description: 'Selon barème fiscal art. 669' },
    },
    
    CARACTERISTIQUES: {
      ILLIQUIDITE: { min: 10, max: 20, description: 'Difficulté de revente (biens atypiques)' },
      MAUVAIS_ETAT: { min: 10, max: 30, description: 'Travaux importants nécessaires' },
      SERVITUDES: { min: 5, max: 15, description: 'Servitudes affectant la valeur' },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // DÉMEMBREMENT DE PROPRIÉTÉ - CGI art. 968, 669
  // ─────────────────────────────────────────────────────────────────────────────
  DEMEMBREMENT: {
    REGLE: 'L\'usufruitier déclare la pleine propriété pour l\'IFI (sauf exceptions)',
    
    EXCEPTIONS_NU_PROPRIETAIRE: [
      'Donation avec réserve d\'usufruit avant le 01/01/2018 (régime transitoire)',
      'Usufruit légal du conjoint survivant',
      'Démembrement résultant de la loi (art. 757 du Code civil)',
    ],
    
    BAREME_USUFRUIT: [
      { ageUsufruitier: '< 21 ans', usufruit: 90, nuePropriete: 10 },
      { ageUsufruitier: '21-30 ans', usufruit: 80, nuePropriete: 20 },
      { ageUsufruitier: '31-40 ans', usufruit: 70, nuePropriete: 30 },
      { ageUsufruitier: '41-50 ans', usufruit: 60, nuePropriete: 40 },
      { ageUsufruitier: '51-60 ans', usufruit: 50, nuePropriete: 50 },
      { ageUsufruitier: '61-70 ans', usufruit: 40, nuePropriete: 60 },
      { ageUsufruitier: '71-80 ans', usufruit: 30, nuePropriete: 70 },
      { ageUsufruitier: '81-90 ans', usufruit: 20, nuePropriete: 80 },
      { ageUsufruitier: '> 90 ans', usufruit: 10, nuePropriete: 90 },
    ],
    
    INFO: 'Le nu-propriétaire n\'est pas imposable sauf cas exceptionnels',
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// BIENS TAXABLES ET NON TAXABLES
// ══════════════════════════════════════════════════════════════════════════════
export const BIENS_IFI_2025 = {
  // ─────────────────────────────────────────────────────────────────────────────
  // BIENS TAXABLES
  // ─────────────────────────────────────────────────────────────────────────────
  TAXABLES: [
    {
      categorie: 'Immeubles bâtis',
      exemples: ['Résidences principales et secondaires', 'Immeubles locatifs', 'Locaux commerciaux détenus en direct'],
    },
    {
      categorie: 'Immeubles non bâtis',
      exemples: ['Terrains à bâtir', 'Terres agricoles non louées', 'Terrains de loisirs'],
    },
    {
      categorie: 'Droits réels immobiliers',
      exemples: ['Usufruit', 'Droit d\'usage et d\'habitation', 'Emphytéose'],
    },
    {
      categorie: 'Parts de sociétés',
      exemples: ['SCI (quote-part immobilière)', 'SCPI', 'OPCI (part immobilière)'],
      precision: 'À hauteur de la fraction représentative de biens immobiliers',
    },
    {
      categorie: 'Contrats d\'assurance-vie',
      exemples: ['Unités de compte immobilières (SCI, SCPI, OPCI)'],
      precision: 'À hauteur de la valeur représentative de l\'immobilier',
    },
  ],

  // ─────────────────────────────────────────────────────────────────────────────
  // BIENS NON TAXABLES
  // ─────────────────────────────────────────────────────────────────────────────
  NON_TAXABLES: [
    {
      categorie: 'Biens professionnels',
      conditions: 'Exercice de l\'activité principale',
    },
    {
      categorie: 'Biens ruraux loués par bail à long terme',
      conditions: 'Exonération 75% puis 50%',
    },
    {
      categorie: 'Bois et forêts',
      conditions: 'Avec engagement de gestion',
    },
    {
      categorie: 'Actifs financiers',
      exemples: ['Actions', 'Obligations', 'Livrets', 'PEA', 'Fonds euros assurance-vie'],
      precision: 'L\'IFI ne taxe QUE l\'immobilier (contrairement à l\'ancien ISF)',
    },
    {
      categorie: 'Œuvres d\'art, véhicules, meubles',
      precision: 'Non taxables à l\'IFI',
    },
  ],
} as const

// ══════════════════════════════════════════════════════════════════════════════
// OBLIGATIONS DÉCLARATIVES
// ══════════════════════════════════════════════════════════════════════════════
export const DECLARATION_IFI_2025 = {
  FORMULAIRE: '2042-IFI',
  DATE_LIMITE: 'Même date que la déclaration de revenus (mai-juin)',
  
  DOCUMENTS_JUSTIFICATIFS: [
    'Relevés de propriété (cadastre)',
    'Tableaux d\'amortissement des emprunts',
    'Estimations immobilières (si contestation)',
    'Statuts des SCI',
    'Relevés de parts SCPI/OPCI',
  ],
  
  SANCTIONS: {
    DEFAUT_DECLARATION: '10% du montant dû',
    INSUFFISANCE: '40% en cas de mauvaise foi, 80% en cas de manœuvres frauduleuses',
    RETARD_PAIEMENT: '0.20% par mois de retard + majoration 10%',
  },
  
  PRESCRIPTION: '6 ans (délai de reprise de l\'administration)',
} as const

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calcule l'IFI brut selon le barème
 */
export function calculerIFIBrut(patrimoineNetTaxable: number): {
  ifi: number
  detailTranches: Array<{ tranche: string; base: number; taux: number; impot: number }>
  tmi: number
} {
  if (patrimoineNetTaxable < SEUIL_IFI_2025.SEUIL_IMPOSITION) {
    return { ifi: 0, detailTranches: [], tmi: 0 }
  }

  let ifi = 0
  let tmi = 0
  const detailTranches: Array<{ tranche: string; base: number; taux: number; impot: number }> = []

  for (const tranche of BAREME_IFI_2025) {
    if (patrimoineNetTaxable > tranche.min) {
      const base = Math.min(patrimoineNetTaxable, tranche.max) - tranche.min
      const impotTranche = base * (tranche.taux / 100)
      ifi += impotTranche

      if (tranche.taux > 0) {
        detailTranches.push({
          tranche: `${tranche.min.toLocaleString('fr-FR')} € - ${tranche.max === Infinity ? '∞' : tranche.max.toLocaleString('fr-FR')} €`,
          base: Math.round(base),
          taux: tranche.taux,
          impot: Math.round(impotTranche),
        })
        tmi = tranche.taux
      }
    }
  }

  return { ifi: Math.round(ifi), detailTranches, tmi }
}

/**
 * Calcule l'IFI net après décote et réductions
 */
export function calculerIFINet(
  patrimoineNetTaxable: number,
  dons: number = 0
): {
  patrimoineNet: number
  ifiBrut: number
  decote: number
  reductionDons: number
  ifiNet: number
  assujetti: boolean
  detailTranches: Array<{ tranche: string; base: number; taux: number; impot: number }>
} {
  const assujetti = patrimoineNetTaxable >= SEUIL_IFI_2025.SEUIL_IMPOSITION
  
  if (!assujetti) {
    return {
      patrimoineNet: patrimoineNetTaxable,
      ifiBrut: 0,
      decote: 0,
      reductionDons: 0,
      ifiNet: 0,
      assujetti: false,
      detailTranches: [],
    }
  }

  const { ifi: ifiBrut, detailTranches } = calculerIFIBrut(patrimoineNetTaxable)
  const decote = DECOTE_IFI_2025.calculer(patrimoineNetTaxable)
  const reductionDons = Math.min(dons * 0.75, REDUCTIONS_IFI_2025.DONS.PLAFOND_REDUCTION)
  
  const ifiNet = Math.max(0, ifiBrut - decote - reductionDons)

  return {
    patrimoineNet: patrimoineNetTaxable,
    ifiBrut,
    decote: Math.round(decote),
    reductionDons: Math.round(reductionDons),
    ifiNet: Math.round(ifiNet),
    assujetti: true,
    detailTranches,
  }
}

/**
 * Calcule la valeur d'un usufruit selon l'âge
 */
export function getValeurUsufruit(ageUsufruitier: number): { usufruit: number; nuePropriete: number } {
  const bareme = EVALUATION_BIENS_2025.DEMEMBREMENT.BAREME_USUFRUIT
  
  if (ageUsufruitier < 21) return { usufruit: 90, nuePropriete: 10 }
  if (ageUsufruitier <= 30) return { usufruit: 80, nuePropriete: 20 }
  if (ageUsufruitier <= 40) return { usufruit: 70, nuePropriete: 30 }
  if (ageUsufruitier <= 50) return { usufruit: 60, nuePropriete: 40 }
  if (ageUsufruitier <= 60) return { usufruit: 50, nuePropriete: 50 }
  if (ageUsufruitier <= 70) return { usufruit: 40, nuePropriete: 60 }
  if (ageUsufruitier <= 80) return { usufruit: 30, nuePropriete: 70 }
  if (ageUsufruitier <= 90) return { usufruit: 20, nuePropriete: 80 }
  return { usufruit: 10, nuePropriete: 90 }
}

/**
 * Calcule le plafonnement des dettes
 */
export function calculerPlafondDettes(patrimoineBrut: number, dettes: number): {
  dettesDeductibles: number
  plafonnement: number
  message: string
} {
  if (patrimoineBrut <= 5000000) {
    return {
      dettesDeductibles: dettes,
      plafonnement: 0,
      message: 'Pas de plafonnement (patrimoine ≤ 5M €)',
    }
  }

  const seuilDettes = patrimoineBrut * 0.60
  
  if (dettes <= seuilDettes) {
    return {
      dettesDeductibles: dettes,
      plafonnement: 0,
      message: 'Dettes < 60% du patrimoine, pas de plafonnement',
    }
  }

  const dettesPlafonnees = seuilDettes + (dettes - seuilDettes) * 0.50
  const plafonnement = dettes - dettesPlafonnees

  return {
    dettesDeductibles: Math.round(dettesPlafonnees),
    plafonnement: Math.round(plafonnement),
    message: `Plafonnement appliqué : ${Math.round(plafonnement).toLocaleString('fr-FR')} € de dettes non déductibles`,
  }
}

/**
 * Vérifie si un don est éligible à la réduction IFI
 */
export function verifierEligibiliteDonIFI(montant: number): {
  reduction: number
  plafonne: boolean
  message: string
} {
  const reductionBrute = montant * 0.75
  const plafonne = reductionBrute > REDUCTIONS_IFI_2025.DONS.PLAFOND_REDUCTION
  const reduction = Math.min(reductionBrute, REDUCTIONS_IFI_2025.DONS.PLAFOND_REDUCTION)

  return {
    reduction: Math.round(reduction),
    plafonne,
    message: plafonne 
      ? `Don plafonné : réduction limitée à ${REDUCTIONS_IFI_2025.DONS.PLAFOND_REDUCTION.toLocaleString('fr-FR')} €`
      : `Réduction IFI : ${Math.round(reduction).toLocaleString('fr-FR')} € (75% du don)`,
  }
}
