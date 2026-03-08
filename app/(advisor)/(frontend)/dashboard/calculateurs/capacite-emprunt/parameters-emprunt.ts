/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PARAMÈTRES CAPACITÉ D'EMPRUNT — Calculateur Emprunt Immobilier
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Source unique de vérité : RULES (fiscal-rules.ts) pour les seuils HCSF
 * Période d'application : déterminée par RULES.meta (année fiscale, version)
 * Mise à jour : via l'interface admin /superadmin/fiscal-rules ou fiscal-rules.ts
 * Sources : HCSF, CAFPI, Action Logement, Service-Public.fr, Légifrance
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
// NORMES HCSF 2025 (Haut Conseil de Stabilité Financière) — Source : RULES.immobilier.hcsf
// Ref: Décision D-HCSF-2021-7 modifiée - art. L. 631-2-1 CMF
// ══════════════════════════════════════════════════════════════════════════════
export const NORMES_HCSF_2025 = {
  /** Taux d'effort maximum (assurance incluse) - art. 1 */
  tauxEndettementMax: RULES.immobilier.hcsf.taux_endettement_max,
  /** Durée maximale standard */
  dureeMaxStandard: RULES.immobilier.hcsf.duree_max_ans,
  /** Durée maximale avec différé VEFA/construction (max 2 ans de différé) */
  dureeMaxVEFA: 27, // ans
  /** Marge de flexibilité pour dérogations */
  margeFlexibilite: 0.20, // 20% des dossiers
  /** Part des dérogations pour investissement locatif (depuis juillet 2023) */
  derogationLocatif: 0.30, // 30% des 20%
  /** Reste à vivre minimum recommandé - personne seule */
  resteAVivreMinSeul: 700,
  /** Reste à vivre minimum recommandé - couple */
  resteAVivreMinCouple: 1200,
  /** Reste à vivre par enfant supplémentaire */
  resteAVivreParEnfant: 350,
}

// ══════════════════════════════════════════════════════════════════════════════
// TAUX IMMOBILIERS DÉCEMBRE 2025
// Source: CAFPI Baromètre 02/12/2025 - https://www.cafpi.fr/credit-immobilier/barometre-taux
// ══════════════════════════════════════════════════════════════════════════════
export const TAUX_MARCHE_DECEMBRE_2025 = {
  /** Taux moyens négociés (hors assurance) */
  moyens: {
    7: 2.95,
    10: 3.00,
    12: 3.05,
    15: 3.07,
    17: 3.15,
    20: 3.24,
    22: 3.30,
    25: 3.34,
  } as Record<number, number>,
  /** Meilleurs taux CAFPI (10% des dossiers) */
  meilleurs: {
    15: 2.85,
    20: 3.00,
    25: 3.10,
  } as Record<number, number>,
  /** Taux usure T4 2025 (Banque de France) */
  usure: {
    moins10ans: 4.60,
    de10a20ans: 4.77,
    plus20ans: 4.87,
  },
}

/** Retourne le taux moyen pour une durée donnée */
export function getTauxMoyenParDuree(duree: number): number {
  const taux = TAUX_MARCHE_DECEMBRE_2025.moyens
  if (duree <= 7) return taux[7]
  if (duree <= 10) return taux[10]
  if (duree <= 12) return taux[12]
  if (duree <= 15) return taux[15]
  if (duree <= 17) return taux[17]
  if (duree <= 20) return taux[20]
  if (duree <= 22) return taux[22]
  return taux[25]
}

// ══════════════════════════════════════════════════════════════════════════════
// PTZ 2025 - PRÊT À TAUX ZÉRO
// Ref: Décret n° 2024-304 du 2 avril 2024 - Art. R. 31-10-2 et suivants CCH
// Modifié par décret n° 2025-XXX du 1er avril 2025 (extension neuf)
// Prolongé jusqu'au 31/12/2027 - Loi de finances 2024
// ══════════════════════════════════════════════════════════════════════════════

/** Plafonds de revenus PTZ 2025 par zone et taille du foyer (RFR N-2) */
export const PLAFONDS_REVENUS_PTZ_2025: Record<string, Record<number, number>> = {
  // Tranche 1 (quotité 50%)
  A_bis: { 1: 49000, 2: 73500, 3: 88200, 4: 102900, 5: 117600, 6: 132300, 7: 147000, 8: 161700 },
  A: { 1: 49000, 2: 73500, 3: 88200, 4: 102900, 5: 117600, 6: 132300, 7: 147000, 8: 161700 },
  B1: { 1: 34500, 2: 51750, 3: 62100, 4: 72450, 5: 82800, 6: 93150, 7: 103500, 8: 113850 },
  B2: { 1: 31050, 2: 43470, 3: 52164, 4: 60858, 5: 69552, 6: 78246, 7: 86940, 8: 95634 },
  C: { 1: 27600, 2: 38640, 3: 46368, 4: 54096, 5: 61824, 6: 69552, 7: 77280, 8: 85008 },
}

/** Plafonds d'opération PTZ 2025 (coût max retenu pour le calcul) */
export const PLAFONDS_OPERATION_PTZ_2025: Record<string, Record<number, number>> = {
  A_bis: { 1: 150000, 2: 225000, 3: 270000, 4: 315000, 5: 360000 },
  A: { 1: 150000, 2: 225000, 3: 270000, 4: 315000, 5: 360000 },
  B1: { 1: 135000, 2: 202500, 3: 243000, 4: 283500, 5: 324000 },
  B2: { 1: 110000, 2: 154000, 3: 184800, 4: 215600, 5: 246400 },
  C: { 1: 100000, 2: 140000, 3: 168000, 4: 196000, 5: 224000 },
}

/** Quotités PTZ 2025 par tranche de revenus (% du coût d'opération plafonné) */
export const QUOTITES_PTZ_2025 = {
  /** Logement collectif neuf - Toutes zones depuis 01/04/2025 */
  neuf_collectif: {
    tranche1: 0.50, // RFR <= plafond tranche 1
    tranche2: 0.40, // RFR <= plafond tranche 2
    tranche3: 0.40, // RFR <= plafond tranche 3
    tranche4: 0.20, // RFR <= plafond tranche 4
  },
  /** Maison individuelle neuve - Toutes zones depuis 01/04/2025 */
  neuf_individuel: {
    tranche1: 0.30,
    tranche2: 0.25,
    tranche3: 0.20,
    tranche4: 0.15,
  },
  /** Ancien avec travaux >= 25% - Zones B2 et C uniquement */
  ancien_travaux: {
    tranche1: 0.50,
    tranche2: 0.40,
    tranche3: 0.40,
    tranche4: 0.20,
  },
  /** Logement social (vente HLM) */
  social: {
    toutes_tranches: 0.20,
  },
}

/** Durées et différés PTZ 2025 par tranche */
export const DUREES_PTZ_2025 = {
  tranche1: { dureeTotal: 25, differe: 15, remboursement: 10 },
  tranche2: { dureeTotal: 22, differe: 10, remboursement: 12 },
  tranche3: { dureeTotal: 20, differe: 5, remboursement: 15 },
  tranche4: { dureeTotal: 15, differe: 0, remboursement: 15 },
}

