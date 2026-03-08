/**
 * Synthesis Service - Calculs de synthèse client
 * 
 * Ce service agrège toutes les données client pour produire une synthèse complète:
 * - Patrimoine (actifs, passifs, répartition)
 * - Budget (revenus, charges, capacité d'épargne)
 * - Objectifs et projets
 * - Alertes automatiques
 * - Indicateurs clés
 */

import { prisma } from '../prisma'
import { calculerEndettement } from '@/app/(advisor)/(frontend)/dashboard/calculateurs/capacite-emprunt/parameters-emprunt'
import { logger } from '../logger'

// =============================================================================
// Types
// =============================================================================

export interface PatrimoineSummary {
  patrimoineBrut: number
  patrimoineNet: number
  totalActifs: number
  totalPassifs: number
  repartition: {
    immobilier: number
    financier: number
    professionnel: number
    autre: number
  }
  repartitionPourcentage: {
    immobilier: number
    financier: number
    professionnel: number
    autre: number
  }
  actifsGeres: number
  actifsNonGeres: number
  tauxGestion: number
}

export interface BudgetSummary {
  revenusMensuels: number
  revenusAnnuels: number
  chargesMensuelles: number
  chargesAnnuelles: number
  capaciteEpargneMensuelle: number
  capaciteEpargneAnnuelle: number
  tauxEpargne: number
  mensualitesCredits: number
  tauxEndettement: number
  resteAVivre: number
}

export interface ObjectifSummary {
  id: string
  name: string
  type: string
  priority: string
  targetAmount: number
  currentAmount: number
  progress: number
  targetDate: Date | null
  daysRemaining: number | null
  status: 'ON_TRACK' | 'AT_RISK' | 'EN_RETARD' | 'TERMINE'
}

export interface ProjetSummary {
  id: string
  name: string
  type: string
  status: string
  budget: number
  startDate: Date | null
  endDate: Date | null
}

export interface AlerteSynthese {
  id: string
  type: 'CRITIQUE' | 'WARNING' | 'INFO'
  category: string
  message: string
  recommendation: string
  value?: number
  threshold?: number
}

export interface IndicateurCle {
  id: string
  name: string
  value: number | string
  unit?: string
  trend?: 'UP' | 'DOWN' | 'STABLE'
  status: 'GOOD' | 'WARNING' | 'CRITIQUE' | 'NEUTRAL'
  description?: string
  isPremium: boolean
  estimatedValue?: number
}

export interface ClientSynthesis {
  clientId: string
  clientName: string
  calculatedAt: Date
  
  patrimoine: PatrimoineSummary
  budget: BudgetSummary
  objectifs: ObjectifSummary[]
  projets: ProjetSummary[]
  alertes: AlerteSynthese[]
  indicateurs: IndicateurCle[]
  
  // Métadonnées
  lastPatrimoineUpdate: Date | null
  lastBudgetUpdate: Date | null
  dataCompleteness: number // 0-100%
}

// Note: Les types Prisma (Decimal, JsonValue) nécessitent un typage dynamique
// Les conversions Number() sont appliquées dans les méthodes de calcul
 
type ClientDataInternal = any
 

// =============================================================================
// Service principal
// =============================================================================

export class SynthesisService {
  private cabinetId: string
  
  constructor(cabinetId: string) {
    this.cabinetId = cabinetId
  }
  
