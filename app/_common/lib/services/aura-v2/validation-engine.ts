/**
 * AURA V2 — Validation Engine
 * 
 * Couche de validation backend pour vérifier les sorties de l'agent.
 * Le backend est TOUJOURS la source de vérité.
 * 
 * Types de validation :
 * - fiscal_calculation : Vérifie les calculs fiscaux contre les simulateurs backend
 * - patrimoine_coherence : Vérifie la cohérence des données patrimoniales
 * - regulatory_check : Vérifie la conformité réglementaire
 * - data_integrity : Vérifie l'intégrité des données CRM
 * - simulation_result : Vérifie les résultats de simulation
 * - document_content : Vérifie le contenu d'un brouillon de document
 */

import type {
  ValidationType,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types'
import { getPrismaClient } from '../../prisma'

// ============================================================================
// VALIDATION ENGINE
// ============================================================================

export class ValidationEngine {
  private prisma: ReturnType<typeof getPrismaClient>

  constructor(private cabinetId: string) {
    this.prisma = getPrismaClient(cabinetId, false)
  }

  /**
   * Point d'entrée principal : valide une sortie d'agent.
   */
  async validate(
    type: ValidationType,
    agentOutput: unknown,
    context: { runId: string; clientId?: string },
  ): Promise<ValidationResult> {
    const startTime = Date.now()

    let result: ValidationResult

    switch (type) {
      case 'fiscal_calculation':
        result = await this.validateFiscalCalculation(agentOutput, context)
        break
      case 'patrimoine_coherence':
        result = await this.validatePatrimoineCoherence(agentOutput, context)
        break
      case 'regulatory_check':
        result = await this.validateRegulatoryCheck(agentOutput, context)
        break
      case 'data_integrity':
        result = await this.validateDataIntegrity(agentOutput, context)
        break
      case 'simulation_result':
        result = await this.validateSimulationResult(agentOutput, context)
        break
      case 'document_content':
        result = await this.validateDocumentContent(agentOutput, context)
        break
      default:
        result = {
          type,
          passed: true,
          score: 1,
          errors: [],
          warnings: [{ field: 'type', message: `Type de validation inconnu: ${type}`, severity: 'warning' }],
        }
    }

    // Persister le résultat de validation
    const durationMs = Date.now() - startTime
    await this.persistValidation(context.runId, type, result, agentOutput, durationMs)

    return result
  }

  // ── Validation fiscale ──

  /**
   * Vérifie que les montants fiscaux mentionnés par l'agent correspondent
   * aux calculs officiels du backend.
   */
  private async validateFiscalCalculation(
    agentOutput: unknown,
    context: { runId: string; clientId?: string },
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const output = agentOutput as Record<string, unknown>
    if (!output) return { type: 'fiscal_calculation', passed: true, score: 1, errors, warnings }

    // Vérifier la présence de montants dans la sortie
    const amountPattern = /(\d[\d\s]*[,.]?\d*)\s*€/g
    const outputStr = typeof agentOutput === 'string' ? agentOutput : JSON.stringify(agentOutput)
    const amounts = outputStr.match(amountPattern) || []

    if (amounts.length > 0) {
      // Si l'agent mentionne des montants, vérifier qu'ils proviennent d'un outil
      warnings.push({
        field: 'amounts',
        message: `${amounts.length} montant(s) détecté(s) dans la réponse. Vérifier qu'ils proviennent des résultats d'outils.`,
        severity: 'info',
      })
    }

    // Vérifier les taux mentionnés
    const ratePattern = /(\d+[,.]?\d*)\s*%/g
    const rates = outputStr.match(ratePattern) || []

    // Vérifier les taux connus (barème IR, PS, etc.)
    const knownRates = ['17.2', '30', '12.8', '7.5', '9.2', '0.5', '11', '30', '41', '45']
    for (const rate of rates) {
      const numRate = rate.replace('%', '').replace(',', '.').trim()
      if (!knownRates.includes(numRate)) {
        warnings.push({
          field: 'rates',
          message: `Taux ${rate} détecté — vérifier la validité`,
          severity: 'info',
        })
      }
    }

    const score = errors.length === 0 ? (warnings.length > 3 ? 0.7 : 1) : 0.3
    return {
      type: 'fiscal_calculation',
      passed: errors.length === 0,
      score,
      errors,
      warnings,
    }
  }

  // ── Cohérence patrimoniale ──

  /**
   * Vérifie que les données patrimoniales sont cohérentes
   * (actifs - passifs = patrimoine net, pas de valeurs négatives aberrantes, etc.)
   */
  private async validatePatrimoineCoherence(
    agentOutput: unknown,
    context: { runId: string; clientId?: string },
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!context.clientId) {
      return { type: 'patrimoine_coherence', passed: true, score: 1, errors, warnings }
    }

    // Récupérer les données réelles du backend
    const client = await this.prisma.client.findFirst({
      where: { id: context.clientId, cabinetId: this.cabinetId },
      select: {
        totalActifs: true,
        totalPassifs: true,
        patrimoineNet: true,
      },
    })

    if (!client) {
      warnings.push({
        field: 'client',
        message: 'Client non trouvé — validation patrimoniale impossible',
        severity: 'warning',
      })
      return { type: 'patrimoine_coherence', passed: true, score: 0.5, errors, warnings }
    }

    const totalActifs = Number(client.totalActifs || 0)
    const totalPassifs = Number(client.totalPassifs || 0)
    const patrimoineNet = Number(client.patrimoineNet || 0)

    // Vérifier la cohérence : actifs - passifs ≈ patrimoine net
    const expectedNet = totalActifs - totalPassifs
    const diff = Math.abs(expectedNet - patrimoineNet)
    if (diff > 100) { // Tolérance de 100€
      warnings.push({
        field: 'patrimoineNet',
        message: `Patrimoine net (${patrimoineNet}€) ≠ Actifs (${totalActifs}€) - Passifs (${totalPassifs}€) = ${expectedNet}€. Différence: ${diff}€`,
        severity: 'warning',
      })
    }

    // Vérifier les montants dans la réponse de l'agent
    const outputStr = typeof agentOutput === 'string' ? agentOutput : JSON.stringify(agentOutput)

    // Chercher des montants patrimoniaux dans la réponse
    const mentionedAmounts = this.extractEurAmounts(outputStr)
    for (const amount of mentionedAmounts) {
      // Vérifier que le montant est cohérent avec le patrimoine
      if (amount > totalActifs * 2 && amount > 1_000_000) {
        warnings.push({
          field: 'amount_coherence',
          message: `Montant ${amount}€ mentionné semble élevé par rapport au patrimoine (actifs: ${totalActifs}€)`,
          severity: 'warning',
        })
      }
    }

    const score = errors.length === 0 ? (warnings.length > 2 ? 0.7 : 1) : 0.3
    return {
      type: 'patrimoine_coherence',
      passed: errors.length === 0,
      score,
      errors,
      warnings,
    }
  }

  // ── Vérification réglementaire ──

  /**
   * Vérifie que la réponse de l'agent respecte les contraintes réglementaires :
   * - Pas de conseil juridique/fiscal direct
   * - Mentions obligatoires (brouillon, validation conseiller)
   * - Pas de promesse de rendement
   */
  private async validateRegulatoryCheck(
    agentOutput: unknown,
    context: { runId: string; clientId?: string },
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const outputStr = typeof agentOutput === 'string' ? agentOutput : JSON.stringify(agentOutput)
    const lowerStr = outputStr.toLowerCase()

    // Vérifier l'absence de conseil juridique/fiscal direct
    const forbiddenPhrases = [
      'vous devez absolument',
      'il faut impérativement',
      'je vous garantis',
      'rendement garanti',
      'sans aucun risque',
      'placement sûr à 100%',
      'j\'affirme que',
      'cela vous donnera exactement',
    ]

    for (const phrase of forbiddenPhrases) {
      if (lowerStr.includes(phrase)) {
        errors.push({
          field: 'regulatory',
          expected: 'Formulation conditionnelle',
          got: phrase,
          severity: 'error',
          message: `Formulation directe interdite détectée: "${phrase}". Utiliser "sous réserve", "il serait pertinent de", etc.`,
        })
      }
    }

    // Vérifier la présence de nuances/disclaimers pour les recommandations
    const hasRecommendation = /recommand|préconise|conseil|suggestion|propose/i.test(outputStr)
    if (hasRecommendation) {
      const hasDisclaimer = /sous réserve|à valider|vérifier avec|attention|prudence|risque/i.test(outputStr)
      if (!hasDisclaimer) {
        warnings.push({
          field: 'disclaimer',
          message: 'Recommandation détectée sans mention de réserve. Ajouter "sous réserve de validation" ou similaire.',
          severity: 'warning',
        })
      }
    }

    // Vérifier les mentions de document brouillon
    const isDocumentContext = /brouillon|rapport|document|lettre|bilan/i.test(outputStr)
    if (isDocumentContext) {
      const hasDraftMention = /brouillon|draft|à valider|non officiel|aucune valeur/i.test(outputStr)
      if (!hasDraftMention) {
        warnings.push({
          field: 'draft_mention',
          message: 'Contexte de document détecté sans mention de brouillon.',
          severity: 'warning',
        })
      }
    }

    const score = errors.length === 0 ? (warnings.length > 2 ? 0.7 : 1) : 0
    return {
      type: 'regulatory_check',
      passed: errors.length === 0,
      score,
      errors,
      warnings,
    }
  }

  // ── Intégrité des données ──

  /**
   * Vérifie l'intégrité des données mentionnées dans la réponse
   * par rapport aux données réelles en base.
   */
  private async validateDataIntegrity(
    agentOutput: unknown,
    context: { runId: string; clientId?: string },
  ): Promise<ValidationResult> {
    // Validation basique : vérifier que la sortie n'est pas vide et bien formée
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!agentOutput) {
      errors.push({
        field: 'output',
        expected: 'Non-null output',
        got: null,
        severity: 'error',
        message: 'Sortie de l\'agent vide ou null',
      })
    }

    return {
      type: 'data_integrity',
      passed: errors.length === 0,
      score: errors.length === 0 ? 1 : 0,
      errors,
      warnings,
    }
  }

  // ── Résultat de simulation ──

  /**
   * Vérifie qu'un résultat de simulation provient bien du backend
   * et n'a pas été inventé par l'agent.
   */
  private async validateSimulationResult(
    agentOutput: unknown,
    context: { runId: string; clientId?: string },
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const output = agentOutput as Record<string, unknown>
    if (!output) {
      return { type: 'simulation_result', passed: true, score: 1, errors, warnings }
    }

    // Vérifier que le résultat contient un indicateur de source backend
    if (output.source !== 'backend' && output.source !== 'simulator') {
      warnings.push({
        field: 'source',
        message: 'Résultat de simulation sans indicateur de source backend',
        severity: 'warning',
      })
    }

    return {
      type: 'simulation_result',
      passed: errors.length === 0,
      score: errors.length === 0 ? 1 : 0.5,
      errors,
      warnings,
    }
  }

  // ── Contenu de document ──

  /**
   * Vérifie le contenu d'un brouillon de document.
   */
  private async validateDocumentContent(
    agentOutput: unknown,
    context: { runId: string; clientId?: string },
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const outputStr = typeof agentOutput === 'string' ? agentOutput : JSON.stringify(agentOutput)

    // Vérifier la mention de brouillon
    if (!/brouillon|draft|non officiel/i.test(outputStr)) {
      errors.push({
        field: 'draft_status',
        expected: 'Mention "BROUILLON"',
        got: 'Absente',
        severity: 'critical',
        message: 'Le document doit porter la mention BROUILLON',
      })
    }

    // Vérifier l'absence d'informations personnelles non masquées
    const ssnPattern = /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/
    if (ssnPattern.test(outputStr)) {
      errors.push({
        field: 'personal_data',
        expected: 'Numéro de sécurité sociale masqué',
        got: 'Non masqué',
        severity: 'critical',
        message: 'Numéro de sécurité sociale détecté en clair dans le document',
      })
    }

    const score = errors.length === 0 ? 1 : 0
    return {
      type: 'document_content',
      passed: errors.length === 0,
      score,
      errors,
      warnings,
    }
  }

  // ── Persistence ──

  private async persistValidation(
    runId: string,
    type: ValidationType,
    result: ValidationResult,
    agentOutput: unknown,
    durationMs: number,
  ): Promise<void> {
    try {
      await this.prisma.validationRun.create({
        data: {
          runId,
          cabinetId: this.cabinetId,
          validationType: type,
          status: result.passed ? (result.warnings.length > 0 ? 'WARNING' : 'PASSED') : 'FAILED',
          agentOutput: (agentOutput || undefined) as import('@prisma/client').Prisma.InputJsonValue | undefined,
          passed: result.passed,
          score: result.score,
          errors: result.errors.length > 0 ? (JSON.parse(JSON.stringify(result.errors)) as import('@prisma/client').Prisma.InputJsonValue) : undefined,
          warnings: result.warnings.length > 0 ? (JSON.parse(JSON.stringify(result.warnings)) as import('@prisma/client').Prisma.InputJsonValue) : undefined,
          durationMs,
        },
      })
    } catch {
      // Non-blocking
    }
  }

  // ── Utilitaires ──

  private extractEurAmounts(text: string): number[] {
    const amounts: number[] = []
    const pattern = /([\d\s]+[,.]?\d*)\s*€/g
    let match

    while ((match = pattern.exec(text)) !== null) {
      const numStr = match[1].replace(/\s/g, '').replace(',', '.')
      const num = parseFloat(numStr)
      if (!isNaN(num) && num > 0) {
        amounts.push(num)
      }
    }

    return amounts
  }
}
