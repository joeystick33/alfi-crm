/**
 * Workflow Service - Gestion des workflows et processus métier
 */

import { prisma } from '@/app/_common/lib/prisma'

export type WorkflowType = 'CLIENT_ONBOARDING' | 'KYC_REVIEW' | 'CONTRACT_SIGNATURE' | 'ARBITRAGE' | 'RECLAMATION'
export type WorkflowStatus = 'BROUILLON' | 'ACTIF' | 'PAUSED' | 'TERMINE' | 'ANNULE'
export type StepStatus = 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'SKIPPED' | 'ECHEC'

export interface WorkflowStep {
  id: string
  name: string
  order: number
  status: StepStatus
  assignedTo?: string
  dueDate?: Date
  completedAt?: Date
}

export interface Workflow {
  id: string
  type: WorkflowType
  entityId: string
  status: WorkflowStatus
  currentStep: number
  steps: WorkflowStep[]
  createdAt: Date
  completedAt?: Date
}

export class WorkflowService {
  /**
   * Crée un nouveau workflow
   */
  createWorkflow(type: WorkflowType, entityId: string): Workflow {
    const steps = this.getTemplateSteps(type)
    
    return {
      id: `wf-${Date.now()}`,
      type,
      entityId,
      status: 'ACTIF',
      currentStep: 0,
      steps,
      createdAt: new Date(),
    }
  }

  /**
   * Avance le workflow à l'étape suivante
   */
  advanceWorkflow(workflow: Workflow, userId: string): Workflow {
    const currentStep = workflow.steps[workflow.currentStep]
    if (currentStep) {
      currentStep.status = 'TERMINE'
      currentStep.completedAt = new Date()
    }

    if (workflow.currentStep < workflow.steps.length - 1) {
      workflow.currentStep++
      workflow.steps[workflow.currentStep].status = 'EN_COURS'
    } else {
      workflow.status = 'TERMINE'
      workflow.completedAt = new Date()
    }

    return workflow
  }

  /**
   * Retourne les étapes template selon le type
   */
  private getTemplateSteps(type: WorkflowType): WorkflowStep[] {
    const templates: Record<WorkflowType, string[]> = {
      CLIENT_ONBOARDING: ['Collecte infos', 'Vérification KYC', 'Questionnaire MIF2', 'Profil investisseur', 'Signature contrat'],
      KYC_REVIEW: ['Vérification documents', 'Mise à jour infos', 'Validation conformité'],
      CONTRACT_SIGNATURE: ['Préparation', 'Envoi signature', 'Réception', 'Archivage'],
      ARBITRAGE: ['Demande', 'Analyse', 'Validation', 'Exécution'],
      RECLAMATION: ['Réception', 'Analyse', 'Réponse', 'Clôture'],
    }

    return templates[type].map((name, i) => ({
      id: `step-${i}`,
      name,
      order: i + 1,
      status: i === 0 ? 'EN_COURS' : 'EN_ATTENTE',
    }))
  }

  /**
   * Récupère les workflows actifs pour un utilisateur
   */
  async getActiveWorkflows(userId: string): Promise<number> {
    // Comptage simplifié via les tâches en cours
    const count = await prisma.tache.count({
      where: {
        assignedToId: userId,
        status: { not: 'TERMINE' },
      },
    })
    return count
  }
}

export const workflowService = new WorkflowService()
export default workflowService
