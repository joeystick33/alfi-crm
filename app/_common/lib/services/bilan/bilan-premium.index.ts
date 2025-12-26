/**
 * API du système Bilan Premium
 * Point d'entrée unifié pour la génération de PDF premium avec graphiques
 */

export * from './bilan-premium.types'
export { generatePremiumTemplate, COLORS } from './bilan-premium.template'
export { renderPremiumPdf, renderPremiumPdfToFile, renderPremiumHtml } from './bilan-premium.renderer'

import type { BilanPremiumData, DetailedAsset, DetailedContract } from './bilan-premium.types'
import { renderPremiumPdf } from './bilan-premium.renderer'

/**
 * Interface étendue pour les données client complètes
 * Compatible avec le système existant mais avec champs additionnels
 */
export interface ClientDataExtended {
  client: {
    prenom: string
    nom: string
    email?: string
    dateNaissance?: string
    situationFamiliale?: string
    nombreEnfants?: number
    profession?: string
    age?: number
  }
  patrimoine: {
    totalActifs: number
    totalPassifs: number
    patrimoineNet: number
    patrimoineGere: number
    tauxGestion: number
    evolutionAnnuelle: number
    tauxCroissance: number
    repartition: { categorie: string; montant: number; pourcentage: number }[]
  }
  budget: {
    revenusMensuels: number
    chargesMensuelles: number
    mensualitesCredits: number
    epargne: number
    tauxEpargne: number
    tauxEndettement: number
    capaciteEmprunt: number
  }
  fiscalite: {
    revenuImposable: number
    impotRevenu: number
    tmi: number
    tauxEffectif: number
    patrimoineImmobilierNet: number
    ifi: number
  }
  objectifs: {
    principal: string
    montantCible: number
    montantActuel: number
    progression: number
    horizon: string
  }
  actifs?: DetailedAsset[]
  contrats?: DetailedContract[]
}

/**
 * Génère un bilan premium complet à partir des données client
 */
export async function generatePremiumBilan(clientData: ClientDataExtended): Promise<Buffer> {
  const bilanData = transformToBilanData(clientData)
  return renderPremiumPdf(bilanData)
}

/**
 * Transforme les données client étendues en données BilanPremiumData
 */
