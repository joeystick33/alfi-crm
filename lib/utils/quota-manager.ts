/**
 * Quota Manager - Gestion des quotas d'organisation
 * Validation, vérification et mise à jour des quotas
 * Adapté pour Prisma
 */

import { prisma } from '@/lib/prisma';
import { isUnlimited } from './plan-definitions';

/**
 * Erreurs personnalisées
 */
export class QuotaExceededError extends Error {
  quotaType: string;
  current: number;
  max: number;

  constructor(quotaType: string, current: number, max: number) {
    super(`Quota exceeded for ${quotaType}. Current: ${current}, Max: ${max}`);
    this.name = 'QuotaExceededError';
    this.quotaType = quotaType;
    this.current = current;
    this.max = max;
  }
}

export class QuotaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaValidationError';
  }
}

/**
 * Récupérer une organisation avec son usage
 */
export async function getOrganizationWithUsage(cabinetId: string) {
  const org = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
  });
  
  if (!org) {
    throw new Error('Organization not found');
  }
  
  // Si pas d'usage, le calculer
  if (!org.usage || typeof org.usage !== 'object') {
    await updateUsageStats(cabinetId);
    return getOrganizationWithUsage(cabinetId);
  }
  
  return org;
}

/**
 * Valider les quotas avant mise à jour
 */
export async function validateQuotas(cabinetId: string, newQuotas: any) {
  const org = await getOrganizationWithUsage(cabinetId);
  const usage = (org.usage as any) || {};
  
  // Vérifier maxAdvisors
  if (newQuotas.maxAdvisors !== undefined && 
      !isUnlimited(newQuotas.maxAdvisors) &&
      newQuotas.maxAdvisors < (usage.advisorsCount || 0)) {
    throw new QuotaValidationError(
      `Cannot set maxAdvisors to ${newQuotas.maxAdvisors}. Current usage: ${usage.advisorsCount}`
    );
  }
  
  // Vérifier maxAssistants
  if (newQuotas.maxAssistants !== undefined &&
      !isUnlimited(newQuotas.maxAssistants) &&
      newQuotas.maxAssistants < (usage.assistantsCount || 0)) {
    throw new QuotaValidationError(
      `Cannot set maxAssistants to ${newQuotas.maxAssistants}. Current usage: ${usage.assistantsCount}`
    );
  }
  
  return true;
}

/**
 * Vérifier si un quota est atteint
 */
export async function checkQuotaLimit(
  cabinetId: string, 
  quotaType: string, 
  conseillerId: string | null = null
): Promise<boolean> {
  const org = await getOrganizationWithUsage(cabinetId);
  const usage = (org.usage as any) || {};
  const quotas = (org.quotas as any) || {};
  
  switch (quotaType) {
    case 'conseillers':
      if (isUnlimited(quotas.maxAdvisors)) return true;
      return (usage.advisorsCount || 0) < quotas.maxAdvisors;
      
    case 'assistants':
      if (isUnlimited(quotas.maxAssistants)) return true;
      return (usage.assistantsCount || 0) < quotas.maxAssistants;
      
    case 'particuliers':
      if (isUnlimited(quotas.maxClientsPerAdvisor)) return true;
      
      // Compter les clients de ce conseiller
      if (conseillerId) {
        const clientsCount = await prisma.client.count({
          where: {
            conseillerId,
            cabinetId,
          },
        });
        return clientsCount < quotas.maxClientsPerAdvisor;
      }
      
      return true;
      
    default:
      return false;
  }
}

/**
 * Obtenir le pourcentage d'utilisation d'un quota
 */
export function getQuotaUsagePercentage(current: number, max: number): number {
  if (isUnlimited(max)) return 0;
  if (max === 0) return 100;
  return Math.round((current / max) * 100);
}

/**
 * Vérifier si un quota nécessite une alerte
 */
export function shouldAlertQuota(current: number, max: number): boolean {
  const percentage = getQuotaUsagePercentage(current, max);
  return percentage >= 80;
}

/**
 * Obtenir le niveau d'alerte d'un quota
 */
