// FILE: lib/jobs/patrimoine-snapshot.job.ts

import { createSnapshotsForAllClients, cleanupOldSnapshots } from '@/lib/services/patrimoine-snapshot.service'

// ===========================================
// PATRIMOINE SNAPSHOT JOB
// ===========================================

export interface PatrimoineSnapshotJobResult {
  success: boolean
  message: string
  stats: {
    total: number
    success: number
    errors: number
    cleanedUp: number
  }
  executionTime: number
}

/**
 * Job CRON pour créer les snapshots patrimoine mensuels
 * Exécuté le 1er de chaque mois à 3h du matin
 */
export async function runPatrimoineSnapshotJob(): Promise<PatrimoineSnapshotJobResult> {
  const startTime = Date.now()
  
  console.log('🚀 Starting Patrimoine Snapshot Job...')
  
  try {
    // Créer les snapshots pour tous les clients actifs
    const snapshotResult = await createSnapshotsForAllClients()
    
    console.log(`📊 Snapshots created: ${snapshotResult.success}/${snapshotResult.total}`)
    
    // Nettoyer les anciens snapshots (>24 mois)
    const cleanedUp = await cleanupOldSnapshots(24)
    
    console.log(`🧹 Old snapshots cleaned up: ${cleanedUp}`)
    
    const executionTime = Date.now() - startTime
    
    console.log(`✅ Patrimoine Snapshot Job completed in ${executionTime}ms`)
    
    return {
      success: true,
      message: `Job completed successfully. ${snapshotResult.success} snapshots created, ${cleanedUp} old snapshots cleaned up.`,
      stats: {
        total: snapshotResult.total,
        success: snapshotResult.success,
        errors: snapshotResult.errors,
        cleanedUp,
      },
      executionTime,
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    
    console.error('❌ Patrimoine Snapshot Job failed:', error)
    
    return {
      success: false,
      message: `Job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats: {
        total: 0,
        success: 0,
        errors: 1,
        cleanedUp: 0,
      },
      executionTime,
    }
  }
}