export function transformToBilanData(clientData: ClientDataExtended): BilanPremiumData {
  const colors = ['#7373FF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  
  // Score simplifié
  const patrimoineScore = clientData.patrimoine.patrimoineNet > 500000 ? 85 : clientData.patrimoine.patrimoineNet > 200000 ? 70 : 55
  const budgetScore = clientData.budget.tauxEndettement <= 25 ? 90 : clientData.budget.tauxEndettement <= 35 ? 70 : 40
  const fiscaliteScore = clientData.fiscalite.tmi <= 30 ? 80 : clientData.fiscalite.tmi <= 41 ? 60 : 40
  const objectifsScore = clientData.objectifs.progression >= 70 ? 85 : clientData.objectifs.progression >= 40 ? 65 : 45
  const diversificationScore = 100 - Math.max(...clientData.patrimoine.repartition.map(r => r.pourcentage))
  const globalScore = Math.round((patrimoineScore + budgetScore + fiscaliteScore + objectifsScore + diversificationScore) / 5)
  
  // Profil investisseur
  const age = clientData.client.age || 45
  let profilInvestisseur: 'SECURITAIRE' | 'PRUDENT' | 'EQUILIBRE' | 'DYNAMIQUE' | 'OFFENSIF' = 'EQUILIBRE'
  if (age > 60) profilInvestisseur = 'SECURITAIRE'
  else if (age > 50) profilInvestisseur = 'PRUDENT'
  else if (clientData.budget.tauxEpargne > 30) profilInvestisseur = 'DYNAMIQUE'
  
  // Actions prioritaires
  const actionsPrioritaires = []
  if (Math.max(...clientData.patrimoine.repartition.map(r => r.pourcentage)) > 60) {
    actionsPrioritaires.push({
      rang: 1,
      titre: 'Diversifier le patrimoine',
      description: 'Concentration patrimoniale elevee. Reduire le risque par la diversification.',
      impact: 'FORT' as const,
      urgence: 'COURT_TERME' as const,
      categorie: 'PATRIMOINE' as const,
    })
  }
  if (clientData.fiscalite.tmi >= 41) {
    actionsPrioritaires.push({
      rang: 2,
      titre: 'Optimiser la fiscalite',
      description: `TMI a ${clientData.fiscalite.tmi}% : fort potentiel d'economie fiscale.`,
      impact: 'FORT' as const,
      urgence: 'IMMEDIATE' as const,
      categorie: 'FISCALITE' as const,
    })
  }
  if (clientData.patrimoine.tauxGestion < 50) {
    actionsPrioritaires.push({
      rang: 3,
      titre: 'Elargir l\'accompagnement',
      description: 'Potentiel d\'optimisation sur le patrimoine non gere.',
      impact: 'MOYEN' as const,
      urgence: 'MOYEN_TERME' as const,
      categorie: 'PATRIMOINE' as const,
    })
  }
  
  // Données graphiques
  const mois = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']
  const basePatrimoine = clientData.patrimoine.patrimoineNet - clientData.patrimoine.evolutionAnnuelle
  const evolutionMensuelle = clientData.patrimoine.evolutionAnnuelle / 12
  
  // Verdict
  const isGood = globalScore >= 65
  
  return {
    client: clientData.client,
    dateGeneration: new Date(),
    score: {
      global: globalScore,
      patrimoine: patrimoineScore,
      budget: budgetScore,
      fiscalite: fiscaliteScore,
      objectifs: objectifsScore,
      diversification: diversificationScore,
    },
    profilInvestisseur,
    actionsPrioritaires,
    patrimoine: clientData.patrimoine,
    budget: clientData.budget,
    fiscalite: clientData.fiscalite,
    objectifs: clientData.objectifs,
    charts: {
      patrimoine: {
        repartition: clientData.patrimoine.repartition.map((r, i) => ({
          label: r.categorie,
          value: r.pourcentage,
          color: colors[i % colors.length],
        })),
        evolution: mois.map((m, i) => ({
          date: m,
          actifs: Math.round(basePatrimoine + evolutionMensuelle * i + clientData.patrimoine.totalPassifs),
          passifs: clientData.patrimoine.totalPassifs,
          net: Math.round(basePatrimoine + evolutionMensuelle * i),
        })),
        projection: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].flatMap(annee => [
          { annee: 2025 + annee, valeur: Math.round(clientData.patrimoine.patrimoineNet * Math.pow(1.02, annee)), scenario: 'pessimiste' as const },
          { annee: 2025 + annee, valeur: Math.round(clientData.patrimoine.patrimoineNet * Math.pow(1.05, annee)), scenario: 'median' as const },
          { annee: 2025 + annee, valeur: Math.round(clientData.patrimoine.patrimoineNet * Math.pow(1.08, annee)), scenario: 'optimiste' as const },
        ]),
      },
      budget: {
        revenus: [
          { categorie: 'Salaires', montant: clientData.budget.revenusMensuels * 0.7, color: colors[0] },
          { categorie: 'Revenus fonciers', montant: clientData.budget.revenusMensuels * 0.2, color: colors[1] },
          { categorie: 'Autres', montant: clientData.budget.revenusMensuels * 0.1, color: colors[2] },
        ],
        charges: [
          { categorie: 'Logement', montant: clientData.budget.chargesMensuelles * 0.4, color: colors[3] },
          { categorie: 'Vie courante', montant: clientData.budget.chargesMensuelles * 0.35, color: colors[4] },
          { categorie: 'Autres', montant: clientData.budget.chargesMensuelles * 0.25, color: colors[5] },
        ],
        flux: [],
      },
      fiscalite: {
        decomposition: [
          { label: 'Revenu imposable', montant: clientData.fiscalite.revenuImposable, type: 'revenu' as const },
          { label: 'Impot', montant: clientData.fiscalite.impotRevenu, type: 'impot' as const },
        ],
        optimisations: [
          { dispositif: 'PER', economie: clientData.fiscalite.tmi * 100, eligible: true },
          { dispositif: 'Assurance-vie', economie: clientData.fiscalite.tmi * 50, eligible: true },
          { dispositif: 'SCPI fiscale', economie: clientData.fiscalite.tmi * 80, eligible: clientData.fiscalite.tmi >= 30 },
        ],
      },
      objectifs: {
        progression: mois.map((m, i) => ({
          mois: m,
          reel: Math.round(clientData.objectifs.montantActuel * (0.8 + i * 0.02)),
          cible: Math.round(clientData.objectifs.montantCible * ((i + 1) / 12)),
        })),
      },
      performance: {
        historique: mois.map((m) => ({
          date: m,
          portefeuille: Math.round((5 + Math.random() * 5) * 10) / 10,
          benchmark: Math.round((4 + Math.random() * 3) * 10) / 10,
        })),
        parClasse: [
          { classe: 'Actions', performance: 8.5, benchmark: 7.2 },
          { classe: 'Obligations', performance: 2.1, benchmark: 2.5 },
          { classe: 'Immobilier', performance: 4.8, benchmark: 4.2 },
        ],
      },
    },
    gauges: {
      endettement: { label: 'Endettement', value: clientData.budget.tauxEndettement, min: 0, max: 50, thresholds: [], unit: '%' },
      epargne: { label: 'Epargne', value: clientData.budget.tauxEpargne, min: 0, max: 100, thresholds: [], unit: '%' },
      diversification: { label: 'Diversification', value: diversificationScore, min: 0, max: 100, thresholds: [], unit: '%' },
      objectif: { label: 'Objectif', value: clientData.objectifs.progression, min: 0, max: 100, thresholds: [], unit: '%' },
    },
    actifs: clientData.actifs || [],
    contrats: clientData.contrats || [],
    risques: {
      niveau: globalScore > 70 ? 'FAIBLE' : globalScore > 50 ? 'MODERE' : 'ELEVE',
      score: globalScore,
      facteurs: [],
    },
    protection: {
      couvertureDecès: { capital: 0, besoins: clientData.budget.revenusMensuels * 60, ecart: -clientData.budget.revenusMensuels * 60, statut: 'ABSENT' },
      couvertureInvalidite: { revenuGaranti: 0, besoins: clientData.budget.revenusMensuels * 0.7, ecart: -clientData.budget.revenusMensuels * 0.7, statut: 'ABSENT' },
      contrats: [],
    },
    succession: {
      droitsEstimes: Math.round(clientData.patrimoine.patrimoineNet * 0.15),
      abattements: [{ beneficiaire: 'Enfants', montant: 100000 * (clientData.client.nombreEnfants || 0), utilise: 0 }],
      strategies: [
        { nom: 'Donation nue-propriete', description: 'Transmettre la nue-propriete', economie: clientData.patrimoine.patrimoineNet * 0.05, complexite: 'MOYENNE' },
      ],
      schema: [],
    },
    benchmarks: [
      { categorie: 'Patrimoine Net', votreSituation: clientData.patrimoine.patrimoineNet, moyenneProfil: 350000, ecart: ((clientData.patrimoine.patrimoineNet - 350000) / 350000) * 100, commentaire: '' },
      { categorie: 'Epargne mensuelle', votreSituation: clientData.budget.epargne, moyenneProfil: 800, ecart: ((clientData.budget.epargne - 800) / 800) * 100, commentaire: '' },
    ],
    diagnostic: {
      forces: isGood ? ['Patrimoine significatif', 'Capacite d\'epargne', 'Endettement maitrise'] : ['Situation perfectible'],
      vigilances: !isGood ? ['Diversification a ameliorer', 'Optimisation fiscale possible'] : [],
      recommandations: actionsPrioritaires.map(a => a.titre),
      verdict: {
        level: isGood ? 'GOOD' : 'MEDIUM',
        label: isGood ? 'Situation patrimoniale saine' : 'Situation patrimoniale correcte',
        comment: isGood 
          ? 'La situation patrimoniale presente de nombreux atouts. Une optimisation ciblee permettrait de renforcer la solidite globale.'
          : 'La situation patrimoniale necessite une attention particuliere sur plusieurs points.',
      },
    },
  }
}
