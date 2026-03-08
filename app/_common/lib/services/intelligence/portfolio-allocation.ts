/**
 * Portfolio Allocation Engine — Rééquilibrage & Allocation cible
 * 
 * Inspiré par :
 *   - Anthropic Financial Services Plugins (wealth-management/portfolio-rebalance)
 *   - Gist branw/22244fa900cc38bb58d4399ba3d8f744 (Portfolio Rebalancer)
 *   - Gist sidharthkumarpradhan (AI-Powered Portfolio Management)
 * 
 * Adapté CGP français : Assurance-vie, PER, SCPI, Actions, Obligations, Monétaire, Immobilier.
 * 
 * Composants :
 *   1. Allocation Analyzer — Analyse de l'allocation actuelle vs profil de risque
 *   2. Rebalance Calculator — Calcul des mouvements pour atteindre l'allocation cible
 *   3. Contribution Distributor — Distribution optimale des versements programmés
 *   4. Drift Detector — Alerte dérive allocation
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

/** Classes d'actifs CGP français */
export type AssetClass =
  | 'FONDS_EUROS'         // Assurance-vie fonds euros
  | 'UC_ACTIONS'          // UC actions (AV/PER)
  | 'UC_OBLIGATIONS'      // UC obligations
  | 'UC_DIVERSIFIE'       // UC diversifiés/flexibles
  | 'MONETAIRE'           // Livrets, comptes, dépôts
  | 'ACTIONS_DIRECTES'    // PEA, CTO
  | 'IMMOBILIER_PHYSIQUE' // Résidence principale, locatif
  | 'SCPI_OPCI'           // Pierre-papier
  | 'PRIVATE_EQUITY'      // FCPR, FCPI, FIP
  | 'OR_MATIERES'         // Or, matières premières
  | 'CRYPTO'              // Actifs numériques
  | 'TRESORERIE'          // Trésorerie disponible
  | 'DETTE'               // Passifs (crédits)

export interface AllocationTarget {
  assetClass: AssetClass
  targetPct: number       // % cible
  minPct: number          // % minimum toléré
  maxPct: number          // % maximum toléré
  label: string
}

export interface CurrentAllocation {
  assetClass: AssetClass
  label: string
  value: number           // Valeur en €
  pct: number             // % du total
}

export interface AllocationDrift {
  assetClass: AssetClass
  label: string
  currentPct: number
  targetPct: number
  driftPct: number        // Écart en points de %
  status: 'ok' | 'warning' | 'critical'
  direction: 'over' | 'under' | 'on_target'
}

export interface RebalanceAction {
  assetClass: AssetClass
  label: string
  action: 'buy' | 'sell' | 'hold'
  amount: number          // Montant en €
  fromPct: number
  toPct: number
  rationale: string
}

export interface RebalanceProposal {
  clientId: string
  clientName: string
  totalPortfolio: number
  currentAllocations: CurrentAllocation[]
  targetAllocations: AllocationTarget[]
  drifts: AllocationDrift[]
  actions: RebalanceAction[]
  summary: {
    totalMoves: number
    totalBuys: number
    totalSells: number
    maxDrift: number
    rebalanceUrgency: 'none' | 'low' | 'medium' | 'high'
  }
}

export interface ContributionPlan {
  monthlyAmount: number
  distributions: {
    assetClass: AssetClass
    label: string
    amount: number
    pct: number
    rationale: string
  }[]
  projectedAllocationAfter: CurrentAllocation[]
}

// ============================================================================
// PROFILS DE RISQUE — ALLOCATIONS CIBLES (AMF/MiFID II)
// ============================================================================

