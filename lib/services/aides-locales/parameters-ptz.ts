/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PARAMÈTRES PTZ ET AIDES — Pour les services Aides Locales
 * Extrait de parameters-emprunt.ts pour éviter les imports circulaires
 * Source: HCSF, CAFPI, Action Logement, Service-Public.fr, Légifrance
 * ══════════════════════════════════════════════════════════════════════════════
 */

/** Plafonds de revenus PTZ 2025 par zone et taille du foyer (RFR N-2) */
export const PLAFONDS_REVENUS_PTZ_2025: Record<string, Record<number, number>> = {
  A_bis: { 1: 49000, 2: 73500, 3: 88200, 4: 102900, 5: 117600, 6: 132300, 7: 147000, 8: 161700 },
  A: { 1: 49000, 2: 73500, 3: 88200, 4: 102900, 5: 117600, 6: 132300, 7: 147000, 8: 161700 },
  B1: { 1: 34500, 2: 51750, 3: 62100, 4: 72450, 5: 82800, 6: 93150, 7: 103500, 8: 113850 },
  B2: { 1: 31050, 2: 43470, 3: 52164, 4: 60858, 5: 69552, 6: 78246, 7: 86940, 8: 95634 },
  C: { 1: 27600, 2: 38640, 3: 46368, 4: 54096, 5: 61824, 6: 69552, 7: 77280, 8: 85008 },
}

/** Plafonds de ressources PLI 2025 (RFR N-2) pour Action Logement */
export const PLAFONDS_PLI_2025: Record<string, Record<number, number>> = {
  A_bis: { 1: 43475, 2: 64935, 3: 78062, 4: 93164, 5: 110996, 6: 124938 },
  A: { 1: 43475, 2: 64935, 3: 78062, 4: 93164, 5: 110996, 6: 124938 },
  B1: { 1: 35435, 2: 47321, 3: 56893, 4: 68680, 5: 80793, 6: 91077 },
  B2: { 1: 31892, 2: 42588, 3: 51204, 4: 61812, 5: 72714, 6: 81969 },
  C: { 1: 31892, 2: 42588, 3: 51204, 4: 61812, 5: 72714, 6: 81969 },
}

/** PAS - PRÊT À L'ACCESSION SOCIALE 2025 */
export const PRET_ACCESSION_SOCIALE_2025 = {
  tauxPlafonds: {
    moins12ans: 5.50,
    de12a15ans: 5.70,
    de15a20ans: 5.80,
    plus20ans: 5.85,
  } as Record<string, number>,
  duree: { min: 5, max: 30, recommandee: 25 },
  aplEligible: true,
  fraisDossierMax: 500,
  plafonds: {
    A_bis: { 1: 37000, 2: 51800, 3: 62900, 4: 74000, 5: 85100, 6: 96200 },
    A: { 1: 37000, 2: 51800, 3: 62900, 4: 74000, 5: 85100, 6: 96200 },
    B1: { 1: 30000, 2: 42000, 3: 51000, 4: 60000, 5: 69000, 6: 78000 },
    B2: { 1: 27000, 2: 37800, 3: 45900, 4: 54000, 5: 62100, 6: 70200 },
    C: { 1: 24000, 2: 33600, 3: 40800, 4: 48000, 5: 55200, 6: 62400 },
  },
  operations: [
    'acquisition_neuf',
    'acquisition_ancien',
    'acquisition_ancien_travaux',
    'construction',
    'travaux_amelioration',
  ],
  conditions: {
    residencePrincipale: true,
    proprietaireOccupant: true,
  },
}

