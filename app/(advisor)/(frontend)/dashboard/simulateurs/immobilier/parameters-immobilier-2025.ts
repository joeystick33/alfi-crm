/**
 * PARAMÈTRES IMMOBILIER 2025
 * Sources : CGI, BOFiP, Loi de Finances 2025
 * 
 * Ce fichier centralise tous les paramètres fiscaux et réglementaires
 * pour les simulateurs d'investissement immobilier.
 */

// ============================================================================
// PRÉLÈVEMENTS SOCIAUX
// ============================================================================
export const PRELEVEMENTS_SOCIAUX = {
  // Taux global PS (revenus du patrimoine)
  TAUX_GLOBAL: 17.2,
  // Détail des composantes
  CSG: 9.2,
  CRDS: 0.5,
  PRELEVEMENT_SOLIDARITE: 7.5,
  // CSG déductible du revenu imposable (revenus fonciers au réel)
  CSG_DEDUCTIBLE: 6.8,
}

// ============================================================================
// LOCATION NUE - REVENUS FONCIERS
// ============================================================================
export const LOCATION_NUE = {
  // Micro-foncier (CGI art. 32)
  MICRO_FONCIER: {
    PLAFOND_RECETTES: 15000, // Plafond annuel de recettes
    ABATTEMENT: 30, // Abattement forfaitaire pour charges
    EXCLUSIONS: [
      'Monuments historiques',
      'Dispositifs spéciaux (Malraux, etc.)',
      'Parts de SCI ou SCPI (si > 15 000 € avec autres revenus)',
    ],
  },
  
  // Régime réel (CGI art. 28 à 31)
  REEL: {
    // Charges déductibles (art. 31)
    CHARGES_DEDUCTIBLES: [
      { code: 'INTERETS', label: 'Intérêts d\'emprunt', deductible: true },
      { code: 'ASSURANCE_EMPRUNT', label: 'Assurance emprunteur', deductible: true },
      { code: 'TAXE_FONCIERE', label: 'Taxe foncière (hors TEOM)', deductible: true },
      { code: 'CHARGES_COPRO', label: 'Charges de copropriété non récupérables', deductible: true },
      { code: 'ASSURANCE_PNO', label: 'Assurance propriétaire non occupant', deductible: true },
      { code: 'FRAIS_GESTION', label: 'Frais de gestion (agence)', deductible: true },
      { code: 'FRAIS_PROCEDURE', label: 'Frais de procédure', deductible: true },
      { code: 'TRAVAUX_ENTRETIEN', label: 'Travaux d\'entretien et réparation', deductible: true },
      { code: 'TRAVAUX_AMELIORATION', label: 'Travaux d\'amélioration', deductible: true },
      { code: 'INDEMNITE_EVICTION', label: 'Indemnités d\'éviction', deductible: true },
      { code: 'PROVISIONS_CHARGES', label: 'Provisions pour charges de copro', deductible: true },
    ],
    // Charges NON déductibles
    CHARGES_NON_DEDUCTIBLES: [
      'Travaux de construction, reconstruction ou agrandissement',
      'Capital remboursé du crédit',
      'Mobilier et équipements',
    ],
  },
  
  // Déficit foncier (CGI art. 156-I-3°)
  DEFICIT_FONCIER: {
    PLAFOND_IMPUTATION_RG: 10700, // Plafond d'imputation sur revenu global par an
    PLAFOND_IMPUTATION_RG_RENOVATION_ENERGETIQUE: 21400, // Doublé pour rénovation énergétique (2023-2025)
    DUREE_REPORT: 10, // Durée de report sur revenus fonciers (années)
    ENGAGEMENT_LOCATION: 3, // Durée minimale de location après imputation (années)
    // Le déficit provenant des intérêts d'emprunt ne s'impute que sur revenus fonciers
  },
}

// ============================================================================
// LMNP - LOUEUR MEUBLÉ NON PROFESSIONNEL
// ============================================================================
export const LMNP = {
  // Seuil de passage LMP (CGI art. 155-IV)
  SEUIL_RECETTES_LMP: 23000,
  
  // Micro-BIC (CGI art. 50-0) - Réforme LF 2024 pour revenus 2025
  MICRO_BIC: {
    // Location meublée classique (longue durée)
    PLAFOND_RECETTES_CLASSIQUE: 15000,
    ABATTEMENT_CLASSIQUE: 30,
    // Meublé tourisme CLASSÉ (LF 2024)
    PLAFOND_RECETTES_TOURISME_CLASSE: 77700,
    ABATTEMENT_TOURISME_CLASSE: 50,
    // Meublé tourisme NON classé (LF 2024 - réforme majeure)
    PLAFOND_RECETTES_TOURISME_NON_CLASSE: 15000,
    ABATTEMENT_TOURISME_NON_CLASSE: 30,
    // Chambre d'hôtes (maintenu)
    PLAFOND_RECETTES_CHAMBRE_HOTES: 188700,
    ABATTEMENT_CHAMBRE_HOTES: 71,
  },
  
  // Régime réel simplifié
  REEL: {
    // Amortissements (durées usuelles)
    AMORTISSEMENTS: {
      BATIMENT: { dureeMin: 25, dureeMax: 50, dureeUsuelle: 30, description: 'Construction (hors terrain)' },
      TERRAIN: { dureeMin: 0, dureeMax: 0, dureeUsuelle: 0, description: 'Non amortissable' },
      MOBILIER: { dureeMin: 5, dureeMax: 10, dureeUsuelle: 7, description: 'Meubles et équipements' },
      TRAVAUX_GROS_OEUVRE: { dureeMin: 15, dureeMax: 30, dureeUsuelle: 20, description: 'Toiture, façade...' },
      TRAVAUX_SECOND_OEUVRE: { dureeMin: 10, dureeMax: 15, dureeUsuelle: 12, description: 'Électricité, plomberie...' },
      TRAVAUX_AMENAGEMENT: { dureeMin: 5, dureeMax: 10, dureeUsuelle: 7, description: 'Cuisine équipée, SDB...' },
    },
    // Part terrain (non amortissable) - fourchette usuelle
    PART_TERRAIN_MIN: 10, // 10% minimum (immeuble centre-ville)
    PART_TERRAIN_MAX: 30, // 30% maximum (maison avec jardin)
    PART_TERRAIN_DEFAUT: 15, // Valeur par défaut
    // Charges déductibles spécifiques LMNP
    CHARGES_SPECIFIQUES: [
      { code: 'COMPTABILITE', label: 'Frais de comptabilité', montantUsuel: 500, deductible: true },
      { code: 'CFE', label: 'Cotisation Foncière des Entreprises', montantUsuel: 200, deductible: true },
      { code: 'ADHESION_CGA', label: 'Adhésion centre de gestion agréé', montantUsuel: 150, deductible: true },
    ],
    // Règle de l'amortissement différé
    // L'amortissement ne peut pas créer de déficit, il est reporté sans limite
    AMORTISSEMENT_DIFFERE: true,
  },
  
  // Obligations meublé
  LISTE_MOBILIER_OBLIGATOIRE: [
    'Literie avec couette ou couverture',
    'Volets ou rideaux occultants dans les chambres',
    'Plaques de cuisson',
    'Four ou micro-ondes',
    'Réfrigérateur avec compartiment congélateur ou congélateur',
    'Vaisselle et ustensiles de cuisine',
    'Table et sièges',
    'Étagères de rangement',
    'Luminaires',
    'Matériel d\'entretien ménager',
  ],
}

