
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import type { PrismaClient } from '@prisma/client'
import { logger } from '@/app/_common/lib/logger'
interface BaseReportData {
  cabinet: string
  period: string
  generatedAt: string
  generatedBy: string
  [key: string]: unknown
}

/**
 * GET /api/advisor/management/reporting
 * Génère un rapport PDF à la demande
 * Accessible uniquement par les ADMIN
 * 
 * Query params:
 * - type: 'cabinet' | 'conseiller' | 'facturation' | 'objectifs'
 * - conseillerId: (optional) for conseiller-specific reports
 * - period: 'month' | 'quarter' | 'year'
 * - format: 'json' | 'pdf' (default: json for data, pdf triggers download)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Réservé aux administrateurs', 403)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'cabinet'
    const conseillerId = searchParams.get('conseillerId')
    const period = searchParams.get('period') || 'month'
    const format = searchParams.get('format') || 'json'

    const now = new Date()
    let startDate: Date
    let periodLabel: string

    switch (period) {
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        periodLabel = `T${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        periodLabel = `Année ${now.getFullYear()}`
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        periodLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }

    // Get cabinet info
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: context.cabinetId },
      select: { name: true, address: true }
    })

    // Build report data based on type
    let reportData: BaseReportData

    switch (reportType) {
      case 'cabinet':
        reportData = await generateCabinetReport(prisma, context.cabinetId, startDate, {
          cabinet: cabinet?.name || 'Cabinet',
          period: periodLabel,
          generatedAt: now.toISOString(),
          generatedBy: `${user.firstName} ${user.lastName}`,
        })
        break
      case 'conseiller':
        if (!conseillerId) {
          return createErrorResponse('conseillerId requis pour ce type de rapport', 400)
        }
        reportData = await generateConseillerReport(prisma, conseillerId, startDate, {
          cabinet: cabinet?.name || 'Cabinet',
          period: periodLabel,
          generatedAt: now.toISOString(),
          generatedBy: `${user.firstName} ${user.lastName}`,
        })
        break
      case 'facturation':
        reportData = await generateFacturationReport(prisma, context.cabinetId, startDate, {
          cabinet: cabinet?.name || 'Cabinet',
          period: periodLabel,
          generatedAt: now.toISOString(),
          generatedBy: `${user.firstName} ${user.lastName}`,
        })
        break
      case 'objectifs':
        reportData = await generateObjectifsReport(prisma, context.cabinetId, startDate, {
          cabinet: cabinet?.name || 'Cabinet',
          period: periodLabel,
          generatedAt: now.toISOString(),
          generatedBy: `${user.firstName} ${user.lastName}`,
        })
        break
      default:
        return createErrorResponse('Type de rapport invalide', 400)
    }

    // If format is PDF, return HTML that can be printed/saved as PDF
    if (format === 'pdf') {
      const html = generatePDFHTML(reportData, reportType)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="rapport-${reportType}-${period}.html"`,
        }
      })
    }

    // Return JSON data
    return NextResponse.json(reportData)
  } catch (error) {
    logger.error('Error in GET /api/advisor/management/reporting:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

// Generate cabinet-wide report
async function generateCabinetReport(prisma: PrismaClient, cabinetId: string, startDate: Date, baseData: BaseReportData) {
  const conseillers = await prisma.user.findMany({
    where: {
      cabinetId,
      role: { in: ['ADVISOR', 'ASSISTANT'] },
      isActive: true,
    },
    select: { id: true, firstName: true, lastName: true }
  })

  // Get stats per conseiller
  const conseillersStats = await Promise.all(
    conseillers.map(async (c) => {
      const clients = await prisma.client.count({
        where: { conseillerId: c.id }
      })

      const newClients = await prisma.client.count({
        where: {
          conseillerId: c.id,
          createdAt: { gte: startDate },
        }
      })

      const opportunities = await prisma.opportunite.findMany({
        where: {
          conseillerId: c.id,
          createdAt: { gte: startDate },
        },
        select: { estimatedValue: true, status: true }
      })

      const won = opportunities.filter((o) => o.status === 'CONVERTIE')
      const ca = won.reduce((sum, o) => sum + (o.estimatedValue?.toNumber() || 0), 0)

      return {
        name: `${c.firstName} ${c.lastName}`,
        clients,
        newClients,
        opportunities: opportunities.length,
        opportunitiesWon: won.length,
        ca,
        conversionRate: opportunities.length > 0
          ? Math.round((won.length / opportunities.length) * 100)
          : 0,
      }
    })
  )

  // Calculate totals
  const totalClients = conseillersStats.reduce((sum, c) => sum + c.clients, 0)
  const totalNewClients = conseillersStats.reduce((sum, c) => sum + c.newClients, 0)
  const totalCA = conseillersStats.reduce((sum, c) => sum + c.ca, 0)
  const totalOpportunities = conseillersStats.reduce((sum, c) => sum + c.opportunities, 0)
  const totalWon = conseillersStats.reduce((sum, c) => sum + c.opportunitiesWon, 0)

  return {
    ...baseData,
    type: 'Rapport Cabinet',
    summary: {
      totalConseillers: conseillers.length,
      totalClients,
      totalNewClients,
      totalCA,
      totalOpportunities,
      totalOpportunitiesWon: totalWon,
      conversionRate: totalOpportunities > 0 ? Math.round((totalWon / totalOpportunities) * 100) : 0,
    },
    conseillers: conseillersStats.sort((a, b) => b.ca - a.ca),
  }
}

// Generate conseiller-specific report
async function generateConseillerReport(prisma: PrismaClient, conseillerId: string, startDate: Date, baseData: BaseReportData) {
  const conseiller = await prisma.user.findUnique({
    where: { id: conseillerId },
    select: { firstName: true, lastName: true, email: true, createdAt: true }
  })

  if (!conseiller) {
    throw new Error('Conseiller non trouvé')
  }

  // Get clients
  const clients = await prisma.client.findMany({
    where: { conseillerId: conseillerId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      wealth: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  // Get opportunities
  const opportunities = await prisma.opportunite.findMany({
    where: {
      conseillerId: conseillerId,
      createdAt: { gte: startDate },
    },
    include: {
      client: {
        select: { firstName: true, lastName: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  })

  const won = opportunities.filter((o) => o.status === 'ACCEPTEE' || o.status === 'CONVERTIE')
  const ca = won.reduce((sum, o) => sum + (o.estimatedValue?.toNumber() || 0), 0)

  // Get tasks
  const tasks = await prisma.tache.findMany({
    where: {
      assignedToId: conseillerId,
      createdAt: { gte: startDate },
    },
    select: { status: true }
  })

  const tasksDone = tasks.filter((t) => t.status === 'TERMINE').length

  return {
    ...baseData,
    type: 'Rapport Conseiller',
    conseiller: {
      name: `${conseiller.firstName} ${conseiller.lastName}`,
      email: conseiller.email,
      memberSince: conseiller.createdAt,
    },
    stats: {
      totalClients: clients.length,
      newClients: clients.filter((c) => new Date(c.createdAt) >= startDate).length,
      totalOpportunities: opportunities.length,
      opportunitiesWon: won.length,
      ca,
      conversionRate: opportunities.length > 0
        ? Math.round((won.length / opportunities.length) * 100)
        : 0,
      tasks: tasks.length,
      tasksDone,
      tasksCompletionRate: tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0,
    },
    topClients: clients.slice(0, 10).map((c) => ({
      name: `${c.firstName} ${c.lastName}`,
      patrimoine: (c.wealth as any)?.netWealth || 0,
    })),
    recentOpportunities: opportunities.slice(0, 10).map((o) => ({
      title: o.name,
      client: o.client ? `${o.client.firstName} ${o.client.lastName}` : 'N/A',
      amount: o.estimatedValue?.toNumber() || 0,
      status: o.status,
    })),
  }
}

// Generate facturation report
async function generateFacturationReport(prisma: PrismaClient, cabinetId: string, startDate: Date, baseData: BaseReportData) {
  const invoices = await prisma.invoice.findMany({
    where: {
      cabinetId,
      issueDate: { gte: startDate },
    },
    include: {
      conseiller: {
        select: { firstName: true, lastName: true }
      },
      client: {
        select: { firstName: true, lastName: true }
      }
    },
    orderBy: { issueDate: 'desc' },
  })

  const totalCA = invoices.reduce((sum, inv) => sum + (inv.amountTTC?.toNumber() || 0), 0)
  const paidAmount = invoices
    .filter((inv) => inv.status === 'PAYEE')
    .reduce((sum, inv) => sum + (inv.amountTTC?.toNumber() || 0), 0)
  const pendingAmount = totalCA - paidAmount

  // Group by conseiller
  const byConseiller = invoices.reduce((acc: Record<string, { total: number; count: number }>, inv) => {
    const key = inv.conseiller ? `${inv.conseiller.firstName} ${inv.conseiller.lastName}` : 'Non assigné'
    if (!acc[key]) {
      acc[key] = { total: 0, count: 0 }
    }
    acc[key].total += inv.amountTTC?.toNumber() || 0
    acc[key].count += 1
    return acc
  }, {})

  return {
    ...baseData,
    type: 'Rapport Facturation',
    summary: {
      totalCA,
      paidAmount,
      pendingAmount,
      invoiceCount: invoices.length,
      paidCount: invoices.filter((inv) => inv.status === 'PAYEE').length,
    },
    byConseiller: Object.entries(byConseiller).map(([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
    })).sort((a, b) => b.total - a.total),
    recentInvoices: invoices.slice(0, 20).map((inv) => ({
      number: inv.invoiceNumber,
      client: inv.client ? `${inv.client.firstName} ${inv.client.lastName}` : 'N/A',
      conseiller: inv.conseiller ? `${inv.conseiller.firstName} ${inv.conseiller.lastName}` : 'N/A',
      amount: inv.amountTTC?.toNumber() || 0,
      status: inv.status,
      date: inv.issueDate,
    })),
  }
}

// Generate objectifs report
async function generateObjectifsReport(prisma: PrismaClient, cabinetId: string, startDate: Date, baseData: BaseReportData) {
  const conseillers = await prisma.user.findMany({
    where: {
      cabinetId,
      role: { in: ['ADVISOR', 'ASSISTANT'] },
      isActive: true,
    },
    select: { id: true, firstName: true, lastName: true }
  })

  // Default targets
  const targets = {
    ca: 30000,
    clients: 6,
  }

  const objectifsData = await Promise.all(
    conseillers.map(async (c) => {
      // Get current CA
      const opportunities = await prisma.opportunite.findMany({
        where: {
          conseillerId: c.id,
          status: { in: ['ACCEPTEE', 'CONVERTIE'] },
          createdAt: { gte: startDate },
        },
        select: { estimatedValue: true }
      })
      const ca = opportunities.reduce((sum, o) => sum + (o.estimatedValue?.toNumber() || 0), 0)

      // Get new clients
      const newClients = await prisma.client.count({
        where: {
          conseillerId: c.id,
          createdAt: { gte: startDate },
        }
      })

      return {
        name: `${c.firstName} ${c.lastName}`,
        ca: {
          current: ca,
          target: targets.ca,
          progress: Math.round((ca / targets.ca) * 100),
          status: ca >= targets.ca ? 'Atteint' : ca >= targets.ca * 0.8 ? 'En bonne voie' : 'En retard',
        },
        clients: {
          current: newClients,
          target: targets.clients,
          progress: Math.round((newClients / targets.clients) * 100),
          status: newClients >= targets.clients ? 'Atteint' : newClients >= targets.clients * 0.8 ? 'En bonne voie' : 'En retard',
        },
      }
    })
  )

  // Calculate global progress
  const totalCA = objectifsData.reduce((sum, c) => sum + c.ca.current, 0)
  const totalClients = objectifsData.reduce((sum, c) => sum + c.clients.current, 0)
  const globalTargetCA = targets.ca * conseillers.length
  const globalTargetClients = targets.clients * conseillers.length

  return {
    ...baseData,
    type: 'Rapport Objectifs',
    global: {
      ca: {
        current: totalCA,
        target: globalTargetCA,
        progress: Math.round((totalCA / globalTargetCA) * 100),
      },
      clients: {
        current: totalClients,
        target: globalTargetClients,
        progress: Math.round((totalClients / globalTargetClients) * 100),
      },
    },
    conseillers: objectifsData,
  }
}

// Generate printable HTML for PDF
function generatePDFHTML(data: BaseReportData, reportType: string): string {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)

  // Utilisation d'un type partiel pour accéder aux propriétés spécifiques du rapport sans erreur TypeScript
  const report = data as any

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.type} - ${report.period}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .header { 
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 { color: #1e40af; font-size: 28px; }
    .header .meta { color: #6b7280; font-size: 14px; margin-top: 10px; }
    .section { margin-bottom: 30px; }
    .section h2 { 
      color: #1e40af; 
      font-size: 18px; 
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    .stats-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card { 
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
    }
    .stat-card .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .stat-card .value { font-size: 24px; font-weight: bold; color: #1e40af; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { 
      padding: 10px; 
      text-align: left; 
      border-bottom: 1px solid #e5e7eb;
    }
    th { 
      background: #f8fafc; 
      font-weight: 600;
      color: #374151;
      font-size: 12px;
      text-transform: uppercase;
    }
    tr:hover { background: #f8fafc; }
    .status-achieved { color: #059669; }
    .status-ontrack { color: #2563eb; }
    .status-atrisk { color: #d97706; }
    .status-behind { color: #dc2626; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.type}</h1>
    <div class="meta">
      <strong>${report.cabinet}</strong> • Période: ${report.period}<br>
      Généré le ${new Date(report.generatedAt).toLocaleDateString('fr-FR', { dateStyle: 'full' })} par ${report.generatedBy}
    </div>
  </div>

  ${report.summary ? `
  <div class="section">
    <h2>Résumé</h2>
    <div class="stats-grid">
      ${report.summary.totalCA !== undefined ? `
        <div class="stat-card">
          <div class="label">Chiffre d'affaires</div>
          <div class="value">${formatCurrency(report.summary.totalCA)}</div>
        </div>
      ` : ''}
      ${report.summary.totalClients !== undefined ? `
        <div class="stat-card">
          <div class="label">Total Clients</div>
          <div class="value">${report.summary.totalClients}</div>
        </div>
      ` : ''}
      ${report.summary.totalNewClients !== undefined ? `
        <div class="stat-card">
          <div class="label">Nouveaux Clients</div>
          <div class="value">${report.summary.totalNewClients}</div>
        </div>
      ` : ''}
      ${report.summary.conversionRate !== undefined ? `
        <div class="stat-card">
          <div class="label">Taux de conversion</div>
          <div class="value">${report.summary.conversionRate}%</div>
        </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${report.conseillers && report.conseillers.length > 0 ? `
  <div class="section">
    <h2>Performance par Conseiller</h2>
    <table>
      <thead>
        <tr>
          <th>Conseiller</th>
          <th>Clients</th>
          <th>Nouveaux</th>
          <th>Opportunités</th>
          <th>Gagnées</th>
          <th>CA</th>
          <th>Conversion</th>
        </tr>
      </thead>
      <tbody>
        ${report.conseillers.map((c: any) => `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td>${c.clients || c.ca?.current || '-'}</td>
            <td>${c.newClients || c.clients?.current || '-'}</td>
            <td>${c.opportunities || '-'}</td>
            <td>${c.opportunitiesWon || '-'}</td>
            <td>${formatCurrency(c.ca?.current || c.ca || 0)}</td>
            <td>${c.conversionRate || c.ca?.progress || 0}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>Document généré automatiquement - ${report.cabinet} CRM</p>
    <button class="no-print" onclick="window.print()" style="margin-top: 10px; padding: 10px 20px; cursor: pointer;">
      Imprimer / Enregistrer en PDF
    </button>
  </div>
</body>
</html>
  `
}
