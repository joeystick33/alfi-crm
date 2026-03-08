/**
 * ══════════════════════════════════════════════════════════════════════════════
 * AURA — Paramètres Réglementaires Configurables 2025
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Ce fichier centralise TOUS les paramètres fiscaux, sociaux et réglementaires
 * utilisés par le cerveau AURA V2. Il est conçu pour être mis à
 * jour facilement chaque année lors de la publication du PLF / LFSS.
 *
 * Pour mettre à jour :
 *   1. Dupliquer la section concernée avec l'année N+1
 *   2. Modifier les valeurs selon les nouveaux barèmes
 *   3. Mettre à jour ANNEE_FISCALE et ANNEE_REVENUS
 *   4. Relancer le serveur
 *
 * Sources officielles :
 *   - CGI : Code Général des Impôts (Legifrance)
 *   - BOFIP : Bulletin Officiel des Finances Publiques
 *   - CSS : Code de la Sécurité Sociale
 *   - Althémis Chiffres-clés patrimoine 2025
 *   - PLF 2025 / LFSS 2025
 */

// ============================================================================
// METADATA
// ============================================================================

export const ANNEE_FISCALE = 2025
export const ANNEE_REVENUS = 2024
export const DERNIERE_MISE_A_JOUR = '2025-01-15'
export const VERSION_CONFIG = '2025.1.0'

// ============================================================================
// BARÈME IR — CGI art. 197
// ============================================================================

export const BAREME_IR = {
  annee: 2025,
  revenus: 2024,
  ref: 'CGI art. 197',
  tranches: [
    { min: 0, max: 11_497, taux: 0 },
    { min: 11_497, max: 29_315, taux: 11 },
    { min: 29_315, max: 83_823, taux: 30 },
    { min: 83_823, max: 180_294, taux: 41 },
    { min: 180_294, max: Infinity, taux: 45 },
  ],
} as const

// ============================================================================
// QUOTIENT FAMILIAL — CGI art. 197 I-2°
// ============================================================================

export const QUOTIENT_FAMILIAL = {
  ref: 'CGI art. 197 I-2°',
  plafondDemiPart: 1_759,
  plafondQuartPart: 879.50,
  plafondParentIsole: 4_149,
  plafondInvalidite: 3_566,
  plafondAncienCombattant: 3_566,
} as const

// ============================================================================
// DÉCOTE — CGI art. 197 I-4°
// ============================================================================

export const DECOTE = {
  ref: 'CGI art. 197 I-4°',
  seul: { seuil: 1_929, plafond: 873, taux: 0.4525 },
  couple: { seuil: 3_191, plafond: 1_444, taux: 0.4525 },
} as const

// ============================================================================
// ABATTEMENTS — CGI art. 83, 158
// ============================================================================

export const ABATTEMENTS = {
  salaires: { taux: 10, min: 495, max: 14_171, ref: 'CGI art. 83' },
  pensions: { taux: 10, min: 442, max: 4_321, ref: 'CGI art. 158-5-a' },
  microFoncier: { taux: 30, plafondRecettes: 15_000, ref: 'CGI art. 32' },
  dividendes: { taux: 40, ref: 'CGI art. 158-3-2°' },
  microBIC: { taux: 50, plafondRecettes: 188_700, ref: 'CGI art. 50-0' },
  microBNC: { taux: 34, plafondRecettes: 77_700, ref: 'CGI art. 102 ter' },
} as const

// ============================================================================
// PFU (Flat Tax) — CGI art. 200 A
// ============================================================================

export const PFU = {
  ref: 'CGI art. 200 A',
  tauxGlobal: 30,
  tauxIR: 12.8,
  tauxPS: 17.2,
  detailPS: {
    CSG: 9.2,
    CRDS: 0.5,
    solidarite: 7.5,
  },
  CSGDeductible: 6.8,
} as const

// ============================================================================
// ASSURANCE-VIE
// ============================================================================