const RISK_PROFILE_TARGETS: Record<string, AllocationTarget[]> = {
  PRUDENT: [
    { assetClass: 'FONDS_EUROS', targetPct: 50, minPct: 40, maxPct: 65, label: 'Fonds euros' },
    { assetClass: 'UC_OBLIGATIONS', targetPct: 20, minPct: 10, maxPct: 30, label: 'Obligations' },
    { assetClass: 'UC_ACTIONS', targetPct: 10, minPct: 0, maxPct: 20, label: 'Actions' },
    { assetClass: 'SCPI_OPCI', targetPct: 10, minPct: 0, maxPct: 15, label: 'SCPI/OPCI' },
    { assetClass: 'MONETAIRE', targetPct: 10, minPct: 5, maxPct: 20, label: 'Monétaire' },
  ],
  EQUILIBRE: [
    { assetClass: 'FONDS_EUROS', targetPct: 30, minPct: 20, maxPct: 40, label: 'Fonds euros' },
    { assetClass: 'UC_ACTIONS', targetPct: 30, minPct: 20, maxPct: 40, label: 'Actions' },
    { assetClass: 'UC_OBLIGATIONS', targetPct: 15, minPct: 10, maxPct: 25, label: 'Obligations' },
    { assetClass: 'SCPI_OPCI', targetPct: 15, minPct: 5, maxPct: 20, label: 'SCPI/OPCI' },
    { assetClass: 'MONETAIRE', targetPct: 5, minPct: 0, maxPct: 15, label: 'Monétaire' },
    { assetClass: 'UC_DIVERSIFIE', targetPct: 5, minPct: 0, maxPct: 10, label: 'Diversifié' },
  ],
  DYNAMIQUE: [
    { assetClass: 'UC_ACTIONS', targetPct: 50, minPct: 35, maxPct: 65, label: 'Actions' },
    { assetClass: 'FONDS_EUROS', targetPct: 15, minPct: 5, maxPct: 25, label: 'Fonds euros' },
    { assetClass: 'SCPI_OPCI', targetPct: 15, minPct: 5, maxPct: 20, label: 'SCPI/OPCI' },
    { assetClass: 'UC_OBLIGATIONS', targetPct: 10, minPct: 5, maxPct: 20, label: 'Obligations' },
    { assetClass: 'PRIVATE_EQUITY', targetPct: 5, minPct: 0, maxPct: 10, label: 'Private Equity' },
    { assetClass: 'MONETAIRE', targetPct: 5, minPct: 0, maxPct: 10, label: 'Monétaire' },
  ],
  OFFENSIF: [
    { assetClass: 'UC_ACTIONS', targetPct: 65, minPct: 50, maxPct: 80, label: 'Actions' },
    { assetClass: 'SCPI_OPCI', targetPct: 10, minPct: 0, maxPct: 15, label: 'SCPI/OPCI' },
    { assetClass: 'PRIVATE_EQUITY', targetPct: 10, minPct: 0, maxPct: 15, label: 'Private Equity' },
    { assetClass: 'UC_OBLIGATIONS', targetPct: 5, minPct: 0, maxPct: 15, label: 'Obligations' },
    { assetClass: 'FONDS_EUROS', targetPct: 5, minPct: 0, maxPct: 15, label: 'Fonds euros' },
    { assetClass: 'MONETAIRE', targetPct: 5, minPct: 0, maxPct: 10, label: 'Monétaire' },
  ],
}

// ============================================================================
// PORTFOLIO ALLOCATION ENGINE
// ============================================================================

export class PortfolioAllocationEngine {
  private cabinetId: string

  constructor(cabinetId: string) {
    this.cabinetId = cabinetId
  }

  private get prisma() {
    return getPrismaClient(this.cabinetId)
  }