// ============================================================================
// LMP - LOUEUR MEUBLÉ PROFESSIONNEL
// ============================================================================
export const LMP = {
  // Conditions cumulatives (CGI art. 155-IV)
  CONDITIONS: {
    SEUIL_RECETTES: 23000, // Recettes > 23 000 €/an
    RECETTES_SUPERIEURES_REVENUS_PRO: true, // Recettes > autres revenus d'activité du foyer
  },
  
  // Cotisations sociales SSI (ex-RSI)
  COTISATIONS_SSI: {
    // Taux approximatifs sur bénéfice
    MALADIE_MATERNITE: 6.5, // Variable selon revenus
    RETRAITE_BASE: 17.75, // Jusqu'au PASS
    RETRAITE_COMPLEMENTAIRE: 7, // 
    INVALIDITE_DECES: 1.3,
    ALLOCATIONS_FAMILIALES: 3.1, // Taux plein (peut être réduit)
    CSG_CRDS: 9.7, // 9.2% CSG + 0.5% CRDS
    FORMATION_PRO: 0.25,
    // Taux global approximatif
    TAUX_GLOBAL_APPROXIMATIF: 45,
    // Cotisations minimales
    COTISATION_MINIMALE: 1200, // Environ
  },
  
  // Avantages LMP
  AVANTAGES: {
    DEFICIT_IMPUTABLE_RG: true, // Déficit imputable sur revenu global sans limite
    EXONERATION_PV_5_ANS: true, // Exonération PV si activité > 5 ans et CA < 90 000 €
    SEUIL_EXONERATION_TOTALE: 90000,
    SEUIL_EXONERATION_PARTIELLE: 126000,
  },
  
  // Plus-value professionnelle
  PLUS_VALUE_PRO: {
    // Court terme : réintégration des amortissements
    // Long terme : exonération possible si conditions remplies
    DUREE_COURT_TERME: 2, // années
    TAUX_LONG_TERME: 12.8, // + PS 17.2%
  },
}

// ============================================================================
// PLUS-VALUE IMMOBILIÈRE DES PARTICULIERS
// ============================================================================
export const PLUS_VALUE_IMMOBILIERE = {
  // Taux d'imposition (CGI art. 200 B)
  TAUX_IR: 19,
  TAUX_PS: 17.2,
  
  // Abattements pour durée de détention (CGI art. 150 VC)
  ABATTEMENTS_IR: {
    ANNEES_0_5: 0, // Pas d'abattement les 5 premières années
    ANNEES_6_21: 6, // 6% par an de la 6e à la 21e année
    ANNEE_22: 4, // 4% la 22e année (total 100%)
    EXONERATION_TOTALE: 22, // Exonération totale après 22 ans
  },
  
  ABATTEMENTS_PS: {
    ANNEES_0_5: 0,
    ANNEES_6_21: 1.65, // 1.65% par an de la 6e à la 21e année
    ANNEE_22: 1.60, // 1.60% la 22e année
    ANNEES_23_30: 9, // 9% par an de la 23e à la 30e année
    EXONERATION_TOTALE: 30, // Exonération totale après 30 ans
  },
  
  // Surtaxe sur plus-values élevées (CGI art. 1609 nonies G)
  SURTAXE: [
    { seuil: 50000, taux: 0 },
    { seuil: 60000, taux: 2 },
    { seuil: 100000, taux: 2, formule: 'PV × 2% - (60000 - PV) × 1/20' }, // Lissage
    { seuil: 110000, taux: 3, formule: 'PV × 3% - 3000' },
    { seuil: 150000, taux: 3 },
    { seuil: 160000, taux: 4, formule: 'PV × 4% - 1500' },
    { seuil: 200000, taux: 4 },
    { seuil: 210000, taux: 5, formule: 'PV × 5% - 2000' },
    { seuil: 250000, taux: 5 },
    { seuil: 260000, taux: 6, formule: 'PV × 6% - 2500' },
    { seuil: Infinity, taux: 6 },
  ],
  
  // Majoration du prix d'acquisition
  MAJORATION_FORFAITAIRE: {
    FRAIS_ACQUISITION: 7.5, // Forfait 7.5% si pas de justificatifs
    TRAVAUX_15_ANS: 15, // Forfait 15% si détention > 5 ans et pas de justificatifs
  },
}

// ============================================================================
// PLAFONDS DISPOSITIFS FISCAUX
// ============================================================================
export const DISPOSITIFS_FISCAUX = {
  // Pinel (CGI art. 199 novovicies) - Fin au 31/12/2024
  PINEL: {
    DATE_FIN: '2024-12-31',
    PLAFOND_INVESTISSEMENT: 300000,
    PLAFOND_PAR_M2: 5500,
    NB_LOGEMENTS_MAX: 2,
    TAUX_REDUCTION: {
      '6_ANS': 9, // 2024
      '9_ANS': 12,
      '12_ANS': 14,
    },
    TAUX_REDUCTION_PLUS: { // Pinel+
      '6_ANS': 12,
      '9_ANS': 18,
      '12_ANS': 21,
    },
    PLAFONDS_LOYER_M2: {
      'A_BIS': 18.25,
      'A': 13.56,
      'B1': 10.93,
      'B2': 9.50, // Sur agrément
    },
  },
  
  // Denormandie (CGI art. 199 novovicies)
  DENORMANDIE: {
    PART_TRAVAUX_MIN: 25, // 25% du coût total minimum
    // Mêmes taux et plafonds que Pinel
  },
  
  // Malraux (CGI art. 199 tervicies)
  MALRAUX: {
    TAUX_SPR: 30, // Site Patrimonial Remarquable avec PSMV
    TAUX_QAD: 22, // Quartier Ancien Dégradé
    PLAFOND_TRAVAUX: 400000,
    PERIODE_PLAFOND: 4, // années
  },
  
  // Monuments Historiques (CGI art. 156-II-1° ter)
  MONUMENTS_HISTORIQUES: {
    DEDUCTION_TRAVAUX: 100, // 100% des travaux déductibles
    ENGAGEMENT_CONSERVATION: 15, // années
    OUVERTURE_PUBLIC: true, // Obligatoire pour déduction à 100%
  },
  
  // Loc'Avantages (CGI art. 199 tricies)
  LOC_AVANTAGES: {
    LOC1: { reduction: 15, plafondLoyer: 'intermédiaire' },
    LOC2: { reduction: 35, plafondLoyer: 'social' },
    LOC3: { reduction: 65, plafondLoyer: 'très_social', intermediation: true },
  },
  
  // Plafond global des niches fiscales
  PLAFOND_NICHES_FISCALES: 10000,
  PLAFOND_NICHES_OUTREMER: 18000,
}