export const ASSURANCE_VIE = {
  // Rachats après 8 ans — CGI art. 125-0 A
  abattement8ans: {
    seul: 4_600,
    couple: 9_200,
    ref: 'CGI art. 125-0 A',
  },
  // Prélèvement forfaitaire — CGI art. 125-0 A
  prelevementForfaitaire: {
    avant4ans: 12.8,
    entre4et8ans: 12.8,
    apres8ans_avant150k: 7.5,
    apres8ans_apres150k: 12.8,
    seuil150k: 150_000,
  },
  // Décès — CGI art. 990 I
  deces: {
    abattementParBeneficiaire: 152_500,
    taux1: { max: 700_000, taux: 20 },
    taux2: { min: 700_000, taux: 31.25 },
    ref: 'CGI art. 990 I',
    ageCharniere: 70,
    abattementArt757B: 30_500,
    refArt757B: 'CGI art. 757 B',
  },
} as const

// ============================================================================
// PER (Plan Épargne Retraite) — CGI art. 163 quatervicies
// ============================================================================

export const PER = {
  ref: 'CGI art. 163 quatervicies',
  plafond10pct: true,
  plafondAbsolu: 35_194,
  plafondMinimum: 4_399,
  PASS: 46_368,
  reportableAnnees: 3,
} as const

// ============================================================================
// IFI (Impôt sur la Fortune Immobilière) — CGI art. 977
// ============================================================================

export const IFI = {
  ref: 'CGI art. 977',
  seuilAssujettissement: 1_300_000,
  bareme: [
    { min: 0, max: 800_000, taux: 0 },
    { min: 800_000, max: 1_300_000, taux: 0.50 },
    { min: 1_300_000, max: 2_570_000, taux: 0.70 },
    { min: 2_570_000, max: 5_000_000, taux: 1.00 },
    { min: 5_000_000, max: 10_000_000, taux: 1.25 },
    { min: 10_000_000, max: Infinity, taux: 1.50 },
  ],
  decote: {
    seuilBas: 1_300_000,
    seuilHaut: 1_400_000,
    formule: '17500 - 1.25% × patrimoine',
  },
  plafonnement: 75, // % des revenus
  abattementRP: 30, // Résidence principale
} as const

// ============================================================================
// CEHR (Contribution Exceptionnelle Hauts Revenus) — CGI art. 223 sexies
// ============================================================================

export const CEHR = {
  ref: 'CGI art. 223 sexies',
  seul: [
    { min: 0, max: 250_000, taux: 0 },
    { min: 250_000, max: 500_000, taux: 3 },
    { min: 500_000, max: Infinity, taux: 4 },
  ],
  couple: [
    { min: 0, max: 500_000, taux: 0 },
    { min: 500_000, max: 1_000_000, taux: 3 },
    { min: 1_000_000, max: Infinity, taux: 4 },
  ],
} as const

// ============================================================================
// DONATIONS & SUCCESSIONS — CGI art. 779 et suivants
// ============================================================================

export const DONATIONS_SUCCESSIONS = {
  ref: 'CGI art. 779 et suivants',
  periodeRappel: 15, // années
  abattements: {
    conjoint: { montant: 80_724, ref: 'CGI art. 790 E' },
    enfant: { montant: 100_000, ref: 'CGI art. 779 I' },
    petitEnfant: { montant: 31_865, ref: 'CGI art. 790 B' },
    arrierePetitEnfant: { montant: 5_310, ref: 'CGI art. 790 D' },
    frereOuSoeur: { montant: 15_932, ref: 'CGI art. 779 IV' },
    neveuOuNiece: { montant: 7_967, ref: 'CGI art. 779 V' },
    handicape: { montant: 159_325, ref: 'CGI art. 779 II' },
    tiers: { montant: 1_594, ref: 'CGI art. 788' },
  },
  donsFamiliaux: {
    montant: 31_865,
    ageMax: 80,
    ageMajoriteDonataire: 18,
    ref: 'CGI art. 790 G',
  },
  baremeLigneDirecte: [
    { min: 0, max: 8_072, taux: 5 },
    { min: 8_072, max: 12_109, taux: 10 },
    { min: 12_109, max: 15_932, taux: 15 },
    { min: 15_932, max: 552_324, taux: 20 },
    { min: 552_324, max: 902_838, taux: 30 },
    { min: 902_838, max: 1_805_677, taux: 40 },
    { min: 1_805_677, max: Infinity, taux: 45 },
  ],
} as const