  /**
   * Analyser l'allocation actuelle d'un client et proposer un rééquilibrage
   */
  async analyzeAndRebalance(clientId: string): Promise<RebalanceProposal> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, cabinetId: this.cabinetId },
      include: {
        actifs: {
          include: { actif: { select: { id: true, name: true, type: true, category: true, value: true } } },
        },
        passifs: {
          select: { id: true, type: true, initialAmount: true, remainingAmount: true, name: true },
        },
        contrats: {
          where: { status: 'ACTIF' },
          select: { id: true, type: true, value: true, name: true },
        },
      },
    })

    if (!client) throw new Error(`Client ${clientId} introuvable`)

    // Determine risk profile
    const riskProfile = client.riskProfile || 'EQUILIBRE'
    const targets = RISK_PROFILE_TARGETS[riskProfile] || RISK_PROFILE_TARGETS.EQUILIBRE

    // Build current allocation from actifs + contrats
    const allocMap = new Map<AssetClass, number>()

    for (const ca of client.actifs || []) {
      const actif = ca.actif
      const value = Number(actif.value || 0)
      const assetClass = this.mapActifToAssetClass(actif.type, actif.category as string)
      allocMap.set(assetClass, (allocMap.get(assetClass) || 0) + value)
    }

    // Add contract values
    for (const contrat of client.contrats || []) {
      const value = Number(contrat.value || 0)
      if (contrat.type === 'ASSURANCE_VIE') {
        // Simplified: split AV value based on profile
        const feAlloc = riskProfile === 'PRUDENT' ? 0.6 : riskProfile === 'EQUILIBRE' ? 0.4 : 0.2
        allocMap.set('FONDS_EUROS', (allocMap.get('FONDS_EUROS') || 0) + value * feAlloc)
        allocMap.set('UC_ACTIONS', (allocMap.get('UC_ACTIONS') || 0) + value * (1 - feAlloc))
      } else if (contrat.type === 'EPARGNE_RETRAITE') {
        allocMap.set('UC_DIVERSIFIE', (allocMap.get('UC_DIVERSIFIE') || 0) + value)
      }
    }

    const totalPortfolio = [...allocMap.values()].reduce((sum, v) => sum + v, 0)
    if (totalPortfolio === 0) {
      return {
        clientId,
        clientName: `${client.firstName} ${client.lastName}`,
        totalPortfolio: 0,
        currentAllocations: [],
        targetAllocations: targets,
        drifts: [],
        actions: [],
        summary: { totalMoves: 0, totalBuys: 0, totalSells: 0, maxDrift: 0, rebalanceUrgency: 'none' },
      }
    }

    // Current allocations
    const currentAllocations: CurrentAllocation[] = [...allocMap.entries()].map(([ac, value]) => ({
      assetClass: ac,
      label: targets.find(t => t.assetClass === ac)?.label || ac,
      value,
      pct: Math.round((value / totalPortfolio) * 1000) / 10,
    }))

    // Calculate drifts
    const drifts: AllocationDrift[] = targets.map(target => {
      const current = currentAllocations.find(c => c.assetClass === target.assetClass)
      const currentPct = current?.pct || 0
      const driftPct = Math.round((currentPct - target.targetPct) * 10) / 10

      let status: AllocationDrift['status']
      if (currentPct < target.minPct || currentPct > target.maxPct) status = 'critical'
      else if (Math.abs(driftPct) > 5) status = 'warning'
      else status = 'ok'

      return {
        assetClass: target.assetClass,
        label: target.label,
        currentPct,
        targetPct: target.targetPct,
        driftPct,
        status,
        direction: driftPct > 1 ? 'over' as const : driftPct < -1 ? 'under' as const : 'on_target' as const,
      }
    })

    // Calculate rebalance actions
    const actions: RebalanceAction[] = drifts
      .filter(d => d.status !== 'ok' || Math.abs(d.driftPct) > 2)
      .map(d => {
        const amount = Math.round(Math.abs(d.driftPct / 100) * totalPortfolio)
        const action: RebalanceAction['action'] = d.direction === 'over' ? 'sell' : d.direction === 'under' ? 'buy' : 'hold'

        let rationale: string
        if (d.status === 'critical') {
          rationale = `Hors bande de tolérance (${d.currentPct}% vs ${d.driftPct > 0 ? d.driftPct : d.driftPct}% max). Rééquilibrage urgent.`
        } else {
          rationale = `Écart de ${Math.abs(d.driftPct)} points. Ajustement recommandé.`
        }

        return {
          assetClass: d.assetClass,
          label: d.label,
          action,
          amount,
          fromPct: d.currentPct,
          toPct: d.targetPct,
          rationale,
        }
      })
      .filter(a => a.action !== 'hold')

    const maxDrift = Math.max(...drifts.map(d => Math.abs(d.driftPct)), 0)
    let rebalanceUrgency: RebalanceProposal['summary']['rebalanceUrgency']
    if (drifts.some(d => d.status === 'critical')) rebalanceUrgency = 'high'
    else if (maxDrift > 5) rebalanceUrgency = 'medium'
    else if (maxDrift > 2) rebalanceUrgency = 'low'
    else rebalanceUrgency = 'none'

    return {
      clientId,
      clientName: `${client.firstName} ${client.lastName}`,
      totalPortfolio,
      currentAllocations,
      targetAllocations: targets,
      drifts,
      actions,
      summary: {
        totalMoves: actions.length,
        totalBuys: actions.filter(a => a.action === 'buy').reduce((s, a) => s + a.amount, 0),
        totalSells: actions.filter(a => a.action === 'sell').reduce((s, a) => s + a.amount, 0),
        maxDrift,
        rebalanceUrgency,
      },
    }
  }

  /**
   * Distribuer un versement programmé de manière optimale pour se rapprocher de l'allocation cible
   * (Algorithme inspiré de branw/Portfolio Rebalancer)
   */
  async distributeContribution(
    clientId: string,
    monthlyAmount: number,
  ): Promise<ContributionPlan> {
    const proposal = await this.analyzeAndRebalance(clientId)
    if (proposal.totalPortfolio === 0 || proposal.targetAllocations.length === 0) {
      // New portfolio: distribute according to target allocation
      return {
        monthlyAmount,
        distributions: proposal.targetAllocations.map(t => ({
          assetClass: t.assetClass,
          label: t.label,
          amount: Math.round(monthlyAmount * t.targetPct / 100),
          pct: t.targetPct,
          rationale: `Allocation initiale selon profil ${proposal.clientName}`,
        })),
        projectedAllocationAfter: proposal.targetAllocations.map(t => ({
          assetClass: t.assetClass,
          label: t.label,
          value: Math.round(monthlyAmount * t.targetPct / 100),
          pct: t.targetPct,
        })),
      }
    }

    // Greedy algorithm: allocate contribution to the most under-weight asset classes
    const newTotal = proposal.totalPortfolio + monthlyAmount
    const distributions: ContributionPlan['distributions'] = []
    let remaining = monthlyAmount

    // Sort drifts by most underweight first
    const underweighted = proposal.drifts
      .filter(d => d.direction === 'under' || d.driftPct < 0)
      .sort((a, b) => a.driftPct - b.driftPct) // Most negative first

    for (const drift of underweighted) {
      if (remaining <= 0) break

      // How much do we need to add to reach target?
      const currentValue = proposal.currentAllocations.find(c => c.assetClass === drift.assetClass)?.value || 0
      const targetValue = (drift.targetPct / 100) * newTotal
      const neededAmount = Math.max(0, targetValue - currentValue)
      const allocatedAmount = Math.min(remaining, neededAmount)

      if (allocatedAmount > 0) {
        distributions.push({
          assetClass: drift.assetClass,
          label: drift.label,
          amount: Math.round(allocatedAmount),
          pct: Math.round((allocatedAmount / monthlyAmount) * 100),
          rationale: `Rééquilibrage: ${drift.currentPct}% → objectif ${drift.targetPct}%`,
        })
        remaining -= allocatedAmount
      }
    }

    // Distribute any remaining proportionally to target
    if (remaining > 0) {
      for (const target of proposal.targetAllocations) {
        const extra = Math.round(remaining * target.targetPct / 100)
        const existing = distributions.find(d => d.assetClass === target.assetClass)
        if (existing) {
          existing.amount += extra
          existing.pct = Math.round((existing.amount / monthlyAmount) * 100)
        } else if (extra > 0) {
          distributions.push({
            assetClass: target.assetClass,
            label: target.label,
            amount: extra,
            pct: Math.round((extra / monthlyAmount) * 100),
            rationale: 'Allocation proportionnelle au profil cible',
          })
        }
      }
    }

    // Projected allocation after contribution
    const projectedAllocationAfter: CurrentAllocation[] = proposal.targetAllocations.map(target => {
      const currentValue = proposal.currentAllocations.find(c => c.assetClass === target.assetClass)?.value || 0
      const addedValue = distributions.find(d => d.assetClass === target.assetClass)?.amount || 0
      const newValue = currentValue + addedValue
      return {
        assetClass: target.assetClass,
        label: target.label,
        value: newValue,
        pct: Math.round((newValue / newTotal) * 1000) / 10,
      }
    })

    return {
      monthlyAmount,
      distributions,
      projectedAllocationAfter,
    }
  }

  /**
   * Détecter les dérives d'allocation sur tout le portefeuille du cabinet
   */
  async detectPortfolioDrifts(): Promise<{
    clientsWithDrift: { clientId: string; clientName: string; maxDrift: number; urgency: string }[]
    totalClientsAnalyzed: number
    criticalCount: number
  }> {
    const clients = await this.prisma.client.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: 'ACTIF',
        patrimoineNet: { gte: 10_000 },
      },
      select: { id: true, firstName: true, lastName: true },
    })

    const results: { clientId: string; clientName: string; maxDrift: number; urgency: string }[] = []

    for (const client of clients) {
      try {
        const proposal = await this.analyzeAndRebalance(client.id)
        if (proposal.summary.rebalanceUrgency !== 'none') {
          results.push({
            clientId: client.id,
            clientName: `${client.firstName} ${client.lastName}`,
            maxDrift: proposal.summary.maxDrift,
            urgency: proposal.summary.rebalanceUrgency,
          })
        }
      } catch {
        // Skip clients with errors
      }
    }

    results.sort((a, b) => b.maxDrift - a.maxDrift)

    return {
      clientsWithDrift: results,
      totalClientsAnalyzed: clients.length,
      criticalCount: results.filter(r => r.urgency === 'high').length,
    }
  }

  // ── Helper: Map actif type to asset class ──
  private mapActifToAssetClass(type: string, subType?: string | null): AssetClass {
    switch (type) {
      case 'IMMOBILIER':
        return subType === 'SCPI' || subType === 'OPCI' ? 'SCPI_OPCI' : 'IMMOBILIER_PHYSIQUE'
      case 'FINANCIER':
        if (subType === 'ACTIONS' || subType === 'PEA') return 'ACTIONS_DIRECTES'
        if (subType === 'OBLIGATIONS') return 'UC_OBLIGATIONS'
        if (subType === 'FONDS_EUROS') return 'FONDS_EUROS'
        if (subType === 'MONETAIRE' || subType === 'LIVRET') return 'MONETAIRE'
        if (subType === 'SCPI' || subType === 'OPCI') return 'SCPI_OPCI'
        return 'UC_DIVERSIFIE'
      case 'PROFESSIONNEL':
        return 'PRIVATE_EQUITY'
      case 'AUTRE':
        if (subType === 'CRYPTO') return 'CRYPTO'
        if (subType === 'OR') return 'OR_MATIERES'
        return 'TRESORERIE'
      default:
        return 'TRESORERIE'
    }
  }
}
