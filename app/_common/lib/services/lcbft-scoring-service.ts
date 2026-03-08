// ============================================================================
// LCB-FT Scoring Service — Évaluation automatisée du risque de blanchiment
//
// Base juridique :
//   • Art. L. 561-4-1 CMF — Obligation de vigilance
//   • Art. L. 561-5 CMF — Identification du client
//   • Art. L. 561-6 CMF — Connaissance de la relation d'affaires
//   • Art. L. 561-10-2 CMF — Vigilance renforcée
//   • Liste GAFI — Pays à risque (grise/noire)
//
// Score : 0-100
//   • 0-25 : FAIBLE — Vigilance simplifiée possible
//   • 26-50 : MOYEN — Vigilance standard
//   • 51-75 : ELEVÉ — Vigilance renforcée obligatoire
//   • 76-100 : TRÈS ÉLEVÉ — Déclaration de soupçon à examiner
// ============================================================================

import { prisma } from '../prisma'
import { logger } from '../logger'

// ── PAYS À RISQUE (GAFI — Mise à jour février 2025) ──────────────────────

/** Liste grise GAFI — Juridictions sous surveillance renforcée */
const GAFI_GREY_LIST = [
  'BF', // Burkina Faso
  'CM', // Cameroun
  'CD', // RD Congo
  'HT', // Haïti
  'KE', // Kenya
  'ML', // Mali
  'MZ', // Mozambique
  'NG', // Nigeria
  'ZA', // Afrique du Sud
  'SS', // Soudan du Sud
  'SY', // Syrie (aussi liste noire)
  'TZ', // Tanzanie
  'VE', // Venezuela
  'VN', // Vietnam
  'YE', // Yémen
  'PH', // Philippines
]

/** Liste noire GAFI — Juridictions à haut risque, appel à contre-mesures */
const GAFI_BLACK_LIST = [
  'KP', // Corée du Nord
  'IR', // Iran
  'MM', // Myanmar
]

/** Pays à risque supplémentaires (UE + TRACFIN) */
const EU_HIGH_RISK = [
  'AF', // Afghanistan
  'PK', // Pakistan
  'UG', // Ouganda
  'TT', // Trinité-et-Tobago
  'PA', // Panama
  'BS', // Bahamas
]

// ── TYPES ──────────────────────────────────────────────────────────────────

interface ScoringInput {
  clientId: string
  cabinetId: string
  assessedBy?: string
}

interface RiskFlag {
  code: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  detail: string
  score: number
}

interface ScoringResult {
  scoreTotal: number
  riskLevel: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'TRES_ELEVE'
  flags: RiskFlag[]
  paysRisqueDetectes: { code: string; type: 'grise' | 'noire' | 'eu_high_risk'; organisme: string }[]
  vigilanceRenforcee: boolean
  declarationSoupcon: boolean
  scorePPE: number
  scoreNationalite: number
  scoreResidence: number
  scoreAge: number
  scoreOriginesFonds: number
  scoreMontantPatrimoine: number
  scoreOperationsAtypiques: number
  scoreFrequenceOperations: number
  scoreModificationFrequente: number
  scoreRefusDocuments: number
  scoreInconsistances: number
}

// ── SERVICE ────────────────────────────────────────────────────────────────

export class LCBFTScoringService {