// ============================================================================
// DÉMEMBREMENT — CGI art. 669
// ============================================================================

export const DEMEMBREMENT = {
  ref: 'CGI art. 669',
  bareme: [
    { ageMax: 20, usufruit: 90, nuePropriete: 10 },
    { ageMax: 30, usufruit: 80, nuePropriete: 20 },
    { ageMax: 40, usufruit: 70, nuePropriete: 30 },
    { ageMax: 50, usufruit: 60, nuePropriete: 40 },
    { ageMax: 60, usufruit: 50, nuePropriete: 50 },
    { ageMax: 70, usufruit: 40, nuePropriete: 60 },
    { ageMax: 80, usufruit: 30, nuePropriete: 70 },
    { ageMax: 90, usufruit: 20, nuePropriete: 80 },
    { ageMax: Infinity, usufruit: 10, nuePropriete: 90 },
  ],
} as const

// ============================================================================
// PLAFONNEMENT DES NICHES FISCALES — CGI art. 200-0 A
// ============================================================================

export const PLAFOND_NICHES = {
  ref: 'CGI art. 200-0 A',
  general: 10_000,
  avecSOFICA: 18_000,
  avecOutreMer: 18_000,
} as const

// ============================================================================
// RÉDUCTIONS ET CRÉDITS D'IMPÔT
// ============================================================================

export const REDUCTIONS_CREDITS = {
  dons: {
    tauxGeneral: 66,
    tauxColuche: 75,
    plafondColuche: 1_000,
    plafondPctRevenu: 20,
    ref: 'CGI art. 200',
  },
  emploiDomicile: {
    taux: 50,
    plafond: 12_000,
    majParEnfant: 1_500,
    plafondMax: 15_000,
    plafond1ereAnnee: 15_000,
    majMax1ereAnnee: 18_000,
    ref: 'CGI art. 199 sexdecies',
  },
  gardeEnfants: {
    taux: 50,
    plafondParEnfant: 3_500,
    ref: 'CGI art. 200 quater B',
  },
  investissementPME: {
    taux: 18,
    plafondSeul: 50_000,
    plafondCouple: 100_000,
    ref: 'CGI art. 199 terdecies-0 A',
  },
  scolarite: {
    college: 61,
    lycee: 153,
    superieur: 183,
    ref: 'CGI art. 199 quater F',
  },
  pinel: {
    taux6ans: 9,
    taux9ans: 12,
    taux12ans: 14,
    plafondInvestissement: 300_000,
    plafondM2: 5_500,
    maxLogements: 2,
    ref: 'CGI art. 199 novovicies',
    note: 'Dispositif en extinction - taux réduits 2024',
  },
  denormandie: {
    taux: 12,
    ref: 'CGI art. 199 novovicies',
    note: 'Applicable dans ancien avec travaux',
  },
} as const

// ============================================================================
// PRÉLÈVEMENTS SOCIAUX — CSS
// ============================================================================

export const PRELEVEMENTS_SOCIAUX = {
  tauxGlobal: 17.2,
  detail: {
    CSG: 9.2,
    CRDS: 0.5,
    prelevementSolidarite: 7.5,
  },
  CSGDeductibleRevenus: 6.8,
  CSGDeductiblePatrimoine: 6.8,
  ref: 'CSS art. L136-1 et suivants',
} as const

// ============================================================================
// PLAFOND SÉCURITÉ SOCIALE (PASS)
// ============================================================================

export const PLAFOND_SECURITE_SOCIALE = {
  annuel: 46_368,
  mensuel: 3_864,
  journalier: 213,
  ref: 'CSS art. D242-17',
  annee: 2025,
} as const

// ============================================================================
// IMMOBILIER — Frais, droits, abattements
// ============================================================================