  /**
   * Calcule la synthèse complète d'un client
   */
  async calculateSynthesis(clientId: string): Promise<ClientSynthesis> {
    // Récupérer le client avec toutes ses relations
    // Note: On utilise des requêtes séparées pour éviter les problèmes de typage
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: this.cabinetId,
      },
    })
    
    if (!client) {
      throw new Error('Client non trouvé')
    }
    
    // Récupérer les relations séparément
    const actifs = await prisma.clientActif.findMany({
      where: { clientId },
      include: { actif: true },
    })
    
    const passifs = await prisma.passif.findMany({
      where: { clientId },
    })

    const credits = await prisma.credit.findMany({
      where: {
        clientId,
        cabinetId: this.cabinetId,
        isActive: true,
      },
    })

    // Récupérer revenus et dépenses depuis les tables dédiées (source de vérité pour Budget)
    // IMPORTANT: Inclure cabinetId pour l'isolation des données
    const revenues = await prisma.revenue.findMany({
      where: { clientId, cabinetId: this.cabinetId, isActive: true },
    })
    const expenses = await prisma.expense.findMany({
      where: { clientId, cabinetId: this.cabinetId, isActive: true },
    })
    logger.debug('Loaded budget data', { module: 'SynthesisService', metadata: { revenues: revenues.length, expenses: expenses.length } } as any)
    
    const budget = await prisma.clientBudget.findUnique({
      where: { clientId },
    })
    
    const objectifs = await prisma.objectif.findMany({
      where: { clientId },
    })
    
    const projets = await prisma.projet.findMany({
      where: { clientId },
    })
    
    const contrats = await prisma.contrat.findMany({
      where: { clientId },
    })
    
    // Construire l'objet client enrichi
    const clientData = {
      ...client,
      actifs,
      passifs,
      credits,
      revenues,
      expenses,
      budget,
      objectifs,
      projets,
      contrats,
    }
    
    // Calculer chaque section
    const patrimoineSummary = this.calculatePatrimoine(clientData)
    const budgetSummary = this.calculateBudget(clientData)
    const objectifsSummary = this.mapObjectifs(objectifs || [])
    const projetsSummary = this.mapProjets(projets || [])
    const alertesSummary = this.generateAlertes(patrimoineSummary, budgetSummary, objectifsSummary)
    const indicateursSummary = this.generateIndicateurs(patrimoineSummary, budgetSummary, clientData)
    
    // Calculer la complétude des données
    const dataCompleteness = this.calculateDataCompleteness(clientData)
    
    return {
      clientId: client.id,
      clientName: `${client.firstName || ''} ${client.lastName || ''}`.trim(),
      calculatedAt: new Date(),
      patrimoine: patrimoineSummary,
      budget: budgetSummary,
      objectifs: objectifsSummary,
      projets: projetsSummary,
      alertes: alertesSummary,
      indicateurs: indicateursSummary,
      lastPatrimoineUpdate: actifs?.[0]?.actif?.updatedAt || null,
      lastBudgetUpdate: budget?.updatedAt || null,
      dataCompleteness,
    }
  }
  
  /**
   * Calcule le patrimoine
   */
  private calculatePatrimoine(client: ClientDataInternal): PatrimoineSummary {
    let totalActifs = 0
    let actifsGeres = 0
    let actifsNonGeres = 0
    const repartition = {
      immobilier: 0,
      financier: 0,
      professionnel: 0,
      autre: 0,
    }
    
    // Parcourir les actifs
    if (client.actifs) {
      for (const clientActif of client.actifs) {
        const actif = clientActif.actif
        if (!actif) continue
        
        const value = Number(actif.value) || 0
        const percentage = Number(clientActif.ownershipPercentage) / 100 || 1
        const clientShare = value * percentage
        
        totalActifs += clientShare
        
        // Répartition par catégorie
        const category = actif.category?.toUpperCase() || 'AUTRE'
        if (category === 'IMMOBILIER') {
          repartition.immobilier += clientShare
        } else if (category === 'FINANCIER') {
          repartition.financier += clientShare
        } else if (category === 'PROFESSIONNEL') {
          repartition.professionnel += clientShare
        } else {
          repartition.autre += clientShare
        }
        
        // Actifs gérés vs non gérés
        if (actif.managedByFirm) {
          actifsGeres += clientShare
        } else {
          actifsNonGeres += clientShare
        }
      }
    }
    
    // Calculer les passifs
    let totalPassifs = 0
    if (client.passifs) {
      for (const passif of client.passifs) {
        totalPassifs += Number(passif.remainingAmount) || 0
      }
    }
    
    const patrimoineNet = totalActifs - totalPassifs
    
    // Calculer les pourcentages
    const repartitionPourcentage = {
      immobilier: totalActifs > 0 ? (repartition.immobilier / totalActifs) * 100 : 0,
      financier: totalActifs > 0 ? (repartition.financier / totalActifs) * 100 : 0,
      professionnel: totalActifs > 0 ? (repartition.professionnel / totalActifs) * 100 : 0,
      autre: totalActifs > 0 ? (repartition.autre / totalActifs) * 100 : 0,
    }
    
    return {
      patrimoineBrut: totalActifs,
      patrimoineNet,
      totalActifs,
      totalPassifs,
      repartition,
      repartitionPourcentage,
      actifsGeres,
      actifsNonGeres,
      tauxGestion: totalActifs > 0 ? (actifsGeres / totalActifs) * 100 : 0,
    }
  }
  
  /**
   * Calcule le budget - Utilise les tables Revenue et Expense (source de vérité)
   */
  private calculateBudget(client: ClientDataInternal): BudgetSummary {
    // Helper pour convertir en montant mensuel
    const toMonthly = (amount: number, frequence: string): number => {
      switch (frequence?.toUpperCase()) {
        case 'ANNUEL': return amount / 12
        case 'SEMESTRIEL': return amount / 6
        case 'TRIMESTRIEL': return amount / 3
        case 'PONCTUEL': return amount / 12
        case 'MENSUEL':
        default: return amount
      }
    }

    // Catégories de logement pour identifier le loyer
    const LOGEMENT_CATEGORIES = [
      'LOYER', 'CREDIT_IMMOBILIER_RP', 'CREDIT_IMMOBILIER_LOCATIF',
      'CHARGES_COPROPRIETE', 'TAXE_FONCIERE', 'ASSURANCE_HABITATION',
      'ELECTRICITE_GAZ', 'EAU', 'INTERNET_TELEPHONE'
    ]

    // === REVENUS depuis table Revenue ===
    let revenusMensuels = 0
    if (client.revenues && Array.isArray(client.revenues)) {
      revenusMensuels = client.revenues.reduce((sum: number, r: Record<string, any>) => {
        const montant = Number(r.montant ?? r.amount ?? 0)
        const freq = String(r.frequence ?? r.frequency ?? 'MENSUEL')
        return sum + toMonthly(montant, freq)
      }, 0)
    }
    // Fallback sur client.annualIncome si pas de revenus
    if (revenusMensuels <= 0 && client.annualIncome) {
      revenusMensuels = Number(client.annualIncome) / 12
    }

    // === CHARGES depuis table Expense ===
    let chargesMensuellesHorsCredits = 0
    let loyerActuel = 0
    if (client.expenses && Array.isArray(client.expenses)) {
      logger.debug('Processing expenses', { module: 'SynthesisService', metadata: { count: client.expenses.length } } as any)
      client.expenses.forEach((e: Record<string, any>) => {
        const montant = Number(e.montant ?? e.amount ?? 0)
        const freq = String(e.frequence ?? e.frequency ?? 'MENSUEL')
        const montantMensuel = toMonthly(montant, freq)
        chargesMensuellesHorsCredits += montantMensuel
        
        // Identifier le loyer (catégories logement) - inclure aussi 'LOGEMENT' comme groupe
        const cat = String(e.categorie ?? e.category ?? '').toUpperCase()
        logger.debug('Expense detail', { module: 'SynthesisService', metadata: { libelle: e.libelle, cat, montantMensuel } } as any)
        if (LOGEMENT_CATEGORIES.includes(cat) || cat === 'LOGEMENT') {
          loyerActuel += montantMensuel
        }
      })
      logger.debug('Loyer total detected', { module: 'SynthesisService', metadata: { loyerActuel } } as any)
    } else {
      logger.debug('No expenses found for client', { module: 'SynthesisService' })
    }
    
    // Mensualités des crédits
    let mensualitesCredits = 0
    if (client.credits && Array.isArray(client.credits)) {
      mensualitesCredits = client.credits.reduce((sum: number, credit: Record<string, any>) => {
        const mensualite = Number(credit.mensualiteTotale ?? credit.mensualiteHorsAssurance ?? 0)
        return sum + (Number.isFinite(mensualite) ? mensualite : 0)
      }, 0)
    }

    // Fallback sur passifs si pas de crédits
    if (mensualitesCredits <= 0 && client.passifs) {
      for (const passif of client.passifs) {
        mensualitesCredits += Number(passif.monthlyPayment) || 0
      }
    }

    const chargesMensuelles = chargesMensuellesHorsCredits + mensualitesCredits

    const situationFamiliale: 'seul' | 'couple' = ['MARIE', 'PACSE', 'CONCUBINAGE'].includes(
      String(client.maritalStatus || '').toUpperCase()
    )
      ? 'couple'
      : 'seul'
    const nbEnfants = Number(client.numberOfChildren) || 0
    
    const capaciteEpargneMensuelle = revenusMensuels - chargesMensuelles
    const tauxEpargne = revenusMensuels > 0 ? (capaciteEpargneMensuelle / revenusMensuels) * 100 : 0

    logger.debug('Computing debt ratio', { module: 'SynthesisService', metadata: { revenusMensuels, mensualitesCredits, loyerActuel, chargesMensuellesHorsCredits } } as any)
    const endettement = calculerEndettement({
      revenusMensuels,
      mensualitesCreditsEnCours: mensualitesCredits,
      loyerActuel,
      situationFamiliale,
      nbEnfants,
    })
    const tauxEndettement = endettement.tauxAvecLoyer
    logger.debug('Debt ratio result', { module: 'SynthesisService', metadata: { tauxEndettement, tauxActuel: endettement.tauxActuel } } as any)
    const resteAVivre = revenusMensuels - chargesMensuelles
    
    return {
      revenusMensuels,
      revenusAnnuels: revenusMensuels * 12,
      chargesMensuelles,
      chargesAnnuelles: chargesMensuelles * 12,
      capaciteEpargneMensuelle,
      capaciteEpargneAnnuelle: capaciteEpargneMensuelle * 12,
      tauxEpargne,
      mensualitesCredits,
      tauxEndettement,
      resteAVivre,
    }
  }
  
  /**
   * Mappe les objectifs
   */
  private mapObjectifs(objectifs: ClientDataInternal[]): ObjectifSummary[] {
    const now = new Date()
    
    return objectifs.map(obj => {
      const targetDate = obj.targetDate ? new Date(obj.targetDate) : null
      const daysRemaining = targetDate ? Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
      
      const targetAmount = Number(obj.targetAmount) || 0
      const currentAmount = Number(obj.currentAmount) || 0
      const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
      
      let status: ObjectifSummary['status'] = 'ON_TRACK'
      if (progress >= 100) {
        status = 'TERMINE'
      } else if (daysRemaining !== null && daysRemaining < 0) {
        status = 'EN_RETARD'
      } else if (daysRemaining !== null && daysRemaining < 90 && progress < 75) {
        status = 'AT_RISK'
      }
      
      return {
        id: obj.id,
        name: obj.name || 'Objectif sans nom',
        type: obj.type || 'AUTRE',
        priority: obj.priority || 'MOYENNE',
        targetAmount,
        currentAmount,
        progress,
        targetDate,
        daysRemaining,
        status,
      }
    })
  }
  
  /**
   * Mappe les projets
   */
  private mapProjets(projets: ClientDataInternal[]): ProjetSummary[] {
    return projets.map(proj => ({
      id: proj.id,
      name: proj.name || 'Projet sans nom',
      type: proj.type || 'AUTRE',
      status: proj.status || 'BROUILLON',
      budget: Number(proj.budget) || 0,
      startDate: proj.startDate ? new Date(proj.startDate) : null,
      endDate: proj.endDate ? new Date(proj.endDate) : null,
    }))
  }
  
  /**
   * Génère les alertes automatiques
   */
  private generateAlertes(
    patrimoine: PatrimoineSummary,
    budget: BudgetSummary,
    objectifs: ObjectifSummary[]
  ): AlerteSynthese[] {
    const alertes: AlerteSynthese[] = []
    
    // Alerte concentration immobilière
    if (patrimoine.repartitionPourcentage.immobilier > 70) {
      alertes.push({
        id: 'CONCENTRATION_IMMO',
        type: patrimoine.repartitionPourcentage.immobilier > 85 ? 'CRITIQUE' : 'WARNING',
        category: 'Patrimoine',
        message: `Concentration immobilière élevée (${Math.round(patrimoine.repartitionPourcentage.immobilier)}%)`,
        recommendation: 'Diversifier vers des actifs financiers pour réduire le risque',
        value: patrimoine.repartitionPourcentage.immobilier,
        threshold: 70,
      })
    }
    
    // Alerte taux d'endettement
    if (budget.tauxEndettement > 35) {
      alertes.push({
        id: 'ENDETTEMENT_ELEVE',
        type: 'CRITIQUE',
        category: 'Budget',
        message: `Taux d'endettement élevé (${Math.round(budget.tauxEndettement)}%)`,
        recommendation: 'Réduire les dettes ou augmenter les revenus',
        value: budget.tauxEndettement,
        threshold: 35,
      })
    } else if (budget.tauxEndettement > 30) {
      alertes.push({
        id: 'ENDETTEMENT_ATTENTION',
        type: 'WARNING',
        category: 'Budget',
        message: `Taux d'endettement à surveiller (${Math.round(budget.tauxEndettement)}%)`,
        recommendation: 'Limiter les nouveaux engagements de crédit',
        value: budget.tauxEndettement,
        threshold: 30,
      })
    }
    
    // Alerte épargne de précaution
    const epargneSecurite = budget.chargesMensuelles * 6
    if (patrimoine.repartition.financier < epargneSecurite) {
      alertes.push({
        id: 'EPARGNE_PRECAUTION',
        type: patrimoine.repartition.financier < budget.chargesMensuelles * 3 ? 'CRITIQUE' : 'WARNING',
        category: 'Épargne',
        message: 'Épargne de précaution insuffisante',
        recommendation: `Constituer une épargne de sécurité d'au moins ${Math.round(epargneSecurite).toLocaleString('fr-FR')} €`,
        value: patrimoine.repartition.financier,
        threshold: epargneSecurite,
      })
    }
    
    // Alerte objectifs en retard
    const objectifsEnRetard = objectifs.filter(o => o.status === 'EN_RETARD')
    if (objectifsEnRetard.length > 0) {
      alertes.push({
        id: 'OBJECTIFS_RETARD',
        type: 'WARNING',
        category: 'Objectifs',
        message: `${objectifsEnRetard.length} objectif(s) en retard`,
        recommendation: 'Réviser les échéances ou augmenter les versements',
      })
    }
    
    // Alerte objectifs à risque
    const objectifsARisque = objectifs.filter(o => o.status === 'AT_RISK')
    if (objectifsARisque.length > 0) {
      alertes.push({
        id: 'OBJECTIFS_RISQUE',
        type: 'INFO',
        category: 'Objectifs',
        message: `${objectifsARisque.length} objectif(s) à surveiller`,
        recommendation: 'Vérifier la stratégie d\'épargne',
      })
    }
    
    // Alerte taux d'épargne faible
    if (budget.tauxEpargne < 10 && budget.revenusMensuels > 0) {
      alertes.push({
        id: 'EPARGNE_FAIBLE',
        type: 'WARNING',
        category: 'Budget',
        message: `Taux d'épargne faible (${Math.round(budget.tauxEpargne)}%)`,
        recommendation: 'Optimiser les charges pour dégager plus d\'épargne',
        value: budget.tauxEpargne,
        threshold: 10,
      })
    }
    
    // Alerte patrimoine net négatif
    if (patrimoine.patrimoineNet < 0) {
      alertes.push({
        id: 'PATRIMOINE_NEGATIF',
        type: 'CRITIQUE',
        category: 'Patrimoine',
        message: 'Patrimoine net négatif',
        recommendation: 'Prioriser le remboursement des dettes',
        value: patrimoine.patrimoineNet,
        threshold: 0,
      })
    }
    
    return alertes.sort((a, b) => {
      const order = { CRITICAL: 0, WARNING: 1, INFO: 2 }
      return order[a.type] - order[b.type]
    })
  }
  
  /**
   * Génère les indicateurs clés
   */
  private generateIndicateurs(
    patrimoine: PatrimoineSummary,
    budget: BudgetSummary,
    _client: ClientDataInternal
  ): IndicateurCle[] {
    const indicateurs: IndicateurCle[] = []
    
    // Capacité d'emprunt estimée (formule simplifiée)
    const capaciteEmpruntMensuelle = (budget.revenusMensuels * 0.35) - budget.mensualitesCredits
    const capaciteEmpruntEstimee = capaciteEmpruntMensuelle > 0 ? capaciteEmpruntMensuelle * 240 : 0 // ~20 ans
    
    indicateurs.push({
      id: 'CAPACITE_EMPRUNT',
      name: 'Capacité d\'emprunt estimée',
      value: capaciteEmpruntEstimee,
      unit: '€',
      status: capaciteEmpruntEstimee > 100000 ? 'GOOD' : capaciteEmpruntEstimee > 0 ? 'WARNING' : 'CRITIQUE',
      description: 'Estimation basée sur le taux d\'endettement 35%',
      isPremium: false,
      estimatedValue: capaciteEmpruntEstimee,
    })
    
    // Épargne de sécurité recommandée
    const epargneSecuriteRecommandee = budget.chargesMensuelles * 6
    indicateurs.push({
      id: 'EPARGNE_SECURITE',
      name: 'Épargne de sécurité recommandée',
      value: epargneSecuriteRecommandee,
      unit: '€',
      status: patrimoine.repartition.financier >= epargneSecuriteRecommandee ? 'GOOD' : 'WARNING',
      description: 'Équivalent de 6 mois de charges',
      isPremium: false,
    })
    
    // Ratio patrimoine/revenus
    const ratioPatrimoineRevenus = budget.revenusAnnuels > 0 
      ? patrimoine.patrimoineNet / budget.revenusAnnuels 
      : 0
    indicateurs.push({
      id: 'RATIO_PATRIMOINE_REVENUS',
      name: 'Ratio patrimoine/revenus',
      value: ratioPatrimoineRevenus,
      unit: 'x',
      status: ratioPatrimoineRevenus > 5 ? 'GOOD' : ratioPatrimoineRevenus > 2 ? 'NEUTRAL' : 'WARNING',
      description: 'Patrimoine net divisé par les revenus annuels',
      isPremium: false,
    })
    
    // Indicateurs premium (teasers)
    indicateurs.push({
      id: 'PROJECTION_RETRAITE',
      name: 'Projection retraite',
      value: '🔒',
      status: 'NEUTRAL',
      description: 'Simulation complète avec le simulateur Retraite',
      isPremium: true,
    })
    
    indicateurs.push({
      id: 'DROITS_SUCCESSION',
      name: 'Droits de succession estimés',
      value: '🔒',
      status: 'NEUTRAL',
      description: 'Simulation complète avec le simulateur Succession',
      isPremium: true,
    })
    
    indicateurs.push({
      id: 'OPTIMISATION_FISCALE',
      name: 'Potentiel d\'optimisation fiscale',
      value: '🔒',
      status: 'NEUTRAL',
      description: 'Analyse complète avec les calculateurs fiscaux',
      isPremium: true,
    })
    
    return indicateurs
  }
  
  /**
   * Calcule la complétude des données
   */
  private calculateDataCompleteness(client: ClientDataInternal): number {
    let score = 0
    let maxScore = 0
    
    // Informations de base (20 points)
    maxScore += 20
    if (client.firstName) score += 5
    if (client.lastName) score += 5
    if (client.birthDate) score += 5
    if (client.email || client.phone) score += 5
    
    // Patrimoine (30 points)
    maxScore += 30
    if (client.actifs?.length > 0) score += 15
    if (client.passifs?.length > 0) score += 10
    if (client.contrats?.length > 0) score += 5
    
    // Budget (30 points)
    maxScore += 30
    if (client.budget) {
      score += 10
      if (client.budget.professionalIncome) score += 10
      if (client.budget.monthlyExpenses) score += 10
    }
    
    // Objectifs (20 points)
    maxScore += 20
    if (client.objectifs?.length > 0) score += 10
    if (client.projets?.length > 0) score += 10
    
    return Math.round((score / maxScore) * 100)
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createSynthesisService(cabinetId: string): SynthesisService {
  return new SynthesisService(cabinetId)
}
