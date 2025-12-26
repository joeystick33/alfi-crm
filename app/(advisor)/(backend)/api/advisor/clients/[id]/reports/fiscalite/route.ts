/**
 * API Route: /api/advisor/clients/[id]/reports/fiscalite
 * GET - Génère un rapport PDF de la fiscalité client
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

const MARITAL_STATUS_LABELS: Record<string, string> = {
  SINGLE: 'Célibataire',
  MARRIED: 'Marié(e)',
  PACS: 'Pacsé(e)',
  DIVORCED: 'Divorcé(e)',
  WIDOWED: 'Veuf/Veuve',
  SEPARATED: 'Séparé(e)',
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
        maritalStatus: true,
        numberOfChildren: true,
        taxBracket: true,
        ifiSubject: true,
        ifiAmount: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Récupérer les données fiscales
    const taxation = await prisma.clientTaxation.findUnique({
      where: { clientId },
    })

    // Récupérer les actifs immobiliers pour l'IFI
    const clientActifs = await prisma.clientActif.findMany({
      where: { clientId },
      include: {
        actif: {
          select: {
            id: true,
            name: true,
            category: true,
            value: true,
            fiscalPropertyType: true,
            fiscalIfiValue: true,
          },
        },
      },
    })

    // Filtrer les actifs immobiliers
    const realEstateAssets = clientActifs
      .filter(ca => ca.actif.category === 'IMMOBILIER')
      .map(ca => ({
        name: ca.actif.name,
        value: Number(ca.actif.value),
        ifiValue: ca.actif.fiscalIfiValue ? Number(ca.actif.fiscalIfiValue) : Number(ca.actif.value),
        type: ca.actif.fiscalPropertyType || 'Autre',
      }))

    const totalImmobilier = realEstateAssets.reduce((sum, a) => sum + a.value, 0)
    const totalIFI = realEstateAssets.reduce((sum, a) => sum + a.ifiValue, 0)

    // Récupérer les optimisations fiscales
    const optimizations = await prisma.taxOptimization.findMany({
      where: { clientId },
      select: {
        title: true,
        description: true,
        category: true,
        potentialSavings: true,
        status: true,
      },
    })

    // Générer le PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('RAPPORT FISCAL', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`${client.firstName} ${client.lastName}`, pageWidth / 2, 28, { align: 'center' })
    doc.text(`Année fiscale ${taxation?.anneeFiscale || new Date().getFullYear()}`, pageWidth / 2, 35, { align: 'center' })
    doc.text(`Généré le ${formatDate(new Date())}`, pageWidth / 2, 42, { align: 'center' })

    // Situation fiscale
    let yPos = 55
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Situation fiscale', 14, yPos)

    yPos += 10
    const situationData = [
      ['Situation familiale', MARITAL_STATUS_LABELS[client.maritalStatus || ''] || 'Non renseignée'],
      ['Nombre d\'enfants', String(client.numberOfChildren || 0)],
      ['Revenu annuel déclaré', formatCurrency(Number(client.annualIncome))],
      ['Tranche marginale d\'imposition (TMI)', client.taxBracket ? `${client.taxBracket}%` : 'Non calculée'],
    ]

    autoTable(doc, {
      startY: yPos,
      head: [['Élément', 'Valeur']],
      body: situationData,
      theme: 'striped',
      headStyles: { fillColor: [115, 115, 255] },
      margin: { left: 14, right: 14 },
    })

    // Impôt sur le revenu
    yPos = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Impôt sur le revenu (IR)', 14, yPos)

    const incomeTax = taxation?.incomeTax as Record<string, any> || {}
    const irData = [
      ['Revenu fiscal de référence', formatCurrency(incomeTax.fiscalReferenceIncome || Number(client.annualIncome))],
      ['Nombre de parts', String(incomeTax.taxShares || 1)],
      ['Impôt brut', formatCurrency(incomeTax.grossTax || 0)],
      ['Impôt net', formatCurrency(incomeTax.netTax || 0)],
    ]

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Élément', 'Montant']],
      body: irData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    })

    // IFI
    yPos = (doc as any).lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Impôt sur la Fortune Immobilière (IFI)', 14, yPos)

    const ifiData = [
      ['Patrimoine immobilier brut', formatCurrency(totalImmobilier)],
      ['Base taxable IFI', formatCurrency(totalIFI)],
      ['Assujetti à l\'IFI', client.ifiSubject ? 'Oui' : 'Non'],
      ['Montant IFI estimé', formatCurrency(Number(client.ifiAmount) || 0)],
    ]

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Élément', 'Valeur']],
      body: ifiData,
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] },
      margin: { left: 14, right: 14 },
    })

    // Détail patrimoine immobilier
    if (realEstateAssets.length > 0) {
      yPos = (doc as any).lastAutoTable.finalY + 15
      
      if (yPos > 220) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Détail du patrimoine immobilier', 14, yPos)

      const assetsData = realEstateAssets.map(a => [
        a.name,
        a.type,
        formatCurrency(a.value),
        formatCurrency(a.ifiValue),
      ])

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Bien', 'Type', 'Valeur', 'Valeur IFI']],
        body: assetsData,
        theme: 'striped',
        headStyles: { fillColor: [107, 114, 128] },
        margin: { left: 14, right: 14 },
      })
    }

    // Optimisations fiscales
    if (optimizations.length > 0) {
      yPos = (doc as any).lastAutoTable.finalY + 15

      if (yPos > 220) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Optimisations fiscales identifiées', 14, yPos)

      const optData = optimizations.map(o => [
        o.title || 'Optimisation',
        o.category || '-',
        formatCurrency(Number(o.potentialSavings) || 0),
        o.status || 'PENDING',
      ])

      autoTable(doc, {
        startY: yPos + 5,
        head: [['Titre', 'Catégorie', 'Économie potentielle', 'Statut']],
        body: optData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 14, right: 14 },
      })
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Page ${i} / ${pageCount} - Document à titre informatif - Ne constitue pas un conseil fiscal`,
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
        'Content-Disposition': `attachment; filename="rapport-fiscal-${client.lastName}-${formatDate(new Date()).replace(/\//g, '-')}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating fiscal report:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport fiscal' },
      { status: 500 }
    )
  }
}