/** Prêts régionaux et locaux 2025 */
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
  'ile-de-france': {
    region: 'Île-de-France',
    aides: [
      {
        nom: 'Prêt 92',
        organisme: 'Département Hauts-de-Seine',
        montantMin: 10000,
        montantMax: 30000,
        taux: 0,
        conditions: ['Primo-accédant', 'Revenus < plafonds PAS', 'Logement dans le 92', 'Résidence principale'],
        cumulable: ['PTZ', 'PAS', 'Action Logement'],
      },
      {
        nom: 'Prêt Paris Logement 0%',
        organisme: 'Ville de Paris',
        montantMin: 10000,
        montantMax: 39600,
        taux: 0,
        conditions: ['Primo-accédant', 'Revenus < plafonds PSLA', 'Logement à Paris', 'Résidence principale depuis 1 an'],
        cumulable: ['PTZ', 'PAS'],
      },
    ],
  },
  'paca': {
    region: 'Provence-Alpes-Côte d\'Azur',
    aides: [
      {
        nom: 'Aide accession Bouches-du-Rhône',
        organisme: 'Département 13',
        montantMax: 15000,
        taux: 0,
        conditions: ['Primo-accédant', 'Revenus modestes', 'Logement neuf ou ancien'],
        cumulable: ['PTZ', 'PAS'],
      },
    ],
  },
  'nouvelle-aquitaine': {
    region: 'Nouvelle-Aquitaine',
    aides: [
      {
        nom: 'PTZ+ Bordeaux Métropole',
        organisme: 'Bordeaux Métropole',
        montantMax: 20000,
        taux: 0,
        conditions: ['Primo-accédant', 'Logement dans la métropole', 'Revenus < plafonds PAS'],
        cumulable: ['PTZ', 'PAS', 'Action Logement'],
      },
    ],
  },
  'occitanie': {
    region: 'Occitanie',
    aides: [
      {
        nom: 'Pass Accession Toulouse',
        organisme: 'Toulouse Métropole',
        montantMin: 5000,
        montantMax: 10000,
        taux: 0,
        conditions: ['Primo-accédant', 'Logement neuf ou ancien', 'Revenus < plafonds'],
        cumulable: ['PTZ', 'PAS'],
      },
    ],
  },
  'bretagne': {
    region: 'Bretagne',
    aides: [
      {
        nom: 'Prêt Rennes Métropole',
        organisme: 'Rennes Métropole',
        montantMax: 40000,
        taux: 1,
        conditions: ['Primo-accédant', 'Salariés secteur privé ou agricole', 'Entreprise > 10 salariés'],
        cumulable: ['PTZ', 'Action Logement'],
      },
    ],
  },
  'auvergne-rhone-alpes': {
    region: 'Auvergne-Rhône-Alpes',
    aides: [
      {
        nom: 'Prêt Lyon Métropole',
        organisme: 'Métropole de Lyon',
        montantMax: 22000,
        taux: 0,
        conditions: ['Primo-accédant', 'Logement dans la métropole', 'Revenus < plafonds PSLA'],
        cumulable: ['PTZ', 'PAS'],
      },
    ],
  },
  'hauts-de-france': {
    region: 'Hauts-de-France',
    aides: [
      {
        nom: 'Aide accession Oise',
        organisme: 'Département 60',
        montantMax: 11000,
        taux: 0,
        conditions: ['Primo-accédant', 'Logement neuf', 'Revenus modestes'],
        cumulable: ['PTZ', 'PAS'],
      },
    ],
  },
  'normandie': {
    region: 'Normandie',
    aides: [
      {
        nom: 'Prêt Accession Calvados',
        organisme: 'Département 14',
        montantMax: 8000,
        taux: 0,
        conditions: ['Primo-accédant', 'Revenus < plafonds PAS'],
        cumulable: ['PTZ'],
      },
    ],
  },
  'grand-est': {
    region: 'Grand Est',
    aides: [
      {
        nom: 'Prêt Eurométropole Strasbourg',
        organisme: 'Eurométropole Strasbourg',
        montantMax: 18000,
        taux: 0,
        conditions: ['Primo-accédant', 'Logement dans la métropole'],
        cumulable: ['PTZ', 'PAS'],
      },
    ],
  },
  'pays-de-la-loire': {
    region: 'Pays de la Loire',
    aides: [
      {
        nom: 'Pass Accession Nantes',
        organisme: 'Nantes Métropole',
        montantMax: 15000,
        taux: 0,
        conditions: ['Primo-accédant', 'Logement dans la métropole', 'Revenus < plafonds PSLA'],
        cumulable: ['PTZ', 'Action Logement'],
      },
    ],
  },
}