export const IMMOBILIER = {
  droitsMutation: {
    departement: 4.5,
    commune: 1.2,
    fraisNotaire: 0.814,
    totalEstime: 7.5,
    ref: 'CGI art. 1594 D',
    note: 'Taux pleins en vigueur dans la quasi-totalité des départements',
  },
  plusValues: {
    abattementRP: 100,
    tauxIR: 19,
    tauxPS: 17.2,
    exonerationDureeIR: 22,
    exonerationDureePS: 30,
    abattementExceptionnelZoneTendue: 0,
    ref: 'CGI art. 150 U et suivants',
  },
  locationMeublee: {
    microBIC: { taux: 50, plafond: 77_700, ref: 'CGI art. 50-0' },
    LMNP: { amortissement: true, ref: 'CGI art. 39 C' },
    LMP: {
      seuilRecettes: 23_000,
      conditionRevenus: true,
      ref: 'CGI art. 155 IV',
    },
  },
} as const

// ============================================================================
// RETRAITE — Paramètres de simulation
// ============================================================================

export const RETRAITE = {
  ageDepart: {
    legal: 64,
    tauxPlein: 67,
    ref: 'CSS art. L351-1',
  },
  trimestres: {
    tauxPleinNe1973: 172,
    tauxPleinNe1965: 170,
    decoteParTrimestre: 0.625,
    surcoteParTrimestre: 1.25,
    maxTrimestres: 172,
  },
  PASS: 46_368,
  plafondSS: 46_368,
} as const

// ============================================================================
// EMPRUNTS — Taux indicatifs et paramètres
// ============================================================================

export const EMPRUNTS = {
  tauxUsure: {
    fixe10ans: 5.53,
    fixe20ans: 5.80,
    fixe25ansPLus: 5.97,
    ref: 'Banque de France - T1 2025',
    note: 'Taux mis à jour trimestriellement',
  },
  assuranceEmprunteur: {
    tauxMoyen: 0.34,
    ref: 'Loi Lemoine 2022',
    note: 'Résiliation à tout moment',
  },
  tauxEndettement: {
    max: 35,
    ref: 'HCSF - Recommandation R-2021-01',
  },
} as const

// ============================================================================
// ÉPARGNE SALARIALE — PEE, PERCO, intéressement
// ============================================================================

export const EPARGNE_SALARIALE = {
  PEE: {
    plafondVersement: 8 * 46_368 * 0.25,
    abondementMax: 8 * 46_368 * 0.08,
    ref: 'C. trav. art. L3332-10',
  },
  interessement: {
    plafondIndividuel: 46_368 * 0.75,
    plafondEntreprise: '20% masse salariale',
    ref: 'C. trav. art. L3314-8',
  },
} as const

// ============================================================================
// HELPER — Générer le contexte réglementaire pour le prompt IA
// ============================================================================

