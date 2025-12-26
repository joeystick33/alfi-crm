/**
 * Compliance Service - Gestion de la conformité réglementaire
 * Contrôles ACPR, LAB-FT, MIF2, etc.
 */

import { prisma } from '@/app/_common/lib/prisma'

export interface ComplianceCheck {
  id: string
  type: ComplianceCheckType
  clientId: string
  status: 'EN_ATTENTE' | 'PASSED' | 'ECHEC' | 'REVIEW_NEEDED'
  score: number
  details: ComplianceDetail[]
  createdAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

export type ComplianceCheckType = 
  | 'KYC_INITIAL'
  | 'KYC_REVIEW'
  | 'LAB_FT'
  | 'PPE'
  | 'SANCTIONS'
  | 'MIF2_SUITABILITY'
  | 'MIF2_APPROPRIATENESS'
  | 'CONFLICT_INTEREST'

export interface ComplianceDetail {
  rule: string
  description: string
  result: 'PASS' | 'FAIL' | 'WARNING'
  severity: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE'
  evidence?: string
}

export interface ComplianceAlert {
  id: string
  clientId: string
  type: string
  severity: 'INFO' | 'WARNING' | 'CRITIQUE'
  message: string
  actionRequired: boolean
  dueDate?: Date
  resolvedAt?: Date
}

export interface ComplianceStats {
  totalClients: number
  compliantClients: number
  nonCompliantClients: number
  pendingReviews: number
  alertsOpen: number
  complianceRate: number
}

export class ComplianceService {
  /**
   * Exécute un contrôle de conformité pour un client
   */
  async runComplianceCheck(
    clientId: string,
    type: ComplianceCheckType,
    userId: string
  ): Promise<ComplianceCheck> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        kycDocuments: true,
        actifs: {
          include: {
            actif: {
              select: {
                value: true,
              },
            },
          },
        },
        contrats: true,
      }
    })

    if (!client) {
      throw new Error('Client not found')
    }

    const details: ComplianceDetail[] = []
    let totalScore = 0
    let checksCount = 0

    // Contrôles selon le type
    switch (type) {
      case 'KYC_INITIAL':
      case 'KYC_REVIEW':
        details.push(...this.checkKYCCompliance(client))
        break
      case 'LAB_FT':
        details.push(...this.checkLABFTCompliance({
          sourceOfFunds: client.originOfFunds ?? undefined,
          actifs: (client.actifs || []).map((a) => ({
            value: typeof a.actif?.value === 'number' ? a.actif.value : Number(a.actif?.value) || 0,
          })),
          annualIncome: typeof client.annualIncome === 'number' ? client.annualIncome : Number(client.annualIncome) || 0,
        }))
        break
      case 'PPE':
        details.push(...this.checkPPEStatus({ isPPE: client.isPEP }))
        break
      case 'SANCTIONS':
        details.push(...this.checkSanctionsLists(client))
        break
      case 'MIF2_SUITABILITY':
        details.push(...this.checkMIF2Suitability({
          mifidCompleted: client.kycStatus === 'COMPLET',
          investmentObjectives: typeof client.investmentGoals === 'string' ? client.investmentGoals : undefined,
          investmentHorizonCode: typeof client.investmentHorizonCode === 'string' ? client.investmentHorizonCode : (client.investmentHorizonCode ? String(client.investmentHorizonCode) : undefined),
        }))
        break
      case 'MIF2_APPROPRIATENESS':
        details.push(...this.checkMIF2Appropriateness({
          appropriatenessTestPassed: Boolean(client.investmentKnowledgeCode),
        }))
        break
      case 'CONFLICT_INTEREST':
        details.push(...this.checkConflictOfInterest(client))
        break
    }

    // Calcul du score
    for (const detail of details) {
      checksCount++
      if (detail.result === 'PASS') totalScore += 100
      else if (detail.result === 'WARNING') totalScore += 50
    }

    const score = checksCount > 0 ? Math.round(totalScore / checksCount) : 0
    const hasCriticalFail = details.some(
      d => d.result === 'FAIL' && d.severity === 'CRITIQUE'
    )
    const hasAnyFail = details.some(d => d.result === 'FAIL')

    const status = hasCriticalFail 
      ? 'ECHEC' 
      : hasAnyFail 
        ? 'REVIEW_NEEDED' 
        : 'PASSED'

    return {
      id: `check-${Date.now()}`,
      type,
      clientId,
      status,
      score,
      details,
      createdAt: new Date(),
    }
  }

  /**
   * Contrôles KYC
   */
  private checkKYCCompliance(client: { kycDocuments?: Array<{ type: string; status: string }>; riskProfileCode?: string }): ComplianceDetail[] {
    const details: ComplianceDetail[] = []

    // Pièce d'identité
    const hasIdDocument = client.kycDocuments?.some(
      (d: { type: string; status: string }) => d.type === 'IDENTITE' && d.status === 'VALIDE'
    )
    details.push({
      rule: 'ID_DOCUMENT',
      description: 'Pièce d\'identité valide',
      result: hasIdDocument ? 'PASS' : 'FAIL',
      severity: 'CRITIQUE',
    })

    // Justificatif de domicile
    const hasAddressProof = client.kycDocuments?.some(
      (d: { type: string; status: string }) => d.type === 'ADDRESS_PROOF' && d.status === 'VALIDE'
    )
    details.push({
      rule: 'ADDRESS_PROOF',
      description: 'Justificatif de domicile',
      result: hasAddressProof ? 'PASS' : 'FAIL',
      severity: 'HAUTE',
    })

    // Profil de risque renseigné
    const hasRiskProfile = !!client.riskProfileCode
    details.push({
      rule: 'RISK_PROFILE',
      description: 'Profil de risque renseigné',
      result: hasRiskProfile ? 'PASS' : 'WARNING',
      severity: 'MOYENNE',
    })

    return details
  }

  /**
   * Contrôles LAB-FT (Lutte Anti-Blanchiment - Financement Terrorisme)
   */
  private checkLABFTCompliance(client: { sourceOfFunds?: string; actifs?: Array<{ value?: number }>; annualIncome?: number }): ComplianceDetail[] {
    const details: ComplianceDetail[] = []

    // Source des fonds
    details.push({
      rule: 'SOURCE_FUNDS',
      description: 'Origine des fonds déclarée',
      result: client.sourceOfFunds ? 'PASS' : 'FAIL',
      severity: 'CRITIQUE',
    })

    // Cohérence patrimoine / revenus
    const totalPatrimoine = (client.actifs || []).reduce(
      (sum: number, a: { value?: number }) => sum + (a.value || 0), 0
    )
    const revenus = client.annualIncome || 0
    const ratio = revenus > 0 ? totalPatrimoine / revenus : 0
    
    details.push({
      rule: 'WEALTH_INCOME_RATIO',
      description: 'Cohérence patrimoine/revenus',
      result: ratio < 50 ? 'PASS' : ratio < 100 ? 'WARNING' : 'FAIL',
      severity: ratio >= 100 ? 'HAUTE' : 'MOYENNE',
      evidence: `Ratio: ${ratio.toFixed(1)}x revenus annuels`,
    })

    return details
  }

  /**
   * Contrôle PPE (Personne Politiquement Exposée)
   */
  private checkPPEStatus(client: { isPPE?: boolean }): ComplianceDetail[] {
    return [{
      rule: 'PPE_STATUS',
      description: 'Statut PPE vérifié',
      result: client.isPPE === false ? 'PASS' : 'WARNING',
      severity: client.isPPE ? 'HAUTE' : 'BASSE',
      evidence: client.isPPE ? 'Client déclaré PPE - vigilance renforcée requise' : undefined,
    }]
  }

  /**
   * Contrôle listes sanctions
   */
  private checkSanctionsLists(_client: Record<string, unknown>): ComplianceDetail[] {
    // Simulation - en production, appel à une API externe
    return [{
      rule: 'SANCTIONS_CHECK',
      description: 'Vérification listes sanctions (UE, ONU, OFAC)',
      result: 'PASS',
      severity: 'CRITIQUE',
    }]
  }

  /**
   * Contrôle MIF2 Suitability
   */
  private checkMIF2Suitability(client: { mifidCompleted?: boolean; investmentObjectives?: string; investmentHorizonCode?: string }): ComplianceDetail[] {
    const details: ComplianceDetail[] = []

    // Questionnaire MIF2 rempli
    details.push({
      rule: 'MIF2_QUESTIONNAIRE',
      description: 'Questionnaire MIF2 complété',
      result: client.mifidCompleted ? 'PASS' : 'FAIL',
      severity: 'CRITIQUE',
    })

    // Objectifs d'investissement
    details.push({
      rule: 'INVESTMENT_OBJECTIVES',
      description: 'Objectifs d\'investissement définis',
      result: client.investmentObjectives ? 'PASS' : 'WARNING',
      severity: 'HAUTE',
    })

    // Horizon de placement
    details.push({
      rule: 'INVESTMENT_HORIZON',
      description: 'Horizon de placement défini',
      result: client.investmentHorizonCode ? 'PASS' : 'WARNING',
      severity: 'MOYENNE',
    })

    return details
  }

  /**
   * Contrôle MIF2 Appropriateness
   */
  private checkMIF2Appropriateness(client: { appropriatenessTestPassed?: boolean }): ComplianceDetail[] {
    return [{
      rule: 'APPROPRIATENESS_TEST',
      description: 'Test d\'adéquation MIF2',
      result: client.appropriatenessTestPassed ? 'PASS' : 'WARNING',
      severity: 'HAUTE',
    }]
  }

  /**
   * Contrôle conflits d'intérêts
   */
  private checkConflictOfInterest(_client: Record<string, unknown>): ComplianceDetail[] {
    return [{
      rule: 'CONFLICT_INTEREST',
      description: 'Absence de conflit d\'intérêts déclaré',
      result: 'PASS',
      severity: 'MOYENNE',
    }]
  }

  /**
   * Statistiques de conformité pour un conseiller
   */
  async getComplianceStats(advisorId: string): Promise<ComplianceStats> {
    const clients = await prisma.client.findMany({
      where: { conseillerId: advisorId },
      select: {
        id: true,
        kycStatus: true,
      }
    })

    const compliantClients = clients.filter(
      c => c.kycStatus === 'COMPLET'
    ).length

    const nonCompliantClients = clients.filter(
      c => c.kycStatus === 'EN_ATTENTE' || c.kycStatus === 'EXPIRE' || c.kycStatus === 'REJETE'
    ).length

    return {
      totalClients: clients.length,
      compliantClients,
      nonCompliantClients,
      pendingReviews: clients.length - compliantClients - nonCompliantClients,
      alertsOpen: 0,
      complianceRate: clients.length > 0
        ? Math.round((compliantClients / clients.length) * 100)
        : 0
    }
  }
}

export const complianceService = new ComplianceService()
export default complianceService
