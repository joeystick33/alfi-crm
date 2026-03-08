/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PARAMÈTRES FISCAUX PLUS-VALUES — Calculateur Plus-Values
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Source unique de vérité : RULES (fiscal-rules.ts)
 * Période d'application : déterminée par RULES.meta (année fiscale, version)
 * Mise à jour : via l'interface admin /superadmin/fiscal-rules ou fiscal-rules.ts
 * 
 * Sources :
 * - CGI art. 150-0 A à 150-0 E (plus-values mobilières)
 * - CGI art. 150 U à 150 VH (plus-values immobilières)
 * - CGI art. 150 VI à 150 VM (métaux précieux, bijoux, objets d'art)
 * - CGI art. 150 VH bis (cryptoactifs)
 * 
 * Mise à jour : Décembre 2024 pour revenus 2024
 * Valeurs fiscales centralisées : RULES (fiscal-rules.ts)
 */

import { RULES } from '@/app/_common/lib/rules/fiscal-rules'

// ══════════════════════════════════════════════════════════════════════════════
// PÉRIODE D'APPLICATION — Lecture dynamique depuis RULES.meta
// ══════════════════════════════════════════════════════════════════════════════
export const PERIODE = {
  annee_fiscale: RULES.meta.annee_fiscale,
  annee_revenus: RULES.meta.annee_revenus,
  version: RULES.meta.version,
  date_maj: RULES.meta.date_mise_a_jour,
}

// ══════════════════════════════════════════════════════════════════════════════
// PRÉLÈVEMENTS SOCIAUX - Source : RULES.ps
// ══════════════════════════════════════════════════════════════════════════════
export const PRELEVEMENTS_SOCIAUX = {
  TAUX_GLOBAL: RULES.ps.total * 100,
  DETAIL: {
    CSG: RULES.ps.csg * 100,
    CRDS: RULES.ps.crds * 100,
    PRELEVEMENT_SOLIDARITE: RULES.ps.solidarite * 100,
  },
  CSG_DEDUCTIBLE: RULES.ps.csg_deductible * 100,  // Déductible si option barème
}

// ══════════════════════════════════════════════════════════════════════════════
// PFU (Prélèvement Forfaitaire Unique) - CGI art. 200 A — Source : RULES.ps
// ══════════════════════════════════════════════════════════════════════════════
export const PFU_2025 = {
  TAUX_GLOBAL: RULES.ps.pfu_total * 100,
  TAUX_IR: RULES.ps.pfu_ir * 100,
  TAUX_PS: RULES.ps.total * 100,
  
  INFO: 'Le PFU s\'applique par défaut depuis le 1er janvier 2018',
  OPTION_BAREME: 'Option pour le barème progressif possible (globale pour tous les revenus du capital)',
}

// ══════════════════════════════════════════════════════════════════════════════
// PLUS-VALUES MOBILIÈRES - CGI art. 150-0 A à 150-0 E
// ══════════════════════════════════════════════════════════════════════════════
export const PV_MOBILIERES_2025 = {
  // ─────────────────────────────────────────────────────────────────────────────
  // RÉGIME PFU (défaut depuis 2018) — Source : RULES.ps
  // ─────────────────────────────────────────────────────────────────────────────
  PFU: {
    TAUX_IR: RULES.ps.pfu_ir * 100,
    TAUX_PS: RULES.ps.total * 100,
    TAUX_GLOBAL: RULES.ps.pfu_total * 100,
    ABATTEMENT: 0,  // Pas d'abattement en PFU
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTION BARÈME PROGRESSIF (avec abattements pour titres acquis avant 2018)
  // CGI art. 150-0 D
  // ─────────────────────────────────────────────────────────────────────────────
  BAREME: {
    // Abattement de droit commun (titres acquis avant 01/01/2018)
    ABATTEMENT_DROIT_COMMUN: [
      { dureeMin: 0, dureeMax: 2, taux: 0 },
      { dureeMin: 2, dureeMax: 8, taux: 50 },
      { dureeMin: 8, dureeMax: Infinity, taux: 65 },
    ],
    
    // Abattement renforcé PME (CGI art. 150-0 D, 1 quater)
    // Pour PME de moins de 10 ans à la souscription
    ABATTEMENT_PME: [
      { dureeMin: 0, dureeMax: 1, taux: 0 },
      { dureeMin: 1, dureeMax: 4, taux: 50 },
      { dureeMin: 4, dureeMax: 8, taux: 65 },
      { dureeMin: 8, dureeMax: Infinity, taux: 85 },
    ],
    
    // Abattement dirigeant retraite (CGI art. 150-0 D ter)
    // 500 000 € d'abattement fixe pour cession lors départ retraite
    ABATTEMENT_DIRIGEANT_RETRAITE: 500000,
    
    // PS toujours calculés sur PV brute (pas d'abattement)
    PS_SUR_BRUT: true,
    
    CONDITIONS_TITRES_AVANT_2018: 'Titres acquis avant le 1er janvier 2018',
    INFO: 'L\'abattement s\'applique uniquement à l\'IR, pas aux PS',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SEUIL DE CESSION (exonération si < 15 000 € de cessions/an) - Abrogé
  // ─────────────────────────────────────────────────────────────────────────────
  SEUIL_CESSION: {
    ACTIF: false,
    MONTANT: 0,  // Plus de seuil depuis 2014
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // REPORT/SURSIS D'IMPOSITION
  // ─────────────────────────────────────────────────────────────────────────────
  REPORT_SURSIS: {
    APPORT_CESSION: 'Report d\'imposition automatique (150-0 B ter)',
    ECHANGE_TITRES: 'Sursis d\'imposition (150-0 B)',
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// PLUS-VALUES IMMOBILIÈRES - CGI art. 150 U à 150 VH
// ══════════════════════════════════════════════════════════════════════════════
export const PV_IMMOBILIERES_2025 = {
  // Taux d'imposition — Source : RULES.immobilier.plus_value
  TAUX_IR: RULES.immobilier.plus_value.taux_ir * 100,
  TAUX_PS: RULES.immobilier.plus_value.taux_ps * 100,
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ABATTEMENT POUR DURÉE DE DÉTENTION - IR (CGI art. 150 VC)
  // ─────────────────────────────────────────────────────────────────────────────
  ABATTEMENT_IR: {
    ANNEES_0_5: 0,           // 0% pour années 1 à 5
    ANNEES_6_21: 6,          // 6% par an pour années 6 à 21 (16 ans × 6% = 96%)
    ANNEE_22: 4,             // 4% la 22ème année (4%)
    TOTAL: 100,              // Exonération totale
    DUREE_EXONERATION: 22,   // Exonération IR après 22 ans
    
    // Calcul détaillé
    calculer: (annees: number): number => {
      if (annees <= 5) return 0
      if (annees <= 21) return (annees - 5) * 6
      if (annees === 22) return 96 + 4
      return 100
    },
  },
  
  // ─────────────────────────────────────────────────────────────────────────────
  // ABATTEMENT POUR DURÉE DE DÉTENTION - PS (CGI art. 150 VC)
  // ─────────────────────────────────────────────────────────────────────────────
  ABATTEMENT_PS: {
    ANNEES_0_5: 0,           // 0% pour années 1 à 5
    ANNEES_6_21: 1.65,       // 1.65% par an pour années 6 à 21 (16 ans × 1.65% = 26.4%)
    ANNEE_22: 1.60,          // 1.60% la 22ème année (1.6%)
    ANNEES_23_30: 9,         // 9% par an pour années 23 à 30 (8 ans × 9% = 72%)
    TOTAL: 100,              // Exonération totale
    DUREE_EXONERATION: 30,   // Exonération PS après 30 ans
    
    // Calcul détaillé
    calculer: (annees: number): number => {
      if (annees <= 5) return 0
      if (annees <= 21) return (annees - 5) * 1.65
      if (annees === 22) return 26.4 + 1.6
      if (annees <= 30) return 28 + (annees - 22) * 9
      return 100
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // SURTAXE IMMOBILIÈRE - CGI art. 1609 nonies G
  // ─────────────────────────────────────────────────────────────────────────────
  SURTAXE: {
    SEUIL: 50000,            // S'applique si PV imposable > 50 000 €
    TRANCHES: [
      { min: 50001, max: 60000, taux: 2 },
      { min: 60001, max: 100000, taux: 2 },
      { min: 100001, max: 110000, taux: 3 },
      { min: 110001, max: 150000, taux: 3 },
      { min: 150001, max: 160000, taux: 4 },
      { min: 160001, max: 200000, taux: 4 },
      { min: 200001, max: 210000, taux: 5 },
      { min: 210001, max: 250000, taux: 5 },
      { min: 250001, max: 260000, taux: 6 },
      { min: 260001, max: Infinity, taux: 6 },
    ],
    
    // Lissage pour éviter effet de seuil
    calculer: (pvImposable: number): number => {
      if (pvImposable <= 50000) return 0
      
      // Lissage si PV entre 50001 et 60000 : surtaxe = (PV - 50000) × taux / 20
      // Formule générale : surtaxe = PV × taux% - décote
      let taux = 0
      if (pvImposable <= 100000) taux = 2
      else if (pvImposable <= 150000) taux = 3
      else if (pvImposable <= 200000) taux = 4
      else if (pvImposable <= 250000) taux = 5
      else taux = 6
      
      // Calcul avec lissage
      const surtaxeBrute = pvImposable * taux / 100
      
      // Décote progressive
      const decotes: { [key: number]: number } = {
        2: 60000 * 2 / 100,    // 1 200 €
        3: 110000 * 3 / 100,   // 3 300 €
        4: 160000 * 4 / 100,   // 6 400 €
        5: 210000 * 5 / 100,   // 10 500 €
        6: 260000 * 6 / 100,   // 15 600 €
      }
      
      const surtaxe = Math.max(0, surtaxeBrute - (decotes[taux] || 0))
      return Math.round(surtaxe)
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // EXONÉRATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  EXONERATIONS: {
    RESIDENCE_PRINCIPALE: true,  // Exonération totale
    PREMIERE_CESSION: {
      PLAFOND: 150000,           // Première cession d'un logement autre que RP
      CONDITIONS: [
        'Non propriétaire de RP dans les 4 ans précédents',
        'Remploi dans les 24 mois pour achat RP',
      ],
    },
    EXPROPRIATION: true,         // Exonération si remploi 90%+ dans les 12 mois
    CESSION_DROIT_SUREVELATION: 'Exonération temporaire jusqu\'au 31/12/2024',
    MOINS_15000: {
      ACTIF: true,
      SEUIL: 15000,              // Exonération si prix de cession ≤ 15 000 €
      INFO: 'Par cession, pas par an',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FRAIS ET CHARGES DÉDUCTIBLES
  // ─────────────────────────────────────────────────────────────────────────────
  FRAIS_DEDUCTIBLES: {
    FRAIS_ACQUISITION: {
      REEL: 'Frais réels justifiés (notaire, agence...)',
      FORFAIT: 7.5,  // 7.5% du prix d'acquisition
    },
    TRAVAUX: {
      REEL: 'Travaux de construction, reconstruction, agrandissement, amélioration',
      FORFAIT: 15,   // 15% du prix d'acquisition si détention > 5 ans
      CONDITION: 'Détention > 5 ans',
    },
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// MÉTAUX PRÉCIEUX, BIJOUX, OBJETS D'ART - CGI art. 150 VI à 150 VM
// ══════════════════════════════════════════════════════════════════════════════
export const PV_OBJETS_PRECIEUX_2025 = {
  // ─────────────────────────────────────────────────────────────────────────────
  // OR ET MÉTAUX PRÉCIEUX - CGI art. 150 VI
  // ─────────────────────────────────────────────────────────────────────────────
  OR_METAUX: {
    TAXE_FORFAITAIRE: {
      TAUX_TMP: 11,            // Taxe sur métaux précieux
      TAUX_CRDS: 0.5,          // CRDS additionnelle
      TAUX_TOTAL: 11.5,        // Total : 11.5%
      BASE: 'Prix de cession (pas la plus-value)',
    },
    REGIME_PV_REELLES: {
      TAUX_IR: RULES.immobilier.plus_value.taux_ir * 100,
      TAUX_PS: RULES.immobilier.plus_value.taux_ps * 100,
      TAUX_TOTAL: (RULES.immobilier.plus_value.taux_ir + RULES.immobilier.plus_value.taux_ps) * 100,
      ABATTEMENT_ANNUEL: 5,    // 5% par an au-delà de la 2ème année
      EXONERATION_APRES: 22,   // Exonération totale après 22 ans
      CONDITIONS: 'Justifier date et prix d\'acquisition',
    },
    SEUIL_TAXE: 5000,          // Taxe due si cession > 5 000 €
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // BIJOUX, OBJETS D'ART, DE COLLECTION - CGI art. 150 VJ
  // ─────────────────────────────────────────────────────────────────────────────
  BIJOUX_ART: {
    TAXE_FORFAITAIRE: {
      TAUX_TFOA: 6,            // Taxe forfaitaire objets d'art
      TAUX_CRDS: RULES.ps.crds * 100,
      TAUX_TOTAL: 6.5,
      BASE: 'Prix de cession',
    },
    REGIME_PV_REELLES: {
      TAUX_IR: RULES.immobilier.plus_value.taux_ir * 100,
      TAUX_PS: RULES.immobilier.plus_value.taux_ps * 100,
      TAUX_TOTAL: (RULES.immobilier.plus_value.taux_ir + RULES.immobilier.plus_value.taux_ps) * 100,
      ABATTEMENT_ANNUEL: 5,    // 5% par an au-delà de la 2ème année
      EXONERATION_APRES: 22,
    },
    SEUIL_TAXE: 5000,          // Taxe due si cession > 5 000 €
    
    OBJETS_CONCERNES: [
      'Bijoux',
      'Tableaux et peintures',
      'Sculptures',
      'Antiquités (> 100 ans)',
      'Timbres-poste',
      'Véhicules de collection',
      'Meubles anciens',
    ],
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// CRYPTOACTIFS - CGI art. 150 VH bis
// ══════════════════════════════════════════════════════════════════════════════
export const PV_CRYPTO_2025 = {
  TAUX_IR: RULES.ps.pfu_ir * 100,
  TAUX_PS: RULES.ps.total * 100,
  TAUX_GLOBAL: RULES.ps.pfu_total * 100,
  
  ABATTEMENT: 305,             // Franchise annuelle de 305 €
  
  FAIT_GENERATEUR: 'Cession contre monnaie ayant cours légal ou contre bien/service',
  NON_IMPOSABLE: 'Échange crypto contre crypto',
  
  CALCUL_PV_GLOBALE: {
    FORMULE: 'PV = Prix cession - (Prix acquisition global × Prix cession / Valeur portefeuille)',
    INFO: 'Méthode du prix moyen pondéré',
  },
  
  PROFESSIONNELS: {
    REGIME: 'BIC si activité habituelle (trading intensif)',
    CRITERES: 'Fréquence, montants, moyens techniques',
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// BARÈME IR 2025 - Pour option barème sur PV mobilières
// ══════════════════════════════════════════════════════════════════════════════
export const BAREME_IR_2025 = RULES.ir.bareme.map(t => ({
  min: t.min,
  max: t.max,
  taux: t.taux * 100,
}))

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calcule l'abattement PV mobilières (option barème)
 */
export function calculerAbattementMobilier(
  dureeDetention: number,
  typeTitres: 'droit_commun' | 'pme' = 'droit_commun'
): number {
  const grille = typeTitres === 'pme' 
    ? PV_MOBILIERES_2025.BAREME.ABATTEMENT_PME
    : PV_MOBILIERES_2025.BAREME.ABATTEMENT_DROIT_COMMUN
  
  for (const tranche of grille) {
    if (dureeDetention >= tranche.dureeMin && dureeDetention < tranche.dureeMax) {
      return tranche.taux
    }
  }
  return grille[grille.length - 1].taux
}

/**
 * Calcule l'abattement PV immobilières
 */
export function calculerAbattementImmobilier(dureeDetention: number): {
  abattementIR: number
  abattementPS: number
} {
  return {
    abattementIR: PV_IMMOBILIERES_2025.ABATTEMENT_IR.calculer(dureeDetention),
    abattementPS: PV_IMMOBILIERES_2025.ABATTEMENT_PS.calculer(dureeDetention),
  }
}

/**
 * Compare PFU vs Barème pour PV mobilières
 */
export function comparerPFUvsBareme(
  pvBrute: number,
  dureeDetention: number,
  revenuImposable: number,
  nombreParts: number,
  titresAvant2018: boolean,
  typeTitres: 'droit_commun' | 'pme' = 'droit_commun'
): {
  pfu: { impot: number; ps: number; total: number }
  bareme: { impot: number; ps: number; csgDeductible: number; total: number; abattement: number }
  meilleurChoix: 'PFU' | 'BAREME'
  economie: number
} {
  // Calcul PFU
  const pfuImpot = pvBrute * PFU_2025.TAUX_IR / 100
  const pfuPS = pvBrute * PFU_2025.TAUX_PS / 100
  const pfuTotal = pfuImpot + pfuPS

  // Calcul Barème (si titres acquis avant 2018)
  const abattement = titresAvant2018 ? calculerAbattementMobilier(dureeDetention, typeTitres) : 0
  const pvNette = pvBrute * (1 - abattement / 100)
  
  // IR barème sur PV nette
  const quotientFamilial = (revenuImposable + pvNette) / nombreParts
  let irTotal = 0
  for (const tranche of BAREME_IR_2025) {
    if (quotientFamilial > tranche.min) {
      const base = Math.min(quotientFamilial, tranche.max) - tranche.min
      irTotal += base * tranche.taux / 100
    }
  }
  irTotal = irTotal * nombreParts

  // IR sans PV pour calcul différentiel
  const quotientSansPV = revenuImposable / nombreParts
  let irSansPV = 0
  for (const tranche of BAREME_IR_2025) {
    if (quotientSansPV > tranche.min) {
      const base = Math.min(quotientSansPV, tranche.max) - tranche.min
      irSansPV += base * tranche.taux / 100
    }
  }
  irSansPV = irSansPV * nombreParts

  const irPVBareme = irTotal - irSansPV
  
  // PS sur PV brute (pas d'abattement sur PS)
  const baremePS = pvBrute * PRELEVEMENTS_SOCIAUX.TAUX_GLOBAL / 100
  
  // CSG déductible (6.8% de la PV brute, déductible année suivante)
  const csgDeductible = pvBrute * PRELEVEMENTS_SOCIAUX.CSG_DEDUCTIBLE / 100
  
  const baremeTotal = irPVBareme + baremePS

  const meilleurChoix = pfuTotal <= baremeTotal ? 'PFU' : 'BAREME'
  const economie = Math.abs(pfuTotal - baremeTotal)

  return {
    pfu: { impot: Math.round(pfuImpot), ps: Math.round(pfuPS), total: Math.round(pfuTotal) },
    bareme: { 
      impot: Math.round(irPVBareme), 
      ps: Math.round(baremePS), 
      csgDeductible: Math.round(csgDeductible),
      total: Math.round(baremeTotal),
      abattement,
    },
    meilleurChoix,
    economie: Math.round(economie),
  }
}

/**
 * Calcule la surtaxe immobilière
 */
export function calculerSurtaxeImmobiliere(pvImposable: number): number {
  return PV_IMMOBILIERES_2025.SURTAXE.calculer(pvImposable)
}

/**
 * Calcule l'impôt sur PV immobilière complète
 */
export function calculerPVImmobiliere(
  pvBrute: number,
  dureeDetention: number,
  fraisAcquisition: number = 0,
  travaux: number = 0
): {
  pvBrute: number
  frais: number
  pvNette: number
  abattementIR: number
  abattementPS: number
  pvImposableIR: number
  pvImposablePS: number
  impotIR: number
  impotPS: number
  surtaxe: number
  impotTotal: number
  pvNetteApresImpot: number
  exonereIR: boolean
  exonerePS: boolean
} {
  const pvNette = pvBrute - fraisAcquisition - travaux
  
  const { abattementIR, abattementPS } = calculerAbattementImmobilier(dureeDetention)
  
  const pvImposableIR = pvNette * (1 - abattementIR / 100)
  const pvImposablePS = pvNette * (1 - abattementPS / 100)
  
  const impotIR = pvImposableIR * PV_IMMOBILIERES_2025.TAUX_IR / 100
  const impotPS = pvImposablePS * PV_IMMOBILIERES_2025.TAUX_PS / 100
  const surtaxe = calculerSurtaxeImmobiliere(pvImposableIR)
  
  const impotTotal = impotIR + impotPS + surtaxe
  
  return {
    pvBrute,
    frais: fraisAcquisition + travaux,
    pvNette,
    abattementIR,
    abattementPS,
    pvImposableIR: Math.round(pvImposableIR),
    pvImposablePS: Math.round(pvImposablePS),
    impotIR: Math.round(impotIR),
    impotPS: Math.round(impotPS),
    surtaxe: Math.round(surtaxe),
    impotTotal: Math.round(impotTotal),
    pvNetteApresImpot: Math.round(pvNette - impotTotal),
    exonereIR: abattementIR >= 100,
    exonerePS: abattementPS >= 100,
  }
}

/**
 * Calcule l'impôt sur métaux précieux / objets d'art
 */
export function calculerPVObjetsPrecieux(
  prixCession: number,
  prixAcquisition: number | null,
  dureeDetention: number,
  type: 'or' | 'bijoux_art'
): {
  taxeForfaitaire: { base: number; taux: number; montant: number }
  regimePV: { pvBrute: number; abattement: number; pvImposable: number; ir: number; ps: number; total: number } | null
  meilleurRegime: 'FORFAITAIRE' | 'PV_REELLES'
  impotDu: number
} {
  const config = type === 'or' 
    ? PV_OBJETS_PRECIEUX_2025.OR_METAUX
    : PV_OBJETS_PRECIEUX_2025.BIJOUX_ART

  // Taxe forfaitaire (toujours calculable)
  const taxeForfaitaire = {
    base: prixCession,
    taux: config.TAXE_FORFAITAIRE.TAUX_TOTAL,
    montant: Math.round(prixCession * config.TAXE_FORFAITAIRE.TAUX_TOTAL / 100),
  }

  // Régime PV réelles (si on peut justifier l'acquisition)
  let regimePV = null
  if (prixAcquisition !== null && prixAcquisition > 0) {
    const pvBrute = prixCession - prixAcquisition
    
    if (pvBrute > 0) {
      // Abattement : 5% par an au-delà de 2 ans, max 100% après 22 ans
      const anneesAbattement = Math.max(0, dureeDetention - 2)
      const abattement = Math.min(100, anneesAbattement * 5)
      
      const pvImposable = pvBrute * (1 - abattement / 100)
      const ir = pvImposable * RULES.immobilier.plus_value.taux_ir
      const ps = pvImposable * RULES.immobilier.plus_value.taux_ps
      
      regimePV = {
        pvBrute,
        abattement,
        pvImposable: Math.round(pvImposable),
        ir: Math.round(ir),
        ps: Math.round(ps),
        total: Math.round(ir + ps),
      }
    }
  }

  // Déterminer le meilleur régime
  const meilleurRegime = regimePV && regimePV.total < taxeForfaitaire.montant ? 'PV_REELLES' : 'FORFAITAIRE'
  const impotDu = meilleurRegime === 'FORFAITAIRE' ? taxeForfaitaire.montant : (regimePV?.total || taxeForfaitaire.montant)

  return {
    taxeForfaitaire,
    regimePV,
    meilleurRegime,
    impotDu,
  }
}

/**
 * Calcule l'impôt sur cryptoactifs
 */
export function calculerPVCrypto(
  pvGlobale: number
): {
  pvBrute: number
  franchise: number
  pvImposable: number
  ir: number
  ps: number
  total: number
  netApresImpot: number
} {
  const franchise = PV_CRYPTO_2025.ABATTEMENT
  const pvImposable = Math.max(0, pvGlobale - franchise)
  
  const ir = pvImposable * PV_CRYPTO_2025.TAUX_IR / 100
  const ps = pvImposable * PV_CRYPTO_2025.TAUX_PS / 100
  
  return {
    pvBrute: pvGlobale,
    franchise,
    pvImposable: Math.round(pvImposable),
    ir: Math.round(ir),
    ps: Math.round(ps),
    total: Math.round(ir + ps),
    netApresImpot: Math.round(pvGlobale - ir - ps),
  }
}
