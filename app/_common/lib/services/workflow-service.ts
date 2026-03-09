/**
 * Workflow Service - Gestion des workflows et processus métier
 *
 * Persiste les workflows en DB via le modèle WorkflowState (Prisma).
 * Remplace l'ancienne version in-memory par un vrai state machine persisté.
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

export type WorkflowType =
  | 'CLIENT_ONBOARDING'
  | 'KYC_REVIEW'
  | 'CONTRACT_SIGNATURE'
  | 'ARBITRAGE'
  | 'RECLAMATION'

export type StepStatus = 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'SKIPPED' | 'ECHEC'

export interface WorkflowStep {
  id: string
  name: string
  order: number
  status: StepStatus
  assignedTo?: string
  dueDate?: string
  completedAt?: string
  result?: unknown
  error?: string
}

export interface WorkflowData {
  id: string
  type: string
  title: string
  status: string
  entityId: string | null
  currentStep: number
  totalSteps: number
  steps: WorkflowStep[]
  sharedContext?: Record<string, unknown>
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
}

// ============================================================================
// WORKFLOW TEMPLATES
// ============================================================================

const WORKFLOW_TEMPLATES: Record<WorkflowType, { title: string; steps: string[] }> = {
  CLIENT_ONBOARDING: {
    title: 'Onboarding client',
    steps: [
      'Collecte informations',
      'Vérification KYC',
      'Questionnaire MIF2',
      'Profil investisseur',
      'Signature contrat',
    ],
  },
  KYC_REVIEW: {
    title: 'Revue KYC',
    steps: ['Vérification documents', 'Mise à jour informations', 'Validation conformité'],
  },
  CONTRACT_SIGNATURE: {
    title: 'Signature contrat',
    steps: ['Préparation', 'Envoi signature', 'Réception', 'Archivage'],
  },
  ARBITRAGE: {
    title: 'Arbitrage',
    steps: ['Demande', 'Analyse', 'Validation', 'Exécution'],
  },
  RECLAMATION: {
    title: 'Réclamation',
    steps: ['Réception', 'Analyse', 'Réponse', 'Clôture'],
  },
}

// ============================================================================
// SERVICE
// ============================================================================

export class WorkflowService {
  private prisma: ReturnType<typeof getPrismaClient>

  constructor(private cabinetId: string) {
    this.prisma = getPrismaClient(cabinetId, false)
  }

  /**
   * Create a new workflow, persisted in DB
   */
  async createWorkflow(
    type: WorkflowType,
    userId: string,
    entityId?: string,
    context?: Record<string, unknown>,
  ): Promise<WorkflowData> {
    const template = WORKFLOW_TEMPLATES[type]
    const steps: WorkflowStep[] = template.steps.map((name, i) => ({
      id: `step-${i}`,
      name,
      order: i + 1,
      status: i === 0 ? 'EN_COURS' as const : 'EN_ATTENTE' as const,
    }))

    const record = await this.prisma.workflowState.create({
      data: {
        cabinetId: this.cabinetId,
        userId,
        clientId: entityId || null,
        workflowType: type,
        status: 'RUNNING',
        title: template.title,
        steps: JSON.parse(JSON.stringify(steps)),
        currentStep: 0,
        totalSteps: steps.length,
        sharedContext: context ? JSON.parse(JSON.stringify(context)) : undefined,
        startedAt: new Date(),
      },
    })

    return this.toWorkflowData(record)
  }

  /**
   * Advance to the next step
   */
  async advanceWorkflow(
    workflowId: string,
    stepResult?: unknown,
  ): Promise<WorkflowData> {
    const record = await this.prisma.workflowState.findUniqueOrThrow({
      where: { id: workflowId },
    })

    const steps = (record.steps as unknown as WorkflowStep[]) || []
    const currentIdx = record.currentStep

    // Mark current step complete
    if (steps[currentIdx]) {
      steps[currentIdx].status = 'TERMINE'
      steps[currentIdx].completedAt = new Date().toISOString()
      if (stepResult) {
        steps[currentIdx].result = stepResult
      }
    }

    const isLast = currentIdx >= steps.length - 1
    const nextStep = isLast ? currentIdx : currentIdx + 1

    // Start next step
    if (!isLast && steps[nextStep]) {
      steps[nextStep].status = 'EN_COURS'
    }

    const updated = await this.prisma.workflowState.update({
      where: { id: workflowId },
      data: {
        steps: JSON.parse(JSON.stringify(steps)),
        currentStep: nextStep,
        status: isLast ? 'COMPLETED' : 'RUNNING',
        completedAt: isLast ? new Date() : null,
      },
    })

    return this.toWorkflowData(updated)
  }

  /**
   * Fail the current step
   */
  async failStep(workflowId: string, error: string): Promise<WorkflowData> {
    const record = await this.prisma.workflowState.findUniqueOrThrow({
      where: { id: workflowId },
    })

    const steps = (record.steps as unknown as WorkflowStep[]) || []
    if (steps[record.currentStep]) {
      steps[record.currentStep].status = 'ECHEC'
      steps[record.currentStep].error = error
    }

    const updated = await this.prisma.workflowState.update({
      where: { id: workflowId },
      data: {
        steps: JSON.parse(JSON.stringify(steps)),
        status: 'FAILED',
        error,
      },
    })

    return this.toWorkflowData(updated)
  }

  /**
   * Pause a workflow
   */
  async pauseWorkflow(workflowId: string): Promise<WorkflowData> {
    const updated = await this.prisma.workflowState.update({
      where: { id: workflowId },
      data: { status: 'PAUSED' },
    })
    return this.toWorkflowData(updated)
  }

  /**
   * Resume a paused workflow
   */
  async resumeWorkflow(workflowId: string): Promise<WorkflowData> {
    const updated = await this.prisma.workflowState.update({
      where: { id: workflowId },
      data: { status: 'RUNNING' },
    })
    return this.toWorkflowData(updated)
  }

  /**
   * Cancel a workflow
   */
  async cancelWorkflow(workflowId: string): Promise<WorkflowData> {
    const updated = await this.prisma.workflowState.update({
      where: { id: workflowId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    })
    return this.toWorkflowData(updated)
  }

  /**
   * Get a workflow by ID
   */
  async getWorkflow(workflowId: string): Promise<WorkflowData | null> {
    const record = await this.prisma.workflowState.findUnique({
      where: { id: workflowId },
    })
    return record ? this.toWorkflowData(record) : null
  }

  /**
   * List active workflows for a user
   */
  async getActiveWorkflows(userId: string): Promise<WorkflowData[]> {
    const records = await this.prisma.workflowState.findMany({
      where: {
        cabinetId: this.cabinetId,
        userId,
        status: { in: ['RUNNING', 'PAUSED', 'AWAITING_INPUT'] },
      },
      orderBy: { startedAt: 'desc' },
    })
    return records.map(r => this.toWorkflowData(r))
  }

  /**
   * List all workflows for a client
   */
  async getClientWorkflows(clientId: string): Promise<WorkflowData[]> {
    const records = await this.prisma.workflowState.findMany({
      where: {
        cabinetId: this.cabinetId,
        clientId,
      },
      orderBy: { startedAt: 'desc' },
    })
    return records.map(r => this.toWorkflowData(r))
  }

  /**
   * Count active workflows for a user
   */
  async countActiveWorkflows(userId: string): Promise<number> {
    return this.prisma.workflowState.count({
      where: {
        cabinetId: this.cabinetId,
        userId,
        status: { in: ['RUNNING', 'PAUSED', 'AWAITING_INPUT'] },
      },
    })
  }

  // ── Private helpers ──

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toWorkflowData(record: any): WorkflowData {
    return {
      id: record.id,
      type: record.workflowType,
      title: record.title,
      status: record.status,
      entityId: record.clientId,
      currentStep: record.currentStep,
      totalSteps: record.totalSteps,
      steps: (record.steps as WorkflowStep[]) || [],
      sharedContext: record.sharedContext as Record<string, unknown> | undefined,
      createdAt: record.createdAt,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
    }
  }
}

/**
 * Factory function for creating a workflow service instance
 */
export function createWorkflowService(cabinetId: string): WorkflowService {
  return new WorkflowService(cabinetId)
}
