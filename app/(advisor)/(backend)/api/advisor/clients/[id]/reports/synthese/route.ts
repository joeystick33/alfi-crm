/**
 * API Route: /api/advisor/clients/[id]/reports/synthese
 * GET - Génère un rapport PDF de synthèse (Bilan Patrimonial)
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

        // Générer le PDF
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()

        // Header
        doc.setFontSize(22)
        doc.setTextColor(115, 115, 255) // Brand color
        doc.setFont('helvetica', 'bold')
        doc.text('BILAN PATRIMONIAL', pageWidth / 2, 25, { align: 'center' })

        doc.setFontSize(14)
        doc.setTextColor(100, 100, 100)
        doc.setFont('helvetica', 'normal')
        doc.text(`${client.firstName} ${client.lastName}`, pageWidth / 2, 35, { align: 'center' })
        doc.text(`Document préparé le ${formatDate(new Date())}`, pageWidth / 2, 42, { align: 'center' })

        // --- Section 1: Synthèse ---
        let yPos = 60
        doc.setFontSize(16)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold')
        doc.text('1. Synthèse Globale', 14, yPos)

        yPos += 8
        const globalData = [
            ['Patrimoine Brut', formatCurrency(totalActifs)],
            ['Total des Dettes', formatCurrency(totalPassifs)],
            ['Patrimoine Net', formatCurrency(patrimoineNet)],
            ['Capacité d\'épargne mensuelle', formatCurrency(solde)],
        ]

        autoTable(doc, {
            startY: yPos,
            body: globalData,
            theme: 'plain',
            styles: { fontSize: 12, cellPadding: 5 },
            columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
        })

        yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20

        // --- Section 2: Détail du Patrimoine ---
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('2. Détail du Patrimoine', 14, yPos)

        yPos += 8
        if (client.actifs.length > 0) {
            const actifsData = client.actifs.map(a => [
                a.actif.name || 'Actif',
                a.actif.type || '-',
                formatCurrency(Number(a.actif.value)),
            ])

            autoTable(doc, {
                startY: yPos,
                head: [['Désignation', 'Type', 'Valeur Estimée']],
                body: actifsData,
                theme: 'striped',
                headStyles: { fillColor: [115, 115, 255] },
            })
            yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
        } else {
            yPos += 10
            doc.setFontSize(11)
            doc.setFont('helvetica', 'italic')
            doc.text('Aucun actif répertorié.', 14, yPos)
            yPos += 15
        }

        // --- Section 3: Budget et Flux ---
        if (yPos > 240) { doc.addPage(); yPos = 20 }
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('3. Budget et Capacité d\'Épargne', 14, yPos)

        yPos += 8
        const budgetData = [
            ['Total Revenus Mensuels', formatCurrency(totalRevenus)],
            ['Total Charges Mensuelles', formatCurrency(totalCharges)],
            ['Mensualités Crédits', formatCurrency(totalCredits)],
            ['Solde Disponible (Capacité d\'épargne)', formatCurrency(solde)],
        ]

        autoTable(doc, {
            startY: yPos,
            body: budgetData,
            theme: 'striped',
            styles: { fontSize: 11 },
            columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
        })

        // Footer
        const pageCount = doc.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(9)
            doc.setTextColor(150, 150, 150)
            doc.text(
                `Page ${i} / ${pageCount} - Aura CRM - Rapport confidentiel`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            )
        }

        const pdfBuffer = doc.output('arraybuffer')

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="bilan-patrimonial-${client.lastName}-${formatDate(new Date()).replace(/\//g, '-')}.pdf"`,
            },
        })
    } catch (error) {
        console.error('Error generating synthesis report:', error)
        return NextResponse.json(
            { error: 'Erreur lors de la génération du rapport' },
            { status: 500 }
        )
    }
}