export function getQuotaAlertLevel(current: number, max: number): 'critical' | 'warning' | 'normal' {
  const percentage = getQuotaUsagePercentage(current, max);
  
  if (percentage >= 100) return 'critical';
  if (percentage >= 80) return 'warning';
  return 'normal';
}

/**
 * Mettre à jour les statistiques d'usage d'une organisation
 */
export async function updateUsageStats(cabinetId: string) {
  // Compter les conseillers (ADVISOR et ADMIN)
  const advisorsCount = await prisma.user.count({
    where: {
      cabinetId,
      role: { in: ['ADVISOR', 'ADMIN'] },
    },
  });
  
  // Compter les assistants
  const assistantsCount = await prisma.user.count({
    where: {
      cabinetId,
      role: 'ASSISTANT',
    },
  });
  
  // Compter les clients
  const clientsCount = await prisma.client.count({
    where: {
      cabinetId,
    },
  });
  
  // Mettre à jour l'organisation
  await prisma.cabinet.update({
    where: { id: cabinetId },
    data: {
      usage: {
        advisorsCount,
        assistantsCount,
        clientsCount,
        lastUpdated: new Date(),
      },
    },
  });
  
  return {
    advisorsCount,
    assistantsCount,
    clientsCount,
  };
}

/**
 * Obtenir les quotas avec leur usage
 */
export async function getQuotasWithUsage(cabinetId: string) {
  const org = await getOrganizationWithUsage(cabinetId);
  const quotas = (org.quotas as any) || {};
  const usage = (org.usage as any) || {};
  
  return {
    advisors: {
      current: usage.advisorsCount || 0,
      max: quotas.maxAdvisors || 0,
      percentage: getQuotaUsagePercentage(usage.advisorsCount || 0, quotas.maxAdvisors || 0),
      alertLevel: getQuotaAlertLevel(usage.advisorsCount || 0, quotas.maxAdvisors || 0),
    },
    assistants: {
      current: usage.assistantsCount || 0,
      max: quotas.maxAssistants || 0,
      percentage: getQuotaUsagePercentage(usage.assistantsCount || 0, quotas.maxAssistants || 0),
      alertLevel: getQuotaAlertLevel(usage.assistantsCount || 0, quotas.maxAssistants || 0),
    },
    clients: {
      current: usage.clientsCount || 0,
      max: quotas.maxClientsPerAdvisor || 0,
      percentage: 0, // Calculé par conseiller
      alertLevel: 'normal' as const,
    },
  };
}

/**
 * Obtenir toutes les organisations avec alertes de quota
 */
export async function getOrganizationsWithQuotaAlerts() {
  const organizations = await prisma.cabinet.findMany();
  
  const alerts: any[] = [];
  
  for (const org of organizations) {
    const quotas = (org.quotas as any) || {};
    const usage = (org.usage as any) || {};
    
    // Vérifier chaque quota
    if (shouldAlertQuota(usage.advisorsCount || 0, quotas.maxAdvisors || 0)) {
      alerts.push({
        cabinetId: org.id,
        organizationName: org.name,
        quotaType: 'conseillers',
        current: usage.advisorsCount || 0,
        max: quotas.maxAdvisors || 0,
        percentage: getQuotaUsagePercentage(usage.advisorsCount || 0, quotas.maxAdvisors || 0),
        alertLevel: getQuotaAlertLevel(usage.advisorsCount || 0, quotas.maxAdvisors || 0),
      });
    }
    
    if (shouldAlertQuota(usage.assistantsCount || 0, quotas.maxAssistants || 0)) {
      alerts.push({
        cabinetId: org.id,
        organizationName: org.name,
        quotaType: 'assistants',
        current: usage.assistantsCount || 0,
        max: quotas.maxAssistants || 0,
        percentage: getQuotaUsagePercentage(usage.assistantsCount || 0, quotas.maxAssistants || 0),
        alertLevel: getQuotaAlertLevel(usage.assistantsCount || 0, quotas.maxAssistants || 0),
      });
    }
  }
  
  return alerts;
}
