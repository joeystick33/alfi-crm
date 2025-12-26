/**
 * Types pour le Rapport d'Audit Patrimonial Premium
 * Rapport complet CGP avec analyse approfondie sur 7 domaines
 */

import type { AuditPatrimonialComplet } from '@/app/_common/types/audit-patrimonial.types'

// =============================================================================
// SCORES ET NOTATIONS
// =============================================================================

export type NiveauDiagnostic = 'EXCELLENT' | 'BON' | 'CORRECT' | 'INSUFFISANT' | 'CRITIQUE'

export interface ScoreDetaille {
  valeur: number // 0-100
  niveau: NiveauDiagnostic
  couleur: string
  icone: string
  commentaire: string
}

export interface ScoresAudit {
  global: ScoreDetaille
  situationPersonnelle: ScoreDetaille
  patrimoine: ScoreDetaille
  budget: ScoreDetaille
  fiscalite: ScoreDetaille
  succession: ScoreDetaille
  objectifs: ScoreDetaille
  strategie: ScoreDetaille
}

// =============================================================================
// SECTIONS DU RAPPORT
// =============================================================================

export interface SectionRapport {
  id: string
  numero: number
  titre: string
  sousTitre?: string
  icone: string
  contenu: ParagrapheRapport[]
  indicateursClés?: IndicateurCle[]
  graphiques?: GraphiqueRapport[]
  tableaux?: TableauRapport[]
  alertes?: AlerteRapport[]
  recommandations?: RecommandationRapport[]
}

export interface ParagrapheRapport {
  titre?: string
  contenu: string
  style?: 'normal' | 'important' | 'encadre'
}

export interface IndicateurCle {
  label: string
  valeur: string
  unite?: string
  evolution?: number // Pourcentage d'évolution
  statut: 'success' | 'warning' | 'danger' | 'neutral'
  icone?: string
}

export interface GraphiqueRapport {
  type: 'pie' | 'bar' | 'line' | 'gauge' | 'radar' | 'sankey'
  titre: string
  sousTitre?: string
  donnees: { label: string; valeur: number; couleur?: string }[]
  options?: Record<string, unknown>
}

export interface TableauRapport {
  titre?: string
  entetes: string[]
  lignes: string[][]
  totaux?: string[]
  style?: 'simple' | 'alterné' | 'bordures'
}

export interface AlerteRapport {
  type: 'success' | 'info' | 'warning' | 'danger'
  titre: string
  message: string
  action?: string
}

export interface RecommandationRapport {
  numero: number
  titre: string
  description: string
  impact: 'FORT' | 'MOYEN' | 'FAIBLE'
  urgence: 'IMMEDIATE' | 'COURT_TERME' | 'MOYEN_TERME' | 'LONG_TERME'
  domaine: string
  economieEstimee?: number
}

// =============================================================================
// DONNÉES DU RAPPORT
// =============================================================================

export interface DonneesClientRapport {
  // Identité
  civilite?: string
  nom: string
  prenom: string
  dateNaissance?: string
  age?: number
  
  // Contact
  email?: string
  telephone?: string
  adresse?: string
  
  // Situation
  situationFamiliale: string
  regimeMatrimonial?: string
  nombreEnfants: number
  profession?: string
  employeur?: string
  secteurActivite?: string
  
  // Conjoint
  conjoint?: {
    nom: string
    prenom: string
    dateNaissance?: string
    profession?: string
  }
  
  // Enfants
  enfants?: {
    prenom: string
    dateNaissance?: string
    age?: number
    aCharge: boolean
  }[]
}

export interface DonneesPatrimoineRapport {
  // Synthèse
  totalActifs: number
  totalPassifs: number
  patrimoineNet: number
  
  // Par catégorie
  immobilier: {
    total: number
    pourcentage: number
    details: {
      type: string
      libelle: string
      valeur: number
      localisation?: string
      revenus?: number
    }[]
  }
  
  financier: {
    total: number
    pourcentage: number
    details: {
      type: string
      libelle: string
      valeur: number
      etablissement?: string
      dateOuverture?: string
      performance?: number
    }[]
  }
  
  professionnel: {
    total: number
    pourcentage: number
    details: {
      type: string
      libelle: string
      valeur: number
    }[]
  }
  
  autre: {
    total: number
    pourcentage: number
    details: {
      type: string
      libelle: string
      valeur: number
    }[]
  }
  
