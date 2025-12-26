/**
 * Types pour le Bilan Patrimonial Premium
 * Rapport de synthèse avec graphiques et analyse avancée
 */

// Score patrimonial global
export interface PatrimonialScore {
  global: number // 0-100
  patrimoine: number
  budget: number
  fiscalite: number
  objectifs: number
  diversification: number
}

// Profil investisseur
export type InvestorProfile = 'SECURITAIRE' | 'PRUDENT' | 'EQUILIBRE' | 'DYNAMIQUE' | 'OFFENSIF'

// Données pour les graphiques
export interface ChartData {
  patrimoine: {
    repartition: { label: string; value: number; color: string }[]
    evolution: { date: string; actifs: number; passifs: number; net: number }[]
    projection: { annee: number; valeur: number; scenario: 'pessimiste' | 'median' | 'optimiste' }[]
  }
  budget: {
    revenus: { categorie: string; montant: number; color: string }[]
    charges: { categorie: string; montant: number; color: string }[]
    flux: { source: string; target: string; value: number }[] // Sankey
  }
  fiscalite: {
    decomposition: { label: string; montant: number; type: 'revenu' | 'deduction' | 'impot' }[]
    optimisations: { dispositif: string; economie: number; eligible: boolean }[]
  }
  objectifs: {
    progression: { mois: string; reel: number; cible: number }[]
  }
  performance: {
    historique: { date: string; portefeuille: number; benchmark: number }[]
    parClasse: { classe: string; performance: number; benchmark: number }[]
  }
}

// Indicateur avec jauge
export interface GaugeIndicator {
  label: string
  value: number
  min: number
  max: number
  thresholds: { value: number; color: string; label: string }[]
  unit: string
}

// Action prioritaire
export interface PriorityAction {
  rang: number
  titre: string
  description: string
  impact: 'FORT' | 'MOYEN' | 'FAIBLE'
  urgence: 'IMMEDIATE' | 'COURT_TERME' | 'MOYEN_TERME'
  categorie: 'FISCALITE' | 'PATRIMOINE' | 'BUDGET' | 'PROTECTION' | 'SUCCESSION'
}

// Actif détaillé
export interface DetailedAsset {
  id: string
  libelle: string
  type: string
  categorie: string
  valeur: number
  dateAcquisition?: string
  performance?: number
  liquidite: 'IMMEDIATE' | 'COURT_TERME' | 'MOYEN_TERME' | 'LONG_TERME'
  localisation?: string
}

// Analyse de risque
export interface RiskAnalysis {
  niveau: 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE'
  score: number // 0-100
  facteurs: {
    type: string
    description: string
    impact: number
    probabilite: number
    couverture: boolean
  }[]
}

// Protection / Prévoyance
export interface ProtectionAnalysis {
  couvertureDecès: {
    capital: number
    besoins: number
    ecart: number
    statut: 'SUFFISANT' | 'INSUFFISANT' | 'ABSENT'
  }
  couvertureInvalidite: {
    revenuGaranti: number
    besoins: number
    ecart: number
    statut: 'SUFFISANT' | 'INSUFFISANT' | 'ABSENT'
  }
  contrats: {
    type: string
    assureur: string
    capital: number
    primeAnnuelle: number
  }[]
}

// Analyse successorale
export interface SuccessionAnalysis {
  droitsEstimes: number
  abattements: { beneficiaire: string; montant: number; utilise: number }[]
  strategies: {
    nom: string
    description: string
    economie: number
    complexite: 'SIMPLE' | 'MOYENNE' | 'COMPLEXE'
  }[]
  schema: {
    de: string
    vers: string
    montant: number
    droits: number
  }[]
}

// Contrat détaillé
export interface DetailedContract {
  id: string
  type: 'ASSURANCE_VIE' | 'PER' | 'PEA' | 'CTO' | 'SCPI' | 'PREVOYANCE'
  nom: string
  assureur: string
  dateOuverture: string
  encours: number
  versements: number
  plusValue: number
  performance: number
  fraisGestion: number
  beneficiaires?: string
  liquidite: 'IMMEDIATE' | 'BLOQUEE' | 'CONDITIONNELLE'
}

// Benchmark comparatif
export interface Benchmark {
  categorie: string
  votreSituation: number
  moyenneProfil: number
  ecart: number
  commentaire: string
}

// Données complètes du bilan premium
export interface BilanPremiumData {
  // Infos client
  client: {
    nom: string
    prenom: string
    email?: string
    dateNaissance?: string
    situationFamiliale?: string
    nombreEnfants?: number
    profession?: string
  }
  
  // Date de génération
  dateGeneration: Date
  
  // Score global
  score: PatrimonialScore
  
  // Profil
  profilInvestisseur: InvestorProfile
  
  // Actions prioritaires (Top 3)
  actionsPrioritaires: PriorityAction[]
  
  // Données chiffrées
  patrimoine: {
    totalActifs: number
    totalPassifs: number
    patrimoineNet: number
    patrimoineGere: number
    tauxGestion: number
    evolutionAnnuelle: number
    tauxCroissance: number
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
  
  // Graphiques
  charts: ChartData
  
  // Jauges
  gauges: {
    endettement: GaugeIndicator
    epargne: GaugeIndicator
    diversification: GaugeIndicator
    objectif: GaugeIndicator
  }
  
  // Détails
  actifs: DetailedAsset[]
  contrats: DetailedContract[]
  
  // Analyses avancées
  risques: RiskAnalysis
  protection: ProtectionAnalysis
  succession: SuccessionAnalysis
  
  // Benchmarks
  benchmarks: Benchmark[]
  
  // Diagnostic textuel (conservé du système actuel)
  diagnostic: {
    forces: string[]
    vigilances: string[]
    recommandations: string[]
    verdict: {
      level: string
      label: string
      comment: string
    }
  }
}
