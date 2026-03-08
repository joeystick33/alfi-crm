/**
 * API Route: /api/advisor/clients/[id]/reports/budget
 * GET - Génère un rapport PDF du budget client
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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
    month: '2-digit',
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

    // Récupérer le client
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        annualIncome: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Récupérer les revenus
    const revenues = await prisma.revenue.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    })

    // Récupérer les charges
    const expenses = await prisma.expense.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    })

    // Récupérer les crédits
    const credits = await prisma.credit.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    })

    // Calculer les totaux
    const totalRevenus = revenues.reduce((sum, r) => sum + Number(r.montant || 0), 0)
    const totalCharges = expenses.reduce((sum, e) => sum + Number(e.montant || 0), 0)
    const totalCredits = credits.reduce((sum, c) => sum + Number(c.mensualiteTotale || 0), 0)
    const solde = totalRevenus - totalCharges - totalCredits
    const tauxEndettement = totalRevenus > 0 ? ((totalCharges + totalCredits) / totalRevenus) * 100 : 0

    // Générer le PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('RAPPORT BUDGET', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`${client.firstName} ${client.lastName}`, pageWidth / 2, 28, { align: 'center' })
    doc.text(`Généré le ${formatDate(new Date())}`, pageWidth / 2, 35, { align: 'center' })

    // Résumé
    let yPos = 50
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Synthèse mensuelle', 14, yPos)

    yPos += 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    const summaryData = [
      ['Total Revenus', formatCurrency(totalRevenus)],
      ['Total Charges', formatCurrency(totalCharges)],
      ['Total Crédits', formatCurrency(totalCredits)],
      ['Solde disponible', formatCurrency(solde)],
      ['Taux d\'endettement', `${tauxEndettement.toFixed(1)}%`],
    ]

    autoTable(doc, {
      startY: yPos,
      head: [['Indicateur', 'Montant']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [115, 115, 255] },
      margin: { left: 14, right: 14 },
    })

    // Revenus
    yPos = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Détail des revenus', 14, yPos)

    if (revenues.length > 0) {
      const revenueData = revenues.map(r => [
        r.libelle || 'Revenu',
        r.categorie || '-',
        r.frequence || 'MENSUEL',
        formatCurrency(Number(r.montant)),
      ])

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Libellé', 'Type', 'Fréquence', 'Montant']],
        body: revenueData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 14, right: 14 },
      })
      yPos = (doc as any).lastAutoTable.finalY + 15
    } else {
      yPos += 10
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.text('Aucun revenu enregistré', 14, yPos)
      yPos += 15
    }

    // Charges
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Détail des charges', 14, yPos)

    if (expenses.length > 0) {
      const expenseData = expenses.map(e => [
        e.libelle || 'Charge',
        e.categorie || '-',
        e.frequence || 'MENSUEL',
        formatCurrency(Number(e.montant)),
      ])

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Libellé', 'Catégorie', 'Fréquence', 'Montant']],
        body: expenseData,
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] },
        margin: { left: 14, right: 14 },
      })
      yPos = (doc as any).lastAutoTable.finalY + 15
    } else {
      yPos += 10
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.text('Aucune charge enregistrée', 14, yPos)
      yPos += 15
    }

    // Crédits
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Détail des crédits', 14, yPos)

    if (credits.length > 0) {
      const creditData = credits.map(c => [
        c.libelle || 'Crédit',
        c.type || '-',
        formatCurrency(Number(c.mensualiteTotale)),
        formatCurrency(Number(c.capitalRestantDu)),
      ])

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Libellé', 'Type', 'Mensualité', 'Capital restant']],
        body: creditData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 14, right: 14 },
      })
    } else {
      yPos += 10
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      doc.text('Aucun crédit enregistré', 14, yPos)
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Page ${i} / ${pageCount} - Document généré automatiquement`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    // Retourner le PDF
    const pdfBuffer = doc.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rapport-budget-${client.lastName}-${formatDate(new Date()).replace(/\//g, '-')}.pdf"`,
      },
    })
  } catch (error) {
    logger.error('Error generating budget report:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    )
  }
}