  passifs: {
    total: number
    details: {
      type: string
      libelle: string
      capitalRestant: number
      mensualite: number
      tauxInteret: number
      dureeRestante: number
      financement?: string
    }[]
  }
}

export interface DonneesBudgetRapport {
  // Revenus
  revenusTotaux: number
  revenusDetails: {
    categorie: string
    montant: number
    frequence: string
  }[]
  
  // Charges
  chargesTotales: number
  chargesDetails: {
    categorie: string
    montant: number
    frequence: string
  }[]
  
  // Ratios
  capaciteEpargne: number
  tauxEpargne: number
  tauxEndettement: number
  resteAVivre: number
  
  // Fiscalité
  revenuImposable: number
  impotRevenu: number
  tmi: number
  tauxEffectif: number
  
  // Protection sociale
  protectionSociale: {
    type: string
    couverture: string
    montant?: number
  }[]
}

export interface DonneesSuccessionRapport {
  // Situation actuelle
  massSuccessorale: number
  abattementsDisponibles: {
    beneficiaire: string
    lienParente: string
    abattement: number
    utilise: number
    disponible: number
  }[]
  
  // Simulation droits
  droitsEstimes: number
  tauxGlobal: number
  
  // Répartition
  repartitionHeritiers: {
    heritier: string
    part: number
    montant: number
    droits: number
  }[]
  
  // Stratégies
  strategies: {
    nom: string
    description: string
    economie: number
    complexite: 'SIMPLE' | 'MOYENNE' | 'COMPLEXE'
    delai: string
  }[]
}

export interface DonneesObjectifsRapport {
  // Profil
  profilRisque: string
  tolerancePerte: number
  horizonPlacement: string
  
  // Objectifs
  objectifs: {
    libelle: string
    priorite: number
    montantCible?: number
    echeance?: string
    progression?: number
  }[]
  
  // Contraintes
  contraintes: string[]
  exclusionsESG?: string[]
}

export interface DonneesStrategieRapport {
  // Allocation
  allocationActuelle: {
    classe: string
    pourcentage: number
    montant: number
  }[]
  
  allocationCible: {
    classe: string
    pourcentage: number
    montant: number
    ecart: number
  }[]
  
  // Recommandations
  recommandations: RecommandationRapport[]
  
  // Calendrier
  actionsCalendrier: {
    date: string
    action: string
    priorite: 'HAUTE' | 'MOYENNE' | 'BASSE'
  }[]
}

// =============================================================================
// RAPPORT COMPLET
// =============================================================================

export interface RapportAuditPatrimonial {
  // Métadonnées
  id: string
  dateGeneration: Date
  version: string
  
  // Client
  client: DonneesClientRapport
  
  // Cabinet
  cabinet: {
    nom: string
    conseiller: string
    email?: string
    telephone?: string
    logo?: string
    adresse?: string
    orias?: string
  }
  
  // Scores
  scores: ScoresAudit
  
  // Synthèse exécutive
  syntheseExecutive: {
    introduction: string
    pointsForts: string[]
    pointsVigilance: string[]
    actionsImmediates: RecommandationRapport[]
  }
  
  // Sections détaillées
  sections: {
    situationPersonnelle: SectionRapport
    patrimoine: SectionRapport
    budget: SectionRapport
    fiscalite: SectionRapport
    succession: SectionRapport
    objectifs: SectionRapport
    strategie: SectionRapport
    conclusion: SectionRapport
  }
  
  // Données brutes pour graphiques
  donnees: {
    patrimoine: DonneesPatrimoineRapport
    budget: DonneesBudgetRapport
    succession: DonneesSuccessionRapport
    objectifs: DonneesObjectifsRapport
    strategie: DonneesStrategieRapport
  }
  
  // Annexes
  annexes?: {
    titre: string
    contenu: string
  }[]
  
  // Mentions légales
  mentionsLegales: string
  disclaimer: string
}

// =============================================================================
// FONCTION DE TRANSFORMATION
// =============================================================================

export type AuditToRapportTransformer = (
  audit: AuditPatrimonialComplet,
  clientInfo: {
    nom: string
    prenom: string
    email?: string
  },
  cabinetInfo: {
    nom: string
    conseiller: string
    logo?: string
  }
) => RapportAuditPatrimonial