/** Conditions d'éligibilité PTZ 2025 */
export const CONDITIONS_PTZ_2025 = {
  /** Être primo-accédant (pas propriétaire RP depuis 2 ans) */
  primoAccedant: true,
  /** Résidence principale (occupation dans les 12 mois) */
  residencePrincipale: true,
  /** Travaux minimum pour ancien en zone B2/C */
  seuilTravauxAncien: 0.25, // 25% du coût total
  /** Zones éligibles pour l'ancien avec travaux */
  zonesAncien: ['B2', 'C'],
  /** Neuf éligible partout depuis 01/04/2025 */
  neufToutesZones: true,
}

// ══════════════════════════════════════════════════════════════════════════════
// ÉCO-PTZ 2025 - PRÊT À TAUX ZÉRO RÉNOVATION ÉNERGÉTIQUE
// Ref: Art. 244 quater U CGI, Art. R. 319-1 et suivants CCH
// Prolongé jusqu'au 31/12/2027 - Loi de finances 2024
// ══════════════════════════════════════════════════════════════════════════════
export const ECO_PTZ_2025 = {
  /** Plafonds selon le nombre d'actions */
  plafonds: {
    uneAction: 15000, // 1 catégorie de travaux
    paroiesVitrees: 7000, // Cas particulier fenêtres seules
    deuxActions: 25000, // 2 catégories
    troisActionsPlus: 30000, // 3+ catégories (bouquet)
    assainissement: 10000, // Assainissement non collectif
    performanceGlobale: 50000, // Gain >= 35% + sortie passoire
    maprimerenov: 50000, // Couplé avec MaPrimeRénov'
  },
  /** Durées de remboursement */
  durees: {
    standard: 15, // ans
    performanceGlobale: 20, // ans pour gain >= 35%
    minimum: 3, // ans
  },
  /** Conditions */
  conditions: {
    ancienneteLogement: 2, // ans minimum depuis achèvement
    residencePrincipale: true, // ou location comme RP
    professionnelRGE: true, // Reconnu Garant Environnement
  },
  /** Catégories de travaux éligibles */
  categories: [
    'isolation_toiture',
    'isolation_murs_exterieurs',
    'isolation_planchers_bas',
    'isolation_parois_vitrees',
    'chauffage_regulation',
    'chauffage_renouvelable',
    'eau_chaude_renouvelable',
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// PRÊT ACTION LOGEMENT 2025 (ex-1% patronal)
// Source: actionlogement.fr - Mise à jour novembre 2025
// Ref: Art. L. 313-1 et suivants CCH
// ══════════════════════════════════════════════════════════════════════════════
export const PRET_ACTION_LOGEMENT_2025 = {
  /** Montant maximum */
  montantMax: 30000, // € (attention: certaines sources disent 40000, mais CAFPI/AL confirment 30000)
  /** Taux d'intérêt nominal annuel fixe */
  taux: 1.0, // %
  /** Durée maximale */
  dureeMax: 25, // ans
  /** Pas de frais de dossier ni de garantie */
  fraisDossier: 0,
  fraisGarantie: 0,
  /** Conditions d'éligibilité */
  conditions: {
    /** Salarié entreprise privée non agricole de 10+ salariés */
    tailleEntreprise: 10,
    secteurPrive: true,
    horsAgricole: true,
    /** Respect plafonds ressources PLI */
    respectPlafondsPLI: true,
    /** Résidence principale */
    residencePrincipale: true,
    /** DPE minimum pour ancien (vente HLM) */
    dpeMinAncien: 'E', // A à E
  },
  /** Opérations finançables */
  operations: [
    'construction',
    'acquisition_neuf_vefa',
    'acquisition_hlm', // Vente logement social
    'accession_sociale_psla',
    'brs_neuf_ancien', // Bail réel solidaire
  ],
}

/** Plafonds de ressources PLI 2025 (RFR N-2) pour Action Logement */
export const PLAFONDS_PLI_2025: Record<string, Record<number, number>> = {
  A_bis: { 1: 43475, 2: 64935, 3: 78062, 4: 93164, 5: 110996, 6: 124938 },
  A: { 1: 43475, 2: 64935, 3: 78062, 4: 93164, 5: 110996, 6: 124938 },
  B1: { 1: 35435, 2: 47321, 3: 56893, 4: 68680, 5: 80793, 6: 91077 },
  B2: { 1: 31892, 2: 42588, 3: 51204, 4: 61812, 5: 72714, 6: 81969 },
  C: { 1: 31892, 2: 42588, 3: 51204, 4: 61812, 5: 72714, 6: 81969 },
}

// ══════════════════════════════════════════════════════════════════════════════
// PAS - PRÊT À L'ACCESSION SOCIALE 2025
// Ref: Art. L. 312-1 et suivants CCH - Arrêté du 1er avril 2025
// Source: service-public.fr, ANIL
// ══════════════════════════════════════════════════════════════════════════════
export const PRET_ACCESSION_SOCIALE_2025 = {
  /** Taux plafonnés au 1er avril 2025 selon durée */
  tauxPlafonds: {
    moins12ans: 5.50,   // ≤ 12 ans
    de12a15ans: 5.70,   // > 12 ans et ≤ 15 ans
    de15a20ans: 5.80,   // > 15 ans et ≤ 20 ans
    plus20ans: 5.85,    // > 20 ans
  } as Record<string, number>,
  /** Durées autorisées */
  duree: {
    min: 5,
    max: 30, // Peut aller jusqu'à 30 ans
    recommandee: 25,
  },
  /** Permet accès APL */
  aplEligible: true,
  /** Frais réduits */
  fraisDossierMax: 500, // Plafonnés
  /** Plafonds de revenus (identiques PLI majorés) */
  plafonds: {
    A_bis: { 1: 37000, 2: 51800, 3: 62900, 4: 74000, 5: 85100, 6: 96200 },
    A: { 1: 37000, 2: 51800, 3: 62900, 4: 74000, 5: 85100, 6: 96200 },
    B1: { 1: 30000, 2: 42000, 3: 51000, 4: 60000, 5: 69000, 6: 78000 },
    B2: { 1: 27000, 2: 37800, 3: 45900, 4: 54000, 5: 62100, 6: 70200 },
    C: { 1: 24000, 2: 33600, 3: 40800, 4: 48000, 5: 55200, 6: 62400 },
  },
  /** Opérations finançables */
  operations: [
    'acquisition_neuf',
    'acquisition_ancien',
    'acquisition_ancien_travaux',
    'construction',
    'travaux_amelioration',
  ],
  /** Conditions */
  conditions: {
    residencePrincipale: true,
    proprietaireOccupant: true, // Pas de location sauf cas spéciaux
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// PC - PRÊT CONVENTIONNÉ 2025
// Ref: Art. R. 331-63 et suivants CCH - Arrêté du 1er avril 2025
// Source: service-public.fr, ANIL
// ══════════════════════════════════════════════════════════════════════════════
export const PRET_CONVENTIONNE_2025 = {
  /** Taux plafonnés au 1er avril 2025 */
  tauxPlafonds: {
    moins12ans: 5.50,
    de12a15ans: 5.70,
    de15a20ans: 5.80,
    de20a25ans: 5.90,
    de25a30ans: 5.95,
  } as Record<string, number>,
  /** Durées */
  duree: {
    min: 5,
    max: 30, // Jusqu'à 30 ans
  },
  /** Permet accès APL */
  aplEligible: true,
  /** Pas de plafond de ressources */
  sansConditionRessources: true,
  /** Opérations finançables */
  operations: [
    'acquisition_neuf',
    'acquisition_ancien',
    'construction',
    'travaux_amelioration_agrandissement',
  ],
  /** Caractéristiques */
  caracteristiques: {
    tauxFixeOuVariable: true,
    financeJusque100Pct: true, // Peut financer 100% du projet
    cumulablePTZ: true,
    cumulableActionLogement: true,
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// PRÊT ÉPARGNE LOGEMENT 2025 (PEL / CEL)
// Ref: Art. L. 315-1 et suivants CMF
// Source: service-public.fr, Banque de France
// ══════════════════════════════════════════════════════════════════════════════
export const PRET_EPARGNE_LOGEMENT_2025 = {
  PEL: {
    /** Taux du prêt selon date d'ouverture du PEL */
    tauxPret: {
      avant2016: 4.20, // PEL ouverts avant 01/02/2016
      de2016a2023: 2.20, // PEL ouverts du 01/08/2016 au 31/12/2023
      depuis2024: 3.45, // PEL ouverts depuis 01/01/2024
      depuis2025: 2.95, // PEL ouverts depuis 01/01/2025
    },
    /** Montant maximum du prêt */
    montantMax: 92000,
    /** Durée */
    dureeMin: 2,
    dureeMax: 15,
    /** Ancienneté minimum PEL */
    ancienneteMin: 4, // 4 ans (depuis 2024) - était 2 ans avant
    /** Prime d'État supprimée depuis 2018 */
    primeEtat: false,
  },
  CEL: {
    /** Taux du prêt (taux épargne + 1,5%) */
    margeTaux: 1.5, // % au-dessus du taux d'épargne
    tauxActuel: 3.5, // Environ pour CEL récents
    /** Montant maximum */
    montantMax: 23000,
    /** Durée */
    dureeMin: 2,
    dureeMax: 15,
    /** Ancienneté minimum */
    ancienneteMin: 18, // mois
    /** Cumulable avec prêt PEL */
    cumulablePEL: true,
    montantMaxCumule: 92000, // PEL + CEL combinés
  },
  /** Opérations finançables */
  operations: [
    'acquisition_residence_principale',
    'construction_residence_principale',
    'travaux_residence_principale',
    'acquisition_residence_secondaire', // Possible mais conditions
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// PRÊTS RÉGIONAUX ET LOCAUX 2025 - LISTE PAR RÉGION
// Source: ANIL, Préfectures, collectivités territoriales - Décembre 2025
// Note: 86+ aides locales recensées - Liste non exhaustive
// ══════════════════════════════════════════════════════════════════════════════
export const PRETS_REGIONAUX_2025: Record<string, {
  region: string
  aides: Array<{
    nom: string
    organisme: string
    montantMin?: number
    montantMax: number
    taux: number
    conditions: string[]
    cumulable: string[]
  }>
}> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // ÎLE-DE-FRANCE
  // ═══════════════════════════════════════════════════════════════════════════
  'ile-de-france': {
    region: 'Île-de-France',
    aides: [
      {
        nom: 'Prêt 92',
        organisme: 'Département Hauts-de-Seine',
        montantMin: 10000,
        montantMax: 30000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Revenus < plafonds PAS',
          'Logement dans le 92',
          'Résidence principale',
        ],
        cumulable: ['PTZ', 'PAS', 'Action Logement'],
      },
      {
        nom: 'Prêt Paris Logement 0%',
        organisme: 'Ville de Paris',
        montantMin: 10000,
        montantMax: 39600,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Revenus < plafonds PSLA',
          'Logement à Paris',
          'Résidence principale depuis 1 an',
        ],
        cumulable: ['PTZ', 'PAS'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROVENCE-ALPES-CÔTE D'AZUR
  // ═══════════════════════════════════════════════════════════════════════════
  'paca': {
    region: 'Provence-Alpes-Côte d\'Azur',
    aides: [
      {
        nom: 'Aide accession Bouches-du-Rhône',
        organisme: 'Département 13',
        montantMax: 15000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Revenus modestes',
          'Logement neuf ou ancien',
        ],
        cumulable: ['PTZ', 'PAS'],
      },
      {
        nom: 'PTZ+ Alpes-Maritimes',
        organisme: 'Département 06',
        montantMax: 10000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Plafonds revenus stricts',
        ],
        cumulable: ['PTZ', 'Action Logement'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NOUVELLE-AQUITAINE
  // ═══════════════════════════════════════════════════════════════════════════
  'nouvelle-aquitaine': {
    region: 'Nouvelle-Aquitaine',
    aides: [
      {
        nom: 'PTZ+ Bordeaux Métropole',
        organisme: 'Bordeaux Métropole',
        montantMax: 20000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Logement dans la métropole',
          'Revenus < plafonds PAS',
        ],
        cumulable: ['PTZ', 'PAS', 'Action Logement'],
      },
      {
        nom: 'Prêt Accession Landes',
        organisme: 'Département 40',
        montantMax: 15000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Construction ou achat neuf',
        ],
        cumulable: ['PTZ'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OCCITANIE
  // ═══════════════════════════════════════════════════════════════════════════
  'occitanie': {
    region: 'Occitanie',
    aides: [
      {
        nom: 'Pass Accession Toulouse',
        organisme: 'Toulouse Métropole',
        montantMin: 5000,
        montantMax: 10000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Logement neuf ou ancien',
          'Revenus < plafonds',
        ],
        cumulable: ['PTZ', 'PAS'],
      },
      {
        nom: 'Aide accession Hérault',
        organisme: 'Département 34',
        montantMax: 11000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Revenus modestes',
        ],
        cumulable: ['PTZ'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BRETAGNE
  // ═══════════════════════════════════════════════════════════════════════════
  'bretagne': {
    region: 'Bretagne',
    aides: [
      {
        nom: 'Prêt Rennes Métropole',
        organisme: 'Rennes Métropole',
        montantMax: 40000,
        taux: 1,
        conditions: [
          'Primo-accédant',
          'Salariés secteur privé ou agricole',
          'Entreprise > 10 salariés',
        ],
        cumulable: ['PTZ', 'Action Logement'],
      },
      {
        nom: 'Agri-Accession',
        organisme: 'MSA Bretagne',
        montantMax: 25000,
        taux: 1,
        conditions: [
          'Salarié agricole',
          'Primo-accédant',
        ],
        cumulable: ['PTZ'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUVERGNE-RHÔNE-ALPES
  // ═══════════════════════════════════════════════════════════════════════════
  'auvergne-rhone-alpes': {
    region: 'Auvergne-Rhône-Alpes',
    aides: [
      {
        nom: 'Prêt Lyon Métropole',
        organisme: 'Métropole de Lyon',
        montantMax: 22000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Logement dans la métropole',
          'Revenus < plafonds PSLA',
        ],
        cumulable: ['PTZ', 'PAS'],
      },
      {
        nom: 'PTZ+ Haute-Savoie',
        organisme: 'Département 74',
        montantMax: 13000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Logement dans le 74',
        ],
        cumulable: ['PTZ'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HAUTS-DE-FRANCE
  // ═══════════════════════════════════════════════════════════════════════════
  'hauts-de-france': {
    region: 'Hauts-de-France',
    aides: [
      {
        nom: 'Aide accession Oise',
        organisme: 'Département 60',
        montantMax: 11000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Logement neuf',
          'Revenus modestes',
        ],
        cumulable: ['PTZ', 'PAS'],
      },
      {
        nom: 'Subvention Nord',
        organisme: 'Département 59',
        montantMin: 2500,
        montantMax: 5000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Neuf ou ancien',
        ],
        cumulable: ['PTZ'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NORMANDIE
  // ═══════════════════════════════════════════════════════════════════════════
  'normandie': {
    region: 'Normandie',
    aides: [
      {
        nom: 'Prêt Accession Calvados',
        organisme: 'Département 14',
        montantMax: 8000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Revenus < plafonds PAS',
        ],
        cumulable: ['PTZ'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GRAND EST
  // ═══════════════════════════════════════════════════════════════════════════
  'grand-est': {
    region: 'Grand Est',
    aides: [
      {
        nom: 'Prêt Eurométropole Strasbourg',
        organisme: 'Eurométropole Strasbourg',
        montantMax: 18000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Logement dans la métropole',
        ],
        cumulable: ['PTZ', 'PAS'],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYS DE LA LOIRE
  // ═══════════════════════════════════════════════════════════════════════════
  'pays-de-la-loire': {
    region: 'Pays de la Loire',
    aides: [
      {
        nom: 'Pass Accession Nantes',
        organisme: 'Nantes Métropole',
        montantMax: 15000,
        taux: 0,
        conditions: [
          'Primo-accédant',
          'Logement dans la métropole',
          'Revenus < plafonds PSLA',
        ],
        cumulable: ['PTZ', 'Action Logement'],
      },
    ],
  },
}

/** Liste des communes avec aides locales spécifiques (42 agglos identifiées) */
export const COMMUNES_AIDES_SPECIFIQUES = [
  // Exemples d'intercommunalités actives
  { code: '79191', nom: 'Niort Agglo', aide: 'PTZ+ ancien', montant: 5000 },
  { code: '79247', nom: 'Secondigny', aide: 'Aide construction', montant: 3000 },
  { code: '35238', nom: 'Fougères Agglo', aide: 'Prêt accession', montant: 10000 },
  // etc. - 42 agglos référencées par ANIL
]

/** Sources de données pour intégration SaaS */
export const SOURCES_DONNEES_AIDES = {
  anil: {
    url: 'https://www.anil.org/aides-locales-accession-propriete/',
    description: 'Outil interactif par département - 86+ aides',
    methode: 'Consultation manuelle ou scraping',
  },
  dgfip: {
    url: 'https://api.gouv.fr/les-api/api-ficoba',
    description: 'API Masses Fiscales - plafonds revenus/territoires',
    methode: 'API REST gratuite',
  },
  prefectures: {
    url: 'https://www.prefectures.gouv.fr',
    description: 'Aides par département',
    methode: 'Consultation par département',
  },
  ecologie: {
    url: 'https://www.ecologie.gouv.fr',
    description: 'PDF synthèse nationale aides 2025',
    methode: 'Parsing PDF trimestriel',
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// PONDÉRATIONS REVENUS - PRATIQUE BANCAIRE STANDARD
// Source: Critères internes banques, CAFPI, Pretto
// ══════════════════════════════════════════════════════════════════════════════
export const PONDERATIONS_REVENUS_BANCAIRES = {
  /** Revenus pris à 100% */
  stables: {
    salaire_net_cdi: { coef: 1.0, label: 'Salaire net CDI', conditions: 'Hors période essai' },
    salaire_fonctionnaire: { coef: 1.0, label: 'Traitement fonctionnaire', conditions: 'Titulaire' },
    pension_retraite: { coef: 1.0, label: 'Pension retraite', conditions: 'Garantie à vie' },
    prime_13e_mois: { coef: 1.0, label: '13ème mois contractuel', conditions: 'Si prévu au contrat' },
  },
  /** Revenus pondérés 70-80% */
  semi_stables: {
    prime_annuelle: { coef: 0.80, label: 'Prime annuelle récurrente', conditions: 'Si versée 3 ans consécutifs' },
    pension_alimentaire: { coef: 0.80, label: 'Pension alimentaire reçue', conditions: 'Jugement + paiement régulier' },
    revenus_locatifs: { coef: 0.70, label: 'Revenus locatifs', conditions: 'Standard bancaire 70%' },
    benefices_tns: { coef: 0.70, label: 'Bénéfices TNS/BIC/BNC', conditions: 'Moyenne 3 derniers bilans' },
    salaire_variable: { coef: 0.70, label: 'Part variable/commissions', conditions: 'Moyenne 2-3 ans' },
  },
  /** Revenus pondérés 50% ou moins */
  precaires: {
    salaire_cdd: { coef: 0.50, label: 'Salaire CDD/Intérim', conditions: 'Si ancienneté >= 24 mois dans secteur' },
    auto_entrepreneur: { coef: 0.50, label: 'Revenus auto-entrepreneur', conditions: 'Si 3 ans d\'activité' },
    allocations_caf: { coef: 0.50, label: 'Allocations CAF', conditions: 'Variables selon âge enfants' },
    dividendes: { coef: 0.50, label: 'Dividendes', conditions: 'Si 3 années consécutives' },
  },
  /** Revenus non pris en compte */
  exclus: {
    prime_exceptionnelle: { coef: 0, label: 'Prime exceptionnelle', conditions: 'Non récurrente' },
    indemnites_chomage: { coef: 0, label: 'Indemnités chômage', conditions: 'Temporaires' },
    revenus_placement: { coef: 0, label: 'Plus-values/intérêts', conditions: 'Non garantis' },
  },
}

/** Coefficients selon statut professionnel */
export const COEFFICIENTS_STATUT_PROFESSIONNEL = {
  cdi: { coef: 1.0, label: 'CDI', ancienneteMin: 0, description: 'Revenus stables' },
  cdi_periode_essai: { coef: 0.80, label: 'CDI période essai', ancienneteMin: 0, description: 'Attendre fin PE recommandé' },
  fonctionnaire_titulaire: { coef: 1.0, label: 'Fonctionnaire titulaire', ancienneteMin: 0, description: 'Sécurité emploi' },
  fonctionnaire_stagiaire: { coef: 0.90, label: 'Fonctionnaire stagiaire', ancienneteMin: 0, description: 'En attente titularisation' },
  cdd: { coef: 0.50, label: 'CDD', ancienneteMin: 24, description: 'Minimum 24 mois dans secteur' },
  interim: { coef: 0.50, label: 'Intérimaire', ancienneteMin: 24, description: 'Minimum 24 mois dans secteur' },
  profession_liberale: { coef: 0.70, label: 'Profession libérale', ancienneteMin: 36, description: '3 bilans minimum' },
  gerant_tns: { coef: 0.70, label: 'Gérant TNS', ancienneteMin: 36, description: '3 bilans minimum' },
  auto_entrepreneur: { coef: 0.50, label: 'Auto-entrepreneur', ancienneteMin: 36, description: '3 ans d\'activité minimum' },
  retraite: { coef: 1.0, label: 'Retraité', ancienneteMin: 0, description: 'Revenus garantis' },
  sans_emploi: { coef: 0, label: 'Sans emploi', ancienneteMin: 0, description: 'Non finançable' },
}

// ══════════════════════════════════════════════════════════════════════════════
// FRAIS DE NOTAIRE 2025
// Ref: Art. A. 444-53 et A. 444-174 Code de commerce (émoluments)
// ══════════════════════════════════════════════════════════════════════════════
export const FRAIS_NOTAIRE_2025 = {
  /** Estimation simplifiée */
  estimation: {
    neuf: 0.025, // ~2.5% (émoluments + taxes réduites)
    ancien: 0.08, // ~7-8% (émoluments + droits mutation 5.8%)
  },
  /** Barème émoluments (art. A. 444-91) */
  emoluments: {
    tranches: [
      { max: 6500, taux: 0.03945 },
      { max: 17000, taux: 0.01627 },
      { max: 60000, taux: 0.01085 },
      { max: Infinity, taux: 0.00814 },
    ],
    tva: 0.20, // 20% sur émoluments
  },
  /** Droits de mutation (DMTO) - ancien uniquement */
  dmto: {
    departement: 0.045, // 4.5% (peut être 3.8% dans certains dpts)
    commune: 0.012, // 1.2%
    fraisAssiette: 0.001, // 0.1%
    // Total standard: 5.8% ou 5.09% selon département
  },
}

/** Calcul détaillé des frais de notaire */
export function calculerFraisNotaire(prixBien: number, neuf: boolean): {
  total: number
  emoluments: number
  dmto: number
  debours: number
  detail: string
} {
  // Émoluments (même calcul neuf et ancien)
  let emoluments = 0
  let reste = prixBien
  for (const { max, taux } of FRAIS_NOTAIRE_2025.emoluments.tranches) {
    const base = Math.min(reste, max - (max === Infinity ? 0 : (FRAIS_NOTAIRE_2025.emoluments.tranches.find(t => t.max > max - 1)?.max || 0)))
    if (base <= 0) break
    emoluments += base * taux
    reste -= base
    if (reste <= 0) break
  }
  emoluments = emoluments * (1 + FRAIS_NOTAIRE_2025.emoluments.tva) // + TVA
  
  // DMTO (ancien uniquement)
  const dmto = neuf ? prixBien * 0.007 : prixBien * 0.058 // Taxe publicité foncière neuf ~0.7%, DMTO ancien ~5.8%
  
  // Débours (frais administratifs, cadastre, etc.)
  const debours = 800 + prixBien * 0.001 // Estimation ~800€ + 0.1%
  
  const total = Math.round(emoluments + dmto + debours)
  
  return {
    total,
    emoluments: Math.round(emoluments),
    dmto: Math.round(dmto),
    debours: Math.round(debours),
    detail: neuf 
      ? `Neuf: émoluments ${Math.round(emoluments)}€ + taxe pub. foncière ${Math.round(dmto)}€ + débours ${Math.round(debours)}€`
      : `Ancien: émoluments ${Math.round(emoluments)}€ + DMTO ${Math.round(dmto)}€ + débours ${Math.round(debours)}€`,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// GARANTIES 2025 - LISTE EXHAUSTIVE
// Sources: CAFPI, Gestion de Patrimoine, Capital.fr - Décembre 2025
// ══════════════════════════════════════════════════════════════════════════════
export const GARANTIES_2025 = {
  // ═══════════════════════════════════════════════════════════════════════════
  // CAUTIONS MUTUELLES
  // ═══════════════════════════════════════════════════════════════════════════
  credit_logement: {
    type: 'caution',
    label: 'Crédit Logement',
    fraisCommission: 0.008, // ~0.8% du montant
    fmg: 0.004, // ~0.4% Fonds Mutuel de Garantie (restitué en partie à terme)
    restitution: 0.70, // ~70% du FMG restitué en fin de prêt
    fraisDossier: 200, // Frais fixes
    banques: ['Toutes banques partenaires (200+ établissements)'],
    avantages: ['Leader du marché', 'Restitution partielle FMG', 'Pas de mainlevée'],
    inconvenients: ['Accord selon scoring', 'Pas de remboursement anticipé partiel du FMG'],
    description: 'Organisme de caution mutuelle leader - 200 banques partenaires',
  },
  saccef: {
    type: 'caution',
    label: 'SACCEF',
    fraisCommission: 0.0125, // ~1.25% (entre 1.25% et 1.5%)
    fmg: 0, // Pas de FMG
    restitution: 0, // Pas de restitution
    fraisDossier: 150,
    banques: ['Caisse d\'Épargne', 'Banque Populaire'],
    avantages: ['Coût apparent plus faible', 'Mise en place rapide'],
    inconvenients: ['Pas de restitution', 'Réservé aux banques du groupe BPCE'],
    description: 'Caution Caisse d\'Épargne et Banque Populaire',
  },
  camca: {
    type: 'caution',
    label: 'CAMCA',
    fraisCommission: 0.011, // ~1.1%
    fmg: 0.003,
    restitution: 0.75, // 75% restitué
    fraisDossier: 170,
    banques: ['Crédit Agricole', 'LCL'],
    avantages: ['Restitution partielle', 'Réseau Crédit Agricole'],
    inconvenients: ['Réservé aux clients Crédit Agricole/LCL'],
    description: 'Caution mutuelle du groupe Crédit Agricole',
  },
  casden: {
    type: 'caution',
    label: 'CASDEN',
    fraisCommission: 0.006, // ~0.6% - très avantageux
    fmg: 0.003,
    restitution: 0.80, // 80% restitué
    fraisDossier: 100,
    banques: ['CASDEN Banque Populaire'],
    eligibilite: 'Fonctionnaires Éducation nationale, Recherche, Culture, Jeunesse & Sports',
    avantages: ['Coût très faible', 'Restitution élevée 80%', 'Taux préférentiels'],
    inconvenients: ['Réservé aux fonctionnaires éducation'],
    description: 'Réservé aux fonctionnaires Éducation nationale',
  },
  mgen: {
    type: 'caution',
    label: 'MGEN Caution',
    fraisCommission: 0.007, // ~0.7%
    fmg: 0.003,
    restitution: 0.75, // 75% restitué
    fraisDossier: 120,
    banques: ['Partenaires MGEN'],
    eligibilite: 'Adhérents MGEN (santé, prévoyance)',
    avantages: ['Coût avantageux', 'Restitution 75%'],
    inconvenients: ['Réservé aux adhérents MGEN'],
    description: 'Réservé aux adhérents MGEN (mutuelle enseignement)',
  },
  cnp: {
    type: 'caution',
    label: 'Caution CNP',
    fraisCommission: 0.009, // ~0.9%
    fmg: 0.0035,
    restitution: 0.65, // 65% restitué
    fraisDossier: 180,
    banques: ['La Banque Postale', 'Partenaires CNP Assurances'],
    avantages: ['Restitution partielle', 'Groupe CNP Assurances'],
    inconvenients: ['Principalement La Banque Postale'],
    description: 'Caution CNP Assurances / La Banque Postale',
  },
  socami: {
    type: 'caution',
    label: 'SOCAMI',
    fraisCommission: 0.010, // ~1%
    fmg: 0.003,
    restitution: 0.70,
    fraisDossier: 150,
    banques: ['Crédit Mutuel'],
    avantages: ['Réseau Crédit Mutuel', 'Restitution 70%'],
    inconvenients: ['Réservé au Crédit Mutuel'],
    description: 'Caution mutuelle du Crédit Mutuel',
  },
  cegc: {
    type: 'caution',
    label: 'CEGC (Compagnie Européenne de Garanties et Cautions)',
    fraisCommission: 0.011, // ~1.1%
    fmg: 0.0025,
    restitution: 0.60,
    fraisDossier: 200,
    banques: ['BNP Paribas', 'Société Générale', 'Banques partenaires'],
    avantages: ['Grandes banques partenaires', 'Procédure rapide'],
    inconvenients: ['Restitution plus faible 60%'],
    description: 'Caution BNP Paribas et autres grandes banques',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GARANTIES RÉELLES (Hypothèque, PPD, Nantissement)
  // ═══════════════════════════════════════════════════════════════════════════
  hypotheque: {
    type: 'garantie_reelle',
    label: 'Hypothèque conventionnelle',
    fraisNotaire: 0.015, // ~1.5% (émoluments + taxe publicité foncière)
    mainlevee: 0.007, // ~0.7% si remboursement anticipé avant terme
    restitution: 0,
    fraisDossier: 0,
    banques: ['Toutes banques'],
    biensConcernes: ['Neuf', 'Ancien', 'VEFA', 'Construction', 'Terrain'],
    avantages: ['Acceptée par toutes banques', 'Tous types de biens', 'Rassure les banques'],
    inconvenients: ['Coût élevé', 'Frais mainlevée si revente anticipée', 'Formalisme notarié'],
    description: 'Inscription au service de publicité foncière - tous biens',
  },
  hlspd: {
    type: 'garantie_reelle',
    label: 'HLSPD (ex-PPD)',
    labelComplet: 'Hypothèque Légale Spéciale du Prêteur de Deniers',
    fraisNotaire: 0.007, // ~0.7% (pas de taxe publicité foncière - exonérée)
    mainlevee: 0.007,
    restitution: 0,
    fraisDossier: 0,
    banques: ['Toutes banques'],
    biensConcernes: ['Ancien uniquement (bien existant)'],
    avantages: ['Moins cher que l\'hypothèque (pas de TPF)', 'Priorité sur créanciers'],
    inconvenients: ['Uniquement biens existants', 'Pas pour VEFA/construction/travaux'],
    description: 'Ancien PPD - uniquement biens existants (pas VEFA)',
  },
  nantissement: {
    type: 'garantie_reelle',
    label: 'Nantissement',
    frais: 0.001, // ~0.1% (frais dossier)
    mainlevee: 0,
    restitution: 0,
    fraisDossier: 200,
    banques: ['Toutes banques'],
    actifsConcernes: ['Assurance-vie', 'PEA', 'Compte-titres', 'Parts de SCPI'],
    avantages: ['Très peu coûteux', 'Pas de frais notaire', 'Conserve actifs placés'],
    inconvenients: ['Immobilisation du capital nanti', 'Valeur doit couvrir le prêt'],
    description: 'Nantissement d\'actifs financiers (AV, PEA, SCPI...)',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CAUTIONS FONCTIONNAIRES / PROFESSIONS SPÉCIFIQUES
  // ═══════════════════════════════════════════════════════════════════════════
  mfpf: {
    type: 'caution',
    label: 'MFPF (Mutuelle Fonctionnaires)',
    fraisCommission: 0.006,
    fmg: 0.003,
    restitution: 0.80,
    fraisDossier: 80,
    eligibilite: 'Fonctionnaires toutes fonctions publiques',
    avantages: ['Coût très faible', 'Restitution 80%'],
    inconvenients: ['Réservé fonctionnaires'],
    description: 'Mutuelle Fonction Publique - tous fonctionnaires',
  },
  ips: {
    type: 'caution',
    label: 'IPS (Caution Armées)',
    fraisCommission: 0.005,
    fmg: 0.002,
    restitution: 0.85,
    fraisDossier: 50,
    eligibilite: 'Militaires et gendarmes',
    avantages: ['Très avantageux', 'Restitution 85%'],
    inconvenients: ['Militaires/gendarmes uniquement'],
    description: 'Institution de Prévoyance des Armées',
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// FINANCEMENT SCPI 2025
// Sources: Meilleurtaux Placement, MeilleureSCPI.com - Mai/Décembre 2025
// ══════════════════════════════════════════════════════════════════════════════
export const FINANCEMENT_SCPI_2025 = {
  /** Taux moyens de financement SCPI (mai 2025) */
  taux: {
    10: { min: 3.20, moy: 3.50, max: 3.80 },
    15: { min: 3.40, moy: 3.70, max: 4.00 },
    20: { min: 3.60, moy: 3.90, max: 4.40 },
  },
  /** Montants min/max */
  montant: {
    min: 10000, // Minimum généralement 10 000€
    max: 500000, // Maximum selon banque/profil
    maxConso: 75000, // Max crédit conso
  },
  /** Durées */
  duree: {
    minImmo: 7, // Crédit immo affecté
    maxImmo: 20,
    maxConso: 7, // Crédit conso
  },
  /** Types de prêt */
  types: {
    amortissable: {
      label: 'Prêt amortissable',
      description: 'Remboursement capital + intérêts chaque mois',
      avantages: ['Désendettement progressif', 'Sécurité'],
    },
    in_fine: {
      label: 'Prêt in fine',
      description: 'Intérêts seuls pendant durée, capital remboursé à l\'échéance',
      avantages: ['Optimisation fiscale (déduction intérêts)', 'Mensualités plus faibles'],
      inconvenients: ['Nécessite épargne parallèle', 'Plus de risque'],
    },
  },
  /** Garanties acceptées pour SCPI */
  garanties: ['nantissement', 'hypotheque', 'caution'],
  /** Banques proposant financement SCPI */
  banques: [
    'Crédit Agricole', 'Banque Populaire', 'Crédit Mutuel', 
    'LCL', 'Société Générale', 'BNP Paribas',
  ],
}

// ══════════════════════════════════════════════════════════════════════════════
// ASSURANCE EMPRUNTEUR 2025
// Ref: Loi Lemoine (résiliation à tout moment)
// ══════════════════════════════════════════════════════════════════════════════
export const ASSURANCE_EMPRUNTEUR_2025 = {
  /** Taux moyens par tranche d'âge (% du capital initial / an) */
  tauxParAge: {
    moins30: 0.09,
    de30a34: 0.12,
    de35a39: 0.18,
    de40a44: 0.25,
    de45a49: 0.35,
    de50a54: 0.45,
    de55a59: 0.55,
    de60a64: 0.70,
    de65a69: 0.90,
    plus70: 1.20,
  },
  /** Garanties obligatoires selon projet */
  garanties: {
    residencePrincipale: ['DC', 'PTIA', 'ITT', 'IPT'], // Décès, Perte Totale Irréversible Autonomie, Incapacité Temp., Invalidité Perm.
    investissementLocatif: ['DC', 'PTIA'], // Minimum requis
  },
  /** Quotité minimum */
  quotiteMin: 1.0, // 100% sur une ou deux têtes
  /** Âge limite généralement accepté */
  ageLimite: 85, // ans en fin de prêt
}

/** Retourne le taux d'assurance selon l'âge */
export function getTauxAssuranceParAge(age: number): number {
  const taux = ASSURANCE_EMPRUNTEUR_2025.tauxParAge
  if (age < 30) return taux.moins30
  if (age < 35) return taux.de30a34
  if (age < 40) return taux.de35a39
  if (age < 45) return taux.de40a44
  if (age < 50) return taux.de45a49
  if (age < 55) return taux.de50a54
  if (age < 60) return taux.de55a59
  if (age < 65) return taux.de60a64
  if (age < 70) return taux.de65a69
  return taux.plus70
}

// ══════════════════════════════════════════════════════════════════════════════
// DUREES DE PRÊT AUTORISÉES (HCSF)
// ══════════════════════════════════════════════════════════════════════════════
export const DUREES_PRET_AUTORISEES = [7, 10, 12, 15, 17, 20, 22, 25] // 27 uniquement pour VEFA

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS DE CALCUL
// ══════════════════════════════════════════════════════════════════════════════

/** Calcul de la mensualité hors assurance */
export function calculerMensualiteHorsAssurance(
  montant: number,
  dureeAnnees: number,
  tauxAnnuel: number
): number {
  if (montant <= 0 || dureeAnnees <= 0) return 0
  const n = dureeAnnees * 12
  const t = tauxAnnuel / 100 / 12
  if (t <= 0) return montant / n
  return montant * (t * Math.pow(1 + t, n)) / (Math.pow(1 + t, n) - 1)
}

/** Calcul du coût total des intérêts */
export function calculerCoutTotalInterets(
  montant: number,
  dureeAnnees: number,
  tauxAnnuel: number
): number {
  const mensualite = calculerMensualiteHorsAssurance(montant, dureeAnnees, tauxAnnuel)
  return mensualite * dureeAnnees * 12 - montant
}

/** Calcul du reste à vivre minimum selon la composition du foyer */
export function calculerResteAVivreMinimum(
  situationFamiliale: 'seul' | 'couple',
  nbEnfants: number
): number {
  const base = situationFamiliale === 'couple' 
    ? NORMES_HCSF_2025.resteAVivreMinCouple 
    : NORMES_HCSF_2025.resteAVivreMinSeul
  return base + (nbEnfants * NORMES_HCSF_2025.resteAVivreParEnfant)
}

/** Détermine la tranche PTZ selon le RFR et la zone */
export function determinerTranchePTZ(
  rfr: number,
  zone: string,
  tailleForyer: number
): 1 | 2 | 3 | 4 | null {
  const plafonds = PLAFONDS_REVENUS_PTZ_2025[zone]
  if (!plafonds) return null
  
  const taille = Math.min(tailleForyer, 8)
  const plafond = plafonds[taille]
  
  // Les tranches sont déterminées par le plafond de revenus
  // Tranche 1: <= plafond (quotité max)
  // Tranche 2: <= plafond * 1.2
  // Tranche 3: <= plafond * 1.5
  // Tranche 4: <= plafond * 2
  if (rfr <= plafond) return 1
  if (rfr <= plafond * 1.2) return 2
  if (rfr <= plafond * 1.5) return 3
  if (rfr <= plafond * 2) return 4
  return null // Non éligible
}

/** Vérifie l'éligibilité PTZ 2025 */
export function verifierEligibilitePTZ(params: {
  primoAccedant: boolean
  residencePrincipale: boolean
  neuf: boolean
  typeBien: 'appartement' | 'maison'
  zone: string
  prixBien: number
  travaux: number
  rfr: number
  tailleForyer: number
}): {
  eligible: boolean
  raisons: string[]
  tranche: number | null
  quotite: number
  montantMax: number
} {
  const raisons: string[] = []
  
  if (!params.primoAccedant) {
    raisons.push('Non primo-accédant (propriétaire RP depuis moins de 2 ans)')
  }
  
  if (!params.residencePrincipale) {
    raisons.push('Le bien doit être la résidence principale')
  }
  
  // Vérifier éligibilité selon neuf/ancien
  if (!params.neuf) {
    // Ancien: uniquement zones B2/C avec 25% travaux
    if (!CONDITIONS_PTZ_2025.zonesAncien.includes(params.zone)) {
      raisons.push(`Ancien avec travaux: uniquement en zones B2 et C (zone actuelle: ${params.zone})`)
    }
    const ratioTravaux = params.travaux / params.prixBien
    if (ratioTravaux < CONDITIONS_PTZ_2025.seuilTravauxAncien) {
      raisons.push(`Travaux insuffisants: ${(ratioTravaux * 100).toFixed(1)}% < 25% requis`)
    }
  }
  
  // Déterminer la tranche
  const tranche = determinerTranchePTZ(params.rfr, params.zone, params.tailleForyer)
  if (!tranche) {
    raisons.push('Revenus supérieurs aux plafonds PTZ de la zone')
  }
  
  // Calcul quotité et montant
  let quotite = 0
  if (tranche) {
    const quotites = params.neuf 
      ? (params.typeBien === 'maison' ? QUOTITES_PTZ_2025.neuf_individuel : QUOTITES_PTZ_2025.neuf_collectif)
      : QUOTITES_PTZ_2025.ancien_travaux
    
    quotite = quotites[`tranche${tranche}` as keyof typeof quotites] as number || 0
  }
  
  // Plafond d'opération
  const taillePlafond = Math.min(params.tailleForyer, 5)
  const plafondOperation = PLAFONDS_OPERATION_PTZ_2025[params.zone]?.[taillePlafond] || 0
  const coutOperation = Math.min(params.prixBien + params.travaux, plafondOperation)
  const montantMax = Math.round(coutOperation * quotite)
  
  return {
    eligible: raisons.length === 0 && tranche !== null,
    raisons,
    tranche,
    quotite,
    montantMax,
  }
}

/** Vérifie l'éligibilité au Prêt Action Logement */
export function verifierEligibiliteActionLogement(params: {
  salarieSecteurPrive: boolean
  tailleEntreprise: number
  secteurAgricole: boolean
  residencePrincipale: boolean
  rfr: number
  zone: string
  tailleForyer: number
}): {
  eligible: boolean
  raisons: string[]
  montantMax: number
} {
  const raisons: string[] = []
  
  if (!params.salarieSecteurPrive) {
    raisons.push('Réservé aux salariés du secteur privé')
  }
  
  if (params.tailleEntreprise < PRET_ACTION_LOGEMENT_2025.conditions.tailleEntreprise) {
    raisons.push(`Entreprise doit avoir au moins ${PRET_ACTION_LOGEMENT_2025.conditions.tailleEntreprise} salariés`)
  }
  
  if (params.secteurAgricole) {
    raisons.push('Secteur agricole: se rapprocher du prêt Agri-Accession')
  }
  
  if (!params.residencePrincipale) {
    raisons.push('Uniquement pour la résidence principale')
  }
  
  // Vérifier plafonds PLI
  const plafondsPLI = PLAFONDS_PLI_2025[params.zone]
  if (plafondsPLI) {
    const taille = Math.min(params.tailleForyer, 6)
    const plafond = plafondsPLI[taille]
    if (params.rfr > plafond) {
      raisons.push(`Revenus supérieurs au plafond PLI (${params.rfr.toLocaleString()}€ > ${plafond.toLocaleString()}€)`)
    }
  }
  
  return {
    eligible: raisons.length === 0,
    raisons,
    montantMax: raisons.length === 0 ? PRET_ACTION_LOGEMENT_2025.montantMax : 0,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL TAUX D'ENDETTEMENT (NORMES HCSF 2025)
// Le taux d'endettement = charges de crédit / revenus nets
// ══════════════════════════════════════════════════════════════════════════════

export interface CalculEndettementParams {
  /** Revenus nets mensuels du foyer (salaires nets, revenus locatifs nets à 70%, etc.) */
  revenusMensuels: number
  /** Total des mensualités de crédits en cours (hors projet) */
  mensualitesCreditsEnCours: number
  /** Loyer actuel (pour calcul avec/hors loyer) */
  loyerActuel: number
  /** Situation familiale pour le reste à vivre */
  situationFamiliale: 'seul' | 'couple'
  /** Nombre d'enfants */
  nbEnfants: number
}

export interface ResultatEndettement {
  /** Taux d'endettement actuel (crédits / revenus) - Norme HCSF */
  tauxActuel: number
  /** Taux d'endettement avec loyer (crédits + loyer / revenus) - Pour investissement locatif */
  tauxAvecLoyer: number
  /** Mensualité max possible pour rester sous 35% (hors loyer - achat RP) */
  mensualiteMaxHorsLoyer: number
  /** Mensualité max possible pour rester sous 35% (avec loyer - investissement) */
  mensualiteMaxAvecLoyer: number
  /** Reste à vivre minimum recommandé */
  resteAVivreMinimum: number
  /** Reste à vivre actuel */
  resteAVivreActuel: number
  /** Statut endettement */
  statut: 'ok' | 'attention' | 'critique'
  /** Message explicatif */
  message: string
}

/**
 * Calcule le taux d'endettement selon les normes HCSF 2025
 * 
 * Règles HCSF :
 * - Taux max = 35% (assurance incluse)
 * - Seuls les crédits comptent (pas les charges courantes)
 * - Pour achat RP : le loyer disparaît
 * - Pour investissement : le loyer reste une charge
 */
export function calculerEndettement(params: CalculEndettementParams): ResultatEndettement {
  const { 
    revenusMensuels, 
    mensualitesCreditsEnCours, 
    loyerActuel,
    situationFamiliale,
    nbEnfants 
  } = params
  
  // Protection division par zéro
  if (revenusMensuels <= 0) {
    return {
      tauxActuel: 0,
      tauxAvecLoyer: 0,
      mensualiteMaxHorsLoyer: 0,
      mensualiteMaxAvecLoyer: 0,
      resteAVivreMinimum: calculerResteAVivreMinimum(situationFamiliale, nbEnfants),
      resteAVivreActuel: 0,
      statut: 'critique',
      message: 'Revenus non renseignés'
    }
  }
  
  // Taux d'endettement actuel (HCSF = crédits / revenus uniquement)
  const tauxActuel = (mensualitesCreditsEnCours / revenusMensuels) * 100
  
  // Taux avec loyer (pour calcul capacité investissement)
  const tauxAvecLoyer = ((mensualitesCreditsEnCours + loyerActuel) / revenusMensuels) * 100
  
  const tauxMax = NORMES_HCSF_2025.tauxEndettementMax * 100 // 35%
  
  // Mensualité max = (revenus × 35%) - charges déjà engagées
  // Pour achat RP : le loyer disparaît, donc on ne déduit que les crédits
  const mensualiteMaxHorsLoyer = Math.max(0, (revenusMensuels * NORMES_HCSF_2025.tauxEndettementMax) - mensualitesCreditsEnCours)
  
  // Pour investissement : le loyer reste une charge, on déduit crédits + loyer
  const mensualiteMaxAvecLoyer = Math.max(0, (revenusMensuels * NORMES_HCSF_2025.tauxEndettementMax) - mensualitesCreditsEnCours - loyerActuel)
  
  // Reste à vivre
  const resteAVivreMinimum = calculerResteAVivreMinimum(situationFamiliale, nbEnfants)
  const resteAVivreActuel = revenusMensuels - mensualitesCreditsEnCours - loyerActuel
  
  // Statut - basé sur le taux AVEC loyer (situation réelle du client)
  let statut: 'ok' | 'attention' | 'critique' = 'ok'
  let message = ''
  
  if (tauxAvecLoyer > tauxMax) {
    statut = 'critique'
    message = `Endettement critique : ${tauxAvecLoyer.toFixed(1)}% > 35% (norme HCSF)`
  } else if (tauxAvecLoyer > 30) {
    statut = 'attention'
    message = `Endettement élevé : ${tauxAvecLoyer.toFixed(1)}% - Marge limitée`
  } else if (resteAVivreActuel < resteAVivreMinimum) {
    statut = 'attention'
    message = `Reste à vivre insuffisant : ${resteAVivreActuel.toFixed(0)}€ < ${resteAVivreMinimum}€ recommandé`
  } else {
    message = `Endettement sain : ${tauxAvecLoyer.toFixed(1)}%`
  }
  
  return {
    tauxActuel,
    tauxAvecLoyer,
    mensualiteMaxHorsLoyer,
    mensualiteMaxAvecLoyer,
    resteAVivreMinimum,
    resteAVivreActuel,
    statut,
    message
  }
}

/**
 * Calcule la capacité d'emprunt maximale
 */
export function calculerCapaciteEmprunt(params: {
  mensualiteMax: number
  dureeAnnees: number
  tauxAnnuel: number
}): number {
  const { mensualiteMax, dureeAnnees, tauxAnnuel } = params
  if (mensualiteMax <= 0 || dureeAnnees <= 0) return 0
  
  const n = dureeAnnees * 12
  const t = tauxAnnuel / 100 / 12
  
  if (t <= 0) return mensualiteMax * n
  
  // Formule inverse : Capital = Mensualité × [(1+t)^n - 1] / [t × (1+t)^n]
  return mensualiteMax * (Math.pow(1 + t, n) - 1) / (t * Math.pow(1 + t, n))
}

/** Vérifie l'éligibilité à l'Éco-PTZ */
export function verifierEligibiliteEcoPTZ(params: {
  residencePrincipale: boolean
  ancienneteLogement: number
  montantTravaux: number
  nbCategoriesTravaux: number
  gainEnergetique?: number
  coupleMaprimerenov?: boolean
}): {
  eligible: boolean
  raisons: string[]
  plafond: number
  dureeMax: number
} {
  const raisons: string[] = []
  
  if (!params.residencePrincipale) {
    raisons.push('Le logement doit être une résidence principale')
  }
  
  if (params.ancienneteLogement < ECO_PTZ_2025.conditions.ancienneteLogement) {
    raisons.push(`Logement doit être achevé depuis au moins ${ECO_PTZ_2025.conditions.ancienneteLogement} ans`)
  }
  
  // Déterminer le plafond
  let plafond = 0
  let dureeMax = ECO_PTZ_2025.durees.standard
  
  if (params.coupleMaprimerenov) {
    plafond = ECO_PTZ_2025.plafonds.maprimerenov
  } else if (params.gainEnergetique && params.gainEnergetique >= 35) {
    plafond = ECO_PTZ_2025.plafonds.performanceGlobale
    dureeMax = ECO_PTZ_2025.durees.performanceGlobale
  } else if (params.nbCategoriesTravaux >= 3) {
    plafond = ECO_PTZ_2025.plafonds.troisActionsPlus
  } else if (params.nbCategoriesTravaux === 2) {
    plafond = ECO_PTZ_2025.plafonds.deuxActions
  } else if (params.nbCategoriesTravaux === 1) {
    plafond = ECO_PTZ_2025.plafonds.uneAction
  }
  
  const montantFinancable = Math.min(params.montantTravaux, plafond)
  if (montantFinancable < 7000 && !params.coupleMaprimerenov) {
    raisons.push('Montant minimum des travaux: 7 000 €')
  }
  
  return {
    eligible: raisons.length === 0 && plafond > 0,
    raisons,
    plafond: Math.min(params.montantTravaux, plafond),
    dureeMax,
  }
}