  /**
   * Évalue le risque LCB-FT d'un client et persiste le résultat.
   */
  static async assessClient(input: ScoringInput): Promise<ScoringResult> {
    const { clientId, cabinetId, assessedBy } = input

    // Récupérer les données du client
    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId },
      include: {
        kycDocuments: true,
        kycChecks: true,
        actifs: { include: { actif: true } },
        revenues: { where: { isActive: true } },
        credits: { where: { isActive: true } },
      },
    })

    if (!client) {
      throw new Error('Client non trouvé')
    }

    const flags: RiskFlag[] = []
    const paysRisqueDetectes: ScoringResult['paysRisqueDetectes'] = []

    // ── Facteur 1 : PPE ──
    let scorePPE = 0
    if (client.isPEP) {
      scorePPE = 20
      flags.push({ code: 'PPE', severity: 'HIGH', detail: 'Client identifié comme Personne Politiquement Exposée', score: 20 })
    }

    // ── Facteur 2 : Nationalité ──
    let scoreNationalite = 0
    const nationalite = client.nationality?.toUpperCase() || ''
    if (GAFI_BLACK_LIST.includes(nationalite)) {
      scoreNationalite = 25
      paysRisqueDetectes.push({ code: nationalite, type: 'noire', organisme: 'GAFI' })
      flags.push({ code: 'NATIONALITE_NOIRE', severity: 'CRITICAL', detail: `Nationalité ${nationalite} — Liste noire GAFI`, score: 25 })
    } else if (GAFI_GREY_LIST.includes(nationalite)) {
      scoreNationalite = 15
      paysRisqueDetectes.push({ code: nationalite, type: 'grise', organisme: 'GAFI' })
      flags.push({ code: 'NATIONALITE_GRISE', severity: 'HIGH', detail: `Nationalité ${nationalite} — Liste grise GAFI`, score: 15 })
    } else if (EU_HIGH_RISK.includes(nationalite)) {
      scoreNationalite = 10
      paysRisqueDetectes.push({ code: nationalite, type: 'eu_high_risk', organisme: 'UE' })
      flags.push({ code: 'NATIONALITE_EU_RISK', severity: 'MEDIUM', detail: `Nationalité ${nationalite} — Pays à risque UE`, score: 10 })
    }

    // ── Facteur 3 : Résidence fiscale ──
    let scoreResidence = 0
    const residence = client.taxResidenceCountry?.toUpperCase() || client.fiscalResidence?.toUpperCase() || ''
    if (residence && residence !== 'FR') {
      if (GAFI_BLACK_LIST.includes(residence)) {
        scoreResidence = 25
        flags.push({ code: 'RESIDENCE_NOIRE', severity: 'CRITICAL', detail: `Résidence fiscale ${residence} — Liste noire GAFI`, score: 25 })
      } else if (GAFI_GREY_LIST.includes(residence)) {
        scoreResidence = 12
        flags.push({ code: 'RESIDENCE_GRISE', severity: 'HIGH', detail: `Résidence fiscale ${residence} — Liste grise GAFI`, score: 12 })
      } else {
        // Non-résident France = risque marginal
        scoreResidence = 3
      }
    }

    // ── Facteur 4 : Âge atypique ──
    let scoreAge = 0
    if (client.birthDate) {
      const age = Math.floor((Date.now() - new Date(client.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      if (age < 25 && client.actifs.length > 0) {
        // Jeune client avec patrimoine significatif
        const totalPatrimoine = client.actifs.reduce((sum, ca) => sum + Number(ca.actif.value || 0), 0)
        if (totalPatrimoine > 500000) {
          scoreAge = 10
          flags.push({ code: 'AGE_PATRIMOINE_INCOHERENT', severity: 'MEDIUM', detail: `Client de ${age} ans avec patrimoine > 500K€`, score: 10 })
        }
      }
    }

    // ── Facteur 5 : Origine des fonds ──
    let scoreOriginesFonds = 0
    if (!client.originOfFunds || client.originOfFunds.trim() === '') {
      scoreOriginesFonds = 8
      flags.push({ code: 'ORIGINE_FONDS_MANQUANTE', severity: 'MEDIUM', detail: 'Origine des fonds non renseignée', score: 8 })
    }

    // ── Facteur 6 : Patrimoine vs Revenus ──
    let scoreMontantPatrimoine = 0
    const totalPatrimoine = client.actifs.reduce((sum, ca) => sum + Number(ca.actif.value || 0), 0)
    const totalRevenusAnnuels = client.revenues.reduce((sum, r) => sum + Number(r.montantAnnuel || 0), 0)
    if (totalRevenusAnnuels > 0 && totalPatrimoine > 0) {
      const ratio = totalPatrimoine / totalRevenusAnnuels
      if (ratio > 50) {
        scoreMontantPatrimoine = 15
        flags.push({ code: 'PATRIMOINE_REVENUS_INCOHERENT', severity: 'HIGH', detail: `Ratio patrimoine/revenus anormalement élevé (${ratio.toFixed(0)}x)`, score: 15 })
      } else if (ratio > 20) {
        scoreMontantPatrimoine = 5
      }
    }

    // ── Facteur 7 : KYC incomplet ──
    let scoreRefusDocuments = 0
    const kycExpired = client.kycChecks.filter(k => k.status === 'ECHOUE' || k.status === 'EN_RETARD')
    if (kycExpired.length > 0) {
      scoreRefusDocuments = 8
      flags.push({ code: 'KYC_EXPIRE_ECHOUE', severity: 'MEDIUM', detail: `${kycExpired.length} vérification(s) KYC expirée(s) ou échouée(s)`, score: 8 })
    }
    if (client.kycStatus === 'EN_ATTENTE' || client.kycStatus === 'REJETE') {
      scoreRefusDocuments += 5
      flags.push({ code: 'KYC_INCOMPLET', severity: 'MEDIUM', detail: `KYC en statut ${client.kycStatus}`, score: 5 })
    }

    // ── Facteur 8-11 : Comportement (nécessite historique — scores par défaut 0) ──
    const scoreOperationsAtypiques = 0
    const scoreFrequenceOperations = 0
    const scoreModificationFrequente = 0
    const scoreInconsistances = 0

    // ── Calcul score total ──
    const scoreTotal = Math.min(100,
      scorePPE + scoreNationalite + scoreResidence + scoreAge +
      scoreOriginesFonds + scoreMontantPatrimoine + scoreOperationsAtypiques +
      scoreFrequenceOperations + scoreModificationFrequente + scoreRefusDocuments +
      scoreInconsistances
    )

    // ── Niveau de risque ──
    let riskLevel: ScoringResult['riskLevel']
    if (scoreTotal <= 25) riskLevel = 'FAIBLE'
    else if (scoreTotal <= 50) riskLevel = 'MOYEN'
    else if (scoreTotal <= 75) riskLevel = 'ELEVE'
    else riskLevel = 'TRES_ELEVE'

    const vigilanceRenforcee = riskLevel === 'ELEVE' || riskLevel === 'TRES_ELEVE'
    const declarationSoupcon = riskLevel === 'TRES_ELEVE'

    // ── Persister le résultat ──
    const nextReviewDate = new Date()
    switch (riskLevel) {
      case 'FAIBLE': nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 2); break
      case 'MOYEN': nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1); break
      case 'ELEVE': nextReviewDate.setMonth(nextReviewDate.getMonth() + 6); break
      case 'TRES_ELEVE': nextReviewDate.setMonth(nextReviewDate.getMonth() + 3); break
    }

    await prisma.lCBFTRiskAssessment.create({
      data: {
        cabinetId,
        clientId,
        scoreTotal,
        riskLevel,
        assessedBy: assessedBy || 'SYSTEM',
        nextReviewDate,
        scorePPE,
        scoreNationalite,
        scoreResidence,
        scoreAge,
        scoreOriginesFonds,
        scoreMontantPatrimoine,
        scoreOperationsAtypiques,
        scoreFrequenceOperations,
        scoreModificationFrequente,
        scoreRefusDocuments,
        scoreInconsistances,
        flags: flags as any,
        paysRisqueDetectes: paysRisqueDetectes as any,
        vigilanceRenforcee,
        declarationSoupcon,
      },
    })

    logger.info('LCB-FT risk assessment completed', {
      module: 'LCBFT',
      clientId,
      action: 'RISK_ASSESSMENT',
      metadata: { scoreTotal, riskLevel, flagCount: flags.length } as any,
    })

    return {
      scoreTotal,
      riskLevel,
      flags,
      paysRisqueDetectes,
      vigilanceRenforcee,
      declarationSoupcon,
      scorePPE,
      scoreNationalite,
      scoreResidence,
      scoreAge,
      scoreOriginesFonds,
      scoreMontantPatrimoine,
      scoreOperationsAtypiques,
      scoreFrequenceOperations,
      scoreModificationFrequente,
      scoreRefusDocuments,
      scoreInconsistances,
    }
  }

  /**
   * Récupère la dernière évaluation de risque d'un client.
   */
  static async getLatestAssessment(clientId: string, cabinetId: string) {
    return prisma.lCBFTRiskAssessment.findFirst({
      where: { clientId, cabinetId },
      orderBy: { assessedAt: 'desc' },
    })
  }

  /**
   * Liste les clients nécessitant une réévaluation.
   */
  static async getClientsNeedingReview(cabinetId: string) {
    return prisma.lCBFTRiskAssessment.findMany({
      where: {
        cabinetId,
        nextReviewDate: { lte: new Date() },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, kycStatus: true } },
      },
      orderBy: { nextReviewDate: 'asc' },
    })
  }
}
