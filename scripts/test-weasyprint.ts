/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test end-to-end : génération PDF via WeasyPrint
 * Usage: npx tsx scripts/test-weasyprint.ts
 */
import { generateBilanPatrimonialPremiumHtml } from '../app/_common/lib/templates/bilan-patrimonial-premium'
import { PdfGenerator } from '../app/_common/lib/services/pdf-generator'
import * as fs from 'fs'

const mockData: any = {
  dossier: { id: 'test-001', reference: 'BP-2025-001', type: 'BILAN_PATRIMONIAL', createdAt: new Date() },
  client: {
    nom: 'Dupont', prenom: 'Jean',
    dateNaissance: new Date('1975-06-15'), age: 49,
    situationFamiliale: 'Marié(e)', enfants: 2,
    profession: 'Cadre supérieur',
    regimeMatrimonial: 'Communauté réduite aux acquêts',
    email: 'jean.dupont@email.com', telephone: '06 12 34 56 78',
  },
  conseiller: { nom: 'Martin', prenom: 'Sophie', email: 'sophie.martin@cabinet.fr', telephone: '01 23 45 67 89' },
  cabinet: { nom: 'Cabinet Patrimoine & Avenir', adresse: '12 rue de la Paix, 75002 Paris', telephone: '01 23 45 67 89', email: 'contact@patrimoine-avenir.fr' },
  patrimoine: {
    immobilier: [
      { type: 'Résidence principale', nom: 'Appartement Paris 16e', valeur: 850000, location: 'Paris 16e' },
      { type: 'Investissement locatif', nom: 'Studio Lyon 3e', valeur: 180000, location: 'Lyon 3e' },
      { type: 'SCPI', nom: 'SCPI Primopierre', valeur: 45000, location: 'Diversifié' },
    ],
    financier: [
      { type: 'Assurance-vie', nom: 'AV Generali Epargne', valeur: 120000 },
      { type: 'PEA', nom: 'PEA Boursorama', valeur: 45000 },
      { type: 'PER', nom: 'PER Swisslife', valeur: 32000 },
      { type: 'Livrets', nom: 'Livret A + LDDS', valeur: 35000 },
      { type: 'Compte-titres', nom: 'CTO Saxo', valeur: 28000 },
    ],
    professionnel: [
      { nom: 'Parts SCI familiale', valeur: 95000 },
    ],
    passifs: [
      { type: 'Crédit immobilier', nom: 'Crédit RP Paris', capitalRestant: 320000, tauxInteret: 1.8, mensualite: 1450 },
      { type: 'Crédit immobilier', nom: 'Crédit Studio Lyon', capitalRestant: 85000, tauxInteret: 2.1, mensualite: 520 },
    ],
  },
  revenus: {
    total: 92000,
    details: [
      { type: 'Salaire', montant: 6200, frequence: 'MENSUEL' },
      { type: 'Revenus fonciers', montant: 850, frequence: 'MENSUEL' },
      { type: 'Dividendes', montant: 3200, frequence: 'ANNUEL' },
    ],
  },
  charges: {
    total: 42000,
    totalMensualitesCredits: 1970,
  },
  simulations: [
    {
      type: 'SUCCESSION_SMP',
      nom: 'Simulation successorale',
      parametres: { patrimoine_net: 1025000, regime: 'Communauté réduite aux acquêts' },
      resultats: {
        droits_totaux: 78500,
        heritiers: [
          { nom: 'Conjoint', part: 512500, droits: 0, abattement: 80724 },
          { nom: 'Enfant 1', part: 256250, droits: 39250, abattement: 100000 },
          { nom: 'Enfant 2', part: 256250, droits: 39250, abattement: 100000 },
        ],
      },
    },
  ],
  preconisations: [
    {
      titre: 'Ouvrir un PER complémentaire',
      description: 'Versement de 8 000 €/an pour réduire votre IR de 2 400 € (TMI 30%)',
      priorite: 'HAUTE',
      montantEstime: 8000,
      produit: 'PER Individuel',
      categorie: 'Fiscalité',
      avantages: 'Réduction IR immédiate, capitalisation long terme, préparation retraite',
      risques: 'Blocage des fonds jusqu\'à la retraite (sauf cas de déblocage anticipé)',
      horizonTemporel: 'Moyen terme (5-15 ans)',
      impactFiscalAnnuel: -2400,
      scoreImpact: 85,
    },
    {
      titre: 'Diversifier le patrimoine financier',
      description: 'Réallouer 30 000 € vers un contrat d\'assurance-vie en unités de compte diversifiées',
      priorite: 'MOYENNE',
      montantEstime: 30000,
      produit: 'Assurance-vie multisupport',
      categorie: 'Épargne',
      avantages: 'Diversification, fiscalité avantageuse après 8 ans, transmission optimisée',
      risques: 'Risque de marché sur les UC, volatilité à court terme',
      horizonTemporel: 'Long terme (>8 ans)',
      impactFiscalAnnuel: 0,
      scoreImpact: 72,
    },
  ],
  audit: {
    budget: {
      revenusMensuels: 7667,
      chargesMensuelles: 3500,
      mensualitesCredits: 1970,
      resteAVivre: 2197,
      capaciteEpargneMensuelle: 1197,
      capaciteEpargneAnnuelle: 14364,
      tauxEffort: 25.7,
      tauxEpargne: 15.6,
      scoreSante: 'bon',
      narratif: 'Votre budget est bien maîtrisé avec un taux d\'épargne de 15.6%, supérieur au seuil recommandé de 15%.',
      alertes: [],
      detailRevenus: [
        { categorie: 'Salaire', montant: 6200, poids: 80.9 },
        { categorie: 'Revenus fonciers', montant: 850, poids: 11.1 },
        { categorie: 'Dividendes', montant: 267, poids: 3.5 },
      ],
      detailCharges: [
        { categorie: 'Logement', montant: 800, poids: 22.9 },
        { categorie: 'Alimentation', montant: 600, poids: 17.1 },
        { categorie: 'Transport', montant: 350, poids: 10.0 },
        { categorie: 'Assurances', montant: 280, poids: 8.0 },
        { categorie: 'Loisirs', montant: 400, poids: 11.4 },
      ],
    },
    fiscalite: {
      ir: {
        revenuBrut: 92000,
        deductions: 9200,
        revenuImposable: 82800,
        nombreParts: 3,
        quotientFamilial: 27600,
        impotBrut: 7320,
        plafonnementQF: 0,
        decote: 0,
        cehr: 0,
        impotTotal: 7320,
        contributionsSociales: 1560,
        tmi: 30,
        tauxEffectif: 8.8,
        tranches: [
          { taux: 0, base: 11294, impot: 0 },
          { taux: 11, base: 17821, impot: 1960 },
          { taux: 30, base: 0, impot: 5360 },
        ],
        revenuNetApresImpot: 83120,
        narratif: 'TMI à 30%. Marge d\'optimisation possible via PER.',
      },
      ifi: {
        patrimoineImmobilierBrut: 1075000,
        abattementRP: 255000,
        dettesDeductibles: 405000,
        patrimoineImposable: 0,
        montantIFI: 0,
        assujetti: false,
        narratif: 'Patrimoine immobilier net inférieur au seuil de 1 300 000 €. Non assujetti à l\'IFI.',
      },
      impactRevenusFonciers: {
        revenusFonciersAnnuels: 10200,
        regimeFiscal: 'Micro-foncier',
        baseImposable: 7140,
        irFoncier: 2142,
        psFoncier: 1228,
        totalFiscaliteFonciere: 3370,
        tauxImpositionGlobal: 33.0,
        narratif: 'Vos revenus fonciers de 10 200 €/an sont imposés au régime micro-foncier (abattement 30%). Fiscalité totale de 3 370 € soit un taux global de 33%.',
      },
      optimisation: {
        economiesPotentielles: 3200,
        strategies: [
          { nom: 'PER Individuel', description: 'Versement de 8 000 €/an déductible du revenu imposable', economie: 2400, priorite: 'HAUTE', detailMiseEnOeuvre: 'Ouvrir un PER et mettre en place un versement programmé mensuel de 667 €' },
          { nom: 'Passage au réel foncier', description: 'Déduire les charges réelles (travaux, intérêts) des revenus fonciers', economie: 800, priorite: 'MOYENNE', detailMiseEnOeuvre: 'Comparer micro-foncier vs réel chaque année, prévoir des travaux déductibles' },
        ],
      },
      narratif: 'Situation fiscale standard avec TMI à 30%. Le PER constitue le principal levier d\'optimisation avec une économie potentielle de 2 400 €/an.',
    },
    emprunt: {
      tauxEndettementActuel: 25.7,
      capaciteEndettementResiduelle: 713,
      mensualiteMaxSupportable: 2683,
      enveloppes: [
        { duree: 15, tauxInteret: 3.5, montantMax: 107000, interetsTotal: 21300 },
        { duree: 20, tauxInteret: 3.7, montantMax: 142600, interetsTotal: 28500 },
        { duree: 25, tauxInteret: 3.9, montantMax: 171120, interetsTotal: 42780 },
      ],
      narratif: 'Capacité d\'emprunt résiduelle de 713 €/mois (taux d\'endettement actuel 25.7% vs seuil HCSF 35%). Enveloppe finançable estimée entre 107 000 € (15 ans) et 171 120 € (25 ans).',
    },
    epargnePrecaution: {
      montantCible: 42000,
      epargneLiquideActuelle: 35000,
      gap: 7000,
      priorite: 'medium',
      narratif: 'Votre épargne de précaution de 35 000 € couvre 10 mois de charges courantes, proche de l\'objectif de 12 mois (42 000 €). Manque de 7 000 € à combler.',
      detailEpargneLiquide: [
        { support: 'Livret A', montant: 22950 },
        { support: 'LDDS', montant: 12050 },
      ],
      moisCouverts: 10,
      planConstitution: { moisEpargne: 6, montantMensuel: 1167 },
    },
    immobilier: {
      totalImmobilier: 1075000,
      poidsPatrimoine: 72.3,
      patrimoineImmobilierNet: 670000,
      cashFlowGlobalMensuel: 330,
      concentrationRisque: true,
      biens: [
        {
          nom: 'Appartement Paris 16e', type: 'RESIDENCE_PRINCIPALE', valeur: 850000, poidsPatrimoine: 57.2,
          rendementLocatifBrut: null, rendementLocatifNet: null,
          scenarioRevente: {
            horizons: [
              { annees: 5, prixEstime: 892500, plusValueBrute: 42500, totalFiscalite: 14025, netVendeur: 878475, gainNetTotal: 28475 },
              { annees: 10, prixEstime: 935000, plusValueBrute: 85000, totalFiscalite: 18700, netVendeur: 916300, gainNetTotal: 66300 },
              { annees: 15, prixEstime: 1020000, plusValueBrute: 170000, totalFiscalite: 0, netVendeur: 1020000, gainNetTotal: 170000 },
            ],
            narratif: 'Exonération totale de la plus-value IR et PS après 22 ans (IR) et 30 ans (PS) de détention.',
          },
          analyse: 'Résidence principale représentant 57.2% du patrimoine brut. Concentration élevée mais logique pour un actif principal. La plus-value est exonérée d\'impôt en tant que résidence principale. Valeur estimée stable dans le 16e arrondissement.',
        },
        {
          nom: 'Studio Lyon 3e', type: 'INVESTISSEMENT_LOCATIF', valeur: 180000, poidsPatrimoine: 12.1,
          loyerMensuel: 650, chargesAnnuelles: 2400, cashFlowMensuel: 130, tri: 3.8,
          rendementLocatifBrut: 4.3, rendementLocatifNet: 3.1,
          scenarioRevente: {
            horizons: [
              { annees: 5, prixEstime: 189000, plusValueBrute: 9000, totalFiscalite: 4050, netVendeur: 184950, gainNetTotal: 4950 },
              { annees: 10, prixEstime: 207000, plusValueBrute: 27000, totalFiscalite: 7290, netVendeur: 199710, gainNetTotal: 19710 },
            ],
            narratif: 'Marché locatif dynamique à Lyon 3e. Rendement brut de 4.3%, au-dessus de la moyenne lyonnaise.',
          },
          fiscaliteLocative: { regimeFiscal: 'Micro-foncier', tauxImpositionGlobal: 33.0, totalAnnuel: 2574 },
          analyse: 'Investissement locatif avec un rendement brut de 4.3% et un cash-flow positif de 130 €/mois après charges. Marché locatif dynamique à Lyon, bonne liquidité. Poids raisonnable de 12.1% du patrimoine.',
        },
        {
          nom: 'SCPI Primopierre', type: 'SCPI', valeur: 45000, poidsPatrimoine: 3.0,
          rendementLocatifBrut: 4.8, rendementLocatifNet: 4.0,
          scenarioRevente: null,
          analyse: 'SCPI diversifiée bureaux/commerces. Rendement distribuable de 4.8% brut. Bonne diversification sectorielle et géographique. Liquidité moindre que les actifs financiers.',
        },
      ],
      narratif: 'Votre patrimoine immobilier de 1 075 000 € (72.3% du total) est composé de 3 biens. La résidence principale (57.2%) constitue la part dominante. Le cash-flow global est positif à 330 €/mois. Attention à la concentration sur un seul bien (RP > 40% du patrimoine).',
    },
    financier: {
      totalFinancier: 260000,
      scoreDiversification: 62,
      scoreRisque: 55,
      allocationParType: [
        { type: 'Assurance-vie', valeur: 120000, poids: 46.2 },
        { type: 'PEA', valeur: 45000, poids: 17.3 },
        { type: 'Livrets', valeur: 35000, poids: 13.5 },
        { type: 'PER', valeur: 32000, poids: 12.3 },
        { type: 'Compte-titres', valeur: 28000, poids: 10.8 },
      ],
      allocationParRisque: [
        { risque: 'Sécurisé', valeur: 67000, poids: 25.8 },
        { risque: 'Équilibré', valeur: 120000, poids: 46.2 },
        { risque: 'Dynamique', valeur: 73000, poids: 28.1 },
      ],
      allocationParLiquidite: [
        { liquidite: 'Immédiate', valeur: 63000, poids: 24.2 },
        { liquidite: 'Court terme', valeur: 120000, poids: 46.2 },
        { liquidite: 'Moyen terme', valeur: 77000, poids: 29.6 },
      ],
      recommandationAllocation: [
        { categorie: 'Actions', actuel: 28, cible: 35, ecart: -7 },
        { categorie: 'Obligations', actuel: 22, cible: 25, ecart: -3 },
        { categorie: 'Fonds €', actuel: 35, cible: 25, ecart: 10 },
        { categorie: 'Liquidités', actuel: 15, cible: 10, ecart: 5 },
      ],
      actifs: [
        { nom: 'AV Generali Epargne', type: 'Assurance-vie', valeur: 120000, poidsPatrimoine: 8.1, poidsPortefeuille: 46.2, risque: 'Équilibré', liquidite: 'Court terme', enveloppeFiscale: 'Assurance-vie', commentaire: 'Contrat multisupport, ancienneté >8 ans, fiscalité avantageuse' },
        { nom: 'PEA Boursorama', type: 'PEA', valeur: 45000, poidsPatrimoine: 3.0, poidsPortefeuille: 17.3, risque: 'Dynamique', liquidite: 'Moyen terme', enveloppeFiscale: 'PEA', commentaire: 'ETF monde, bonne diversification, ancienneté >5 ans' },
        { nom: 'PER Swisslife', type: 'PER', valeur: 32000, poidsPatrimoine: 2.2, poidsPortefeuille: 12.3, risque: 'Équilibré', liquidite: 'Bloqué retraite', enveloppeFiscale: 'PER', commentaire: 'Versements déductibles TMI 30%, gestion pilotée horizon' },
        { nom: 'Livret A + LDDS', type: 'Livrets', valeur: 35000, poidsPatrimoine: 2.4, poidsPortefeuille: 13.5, risque: 'Sécurisé', liquidite: 'Immédiate', enveloppeFiscale: 'Exonéré', commentaire: 'Épargne de précaution, taux net 3%' },
        { nom: 'CTO Saxo', type: 'Compte-titres', valeur: 28000, poidsPatrimoine: 1.9, poidsPortefeuille: 10.8, risque: 'Dynamique', liquidite: 'Immédiate', enveloppeFiscale: 'CTO (PFU 30%)', commentaire: 'Actions individuelles, flat tax 30%' },
      ],
      narratif: 'Patrimoine financier de 260 000 € diversifié sur 5 enveloppes. Score de diversification 62/100 — marge d\'amélioration. L\'assurance-vie (46%) domine, les actions (28%) sont sous-pondérées par rapport à la cible de 35%. Recommandation : augmenter l\'exposition actions via PEA et réduire le fonds euros.',
    },
    retraite: {
      ageActuel: 49,
      estimationPension: {
        pensionBaseMensuelle: 1850,
        pensionComplementaireMensuelle: 980,
        pensionTotaleMensuelle: 2830,
        tauxRemplacement: 36.9,
        trimestresValides: 112,
        trimestresRestants: 60,
        trimestresRequis: 172,
        trimestresManquants: 0,
        decoteSurcote: 0,
        decoteSurcoteLabel: 'Taux plein',
        pointsComplementaires: 4200,
        valeurPoint: 1.4159,
      },
      evolutionParAge: [
        { age: 62, trimestres: 164, trimestresManquants: 8, decoteSurcotePct: -5, decoteSurcoteLabel: 'Décote', pensionMensuelle: 2524, tauxRemplacement: 32.9, differenceVsChoisi: -306, estChoisi: false, estOptimal: false },
        { age: 64, trimestres: 172, trimestresManquants: 0, decoteSurcotePct: 0, decoteSurcoteLabel: 'Taux plein', pensionMensuelle: 2830, tauxRemplacement: 36.9, differenceVsChoisi: 0, estChoisi: true, estOptimal: false },
        { age: 67, trimestres: 184, trimestresManquants: 0, decoteSurcotePct: 3.75, decoteSurcoteLabel: 'Surcote', pensionMensuelle: 2936, tauxRemplacement: 38.3, differenceVsChoisi: 106, estChoisi: false, estOptimal: true },
      ],
      analyseGap: {
        revenuSouhaite: 5000,
        pensionEstimee: 2830,
        gapMensuel: 2170,
        capitalNecessaire4Pct: 651000,
        narratif: 'Pour maintenir un revenu de 5 000 €/mois à la retraite, il manque 2 170 €/mois par rapport à votre pension estimée. Un capital de 651 000 € serait nécessaire pour combler ce gap (rendement 4% net).',
      },
      detailEpargneRetraite: [
        { support: 'PER Swisslife', montant: 32000 },
        { support: 'Assurance-vie (part retraite)', montant: 60000 },
      ],
      epargneRetraiteActuelle: 92000,
      scenarios: [
        { label: 'Prudent (2%)', rendement: 2, ageDepart: 64, capitalRetraite: 156000, revenuDurable: 520, gapMensuel: 1650, capitalEpuiseAge: 89, faisable: false },
        { label: 'Équilibré (4%)', rendement: 4, ageDepart: 64, capitalRetraite: 210000, revenuDurable: 700, gapMensuel: 1470, capitalEpuiseAge: null, faisable: true },
        { label: 'Dynamique (6%)', rendement: 6, ageDepart: 64, capitalRetraite: 285000, revenuDurable: 950, gapMensuel: 1220, capitalEpuiseAge: null, faisable: true },
      ],
      recommandations: [
        { priorite: 'HAUTE', description: 'Maximiser les versements PER (8 000 €/an) pour bénéficier de la déduction fiscale à TMI 30%' },
        { priorite: 'MOYENNE', description: 'Augmenter l\'exposition actions en gestion pilotée horizon retraite (15 ans)' },
      ],
      narratif: 'À 49 ans, vous avez validé 112 trimestres sur 172 requis. Pension estimée de 2 830 €/mois à 64 ans (taux plein). Gap de 2 170 €/mois vs objectif de 5 000 €. Capital retraite actuel de 92 000 €, insuffisant. Actions recommandées : maximiser PER + arbitrer vers profil dynamique.',
    },
    succession: {
      patrimoineNetTaxable: 1025000,
      situationFamiliale: 'Marié(e)',
      regimeMatrimonial: 'Communauté réduite aux acquêts',
      nbEnfants: 2,
      droitsEstimes: 78500,
      tauxEffectif: 7.7,
      abattementTotal: 280724,
      detailParHeritier: [
        { lien: 'Conjoint', partBrute: 512500, abattement: 512500, taxable: 0, droits: 0, tauxEffectif: 0, tranches: [] },
        { lien: 'Enfant 1', partBrute: 256250, abattement: 100000, taxable: 156250, droits: 39250, tauxEffectif: 15.3, tranches: [{ taux: 5, base: 8072, impot: 404 }, { taux: 10, base: 12109, impot: 1211 }, { taux: 15, base: 15932, impot: 2390 }, { taux: 20, base: 120137, impot: 24027 }] },
        { lien: 'Enfant 2', partBrute: 256250, abattement: 100000, taxable: 156250, droits: 39250, tauxEffectif: 15.3, tranches: [{ taux: 5, base: 8072, impot: 404 }, { taux: 10, base: 12109, impot: 1211 }, { taux: 15, base: 15932, impot: 2390 }, { taux: 20, base: 120137, impot: 24027 }] },
      ],
      impactAssuranceVie: {
        totalAV: 120000, versementsAvant70: 90000, versementsApres70: 30000,
        abattement990I: 152500, taxable990I: 0, droits990I: 0,
        abattement757B: 30500, taxable757B: 0, droits757B: 0,
        droitsTotalAV: 0, economieVsDMTG: 24000,
        narratif: 'L\'assurance-vie permet une économie de 24 000 € de droits par rapport à une transmission classique.',
      },
      strategiesOptimisation: [
        { strategie: 'Donation avant 70 ans', description: 'Utiliser les abattements renouvelables tous les 15 ans', economieEstimee: 20000, priorite: 'HAUTE', detailMiseEnOeuvre: 'Donation de 100 000 € par enfant (art. 779 CGI), exonérée de droits si renouvelée après 15 ans' },
        { strategie: 'Démembrement de propriété', description: 'Donner la nue-propriété de biens immobiliers en conservant l\'usufruit', economieEstimee: 35000, priorite: 'MOYENNE', detailMiseEnOeuvre: 'Démembrement de la RP ou du studio Lyon. Valeur nue-propriété = 60% à 49 ans (art. 669 CGI)' },
      ],
      narratif: 'Droits de succession estimés à 78 500 € (taux effectif 7.7%). Le conjoint est exonéré. Chaque enfant paierait environ 39 250 €. Des stratégies d\'optimisation (donation, démembrement, assurance-vie) permettraient de réduire significativement cette charge.',
    },
    synthese: {
      scoreGlobal: 72,
      scores: [
        { theme: 'Budget', score: 78, verdict: 'Bon', couleur: '#10b981', commentaire: 'Budget équilibré' },
        { theme: 'Épargne', score: 70, verdict: 'Bon', couleur: '#10b981', commentaire: 'Taux d\'épargne satisfaisant' },
        { theme: 'Endettement', score: 82, verdict: 'Excellent', couleur: '#10b981', commentaire: 'Sous le seuil HCSF' },
        { theme: 'Fiscalité', score: 55, verdict: 'À optimiser', couleur: '#f59e0b', commentaire: 'TMI 30% — PER recommandé' },
        { theme: 'Diversification', score: 65, verdict: 'Correct', couleur: '#f59e0b', commentaire: 'Concentration immobilière' },
        { theme: 'Retraite', score: 58, verdict: 'À anticiper', couleur: '#f59e0b', commentaire: 'Gap retraite identifié' },
        { theme: 'Succession', score: 75, verdict: 'Bon', couleur: '#10b981', commentaire: 'Stratégie à consolider' },
      ],
      pointsForts: [
        'Taux d\'endettement maîtrisé à 25.7%, bien en dessous du seuil HCSF de 35%',
        'Patrimoine net positif de 1 025 000 € — base solide pour les projets futurs',
        'Diversification existante entre immobilier, financier et professionnel',
        'Capacité d\'épargne mensuelle de 1 197 € — levier important',
      ],
      pointsVigilance: [
        'Concentration immobilière à 72% du patrimoine brut — risque de liquidité',
        'TMI à 30% sans optimisation PER — économie potentielle de 2 400 €/an',
        'Épargne de précaution (35 000 €) couvre 10 mois — correcte mais à surveiller',
      ],
      actionsPrioritaires: [
        'Ouvrir un PER et verser 8 000 €/an pour réduire l\'IR',
        'Rééquilibrer l\'allocation en faveur du financier (objectif 40%)',
        'Anticiper la transmission avec des donations avant 70 ans (art. 790G CGI)',
      ],
      narratifGlobal: 'Votre situation patrimoniale est globalement saine avec un score de 72/100. Les principaux axes d\'amélioration concernent l\'optimisation fiscale (PER), la diversification (réduire la concentration immobilière) et l\'anticipation de la retraite et de la succession.',
    },
  },
}