// ============================================================================
// DPE ET CONTRAINTES ÉNERGÉTIQUES
// ============================================================================
export const DPE = {
  // Interdictions de location
  INTERDICTIONS: {
    G_PLUS: { date: '2025-01-01', label: 'DPE G+ (> 450 kWh/m²/an)' },
    G: { date: '2028-01-01', label: 'DPE G' },
    F: { date: '2034-01-01', label: 'DPE F' },
  },
  // Valeur verte (impact sur le prix)
  IMPACT_VALEUR: {
    A: { bonus: 10 },
    B: { bonus: 5 },
    C: { bonus: 0 },
    D: { malus: 0 },
    E: { malus: -5 },
    F: { malus: -10 },
    G: { malus: -20 },
  },
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Calcule l'abattement IR pour plus-value selon durée de détention
 */
export function calculAbattementPVIR(anneesDetention: number): number {
  if (anneesDetention < 6) return 0
  if (anneesDetention >= 22) return 100
  if (anneesDetention <= 21) return 6 * (anneesDetention - 5)
  return 6 * 16 + 4 // 22e année
}

/**
 * Calcule l'abattement PS pour plus-value selon durée de détention
 */
export function calculAbattementPVPS(anneesDetention: number): number {
  if (anneesDetention < 6) return 0
  if (anneesDetention >= 30) return 100
  
  let abattement = 0
  // 6e à 21e année : 1.65%/an
  if (anneesDetention >= 6) {
    const anneesPhase1 = Math.min(anneesDetention, 21) - 5
    abattement += anneesPhase1 * 1.65
  }
  // 22e année : 1.60%
  if (anneesDetention >= 22) {
    abattement += 1.60
  }
  // 23e à 30e année : 9%/an
  if (anneesDetention >= 23) {
    const anneesPhase3 = Math.min(anneesDetention, 30) - 22
    abattement += anneesPhase3 * 9
  }
  
  return Math.min(100, abattement)
}

/**
 * Calcule la surtaxe sur plus-value élevée
 */
export function calculSurtaxePV(plusValueImposable: number): number {
  if (plusValueImposable <= 50000) return 0
  
  const pv = plusValueImposable
  
  if (pv <= 60000) return (pv - 50000) * 0.02
  if (pv <= 100000) return pv * 0.02 - (60000 - pv) * (1/20)
  if (pv <= 110000) return pv * 0.03 - 3000
  if (pv <= 150000) return pv * 0.03
  if (pv <= 160000) return pv * 0.04 - 1500
  if (pv <= 200000) return pv * 0.04
  if (pv <= 210000) return pv * 0.05 - 2000
  if (pv <= 250000) return pv * 0.05
  if (pv <= 260000) return pv * 0.06 - 2500
  return pv * 0.06
}

/**
 * Calcule l'impôt total sur plus-value immobilière
 */
export function calculImpotPlusValue(
  plusValueBrute: number,
  anneesDetention: number,
  options?: { fraisAcquisition?: number; travaux?: number }
): {
  plusValueBrute: number
  plusValueImposableIR: number
  plusValueImposablePS: number
  abattementIR: number
  abattementPS: number
  impotIR: number
  prelevementsSociaux: number
  surtaxe: number
  impotTotal: number
  plusValueNette: number
  explicationCalcul: string[]
} {
  const abattementIR = calculAbattementPVIR(anneesDetention)
  const abattementPS = calculAbattementPVPS(anneesDetention)
  
  const plusValueImposableIR = plusValueBrute * (1 - abattementIR / 100)
  const plusValueImposablePS = plusValueBrute * (1 - abattementPS / 100)
  
  const impotIR = plusValueImposableIR * (PLUS_VALUE_IMMOBILIERE.TAUX_IR / 100)
  const prelevementsSociaux = plusValueImposablePS * (PLUS_VALUE_IMMOBILIERE.TAUX_PS / 100)
  const surtaxe = calculSurtaxePV(plusValueImposableIR)
  
  const impotTotal = impotIR + prelevementsSociaux + surtaxe
  const plusValueNette = plusValueBrute - impotTotal
  
  const explicationCalcul = [
    `Plus-value brute : ${plusValueBrute.toLocaleString('fr-FR')} €`,
    `Durée de détention : ${anneesDetention} ans`,
    ``,
    `📊 Abattements pour durée de détention :`,
    `• Abattement IR : ${abattementIR.toFixed(2)}% ${anneesDetention >= 22 ? '(exonération totale)' : ''}`,
    `• Abattement PS : ${abattementPS.toFixed(2)}% ${anneesDetention >= 30 ? '(exonération totale)' : ''}`,
    ``,
    `📊 Calcul de l'impôt :`,
    `• Plus-value imposable IR : ${plusValueImposableIR.toLocaleString('fr-FR')} €`,
    `• Plus-value imposable PS : ${plusValueImposablePS.toLocaleString('fr-FR')} €`,
    `• Impôt IR (19%) : ${impotIR.toLocaleString('fr-FR')} €`,
    `• Prélèvements sociaux (17.2%) : ${prelevementsSociaux.toLocaleString('fr-FR')} €`,
    surtaxe > 0 ? `• Surtaxe PV élevée : ${surtaxe.toLocaleString('fr-FR')} €` : '',
    ``,
    `💰 Total impôt plus-value : ${impotTotal.toLocaleString('fr-FR')} €`,
    `💰 Plus-value nette : ${plusValueNette.toLocaleString('fr-FR')} €`,
  ].filter(Boolean)
  
  return {
    plusValueBrute,
    plusValueImposableIR,
    plusValueImposablePS,
    abattementIR,
    abattementPS,
    impotIR: Math.round(impotIR),
    prelevementsSociaux: Math.round(prelevementsSociaux),
    surtaxe: Math.round(surtaxe),
    impotTotal: Math.round(impotTotal),
    plusValueNette: Math.round(plusValueNette),
    explicationCalcul,
  }
}

/**
 * Calcule l'amortissement LMNP
 */
export function calculAmortissementLMNP(
  prixAchat: number,
  travaux: number,
  mobilier: number,
  partTerrain: number = 15
): {
  amortissementAnnuelBatiment: number
  amortissementAnnuelMobilier: number
  amortissementAnnuelTravaux: number
  amortissementAnnuelTotal: number
  valeurBatiment: number
  valeurTerrain: number
  explication: string[]
} {
  const valeurTerrain = prixAchat * (partTerrain / 100)
  const valeurBatiment = prixAchat - valeurTerrain
  
  const dureeAmortBatiment = LMNP.REEL.AMORTISSEMENTS.BATIMENT.dureeUsuelle
  const dureeAmortMobilier = LMNP.REEL.AMORTISSEMENTS.MOBILIER.dureeUsuelle
  const dureeAmortTravaux = LMNP.REEL.AMORTISSEMENTS.TRAVAUX_SECOND_OEUVRE.dureeUsuelle
  
  const amortissementAnnuelBatiment = valeurBatiment / dureeAmortBatiment
  const amortissementAnnuelMobilier = mobilier / dureeAmortMobilier
  const amortissementAnnuelTravaux = travaux / dureeAmortTravaux
  const amortissementAnnuelTotal = amortissementAnnuelBatiment + amortissementAnnuelMobilier + amortissementAnnuelTravaux
  
  const explication = [
    `🏠 Valeur du bien : ${prixAchat.toLocaleString('fr-FR')} €`,
    `   • Part terrain (${partTerrain}%, non amortissable) : ${valeurTerrain.toLocaleString('fr-FR')} €`,
    `   • Valeur bâtiment amortissable : ${valeurBatiment.toLocaleString('fr-FR')} €`,
    ``,
    `📊 Calcul des amortissements annuels :`,
    `   • Bâtiment (${dureeAmortBatiment} ans) : ${valeurBatiment.toLocaleString('fr-FR')} ÷ ${dureeAmortBatiment} = ${amortissementAnnuelBatiment.toLocaleString('fr-FR')} €/an`,
    mobilier > 0 ? `   • Mobilier (${dureeAmortMobilier} ans) : ${mobilier.toLocaleString('fr-FR')} ÷ ${dureeAmortMobilier} = ${amortissementAnnuelMobilier.toLocaleString('fr-FR')} €/an` : '',
    travaux > 0 ? `   • Travaux (${dureeAmortTravaux} ans) : ${travaux.toLocaleString('fr-FR')} ÷ ${dureeAmortTravaux} = ${amortissementAnnuelTravaux.toLocaleString('fr-FR')} €/an` : '',
    ``,
    `💡 Amortissement total : ${amortissementAnnuelTotal.toLocaleString('fr-FR')} €/an`,
    ``,
    `⚠️ L'amortissement ne peut pas créer de déficit. L'excédent est reporté sans limite de durée.`,
  ].filter(Boolean)
  
  return {
    amortissementAnnuelBatiment: Math.round(amortissementAnnuelBatiment),
    amortissementAnnuelMobilier: Math.round(amortissementAnnuelMobilier),
    amortissementAnnuelTravaux: Math.round(amortissementAnnuelTravaux),
    amortissementAnnuelTotal: Math.round(amortissementAnnuelTotal),
    valeurBatiment: Math.round(valeurBatiment),
    valeurTerrain: Math.round(valeurTerrain),
    explication,
  }
}

/**
 * Calcule les cotisations SSI pour LMP
 */
export function calculCotisationsSSI(benefice: number): {
  cotisationsTotales: number
  detail: { label: string; montant: number }[]
  explication: string[]
} {
  if (benefice <= 0) {
    return {
      cotisationsTotales: LMP.COTISATIONS_SSI.COTISATION_MINIMALE,
      detail: [{ label: 'Cotisation minimale', montant: LMP.COTISATIONS_SSI.COTISATION_MINIMALE }],
      explication: ['Bénéfice nul ou négatif : cotisation minimale applicable.'],
    }
  }
  
  const detail = [
    { label: 'Maladie-maternité', montant: Math.round(benefice * LMP.COTISATIONS_SSI.MALADIE_MATERNITE / 100) },
    { label: 'Retraite de base', montant: Math.round(benefice * LMP.COTISATIONS_SSI.RETRAITE_BASE / 100) },
    { label: 'Retraite complémentaire', montant: Math.round(benefice * LMP.COTISATIONS_SSI.RETRAITE_COMPLEMENTAIRE / 100) },
    { label: 'Invalidité-décès', montant: Math.round(benefice * LMP.COTISATIONS_SSI.INVALIDITE_DECES / 100) },
    { label: 'Allocations familiales', montant: Math.round(benefice * LMP.COTISATIONS_SSI.ALLOCATIONS_FAMILIALES / 100) },
    { label: 'CSG-CRDS', montant: Math.round(benefice * LMP.COTISATIONS_SSI.CSG_CRDS / 100) },
    { label: 'Formation professionnelle', montant: Math.round(benefice * LMP.COTISATIONS_SSI.FORMATION_PRO / 100) },
  ]
  
  const cotisationsTotales = detail.reduce((sum, d) => sum + d.montant, 0)
  
  const explication = [
    `📊 Calcul des cotisations SSI sur bénéfice de ${benefice.toLocaleString('fr-FR')} €`,
    ``,
    ...detail.map(d => `• ${d.label} : ${d.montant.toLocaleString('fr-FR')} €`),
    ``,
    `💰 Total cotisations : ${cotisationsTotales.toLocaleString('fr-FR')} €`,
    `📊 Taux effectif : ${(cotisationsTotales / benefice * 100).toFixed(1)}%`,
  ]
  
  return { cotisationsTotales, detail, explication }
}

/**
 * ============================================================================
 * PLUS-VALUE LMNP AVEC RÉINTÉGRATION DES AMORTISSEMENTS (LF 2024)
 * ============================================================================
 * 
 * ATTENTION : Depuis la loi de finances 2024 (art. 30), les amortissements
 * pratiqués en LMNP doivent être réintégrés dans le calcul de la plus-value
 * à la revente. C'est une modification MAJEURE du régime fiscal LMNP.
 * 
 * Référence : CGI art. 150 VB modifié
 * Applicable aux cessions réalisées à compter du 1er février 2025
 */
export function calculPlusValueLMNP(
  prixAchat: number,
  fraisAcquisition: number, // Notaire, etc. OU forfait 7.5%
  travauxDeductibles: number, // Travaux OU forfait 15% si > 5 ans
  prixVente: number,
  fraisVente: number, // Agence, diagnostics, etc.
  dureeDetention: number, // En années
  amortissementsCumules: number, // Total des amortissements pratiqués
  options?: {
    utiliseForfaitFrais?: boolean // true = 7.5%
    utiliseForfaitTravaux?: boolean // true = 15% (si > 5 ans)
    dateCession?: Date // Pour vérifier l'application LF 2024
  }
): {
  // Prix de cession
  prixCession: number
  fraisCession: number
  prixCessionNet: number
  
  // Prix d'acquisition
  prixAcquisition: number
  fraisAcquisitionRetenus: number
  travauxRetenus: number
  prixAcquisitionMajore: number
  
  // Réintégration des amortissements (LF 2024)
  amortissementsReintegres: number
  prixAcquisitionCorrige: number
  
  // Plus-value
  plusValueBrute: number
  abattementIR: number
  abattementPS: number
  plusValueImposableIR: number
  plusValueImposablePS: number
  
  // Impôts
  impotIR: number
  impotPS: number
  surtaxe: number
  impotTotal: number
  
  // Résultat net
  plusValueNette: number
  produitNetCession: number
  
  // Explications pédagogiques
  explication: string[]
  alertes: string[]
  articlesCGI: string[]
} {
  // Vérifier si LF 2024 s'applique (cessions à partir du 01/02/2025)
  const dateLimite = new Date('2025-02-01')
  const dateCession = options?.dateCession || new Date()
  const lf2024Applicable = dateCession >= dateLimite
  
  // Prix de cession
  const prixCessionNet = prixVente - fraisVente
  
  // Prix d'acquisition majoré
  const fraisRetenus = options?.utiliseForfaitFrais 
    ? prixAchat * PLUS_VALUE_IMMOBILIERE.MAJORATION_FORFAITAIRE.FRAIS_ACQUISITION / 100
    : fraisAcquisition
  
  const travauxRetenus = options?.utiliseForfaitTravaux && dureeDetention >= 5
    ? prixAchat * PLUS_VALUE_IMMOBILIERE.MAJORATION_FORFAITAIRE.TRAVAUX_15_ANS / 100
    : travauxDeductibles
  
  const prixAcquisitionMajore = prixAchat + fraisRetenus + travauxRetenus
  
  // NOUVEAUTÉ LF 2024 : Réintégration des amortissements
  // Le prix d'acquisition est DIMINUÉ des amortissements pratiqués
  const amortissementsReintegres = lf2024Applicable ? amortissementsCumules : 0
  const prixAcquisitionCorrige = prixAcquisitionMajore - amortissementsReintegres
  
  // Plus-value brute
  const plusValueBrute = Math.max(0, prixCessionNet - prixAcquisitionCorrige)
  
  // Abattements pour durée de détention
  const abattementIR = calculAbattementPVIR(dureeDetention)
  const abattementPS = calculAbattementPVPS(dureeDetention)
  
  const plusValueImposableIR = plusValueBrute * (1 - abattementIR / 100)
  const plusValueImposablePS = plusValueBrute * (1 - abattementPS / 100)
  
  // Calcul des impôts
  const impotIR = plusValueImposableIR * PLUS_VALUE_IMMOBILIERE.TAUX_IR / 100
  const impotPS = plusValueImposablePS * PLUS_VALUE_IMMOBILIERE.TAUX_PS / 100
  const surtaxe = calculSurtaxePV(plusValueImposableIR)
  const impotTotal = impotIR + impotPS + surtaxe
  
  const plusValueNette = plusValueBrute - impotTotal
  const produitNetCession = prixCessionNet - impotTotal
  
  // Explications pédagogiques détaillées
  const explication: string[] = [
    `═══════════════════════════════════════════════════════════════`,
    `📊 CALCUL PLUS-VALUE LMNP - CESSION APRÈS ${dureeDetention} ANS`,
    `═══════════════════════════════════════════════════════════════`,
    ``,
    `① PRIX DE CESSION`,
    `   Prix de vente brut ........................ ${prixVente.toLocaleString('fr-FR')} €`,
    `   Frais de cession (agence, diag.) .......... - ${fraisVente.toLocaleString('fr-FR')} €`,
    `   ─────────────────────────────────────────────────────────────`,
    `   Prix de cession net ....................... ${prixCessionNet.toLocaleString('fr-FR')} €`,
    ``,
    `② PRIX D'ACQUISITION MAJORÉ`,
    `   Prix d'achat .............................. ${prixAchat.toLocaleString('fr-FR')} €`,
    `   Frais d'acquisition ${options?.utiliseForfaitFrais ? '(forfait 7,5%)' : '(réels)'} ....... + ${fraisRetenus.toLocaleString('fr-FR')} €`,
    dureeDetention >= 5 
      ? `   Travaux ${options?.utiliseForfaitTravaux ? '(forfait 15%)' : '(réels)'} .................... + ${travauxRetenus.toLocaleString('fr-FR')} €`
      : `   Travaux (< 5 ans, non déductibles) ........ 0 €`,
    `   ─────────────────────────────────────────────────────────────`,
    `   Sous-total acquisition .................... ${prixAcquisitionMajore.toLocaleString('fr-FR')} €`,
    ``,
  ]
  
  // Section LF 2024 - Réintégration des amortissements
  if (lf2024Applicable && amortissementsCumules > 0) {
    explication.push(
      `③ RÉINTÉGRATION DES AMORTISSEMENTS (LF 2024)`,
      `   ⚠️ NOUVEAUTÉ : Depuis le 01/02/2025, les amortissements`,
      `   pratiqués majorent la plus-value imposable.`,
      ``,
      `   Amortissements cumulés ................... - ${amortissementsCumules.toLocaleString('fr-FR')} €`,
      `   ─────────────────────────────────────────────────────────────`,
      `   Prix d'acquisition corrigé .............. ${prixAcquisitionCorrige.toLocaleString('fr-FR')} €`,
      ``,
    )
  }
  
  explication.push(
    `④ PLUS-VALUE BRUTE`,
    `   ${prixCessionNet.toLocaleString('fr-FR')} € - ${prixAcquisitionCorrige.toLocaleString('fr-FR')} € = ${plusValueBrute.toLocaleString('fr-FR')} €`,
    ``,
    `⑤ ABATTEMENTS POUR DURÉE DE DÉTENTION (${dureeDetention} ans)`,
    `   • Abattement IR : ${abattementIR.toFixed(1)}% ${abattementIR >= 100 ? '→ EXONÉRATION TOTALE' : ''}`,
    `   • Abattement PS : ${abattementPS.toFixed(1)}% ${abattementPS >= 100 ? '→ EXONÉRATION TOTALE' : ''}`,
    ``,
    `   Plus-value imposable IR : ${plusValueImposableIR.toLocaleString('fr-FR')} €`,
    `   Plus-value imposable PS : ${plusValueImposablePS.toLocaleString('fr-FR')} €`,
    ``,
    `⑥ CALCUL DE L'IMPÔT`,
    `   Impôt IR (19%) ............................ ${Math.round(impotIR).toLocaleString('fr-FR')} €`,
    `   Prélèvements sociaux (17,2%) .............. ${Math.round(impotPS).toLocaleString('fr-FR')} €`,
  )
  
  if (surtaxe > 0) {
    explication.push(
      `   Surtaxe PV > 50 000 € ..................... ${Math.round(surtaxe).toLocaleString('fr-FR')} €`,
    )
  }
  
  explication.push(
    `   ─────────────────────────────────────────────────────────────`,
    `   TOTAL IMPÔT ................................ ${Math.round(impotTotal).toLocaleString('fr-FR')} €`,
    ``,
    `⑦ RÉSULTAT NET`,
    `   Plus-value nette après impôt .............. ${Math.round(plusValueNette).toLocaleString('fr-FR')} €`,
    `   Produit net de cession .................... ${Math.round(produitNetCession).toLocaleString('fr-FR')} €`,
  )
  
  // Alertes
  const alertes: string[] = []
  if (lf2024Applicable && amortissementsCumules > 0) {
    alertes.push(
      `⚠️ LF 2024 : Les ${amortissementsCumules.toLocaleString('fr-FR')} € d'amortissements pratiqués ont été réintégrés, majorant la plus-value de ce montant.`
    )
  }
  if (abattementIR < 100 && dureeDetention >= 15) {
    const anneesRestantes = 22 - dureeDetention
    alertes.push(
      `💡 En conservant ${anneesRestantes} ans de plus, vous seriez exonéré d'IR sur la plus-value.`
    )
  }
  if (abattementPS < 100 && dureeDetention >= 22) {
    const anneesRestantes = 30 - dureeDetention
    alertes.push(
      `💡 En conservant ${anneesRestantes} ans de plus, vous seriez exonéré de prélèvements sociaux.`
    )
  }
  if (surtaxe > 0) {
    alertes.push(
      `⚠️ Surtaxe applicable car plus-value imposable > 50 000 € (CGI art. 1609 nonies G).`
    )
  }
  
  // Références légales
  const articlesCGI = [
    'CGI art. 150 VB (prix d\'acquisition)',
    'CGI art. 150 VC (abattements durée détention)',
    'CGI art. 200 B (taux imposition 19%)',
    'CGI art. 1609 nonies G (surtaxe)',
    'LF 2024 art. 30 (réintégration amortissements)',
  ]
  
  return {
    prixCession: prixVente,
    fraisCession: fraisVente,
    prixCessionNet,
    prixAcquisition: prixAchat,
    fraisAcquisitionRetenus: Math.round(fraisRetenus),
    travauxRetenus: Math.round(travauxRetenus),
    prixAcquisitionMajore: Math.round(prixAcquisitionMajore),
    amortissementsReintegres: Math.round(amortissementsReintegres),
    prixAcquisitionCorrige: Math.round(prixAcquisitionCorrige),
    plusValueBrute: Math.round(plusValueBrute),
    abattementIR,
    abattementPS,
    plusValueImposableIR: Math.round(plusValueImposableIR),
    plusValueImposablePS: Math.round(plusValueImposablePS),
    impotIR: Math.round(impotIR),
    impotPS: Math.round(impotPS),
    surtaxe: Math.round(surtaxe),
    impotTotal: Math.round(impotTotal),
    plusValueNette: Math.round(plusValueNette),
    produitNetCession: Math.round(produitNetCession),
    explication,
    alertes,
    articlesCGI,
  }
}

/**
 * Calcul du seuil LMP avec vérification des conditions
 */
export function verifierStatutLMP(
  recettesLocatives: number,
  autresRevenusActivite: number // Salaires, BIC, BNC, BA du foyer fiscal
): {
  estLMP: boolean
  condition1Remplie: boolean // > 23 000 €
  condition2Remplie: boolean // > autres revenus
  explication: string[]
  alertes: string[]
} {
  const condition1 = recettesLocatives > LMP.CONDITIONS.SEUIL_RECETTES
  const condition2 = recettesLocatives > autresRevenusActivite
  const estLMP = condition1 && condition2
  
  const explication = [
    `═══════════════════════════════════════════════════════════════`,
    `📊 VÉRIFICATION DU STATUT LMP (CGI art. 155-IV)`,
    `═══════════════════════════════════════════════════════════════`,
    ``,
    `Les 2 conditions suivantes doivent être CUMULATIVEMENT remplies :`,
    ``,
    `① Recettes locatives meublées > 23 000 €/an`,
    `   Vos recettes : ${recettesLocatives.toLocaleString('fr-FR')} €`,
    `   → ${condition1 ? '✅ Condition remplie' : '❌ Condition NON remplie'}`,
    ``,
    `② Recettes > autres revenus d'activité du foyer fiscal`,
    `   Vos recettes : ${recettesLocatives.toLocaleString('fr-FR')} €`,
    `   Autres revenus : ${autresRevenusActivite.toLocaleString('fr-FR')} €`,
    `   → ${condition2 ? '✅ Condition remplie' : '❌ Condition NON remplie'}`,
    ``,
    `═══════════════════════════════════════════════════════════════`,
    estLMP 
      ? `🔴 STATUT : LOUEUR MEUBLÉ PROFESSIONNEL (LMP)`
      : `🟢 STATUT : LOUEUR MEUBLÉ NON PROFESSIONNEL (LMNP)`,
    `═══════════════════════════════════════════════════════════════`,
  ]
  
  const alertes: string[] = []
  if (estLMP) {
    alertes.push(
      `⚠️ En LMP, vous êtes affilié à la SSI (cotisations sociales ~45% du bénéfice).`,
      `⚠️ Le déficit BIC est imputable sur le revenu global (avantage).`,
      `⚠️ La plus-value est professionnelle avec réintégration des amortissements.`,
      `💡 Exonération possible si activité > 5 ans et CA < 90 000 €.`
    )
  } else if (condition1 && !condition2) {
    alertes.push(
      `⚠️ Proche du seuil LMP ! Surveillez vos recettes.`,
      `💡 Pour éviter le LMP : augmentez vos autres revenus d'activité.`
    )
  }
  
  return {
    estLMP,
    condition1Remplie: condition1,
    condition2Remplie: condition2,
    explication,
    alertes,
  }
}

/**
 * Calcul de la CSG déductible N+1 (revenus fonciers au réel)
 */
export function calculCSGDeductible(revenusFonciersImposables: number): {
  csgPayee: number
  csgDeductibleN1: number
  explication: string[]
} {
  const csgPayee = revenusFonciersImposables * PRELEVEMENTS_SOCIAUX.CSG / 100
  const csgDeductibleN1 = revenusFonciersImposables * PRELEVEMENTS_SOCIAUX.CSG_DEDUCTIBLE / 100
  
  return {
    csgPayee: Math.round(csgPayee),
    csgDeductibleN1: Math.round(csgDeductibleN1),
    explication: [
      `📊 CSG sur revenus fonciers : ${Math.round(csgPayee).toLocaleString('fr-FR')} €`,
      `💡 CSG déductible l'année suivante : ${Math.round(csgDeductibleN1).toLocaleString('fr-FR')} €`,
      `   (${PRELEVEMENTS_SOCIAUX.CSG_DEDUCTIBLE}% sur ${revenusFonciersImposables.toLocaleString('fr-FR')} €)`,
      ``,
      `⚠️ N'oubliez pas de déduire cette CSG sur votre déclaration N+1 !`,
    ],
  }
}

// ============================================================================
// BARÈME IR 2025 (CGI art. 197)
// ============================================================================
export const BAREME_IR_2025 = {
  TRANCHES: [
    { min: 0, max: 11497, taux: 0 },
    { min: 11497, max: 29315, taux: 11 },
    { min: 29315, max: 83823, taux: 30 },
    { min: 83823, max: 180294, taux: 41 },
    { min: 180294, max: Infinity, taux: 45 },
  ],
  PLAFOND_QF: 1759, // Avantage max par demi-part
  DECOTE: {
    CELIBATAIRE: { seuil: 1929, max: 873 },
    COUPLE: { seuil: 3191, max: 1444 },
  },
}

/**
 * Calcul du nombre de parts fiscales
 */
export function calculNombreParts(params: {
  situationFamiliale: 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'
  enfantsACharge: number
  enfantsGardeAlternee?: number
  parentIsole?: boolean
}): number {
  let parts = params.situationFamiliale === 'MARIE_PACSE' ? 2 : 1
  
  // Enfants à charge
  if (params.enfantsACharge === 1) parts += 0.5
  else if (params.enfantsACharge === 2) parts += 1
  else if (params.enfantsACharge >= 3) parts += 1 + (params.enfantsACharge - 2)
  
  // Garde alternée (demi-part)
  if (params.enfantsGardeAlternee) {
    parts += params.enfantsGardeAlternee * 0.25
  }
  
  // Parent isolé
  if (params.parentIsole && params.enfantsACharge >= 1) parts += 0.5
  
  // Veuf avec enfants
  if (params.situationFamiliale === 'VEUF' && params.enfantsACharge >= 1) parts += 0.5
  
  return parts
}

/**
 * Calcul IR détaillé
 */
export function calculIRDetaille(revenuImposable: number, nombreParts: number): {
  quotientFamilial: number
  tmi: number
  impotBrut: number
  impotNet: number
  tauxMoyen: number
  detailTranches: { tranche: string; taux: number; montant: number }[]
  explication: string[]
} {
  const qf = revenuImposable / nombreParts
  let impotParPart = 0
  const detailTranches: { tranche: string; taux: number; montant: number }[] = []
  let tmi = 0
  
  for (const tranche of BAREME_IR_2025.TRANCHES) {
    if (qf > tranche.min) {
      const montantTranche = Math.min(qf, tranche.max) - tranche.min
      const impotTranche = montantTranche * tranche.taux / 100
      impotParPart += impotTranche
      if (montantTranche > 0) {
        detailTranches.push({
          tranche: `${tranche.min.toLocaleString('fr-FR')} - ${tranche.max === Infinity ? '∞' : tranche.max.toLocaleString('fr-FR')} €`,
          taux: tranche.taux,
          montant: Math.round(impotTranche * nombreParts)
        })
        if (tranche.taux > tmi) tmi = tranche.taux
      }
    }
  }
  
  const impotBrut = Math.round(impotParPart * nombreParts)
  const tauxMoyen = revenuImposable > 0 ? (impotBrut / revenuImposable) * 100 : 0
  
  const explication = [
    `═══════════════════════════════════════════════════════════════`,
    `📊 CALCUL IMPÔT SUR LE REVENU (CGI art. 197)`,
    `═══════════════════════════════════════════════════════════════`,
    ``,
    `① QUOTIENT FAMILIAL`,
    `   Revenu imposable : ${revenuImposable.toLocaleString('fr-FR')} €`,
    `   Nombre de parts : ${nombreParts}`,
    `   QF = ${revenuImposable.toLocaleString('fr-FR')} ÷ ${nombreParts} = ${Math.round(qf).toLocaleString('fr-FR')} €`,
    ``,
    `② APPLICATION DU BARÈME`,
    ...detailTranches.map(t => `   • ${t.tranche} à ${t.taux}% = ${t.montant.toLocaleString('fr-FR')} €`),
    ``,
    `③ RÉSULTAT`,
    `   TMI : ${tmi}%`,
    `   Impôt brut : ${impotBrut.toLocaleString('fr-FR')} €`,
    `   Taux moyen : ${tauxMoyen.toFixed(2)}%`,
  ]
  
  return { quotientFamilial: qf, tmi, impotBrut, impotNet: impotBrut, tauxMoyen, detailTranches, explication }
}

// ============================================================================
// IFI - IMPÔT SUR LA FORTUNE IMMOBILIÈRE (CGI art. 977)
// ============================================================================
export const BAREME_IFI = {
  SEUIL_IMPOSITION: 1300000,
  ABATTEMENT_RP: 30, // 30% sur résidence principale
  TRANCHES: [
    { min: 0, max: 800000, taux: 0 },
    { min: 800000, max: 1300000, taux: 0.5 },
    { min: 1300000, max: 2570000, taux: 0.7 },
    { min: 2570000, max: 5000000, taux: 1 },
    { min: 5000000, max: 10000000, taux: 1.25 },
    { min: 10000000, max: Infinity, taux: 1.5 },
  ],
  DECOTE: {
    SEUIL_MIN: 1300000,
    SEUIL_MAX: 1400000,
    FORMULE: '17500 - 1.25% × patrimoine'
  }
}

/**
 * Calcul IFI détaillé
 */
export function calculIFI(params: {
  patrimoineImmobilierBrut: number
  dettesDeductibles: number
  valeurRP?: number
}): {
  assujetti: boolean
  patrimoineNet: number
  patrimoineImposable: number
  impotBrut: number
  decote: number
  impotNet: number
  tauxEffectif: number
  explication: string[]
} {
  const abattementRP = params.valeurRP ? params.valeurRP * BAREME_IFI.ABATTEMENT_RP / 100 : 0
  const patrimoineNet = params.patrimoineImmobilierBrut - params.dettesDeductibles - abattementRP
  
  const assujetti = patrimoineNet >= BAREME_IFI.SEUIL_IMPOSITION
  
  if (!assujetti) {
    return {
      assujetti: false,
      patrimoineNet,
      patrimoineImposable: 0,
      impotBrut: 0,
      decote: 0,
      impotNet: 0,
      tauxEffectif: 0,
      explication: [
        `✅ Patrimoine net (${patrimoineNet.toLocaleString('fr-FR')} €) < seuil IFI (${BAREME_IFI.SEUIL_IMPOSITION.toLocaleString('fr-FR')} €)`,
        `→ Non assujetti à l'IFI`
      ]
    }
  }
  
  let impotBrut = 0
  for (const tranche of BAREME_IFI.TRANCHES) {
    if (patrimoineNet > tranche.min) {
      const montantTranche = Math.min(patrimoineNet, tranche.max) - tranche.min
      impotBrut += montantTranche * tranche.taux / 100
    }
  }
  
  // Décote entre 1,3 M€ et 1,4 M€
  let decote = 0
  if (patrimoineNet >= 1300000 && patrimoineNet <= 1400000) {
    decote = 17500 - patrimoineNet * 0.0125
    decote = Math.max(0, decote)
  }
  
  const impotNet = Math.max(0, Math.round(impotBrut - decote))
  const tauxEffectif = patrimoineNet > 0 ? (impotNet / patrimoineNet) * 100 : 0
  
  const explication = [
    `═══════════════════════════════════════════════════════════════`,
    `📊 CALCUL IFI (CGI art. 977)`,
    `═══════════════════════════════════════════════════════════════`,
    ``,
    `① PATRIMOINE TAXABLE`,
    `   Patrimoine brut : ${params.patrimoineImmobilierBrut.toLocaleString('fr-FR')} €`,
    `   Dettes déductibles : - ${params.dettesDeductibles.toLocaleString('fr-FR')} €`,
    params.valeurRP ? `   Abattement RP (30%) : - ${abattementRP.toLocaleString('fr-FR')} €` : '',
    `   ─────────────────────────────────────────`,
    `   Patrimoine net taxable : ${patrimoineNet.toLocaleString('fr-FR')} €`,
    ``,
    `② CALCUL`,
    `   Impôt brut : ${Math.round(impotBrut).toLocaleString('fr-FR')} €`,
    decote > 0 ? `   Décote : - ${Math.round(decote).toLocaleString('fr-FR')} €` : '',
    `   ─────────────────────────────────────────`,
    `   IFI à payer : ${impotNet.toLocaleString('fr-FR')} €`,
    `   Taux effectif : ${tauxEffectif.toFixed(2)}%`,
  ].filter(Boolean)
  
  return { assujetti, patrimoineNet, patrimoineImposable: patrimoineNet, impotBrut: Math.round(impotBrut), decote: Math.round(decote), impotNet, tauxEffectif, explication }
}

// ============================================================================
// PLAFOND NICHES FISCALES
// ============================================================================
export const PLAFOND_NICHES = {
  PLAFOND_GLOBAL: 10000,
  PLAFOND_OUTREMER: 18000,
  DISPOSITIFS_CONCERNES: [
    'Pinel', 'Denormandie', 'Malraux', 'FCPI', 'FIP', 'SOFICA',
    'Emploi à domicile', 'Garde enfants', 'Investissement PME'
  ],
  HORS_PLAFOND: [
    'Monuments Historiques',
    'Dons aux associations',
    'PERP / PER (déduction RG)',
  ]
}

/**
 * Vérification plafond niches fiscales
 */
export function verifierPlafondNiches(reductionsUtilisees: {
  pinel?: number
  denormandie?: number
  malraux?: number
  emploiDomicile?: number
  autresReductions?: number
}): {
  totalUtilise: number
  plafondRestant: number
  depassement: number
  alertes: string[]
} {
  const total = (reductionsUtilisees.pinel || 0) +
                (reductionsUtilisees.denormandie || 0) +
                (reductionsUtilisees.malraux || 0) +
                (reductionsUtilisees.emploiDomicile || 0) +
                (reductionsUtilisees.autresReductions || 0)
  
  const plafondRestant = Math.max(0, PLAFOND_NICHES.PLAFOND_GLOBAL - total)
  const depassement = Math.max(0, total - PLAFOND_NICHES.PLAFOND_GLOBAL)
  
  const alertes: string[] = []
  if (depassement > 0) {
    alertes.push(`🚨 Dépassement plafond niches fiscales de ${depassement.toLocaleString('fr-FR')} € ! La réduction excédentaire est perdue.`)
  } else if (plafondRestant < 2000) {
    alertes.push(`⚠️ Plafond niches fiscales presque atteint (${plafondRestant.toLocaleString('fr-FR')} € restants).`)
  }
  
  return { totalUtilise: total, plafondRestant, depassement, alertes }
}

// ============================================================================
// SCPI - PARAMÈTRES COMPLÉMENTAIRES
// ============================================================================
export const SCPI_PARAMS = {
  // Délai de jouissance moyen
  DELAI_JOUISSANCE: {
    MOYEN: 5, // mois
    MIN: 3,
    MAX: 6,
  },
  // Frais moyens
  FRAIS: {
    SOUSCRIPTION_MOYEN: 10, // %
    GESTION_ANNUEL: 10, // % des loyers
  },
  // Crédit d'impôt revenus étrangers (méthode du taux effectif)
  CREDIT_IMPOT_ETRANGER: {
    METHODE: 'TAUX_EFFECTIF',
    EXPLICATION: 'Les revenus de source étrangère bénéficient d\'un crédit d\'impôt égal à l\'impôt français correspondant.'
  }
}

/**
 * Calcul fiscalité SCPI avec revenus étrangers
 */
export function calculFiscaliteSCPI(params: {
  revenusPercus: number
  partFrance: number // %
  partEtranger: number // %
  tmi: number
  interetsEmprunt?: number
}): {
  revenusFrance: number
  revenusEtranger: number
  baseImposableFrance: number
  irFrance: number
  psFrance: number
  creditImpotEtranger: number
  impotNet: number
  explication: string[]
} {
  const revenusFrance = params.revenusPercus * params.partFrance / 100
  const revenusEtranger = params.revenusPercus * params.partEtranger / 100
  
  const interets = params.interetsEmprunt || 0
  const baseImposableFrance = Math.max(0, revenusFrance - interets)
  
  // IR et PS sur revenus français
  const irFrance = baseImposableFrance * params.tmi / 100
  const psFrance = baseImposableFrance * PRELEVEMENTS_SOCIAUX.TAUX_GLOBAL / 100
  
  // Crédit d'impôt sur revenus étrangers (méthode taux effectif)
  // Les revenus étrangers sont imposés au taux français puis font l'objet d'un crédit d'impôt
  const irTheorique = (revenusFrance + revenusEtranger) * params.tmi / 100
  const tauxEffectif = (revenusFrance + revenusEtranger) > 0 
    ? irTheorique / (revenusFrance + revenusEtranger) 
    : 0
  const creditImpotEtranger = revenusEtranger * tauxEffectif
  
  const impotNet = Math.round(irFrance + psFrance - creditImpotEtranger)
  
  const explication = [
    `═══════════════════════════════════════════════════════════════`,
    `📊 FISCALITÉ SCPI - REVENUS MIXTES`,
    `═══════════════════════════════════════════════════════════════`,
    ``,
    `① RÉPARTITION DES REVENUS`,
    `   Revenus totaux : ${params.revenusPercus.toLocaleString('fr-FR')} €`,
    `   Part France (${params.partFrance}%) : ${revenusFrance.toLocaleString('fr-FR')} €`,
    `   Part Étranger (${params.partEtranger}%) : ${revenusEtranger.toLocaleString('fr-FR')} €`,
    ``,
    `② FISCALITÉ REVENUS FRANÇAIS`,
    interets > 0 ? `   Intérêts déduits : - ${interets.toLocaleString('fr-FR')} €` : '',
    `   Base imposable : ${baseImposableFrance.toLocaleString('fr-FR')} €`,
    `   IR (TMI ${params.tmi}%) : ${Math.round(irFrance).toLocaleString('fr-FR')} €`,
    `   PS (17,2%) : ${Math.round(psFrance).toLocaleString('fr-FR')} €`,
    ``,
    `③ CRÉDIT D'IMPÔT REVENUS ÉTRANGERS`,
    `   Méthode : Taux effectif`,
    `   Crédit d'impôt : - ${Math.round(creditImpotEtranger).toLocaleString('fr-FR')} €`,
    ``,
    `④ IMPÔT NET`,
    `   Total à payer : ${impotNet.toLocaleString('fr-FR')} €`,
  ].filter(Boolean)
  
  return { revenusFrance, revenusEtranger, baseImposableFrance, irFrance: Math.round(irFrance), psFrance: Math.round(psFrance), creditImpotEtranger: Math.round(creditImpotEtranger), impotNet, explication }
}

// ============================================================================
// AMORTISSEMENT PAR COMPOSANTS (LMNP)
// ============================================================================
export interface ComposantAmortissement {
  libelle: string
  valeur: number
  duree: number
  amortissementAnnuel: number
}

/**
 * Calcul amortissement par composants détaillé
 */
export function calculAmortissementComposants(params: {
  prixAchat: number
  partTerrain: number // %
  travaux?: number
  mobilier?: number
}): {
  composants: ComposantAmortissement[]
  totalAmortissableParAn: number
  valeurNonAmortissable: number
  tableauAmortissement: { annee: number; amortissement: number; cumul: number; resteAAmortir: number }[]
  explication: string[]
} {
  const terrain = params.prixAchat * params.partTerrain / 100
  const batiment = params.prixAchat - terrain
  
  // Décomposition du bâtiment par composants
  const composants: ComposantAmortissement[] = [
    { libelle: 'Terrain (non amortissable)', valeur: terrain, duree: 0, amortissementAnnuel: 0 },
    { libelle: 'Gros œuvre', valeur: batiment * 0.50, duree: 50, amortissementAnnuel: Math.round(batiment * 0.50 / 50) },
    { libelle: 'Façade', valeur: batiment * 0.10, duree: 30, amortissementAnnuel: Math.round(batiment * 0.10 / 30) },
    { libelle: 'Toiture', valeur: batiment * 0.08, duree: 25, amortissementAnnuel: Math.round(batiment * 0.08 / 25) },
    { libelle: 'Électricité', valeur: batiment * 0.08, duree: 25, amortissementAnnuel: Math.round(batiment * 0.08 / 25) },
    { libelle: 'Plomberie', valeur: batiment * 0.07, duree: 25, amortissementAnnuel: Math.round(batiment * 0.07 / 25) },
    { libelle: 'Chauffage', valeur: batiment * 0.07, duree: 20, amortissementAnnuel: Math.round(batiment * 0.07 / 20) },
    { libelle: 'Agencements', valeur: batiment * 0.10, duree: 15, amortissementAnnuel: Math.round(batiment * 0.10 / 15) },
  ]
  
  if (params.travaux && params.travaux > 0) {
    composants.push({ libelle: 'Travaux', valeur: params.travaux, duree: 15, amortissementAnnuel: Math.round(params.travaux / 15) })
  }
  
  if (params.mobilier && params.mobilier > 0) {
    composants.push({ libelle: 'Mobilier', valeur: params.mobilier, duree: 7, amortissementAnnuel: Math.round(params.mobilier / 7) })
  }
  
  const totalAmortissableParAn = composants.reduce((sum, c) => sum + c.amortissementAnnuel, 0)
  const valeurNonAmortissable = terrain
  
  // Tableau d'amortissement sur 30 ans
  const tableauAmortissement: { annee: number; amortissement: number; cumul: number; resteAAmortir: number }[] = []
  let cumul = 0
  const totalAmortissable = params.prixAchat - terrain + (params.travaux || 0) + (params.mobilier || 0)
  
  for (let an = 1; an <= 30; an++) {
    let amortAnnee = 0
    for (const comp of composants) {
      if (comp.duree > 0 && an <= comp.duree) {
        amortAnnee += comp.amortissementAnnuel
      }
    }
    cumul += amortAnnee
    tableauAmortissement.push({
      annee: an,
      amortissement: amortAnnee,
      cumul,
      resteAAmortir: Math.max(0, totalAmortissable - cumul)
    })
  }
  
  const explication = [
    `═══════════════════════════════════════════════════════════════`,
    `📊 AMORTISSEMENT PAR COMPOSANTS (LMNP)`,
    `═══════════════════════════════════════════════════════════════`,
    ``,
    `① VENTILATION DU BIEN`,
    ...composants.map(c => 
      c.duree > 0 
        ? `   • ${c.libelle} : ${c.valeur.toLocaleString('fr-FR')} € sur ${c.duree} ans = ${c.amortissementAnnuel.toLocaleString('fr-FR')} €/an`
        : `   • ${c.libelle} : ${c.valeur.toLocaleString('fr-FR')} € (non amortissable)`
    ),
    ``,
    `② RÉCAPITULATIF`,
    `   Amortissement annuel total : ${totalAmortissableParAn.toLocaleString('fr-FR')} €`,
    `   Valeur non amortissable : ${valeurNonAmortissable.toLocaleString('fr-FR')} €`,
    ``,
    `⚠️ L'amortissement ne peut pas créer de déficit (CGI art. 39 C).`,
    `   L'excédent est reporté sans limite de durée.`,
  ]
  
  return { composants, totalAmortissableParAn, valeurNonAmortissable, tableauAmortissement, explication }
}

// ============================================================================
// PÉDAGOGIE - TOOLTIPS ET EXPLICATIONS
// ============================================================================
export const PEDAGOGIE = {
  LMNP: {
    PART_TERRAIN: {
      titre: 'Part terrain non amortissable',
      explication: `Le terrain ne se déprécie pas, il n'est pas amortissable. La part terrain varie généralement entre 10% (appartement centre-ville) et 30% (maison avec jardin).`,
      source: 'BOFiP BOI-BIC-AMT-10-40-10'
    },
    AMORTISSEMENT_DIFFERE: {
      titre: 'Amortissement différé',
      explication: `L'amortissement ne peut pas créer de déficit BIC. Si l'amortissement dépasse le résultat, l'excédent est "différé" et reportable sans limite de durée.`,
      source: 'CGI art. 39 C'
    },
    SEUIL_LMP: {
      titre: 'Seuil LMP',
      explication: `Vous passez en LMP si vos recettes locatives meublées dépassent 23 000 €/an ET sont supérieures à vos autres revenus d'activité. Conséquence : cotisations SSI (~45% du bénéfice).`,
      source: 'CGI art. 155-IV'
    },
    PV_REINTEGRATION: {
      titre: 'Réintégration amortissements (LF 2024)',
      explication: `Depuis le 01/02/2025, les amortissements pratiqués en LMNP sont réintégrés dans le calcul de la plus-value à la revente. Cela augmente significativement l'impôt de plus-value.`,
      source: 'LF 2024 art. 30, CGI art. 150 VB'
    }
  },
  LOCATION_NUE: {
    MICRO_FONCIER: {
      titre: 'Micro-foncier',
      explication: `Régime simplifié avec abattement forfaitaire de 30%. Réservé aux revenus fonciers < 15 000 €/an. Pas de déduction des charges réelles.`,
      source: 'CGI art. 32'
    },
    DEFICIT_FONCIER: {
      titre: 'Déficit foncier',
      explication: `Le déficit (hors intérêts) peut s'imputer sur le revenu global jusqu'à 10 700 €/an (21 400 € si travaux énergétiques). Obligation de louer 3 ans après imputation.`,
      source: 'CGI art. 156-I-3°'
    },
    CSG_DEDUCTIBLE: {
      titre: 'CSG déductible',
      explication: `6,8% de la CSG payée sur revenus fonciers est déductible du revenu imposable l'année suivante.`,
      source: 'CGI art. 154 quinquies'
    }
  },
  PINEL: {
    FIN_DISPOSITIF: {
      titre: 'Fin du dispositif',
      explication: `Le dispositif Pinel s'est terminé le 31/12/2024. Les investissements réalisés avant cette date continuent de bénéficier de la réduction pendant la durée d'engagement.`,
      source: 'CGI art. 199 novovicies'
    },
    PLAFONDS: {
      titre: 'Plafonds Pinel',
      explication: `Investissement max 300 000 € ET 5 500 €/m². Loyer plafonné selon zone (A bis, A, B1). Ressources locataires plafonnées.`,
      source: 'CGI art. 199 novovicies'
    }
  },
  SCPI: {
    DELAI_JOUISSANCE: {
      titre: 'Délai de jouissance',
      explication: `Période entre l'achat des parts et la perception des premiers revenus (3 à 6 mois généralement). Aucun revenu pendant cette période.`,
      source: 'Documentation SCPI'
    },
    NUE_PROPRIETE: {
      titre: 'SCPI en nue-propriété',
      explication: `Achat avec décote (30-40%), pas de revenus pendant le démembrement, puis récupération de la pleine propriété sans fiscalité. Hors IFI.`,
      source: 'CGI art. 669'
    }
  }
}

// Export des types
export type RegimeFiscalNue = 'MICRO_FONCIER' | 'REEL'
export type RegimeFiscalLMNP = 'MICRO_BIC' | 'REEL'
export type TypeMeuble = 'CLASSIQUE' | 'TOURISME_CLASSE' | 'TOURISME_NON_CLASSE'
export type ClasseDPE = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
