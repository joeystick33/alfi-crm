/**
 * Types pour l'audit patrimonial
 */

export interface AuditPatrimonialData {
  client: {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    birthDate?: Date
    maritalStatus?: string
    profession?: string
    annualIncome?: number
  }
  patrimoine: {
    totalActifs: number
    totalPassifs: number
    netWealth: number
    actifsByCategory: Record<string, number>
    passifsByType: Record<string, number>
  }
  objectifs: Array<{
    id: string
    name: string
    type: string
    targetAmount: number
    currentAmount: number
    progress: number
    targetDate: Date
  }>
  contrats: Array<{
    id: string
    name: string
    type: string
    provider: string
    value?: number
    premium?: number
  }>
  recommendations: Array<{
    type: string
    priority: string
    description: string
    estimatedValue?: number
  }>
}

export interface AuditPatrimonialReport {
  id: string
  clientId: string
  generatedAt: Date
  generatedBy: string
  data: AuditPatrimonialData
  pdfUrl?: string
}

export interface AuditPatrimonialSection {
  title: string
  content: string
  charts?: Array<{
    type: 'pie' | 'bar' | 'line'
    data: Record<string, unknown>
  }>
}

/**
 * Type complet pour le builder de rapport d'audit patrimonial
 * Structure étendue avec toutes les sections d'analyse
 */
export interface AuditPatrimonialComplet {
  id?: string
  
  // Situation personnelle
  situationPersonnelle?: {
    civilite?: string
    nom: string
    prenom: string
    dateNaissance?: string
    age?: number
    situationFamiliale: string
    regimeMatrimonial?: string
    nombreEnfants: number
    profession?: string
    employeur?: string
    conjoint?: {
      nom: string
      prenom: string
      dateNaissance?: string
      profession?: string
    }
    enfants?: Array<{
      prenom: string
      dateNaissance?: string
      age?: number
      aCharge: boolean
    }>
  }
  
  // Audit patrimonial
  auditPatrimonial?: {
    totalActifs: number
    totalPassifs: number
    patrimoineNet: number
    actifsImmobiliers?: Array<{
      type: string
      libelle: string
      valeur: number
      localisation?: string
      revenus?: number
    }>
    actifsFinanciers?: Array<{
      type: string
      libelle: string
      valeur: number
      etablissement?: string
      dateOuverture?: string
      performance?: number
    }>
    actifsProfessionnels?: Array<{
      type: string
      libelle: string
      valeur: number
    }>
    autresActifs?: Array<{
      type: string
      libelle: string
      valeur: number
    }>
    passifs?: Array<{
      type: string
      libelle: string
      capitalRestant: number
      mensualite: number
      tauxInteret: number
      dureeRestante: number
      financement?: string
    }>
  }
  
  // Analyse budgétaire
  analyseBudgetaire?: {
    revenusTotaux: number
    chargesTotales: number
    capaciteEpargne: number
    tauxEpargne: number
    tauxEndettement: number
    resteAVivre: number
    revenusDetails?: Array<{
      categorie: string
      montant: number
      frequence: string
    }>
    chargesDetails?: Array<{
      categorie: string
      montant: number
      frequence: string
    }>
    fiscalite?: {
      revenuImposable: number
      impotRevenu: number
      tmi: number
      tauxEffectif: number
    }
    protectionSociale?: Array<{
      type: string
      couverture: string
      montant?: number
    }>
  }
  
  // Analyse successorale
  analyseSuccessorale?: {
    massSuccessorale: number
    droitsEstimes: number
    tauxGlobal: number
    abattementsDisponibles?: Array<{
      beneficiaire: string
      lienParente: string
      abattement: number
      utilise: number
      disponible: number
    }>
    repartitionHeritiers?: Array<{
      heritier: string
      part: number
      montant: number
      droits: number
    }>
    strategiesOptimisation?: Array<{
      nom: string
      description: string
      economie: number
      complexite: 'SIMPLE' | 'MOYENNE' | 'COMPLEXE'
      delai: string
    }>
  }
  
  // Objectifs patrimoniaux
  objectifsPatrimoniaux?: {
    profilRisque?: string
    tolerancePerte?: number
    horizonPlacement?: string
    objectifs?: Array<{
      libelle: string
      priorite: number
      montantCible?: number
      echeance?: string
      progression?: number
    }>
    contraintes?: string[]
    exclusionsESG?: string[]
  }
  
  // Stratégie patrimoniale
  strategiePatrimoniale?: {
    allocationActuelle?: Array<{
      classe: string
      pourcentage: number
      montant: number
    }>
    allocationCible?: Array<{
      classe: string
      pourcentage: number
      montant: number
      ecart: number
    }>
    recommandations?: Array<{
      numero: number
      titre: string
      description: string
      impact: 'FORT' | 'MOYEN' | 'FAIBLE'
      urgence: 'IMMEDIATE' | 'COURT_TERME' | 'MOYEN_TERME' | 'LONG_TERME'
      domaine: string
      economieEstimee?: number
    }>
    actionsCalendrier?: Array<{
      date: string
      action: string
      priorite: 'HAUTE' | 'MOYENNE' | 'BASSE'
    }>
  }
  
  // Points forts et vigilance
  pointsForts?: string[]
  pointsVigilance?: string[]
}
