// FILE: lib/services/patrimoine-snapshot.service.ts

import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

// ===========================================
// TYPES
// ===========================================

export interface PatrimoineData {
  totalActifs: Decimal
  totalPassifs: Decimal
  patrimoineNet: Decimal
  patrimoineGere: Decimal
  patrimoineNonGere: Decimal
  detailActifs: Record<string, number>
  detailPassifs: Record<string, number>
  totalRevenus: Decimal
  totalCharges: Decimal
  capaciteEpargne: Decimal
  tauxEpargne: Decimal
  totalMensualites: Decimal
  tauxEndettement: Decimal
  baseIFI: Decimal | null
  montantIFI: Decimal | null
}

export interface SnapshotResult {
  snapshotId: string
  clientId: string
  date: Date
  patrimoine: PatrimoineData
}

// ===========================================
// CALCUL DU PATRIMOINE
// ===========================================

async function calculatePatrimoine(clientId: string): Promise<PatrimoineData> {
  // Récupérer les actifs du client via la table de liaison
  const clientActifs = await prisma.clientActif.findMany({
    where: { clientId },
    select: {
      id: true,
      ownershipPercentage: true,
      actifId: true,
    },
  })

  // Récupérer les actifs actifs séparément
  const actifIds = clientActifs.map(ca => ca.actifId)
  const actifs = await prisma.actif.findMany({
    where: {
      id: { in: actifIds },
      isActive: true,
    },
    select: {
      id: true,
      value: true,
      category: true,
      type: true,
      managedByFirm: true,
    },
  })

  // Créer un map pour accès rapide
  const actifMap = new Map(actifs.map(a => [a.id, a]))

  // Récupérer les passifs du client
  const passifs = await prisma.passif.findMany({
    where: { 
      clientId,
      isActive: true,
    },
    select: {
      id: true,
      type: true,
      remainingAmount: true,
      monthlyPayment: true,
    },
  })

  // Récupérer les revenus
  const revenus = await prisma.revenue.findMany({
    where: {
      clientId,
      isActive: true,
    },
    select: {
      montantAnnuel: true,
    },
  })

  // Récupérer les charges
  const charges = await prisma.expense.findMany({
    where: {
      clientId,
      isActive: true,
    },
    select: {
      montantAnnuel: true,
    },
  })

  // Calculer les totaux actifs
  let totalActifs = new Decimal(0)
  let patrimoineGere = new Decimal(0)
  let patrimoineNonGere = new Decimal(0)
  const detailActifs: Record<string, number> = {}

  for (const ca of clientActifs) {
    const actif = actifMap.get(ca.actifId)
    if (!actif) continue
    
    const value = actif.value.mul(ca.ownershipPercentage).div(100)
    totalActifs = totalActifs.add(value)
    
    if (actif.managedByFirm) {
      patrimoineGere = patrimoineGere.add(value)
    } else {
      patrimoineNonGere = patrimoineNonGere.add(value)
    }

    const category = actif.category
    if (!detailActifs[category]) {
      detailActifs[category] = 0
    }
    detailActifs[category] += value.toNumber()
  }

  // Calculer les totaux passifs
  let totalPassifs = new Decimal(0)
  let totalMensualites = new Decimal(0)
  const detailPassifs: Record<string, number> = {}

  for (const p of passifs) {
    totalPassifs = totalPassifs.add(p.remainingAmount)
    totalMensualites = totalMensualites.add(p.monthlyPayment)

    const type = p.type
    if (!detailPassifs[type]) {
      detailPassifs[type] = 0
    }
    detailPassifs[type] += p.remainingAmount.toNumber()
  }

  // Calculer le patrimoine net
  const patrimoineNet = totalActifs.sub(totalPassifs)

  // Calculer les revenus totaux
  const totalRevenus = revenus.reduce(
    (acc, r) => acc.add(r.montantAnnuel),
    new Decimal(0)
  )

  // Calculer les charges totales
  const totalCharges = charges.reduce(
    (acc, c) => acc.add(c.montantAnnuel),
    new Decimal(0)
  )

  // Calculer la capacité d'épargne
  const capaciteEpargne = totalRevenus.sub(totalCharges)

  // Calculer le taux d'épargne
  const tauxEpargne = totalRevenus.gt(0)
    ? capaciteEpargne.div(totalRevenus).mul(100)
    : new Decimal(0)

  // Calculer le taux d'endettement (mensualités / revenus mensuels)
  const revenusMensuels = totalRevenus.div(12)
  const tauxEndettement = revenusMensuels.gt(0)
    ? totalMensualites.div(revenusMensuels).mul(100)
    : new Decimal(0)

  // IFI simplifié (seuil 1.3M€)
  const seuilIFI = new Decimal(1300000)
  let baseIFI: Decimal | null = null
  let montantIFI: Decimal | null = null

  // Calcul simplifié de la base IFI (actifs immobiliers)
  const actifsImmobiliers = Object.entries(detailActifs)
    .filter(([cat]) => cat === 'IMMOBILIER')
    .reduce((acc, [, val]) => acc + val, 0)

  if (actifsImmobiliers > seuilIFI.toNumber()) {
    baseIFI = new Decimal(actifsImmobiliers)
    // Barème simplifié IFI
    montantIFI = calculateIFI(baseIFI)
  }

  return {
    totalActifs,
    totalPassifs,
    patrimoineNet,
    patrimoineGere,
    patrimoineNonGere,
    detailActifs,
    detailPassifs,
    totalRevenus,
    totalCharges,
    capaciteEpargne,
    tauxEpargne,
    totalMensualites,
    tauxEndettement,
    baseIFI,
    montantIFI,
  }
}

