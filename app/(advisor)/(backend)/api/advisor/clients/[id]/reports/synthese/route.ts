/**
 * API Route: /api/advisor/clients/[id]/reports/synthese
 * GET - Génère un rapport PDF de synthèse (Bilan Patrimonial)
 * 
 * Migré de jsPDF → Puppeteer (PDF vectoriel, texte sélectionnable)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { PdfGenerator } from '@/app/_common/lib/services/pdf-generator'
import { premiumReportStyles, generateDonutChart } from '@/app/_common/lib/templates/pdf-styles-premium'
import { logger } from '@/app/_common/lib/logger'
const formatCurrency = (amount: number | null | undefined): string => {
    if (amount == null) return '0 €'
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(amount)
}

const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const context = await requireAuth(request)
        const { id: clientId } = await params
        const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

        // Récupérer le client avec toutes les données nécessaires
        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                cabinetId: context.cabinetId,
            },
            include: {
                actifs: {
                    include: {
                        actif: true
                    }
                },
                passifs: true,
                revenues: true,
                expenses: true,
                credits: true,
            },
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        // Calculs Patrimoine
        const totalActifs = client.actifs.reduce((sum, a) => sum + Number(a.actif.value || 0), 0)
        const totalPassifs = client.passifs.reduce((sum, p) => sum + Number(p.remainingAmount || 0), 0)
        const patrimoineNet = totalActifs - totalPassifs

        // Calculs Budget
        const totalRevenus = client.revenues.reduce((sum, r) => sum + Number(r.montant || 0), 0)
        const totalCharges = client.expenses.reduce((sum, e) => sum + Number(e.montant || 0), 0)
        const totalCredits = client.credits.reduce((sum, c) => sum + Number(c.mensualiteTotale || 0), 0)
        const solde = totalRevenus - totalCharges - totalCredits

        // Répartition par catégorie pour le donut chart
        const catColors: Record<string, string> = {
            IMMOBILIER: '#3b82f6', FINANCIER: '#8b5cf6', EPARGNE_SALARIALE: '#f59e0b',
            EPARGNE_RETRAITE: '#10b981', PROFESSIONNEL: '#ef4444', MOBILIER: '#6366f1', AUTRE: '#94a3b8',
        }
        const catLabels: Record<string, string> = {
            IMMOBILIER: 'Immobilier', FINANCIER: 'Financier', EPARGNE_SALARIALE: 'Ép. salariale',
            EPARGNE_RETRAITE: 'Ép. retraite', PROFESSIONNEL: 'Professionnel', MOBILIER: 'Mobilier', AUTRE: 'Autres',
        }
        const parCategorie: Record<string, number> = {}
        client.actifs.forEach(ca => {
            const cat = ca.actif.category || 'AUTRE'
            parCategorie[cat] = (parCategorie[cat] || 0) + Number(ca.actif.value || 0)
        })
        const chartData = Object.entries(parCategorie)
            .filter(([, v]) => v > 0)
            .map(([cat, val]) => ({ label: catLabels[cat] || cat, value: val, color: catColors[cat] || '#94a3b8' }))

        // Générer le HTML pour Puppeteer
        const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bilan Patrimonial - ${client.firstName} ${client.lastName}</title>
  <style>
    ${premiumReportStyles}
    body { font-size: 10pt; }
  </style>
</head>
<body>

  <!-- COUVERTURE -->
  <div class="page cover">
    <div class="cover-header">
      <div class="cover-logo">
        <div class="cover-logo-icon">A</div>
        <span class="cover-logo-text">Aura CRM</span>
      </div>
      <div class="cover-date">${formatDate(new Date())}</div>
    </div>
    <div class="cover-main">
      <div class="cover-badge">RAPPORT DE SYNTHÈSE</div>
      <div class="cover-title">Bilan<br/>Patrimonial</div>
      <div class="cover-subtitle">Synthèse de la situation patrimoniale, budgétaire et des actifs</div>
      <div class="cover-client-card">
        <div class="cover-client-label">CLIENT</div>
        <div class="cover-client-name">${client.firstName} ${client.lastName}</div>
        <div class="cover-client-info">${formatDate(new Date())}</div>
      </div>
    </div>
    <div class="cover-footer">
      <div class="cover-footer-item"><span>Patrimoine brut</span><br/><span class="cover-footer-value">${formatCurrency(totalActifs)}</span></div>
      <div class="cover-footer-item"><span>Dettes</span><br/><span class="cover-footer-value">${formatCurrency(totalPassifs)}</span></div>
      <div class="cover-footer-item"><span>Patrimoine net</span><br/><span class="cover-footer-value">${formatCurrency(patrimoineNet)}</span></div>
    </div>
  </div>

  <!-- PAGE 2: SYNTHÈSE -->
  <div class="page content-page" style="padding:50px;">
    <div class="page-header">
      <div class="page-title">Synthèse Globale</div>
      <div class="page-number">1</div>
    </div>

    <div class="stats-row">
      <div class="stat-card highlight">
        <div class="stat-label">PATRIMOINE NET</div>
        <div class="stat-value">${formatCurrency(patrimoineNet)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">PATRIMOINE BRUT</div>
        <div class="stat-value">${formatCurrency(totalActifs)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">TOTAL DETTES</div>
        <div class="stat-value" style="color:var(--danger);">${formatCurrency(totalPassifs)}</div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">REVENUS MENSUELS</div>
        <div class="stat-value">${formatCurrency(totalRevenus)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">CHARGES + CRÉDITS</div>
        <div class="stat-value">${formatCurrency(totalCharges + totalCredits)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">CAPACITÉ D'ÉPARGNE</div>
        <div class="stat-value" style="color:${solde >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatCurrency(solde)}</div>
      </div>
    </div>

    ${chartData.length > 0 ? `
    <div class="card" style="margin-top:20px;">
      <div class="card-header"><span class="card-title">Répartition du patrimoine</span></div>
      <div class="chart-container" style="padding:16px;">
        ${generateDonutChart(chartData, 160, 22, { centerLabel: 'Net', centerValue: formatCurrency(patrimoineNet) })}
      </div>
    </div>` : ''}
  </div>

  <!-- PAGE 3: DÉTAIL PATRIMOINE -->
  <div class="page content-page" style="padding:50px;">
    <div class="page-header">
      <div class="page-title">Détail du Patrimoine</div>
      <div class="page-number">2</div>
    </div>

    ${client.actifs.length > 0 ? `
    <div class="table-container">
      <div class="table-header"><span class="table-title">Actifs</span></div>
      <table>
        <thead><tr><th>Désignation</th><th>Type</th><th>Catégorie</th><th style="text-align:right;">Valeur</th></tr></thead>
        <tbody>
          ${client.actifs.map(ca => `<tr>
            <td class="td-main">${ca.actif.name || 'Actif'}</td>
            <td>${ca.actif.type || '-'}</td>
            <td>${catLabels[ca.actif.category || 'AUTRE'] || ca.actif.category}</td>
            <td class="td-amount">${formatCurrency(Number(ca.actif.value))}</td>
          </tr>`).join('')}
          <tr class="table-footer"><td colspan="3">Total Actifs</td><td class="td-amount">${formatCurrency(totalActifs)}</td></tr>
        </tbody>
      </table>
    </div>` : '<p style="color:var(--text-muted);font-style:italic;">Aucun actif répertorié.</p>'}

    ${client.passifs.length > 0 ? `
    <div class="table-container" style="margin-top:24px;">
      <div class="table-header"><span class="table-title">Passifs</span></div>
      <table>
        <thead><tr><th>Désignation</th><th>Type</th><th style="text-align:right;">Capital restant</th><th style="text-align:right;">Mensualité</th></tr></thead>
        <tbody>
          ${client.passifs.map(p => `<tr>
            <td class="td-main">${p.name || 'Passif'}</td>
            <td>${p.type || '-'}</td>
            <td class="td-amount negative">${formatCurrency(Number(p.remainingAmount))}</td>
            <td class="td-amount">${formatCurrency(Number(p.monthlyPayment))}</td>
          </tr>`).join('')}
          <tr class="table-footer"><td colspan="2">Total Passifs</td><td class="td-amount">${formatCurrency(totalPassifs)}</td><td class="td-amount">${formatCurrency(totalCredits)}</td></tr>
        </tbody>
      </table>
    </div>` : ''}
  </div>

  <!-- PAGE 4: BUDGET -->
  <div class="page content-page" style="padding:50px;">
    <div class="page-header">
      <div class="page-title">Budget et Capacité d'Épargne</div>
      <div class="page-number">3</div>
    </div>

    <div class="table-container">
      <table>
        <tbody>
          <tr><td class="td-main">Total Revenus Mensuels</td><td class="td-amount positive">${formatCurrency(totalRevenus)}</td></tr>
          <tr><td class="td-main">Total Charges Mensuelles</td><td class="td-amount negative">${formatCurrency(totalCharges)}</td></tr>
          <tr><td class="td-main">Mensualités Crédits</td><td class="td-amount negative">${formatCurrency(totalCredits)}</td></tr>
          <tr class="table-footer"><td>Solde disponible (Capacité d'épargne)</td><td class="td-amount">${formatCurrency(solde)}</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top:40px;padding:24px;background:var(--bg-light);border-radius:12px;font-size:8pt;color:var(--text-muted);line-height:1.6;">
      <strong>Avertissement :</strong> Ce document est fourni à titre informatif et ne constitue pas un conseil en investissement.
      Les valeurs indiquées sont des estimations basées sur les données déclarées par le client au ${formatDate(new Date())}.
    </div>
  </div>

</body>
</html>`

        // Générer le PDF vectoriel avec Puppeteer
        const pdfBuffer = await PdfGenerator.generateFromHtml(html, {
            format: 'A4',
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
            printBackground: true,
            displayHeaderFooter: true,
            footerTemplate: `
                <div style="width:100%;font-size:8px;padding:0 40px;display:flex;justify-content:space-between;color:#999;">
                    <span>Bilan patrimonial — ${client.firstName} ${client.lastName} — Document confidentiel</span>
                    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
                </div>
            `,
        })

        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="bilan-patrimonial-${client.lastName}-${new Date().toISOString().split('T')[0]}.pdf"`,
            },
        })
    } catch (error) {
        logger.error('Error generating synthesis report:', { error: error instanceof Error ? error.message : String(error) })
        return NextResponse.json(
            { error: 'Erreur lors de la génération du rapport' },
            { status: 500 }
        )
    }
}