async function main() {
  console.log('=== Test WeasyPrint PDF Generation ===\n')

  // Step 1: Generate HTML
  console.log('[1/3] Generating HTML from template...')
  const html = generateBilanPatrimonialPremiumHtml(mockData)
  const htmlPath = '/tmp/bilan-weasyprint-test.html'
  fs.writeFileSync(htmlPath, html, 'utf-8')
  console.log(`  HTML: ${(html.length / 1024).toFixed(1)} KB`)
  console.log(`  Pages: ${(html.match(/class="page[\s"]/g) || []).length} .page divs`)
  console.log(`  SVGs: ${(html.match(/<svg/g) || []).length}`)
  console.log(`  Gradients: ${(html.match(/linear-gradient/g) || []).length}`)
  console.log(`  Saved: ${htmlPath}`)

  // Step 2: Generate PDF via WeasyPrint (through PdfGenerator)
  console.log('\n[2/3] Generating PDF via WeasyPrint...')
  const startMs = Date.now()
  const pdfBuffer = await PdfGenerator.generateFromHtml(html)
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1)
  console.log(`  PDF: ${(pdfBuffer.length / 1024).toFixed(1)} KB in ${elapsed}s`)

  // Step 3: Save PDF
  const pdfPath = '/tmp/bilan-weasyprint-test.pdf'
  fs.writeFileSync(pdfPath, pdfBuffer)
  console.log(`  Saved: ${pdfPath}`)

  console.log('\n=== SUCCESS ===')
  console.log(`Open PDF: open ${pdfPath}`)
}

main().catch(err => {
  console.error('FAILED:', err.message || err)
  process.exit(1)
})