export function generateRegulatoryContext(): string {
  return `
═══ PARAMÈTRES RÉGLEMENTAIRES ${ANNEE_FISCALE} (v${VERSION_CONFIG}) ═══

▸ IR ${ANNEE_FISCALE} (CGI art. 197) :
  ${BAREME_IR.tranches.map(t => `${t.taux}% → ${t.max === Infinity ? 'au-delà' : t.max.toLocaleString('fr-FR') + '€'}`).join(' | ')}

▸ PFU : ${PFU.tauxGlobal}% (${PFU.tauxIR}% IR + ${PFU.tauxPS}% PS)
▸ PS : ${PRELEVEMENTS_SOCIAUX.tauxGlobal}% (CSG ${PRELEVEMENTS_SOCIAUX.detail.CSG}% + CRDS ${PRELEVEMENTS_SOCIAUX.detail.CRDS}% + solidarité ${PRELEVEMENTS_SOCIAUX.detail.prelevementSolidarite}%)
▸ CSG déductible : ${PFU.CSGDeductible}%

▸ IFI seuil : ${IFI.seuilAssujettissement.toLocaleString('fr-FR')}€ | Abatt. RP : ${IFI.abattementRP}%
▸ CEHR seul : 3% (250K) / 4% (500K) | couple : 3% (500K) / 4% (1M)

▸ Assurance-vie 8 ans : abattement ${ASSURANCE_VIE.abattement8ans.seul.toLocaleString('fr-FR')}€/${ASSURANCE_VIE.abattement8ans.couple.toLocaleString('fr-FR')}€
▸ AV décès (art. 990 I) : ${ASSURANCE_VIE.deces.abattementParBeneficiaire.toLocaleString('fr-FR')}€/bénéficiaire
▸ AV art. 757 B (versements après 70 ans) : abattement global ${ASSURANCE_VIE.deces.abattementArt757B.toLocaleString('fr-FR')}€

▸ PER plafond : 10% revenus (max ${PER.plafondAbsolu.toLocaleString('fr-FR')}€) | min ${PER.plafondMinimum.toLocaleString('fr-FR')}€ | report ${PER.reportableAnnees} ans

▸ Donations enfant : ${DONATIONS_SUCCESSIONS.abattements.enfant.montant.toLocaleString('fr-FR')}€ / ${DONATIONS_SUCCESSIONS.periodeRappel} ans
▸ Donations petit-enfant : ${DONATIONS_SUCCESSIONS.abattements.petitEnfant.montant.toLocaleString('fr-FR')}€
▸ Dons familiaux : ${DONATIONS_SUCCESSIONS.donsFamiliaux.montant.toLocaleString('fr-FR')}€ (donateur <${DONATIONS_SUCCESSIONS.donsFamiliaux.ageMax} ans)

▸ Niches fiscales : ${PLAFOND_NICHES.general.toLocaleString('fr-FR')}€ (${PLAFOND_NICHES.avecSOFICA.toLocaleString('fr-FR')}€ avec SOFICA/OM)
▸ Emploi domicile : ${REDUCTIONS_CREDITS.emploiDomicile.taux}% (max ${REDUCTIONS_CREDITS.emploiDomicile.plafond.toLocaleString('fr-FR')}€)
▸ Garde enfants : ${REDUCTIONS_CREDITS.gardeEnfants.taux}% (max ${REDUCTIONS_CREDITS.gardeEnfants.plafondParEnfant.toLocaleString('fr-FR')}€/enfant)

▸ PASS ${ANNEE_FISCALE} : ${PLAFOND_SECURITE_SOCIALE.annuel.toLocaleString('fr-FR')}€
▸ Retraite : âge légal ${RETRAITE.ageDepart.legal} ans | taux plein ${RETRAITE.ageDepart.tauxPlein} ans
▸ Taux endettement max : ${EMPRUNTS.tauxEndettement.max}% (HCSF)

═══ FIN PARAMÈTRES ═══`.trim()
}

// ============================================================================
// HELPER — Obtenir le TMI d'un contribuable
// ============================================================================

export function getTMI(quotientFamilial: number): number {
  for (const t of BAREME_IR.tranches) {
    if (quotientFamilial <= t.max) return t.taux
  }
  return 45
}

// ============================================================================
// HELPER — Calculer l'usufruit/nue-propriété selon l'âge
// ============================================================================

export function getUsufruitNuePropriete(age: number): { usufruit: number; nuePropriete: number } {
  for (const tranche of DEMEMBREMENT.bareme) {
    if (age <= tranche.ageMax) return { usufruit: tranche.usufruit, nuePropriete: tranche.nuePropriete }
  }
  return { usufruit: 10, nuePropriete: 90 }
}

// ============================================================================
// HELPER — Calculer le plafond PER
// ============================================================================

export function getPlafondPER(revenuNet: number): { plafond: number; detail: string } {
  const calcul = revenuNet * 0.10
  if (calcul < PER.plafondMinimum) {
    return { plafond: PER.plafondMinimum, detail: `Plancher ${PER.plafondMinimum.toLocaleString('fr-FR')}€ (10% PASS)` }
  }
  if (calcul > PER.plafondAbsolu) {
    return { plafond: PER.plafondAbsolu, detail: `Plafond ${PER.plafondAbsolu.toLocaleString('fr-FR')}€ (10% × 8 PASS)` }
  }
  return { plafond: Math.round(calcul), detail: `10% × ${revenuNet.toLocaleString('fr-FR')}€ = ${Math.round(calcul).toLocaleString('fr-FR')}€` }
}