// ===========================================
// CALCUL IFI (SIMPLIFIÉ)
// ===========================================

function calculateIFI(base: Decimal): Decimal {
  const seuil = 1300000
  const b = base.toNumber()
  
  if (b <= seuil) return new Decimal(0)

  let ifi = 0

  // Barème 2025
  if (b > 10000000) {
    ifi += (b - 10000000) * 0.015
    ifi += (10000000 - 5000000) * 0.0125
    ifi += (5000000 - 2570000) * 0.01
    ifi += (2570000 - 1300000) * 0.007
    ifi += (1300000 - 800000) * 0.005
  } else if (b > 5000000) {
    ifi += (b - 5000000) * 0.0125
    ifi += (5000000 - 2570000) * 0.01
    ifi += (2570000 - 1300000) * 0.007
    ifi += (1300000 - 800000) * 0.005
  } else if (b > 2570000) {
    ifi += (b - 2570000) * 0.01
    ifi += (2570000 - 1300000) * 0.007
    ifi += (1300000 - 800000) * 0.005
  } else if (b > 1300000) {
    ifi += (b - 1300000) * 0.007
    ifi += (1300000 - 800000) * 0.005
  } else if (b > 800000) {
    ifi += (b - 800000) * 0.005
  }

  // Décote entre 1.3M et 1.4M
  if (b >= 1300000 && b <= 1400000) {
    const decote = 17500 - (1.25 * b / 100)
    ifi = Math.max(0, ifi - decote)
  }

  return new Decimal(ifi)
}

// ===========================================
// SERVICE FUNCTIONS
// ===========================================

/**
 * Crée un snapshot du patrimoine pour un client
 */
