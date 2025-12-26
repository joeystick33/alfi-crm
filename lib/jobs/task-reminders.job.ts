// FILE: lib/jobs/task-reminders.job.ts

import { prisma } from '@/lib/prisma'

// ===========================================
// TASK REMINDERS JOB
// ===========================================

export interface TaskRemindersJobResult {
  success: boolean
  message: string
  stats: {
    overdueTasksMarked: number
    remindersSent: number
    upcomingTasksNotified: number
  }
  executionTime: number
}

/**
 * Job CRON pour gérer les rappels de tâches
 * - Marque les tâches en retard
 * - Envoie des rappels pour les tâches du jour
 * - Notifie pour les tâches à venir
 * 
 * Exécuté quotidiennement à 7h du matin
 */
export async function runTaskRemindersJob(): Promise<TaskRemindersJobResult> {
  const startTime = Date.now()

  console.log('🚀 Starting Task Reminders Job...')

  let overdueTasksMarked = 0
  let remindersSent = 0
  let upcomingTasksNotified = 0

  try {
    const now = new Date()
    const startOfToday = new Date(now.setHours(0, 0, 0, 0))
    const endOfToday = new Date(now.setHours(23, 59, 59, 999))
    const tomorrow = new Date(startOfToday)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 1. Identifier les tâches en retard (dueDate passée, non terminées)
    const overdueTasks = await prisma.tache.findMany({
      where: {
        dueDate: { lt: startOfToday },
        status: { in: ['A_FAIRE', 'EN_COURS'] },
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    // Créer des notifications pour les tâches en retard
    for (const task of overdueTasks) {
      await prisma.notification.create({
        data: {
          cabinetId: task.cabinetId,
          userId: task.assignedToId,
          type: 'TACHE_ECHEANCE',
          title: 'Tâche en retard',
          message: `La tâche "${task.title}" est en retard depuis ${formatDaysAgo(task.dueDate)}.`,
          actionUrl: `/dashboard/taches/${task.id}`,
        },
      })
      overdueTasksMarked++
    }

    console.log(`⚠️ Overdue tasks marked: ${overdueTasksMarked}`)

    // 2. Rappels pour les tâches du jour
    const todayTasks = await prisma.tache.findMany({
      where: {
        dueDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: { in: ['A_FAIRE', 'EN_COURS'] },
        reminderDate: null,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    for (const task of todayTasks) {
      await prisma.notification.create({
        data: {
          cabinetId: task.cabinetId,
          userId: task.assignedToId,
          type: 'TACHE_ECHEANCE',
          title: 'Tâche à faire aujourd\'hui',
          message: `Rappel: "${task.title}" doit être terminée aujourd'hui.`,
          actionUrl: `/dashboard/taches/${task.id}`,
        },
      })

      // Marquer le rappel comme envoyé
      await prisma.tache.update({
        where: { id: task.id },
        data: { reminderDate: now },
      })

      remindersSent++
    }

    console.log(`📧 Today reminders sent: ${remindersSent}`)

    // 3. Notifications pour les tâches de demain
    const tomorrowTasks = await prisma.tache.findMany({
      where: {
        dueDate: {
          gte: tomorrow,
          lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
        },
        status: { in: ['A_FAIRE', 'EN_COURS'] },
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    for (const task of tomorrowTasks) {
      await prisma.notification.create({
        data: {
          cabinetId: task.cabinetId,
          userId: task.assignedToId,
          type: 'TACHE_ECHEANCE',
          title: 'Tâche prévue demain',
          message: `Rappel: "${task.title}" est prévue pour demain.`,
          actionUrl: `/dashboard/taches/${task.id}`,
        },
      })
      upcomingTasksNotified++
    }

    console.log(`🔔 Upcoming tasks notified: ${upcomingTasksNotified}`)

    const executionTime = Date.now() - startTime

    console.log(`✅ Task Reminders Job completed in ${executionTime}ms`)

    return {
      success: true,
      message: `Job completed. ${overdueTasksMarked} overdue, ${remindersSent} reminders, ${upcomingTasksNotified} upcoming.`,
      stats: {
        overdueTasksMarked,
        remindersSent,
        upcomingTasksNotified,
      },
      executionTime,
    }
  } catch (error) {
    const executionTime = Date.now() - startTime

    console.error('❌ Task Reminders Job failed:', error)

    return {
      success: false,
      message: `Job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats: {
        overdueTasksMarked,
        remindersSent,
        upcomingTasksNotified,
      },
      executionTime,
    }
  }
}

// ===========================================
// HELPERS
// ===========================================

function formatDaysAgo(date: Date | null): string {
  if (!date) return 'une date inconnue'

  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return '1 jour'
  return `${diffDays} jours`
}
