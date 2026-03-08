/**
 * INDEX - Paramètres Prévoyance TNS
 * 
 * Point d'entrée centralisé pour les configurations annuelles.
 * Permet le versioning automatique des paramètres par année.
 */

import PREVOYANCE_TNS_2025 from './parameters-prevoyance-2025'
import PREVOYANCE_TNS_2026 from './parameters-prevoyance-2026'
import { logger } from '@/app/_common/lib/logger'
// Configuration par défaut (année en cours)
export const ANNEE_EN_COURS = 2025

// Export des configurations par année
export const CONFIGURATIONS = {
  2025: PREVOYANCE_TNS_2025,
  2026: PREVOYANCE_TNS_2026,
}

/**
 * Récupère la configuration pour une année donnée
 * @param annee - Année de la configuration (défaut: année en cours)
 */
export function getConfiguration(annee: number = ANNEE_EN_COURS) {
  const config = CONFIGURATIONS[annee as keyof typeof CONFIGURATIONS]
  if (!config) {
    logger.warn(`[Prévoyance TNS] Configuration ${annee} non disponible, utilisation de ${ANNEE_EN_COURS}`)
    return CONFIGURATIONS[ANNEE_EN_COURS]
  }
  return config
}

/**
 * Récupère le PASS pour une année donnée
 */
export function getPASS(annee: number = ANNEE_EN_COURS): number {
  return getConfiguration(annee).pass
}

/**
 * Vérifie si une caisse bénéficie du régime CPAM (4-90j)
 */
export function hasCPAM(codeCaisse: string, annee: number = ANNEE_EN_COURS): boolean {
  const config = getConfiguration(annee)
  return config.caissesAvecCPAM.includes(codeCaisse)
}

/**
 * Vérifie si une caisse a un régime IJ après 90 jours
 */
export function hasIJApres90Jours(codeCaisse: string, annee: number = ANNEE_EN_COURS): boolean {
  // Caisses sans IJ après 90j : CIPAV, CARPV
  const SANS_IJ_APRES_90 = ['CIPAV', 'CARPV']
  return !SANS_IJ_APRES_90.includes(codeCaisse)
}

/**
 * Années disponibles
 */
export const ANNEES_DISPONIBLES = Object.keys(CONFIGURATIONS).map(Number)

// Exports nommés
export { PREVOYANCE_TNS_2025 }
export { PREVOYANCE_TNS_2026 }

// Export par défaut
export default getConfiguration