export async function createPatrimoineSnapshot(
  clientId: string,
  notes?: string
): Promise<SnapshotResult> {
  const patrimoine = await calculatePatrimoine(clientId)

  // Créer le snapshot
  const snapshot = await prisma.patrimoineSnapshot.create({
    data: {
      clientId,
      totalActifs: patrimoine.totalActifs,
      totalPassifs: patrimoine.totalPassifs,
      patrimoineNet: patrimoine.patrimoineNet,
      patrimoineGere: patrimoine.patrimoineGere,
      patrimoineNonGere: patrimoine.patrimoineNonGere,
      detailActifs: patrimoine.detailActifs,
      detailPassifs: patrimoine.detailPassifs,
      totalRevenus: patrimoine.totalRevenus,
      totalCharges: patrimoine.totalCharges,
      capaciteEpargne: patrimoine.capaciteEpargne,
      tauxEpargne: patrimoine.tauxEpargne,
      totalMensualites: patrimoine.totalMensualites,
      tauxEndettement: patrimoine.tauxEndettement,
      baseIFI: patrimoine.baseIFI,
      montantIFI: patrimoine.montantIFI,
      isAutoGenerated: true,
      notes,
    },
  })

  // Mettre à jour les champs dénormalisés sur le client
  await prisma.client.update({
    where: { id: clientId },
    data: {
      totalActifs: patrimoine.totalActifs,
      totalPassifs: patrimoine.totalPassifs,
      patrimoineNet: patrimoine.patrimoineNet,
      totalRevenus: patrimoine.totalRevenus,
      totalCharges: patrimoine.totalCharges,
      capaciteEpargne: patrimoine.capaciteEpargne,
      tauxEndettement: patrimoine.tauxEndettement,
      lastSnapshotAt: new Date(),
    },
  })

  return {
    snapshotId: snapshot.id,
    clientId,
    date: snapshot.date,
    patrimoine,
  }
}

/**
 * Crée des snapshots pour tous les clients d'un cabinet
 */
export async function createSnapshotsForCabinet(
  cabinetId: string
): Promise<{ success: number; errors: number }> {
  const clients = await prisma.client.findMany({
    where: {
      cabinetId,
      status: { in: ['ACTIF', 'PROSPECT'] },
    },
    select: { id: true },
  })

  let success = 0
  let errors = 0

  for (const client of clients) {
    try {
      await createPatrimoineSnapshot(client.id, 'Auto-généré - CRON mensuel')
      success++
    } catch (error) {
      console.error(`Error creating snapshot for client ${client.id}:`, error)
      errors++
    }
  }

  return { success, errors }
}

/**
 * Crée des snapshots pour tous les clients actifs
 */
export async function createSnapshotsForAllClients(): Promise<{
  total: number
  success: number
  errors: number
}> {
  const clients = await prisma.client.findMany({
    where: {
      status: { in: ['ACTIF', 'PROSPECT'] },
    },
    select: { id: true },
  })

  let success = 0
  let errors = 0

  for (const client of clients) {
    try {
      await createPatrimoineSnapshot(client.id, 'Auto-généré - CRON mensuel')
      success++
    } catch (error) {
      console.error(`Error creating snapshot for client ${client.id}:`, error)
      errors++
    }
  }

  return {
    total: clients.length,
    success,
    errors,
  }
}

/**
 * Récupère l'historique des snapshots pour un client
 */
export async function getClientSnapshots(
  clientId: string,
  limit = 12
): Promise<PatrimoineData[]> {
  const snapshots = await prisma.patrimoineSnapshot.findMany({
    where: { clientId },
    orderBy: { date: 'desc' },
    take: limit,
  })

  return snapshots.map((s) => ({
    totalActifs: s.totalActifs,
    totalPassifs: s.totalPassifs,
    patrimoineNet: s.patrimoineNet,
    patrimoineGere: s.patrimoineGere,
    patrimoineNonGere: s.patrimoineNonGere,
    detailActifs: s.detailActifs as Record<string, number>,
    detailPassifs: s.detailPassifs as Record<string, number>,
    totalRevenus: s.totalRevenus,
    totalCharges: s.totalCharges,
    capaciteEpargne: s.capaciteEpargne,
    tauxEpargne: s.tauxEpargne,
    totalMensualites: s.totalMensualites,
    tauxEndettement: s.tauxEndettement,
    baseIFI: s.baseIFI,
    montantIFI: s.montantIFI,
  }))
}

/**
 * Supprime les anciens snapshots (>24 mois)
 */
export async function cleanupOldSnapshots(monthsToKeep = 24): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep)

  const result = await prisma.patrimoineSnapshot.deleteMany({
    where: {
      date: { lt: cutoffDate },
    },
  })

  return result.count
}
