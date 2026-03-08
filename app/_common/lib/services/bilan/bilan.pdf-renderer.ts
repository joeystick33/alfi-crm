/**
 * @deprecated Ce renderer jsPDF est remplacé par la génération Puppeteer (PDF vectoriel).
 * Utiliser à la place :
 * - POST /api/advisor/pdf/generate { type: 'BILAN_PATRIMONIAL', id: clientId }
 * - PdfGenerator.generateFromHtml() + generateBilanPatrimonialPremiumHtml()
 * 
 * Backup disponible dans ./_quarantine/bilan.pdf-renderer.ts.bak
 * 
 * Ancien renderer jsPDF + jspdf-autotable — NE PLUS UTILISER
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BilanComplet, BilanSection } from './bilan.builder'
import { GlobalDiagnostic } from './diagnostic.engine'

// ============================================================
// CONSTANTES DE STYLE
// ============================================================

const COLORS = {
  primary: [59, 130, 246] as [number, number, number],      // Bleu
  secondary: [16, 185, 129] as [number, number, number],    // Vert
  accent: [139, 92, 246] as [number, number, number],       // Violet
  warning: [245, 158, 11] as [number, number, number],      // Orange
  danger: [239, 68, 68] as [number, number, number],        // Rouge
  dark: [30, 41, 59] as [number, number, number],           // Slate-800
  muted: [100, 116, 139] as [number, number, number],       // Slate-500
  light: [241, 245, 249] as [number, number, number],       // Slate-100
  white: [255, 255, 255] as [number, number, number],
}

const FONTS = {
  title: 24,
  subtitle: 16,
  heading: 14,
  body: 11,
  small: 9,
  tiny: 8,
}

// ============================================================
// UTILITAIRES
// ============================================================

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function drawRoundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor: [number, number, number]
) {
  doc.setFillColor(...fillColor)
  doc.roundedRect(x, y, width, height, radius, radius, 'F')
}

function addHeader(doc: jsPDF, title: string, icon: string, pageWidth: number) {
  // Bande de titre
  drawRoundedRect(doc, 10, 10, pageWidth - 20, 18, 3, COLORS.primary)

  doc.setTextColor(...COLORS.white)
  doc.setFontSize(FONTS.heading)
  doc.setFont('helvetica', 'bold')
  doc.text(`${icon}  ${title}`, 16, 22)

  // Reset
  doc.setTextColor(...COLORS.dark)
}

function addFooter(doc: jsPDF, pageNumber: number, totalPages: number, clientName: string) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Ligne de séparation
  doc.setDrawColor(...COLORS.light)
  doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15)

  doc.setFontSize(FONTS.tiny)
  doc.setTextColor(...COLORS.muted)
  doc.setFont('helvetica', 'normal')

  doc.text(`Bilan patrimonial - ${clientName}`, 14, pageHeight - 8)
  doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - 30, pageHeight - 8)
  doc.text(`Aura CRM - ${formatDate(new Date())}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
}

// ============================================================
// PAGE 1 : COUVERTURE
// ============================================================

function renderCouverture(doc: jsPDF, section: BilanSection, clientName: string, email: string) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Fond dégradé simulé (bandes)
  drawRoundedRect(doc, 0, 0, pageWidth, 80, 0, COLORS.primary)

  // Titre principal
  doc.setTextColor(...COLORS.white)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('RAPPORT DE SYNTHÈSE', pageWidth / 2, 35, { align: 'center' })
  doc.text('PATRIMONIALE', pageWidth / 2, 48, { align: 'center' })

  doc.setFontSize(FONTS.subtitle)
  doc.setFont('helvetica', 'normal')
  doc.text(clientName, pageWidth / 2, 65, { align: 'center' })

  // Informations client
  doc.setTextColor(...COLORS.dark)
  let yPos = 100

  doc.setFontSize(FONTS.body)
  doc.text(`Genere le ${formatDate(new Date())}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 8
  doc.text(`Client : ${clientName}`, pageWidth / 2, yPos, { align: 'center' })
  if (email) {
    yPos += 8
    doc.text(`Email : ${email}`, pageWidth / 2, yPos, { align: 'center' })
  }

  // Indicateurs clés
  yPos = 130
  doc.setFontSize(FONTS.heading)
  doc.setFont('helvetica', 'bold')
  doc.text('Indicateurs cles', 14, yPos)

  if (section.highlights) {
    const highlightData = section.highlights.map(h => [
      h.icon || '',
      h.label,
      h.value,
    ])

    autoTable(doc, {
      startY: yPos + 5,
      head: [['', 'Indicateur', 'Valeur']],
      body: highlightData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.white,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 60, halign: 'right', fontStyle: 'bold' },
      },
      styles: { fontSize: FONTS.body },
      margin: { left: 14, right: 14 },
    })
  }

  // Encadré diagnostic
  const finalY = (doc as any).lastAutoTable?.finalY || yPos + 60

  if (section.alerts && section.alerts.length > 0) {
    const alert = section.alerts[0]
    const alertColor = alert.typeCode === 'success' ? COLORS.secondary : alert.typeCode === 'warning' ? COLORS.warning : COLORS.primary

    drawRoundedRect(doc, 14, finalY + 10, pageWidth - 28, 25, 4, COLORS.light)
    doc.setDrawColor(...alertColor)
    doc.setLineWidth(2)
    doc.line(14, finalY + 10, 14, finalY + 35)

    doc.setFontSize(FONTS.body)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...COLORS.dark)

    const lines = doc.splitTextToSize(alert.message, pageWidth - 40)
    doc.text(lines, 20, finalY + 20)
  }

  // Disclaimer bas de page
  doc.setFontSize(FONTS.tiny)
  doc.setTextColor(...COLORS.muted)
  doc.text(
    'Ce document est fourni à titre informatif. Il ne constitue pas un conseil en investissement.',
    pageWidth / 2,
    pageHeight - 20,
    { align: 'center' }
  )
}

// ============================================================
// PAGES STANDARDS
// ============================================================

function renderStandardPage(doc: jsPDF, section: BilanSection, pageWidth: number) {
  addHeader(doc, section.title, section.icon, pageWidth)

  let yPos = 40

  // Sous-titre si présent
  if (section.subtitle) {
    doc.setFontSize(FONTS.small)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...COLORS.muted)
    doc.text(section.subtitle, 14, yPos)
    yPos += 8
  }

  // Paragraphes narratifs (nouvelle structure)
  if (section.paragraphs && section.paragraphs.length > 0) {
    for (const paragraph of section.paragraphs) {
      if (yPos > 250) break // Éviter dépassement de page

      // Titre du paragraphe si présent
      if (paragraph.title) {
        doc.setFontSize(FONTS.heading - 2)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.primary)
        doc.text(paragraph.title, 14, yPos)
        yPos += 6
      }

      // Contenu du paragraphe
      doc.setFontSize(FONTS.body)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)

      const contentLines = doc.splitTextToSize(paragraph.content, pageWidth - 28)
      doc.text(contentLines, 14, yPos)
      yPos += contentLines.length * 5 + 8
    }
  }

  // Highlights (indicateurs) - tableau compact
  if (section.highlights && section.highlights.length > 0) {
    const highlightData = section.highlights.map(h => [
      h.icon || '',
      h.label,
      h.value,
    ])

    autoTable(doc, {
      startY: yPos,
      head: [['', 'Indicateur', 'Valeur']],
      body: highlightData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 75 },
        2: { cellWidth: 55, halign: 'right', fontStyle: 'bold' },
      },
      styles: { fontSize: FONTS.small },
      margin: { left: 14, right: 14 },
    })

    yPos = (doc as any).lastAutoTable.finalY + 8
  }

  // Tableaux additionnels
  if (section.tableData) {
    for (const table of section.tableData) {
      // Titre du tableau si présent
      if (table.title) {
        doc.setFontSize(FONTS.body)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...COLORS.dark)
        doc.text(table.title, 14, yPos)
        yPos += 5
      }

      autoTable(doc, {
        startY: yPos,
        head: [table.headers],
        body: table.rows,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.primary,
          textColor: COLORS.white,
        },
        styles: { fontSize: FONTS.small },
        margin: { left: 14, right: 14 },
      })

      yPos = (doc as any).lastAutoTable.finalY + 8
    }
  }

  // Alertes / Encadrés conseil
  if (section.alerts && section.alerts.length > 0) {
    for (const alert of section.alerts) {
      const alertColor = alert.typeCode === 'success' ? COLORS.secondary : alert.typeCode === 'warning' ? COLORS.warning : alert.typeCode === 'danger' ? COLORS.danger : COLORS.primary

      if (yPos > 255) break // Éviter dépassement

      // Calculer la hauteur nécessaire
      const alertLines = doc.splitTextToSize(alert.message, pageWidth - 45)
      const alertHeight = Math.max(18, alertLines.length * 5 + 10)

      drawRoundedRect(doc, 14, yPos, pageWidth - 28, alertHeight, 3, COLORS.light)
      doc.setDrawColor(...alertColor)
      doc.setLineWidth(2)
      doc.line(14, yPos, 14, yPos + alertHeight)

      // Titre de l'alerte si présent
      let alertY = yPos + 6
      if (alert.title) {
        doc.setFontSize(FONTS.small)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...alertColor)
        doc.text(alert.title, 20, alertY)
        alertY += 5
      }

      // Message
      doc.setFontSize(FONTS.small)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.dark)
      doc.text(alertLines, 20, alertY)

      yPos += alertHeight + 5
    }
  }

  return yPos
}

// ============================================================
// PAGE CONCLUSION
// ============================================================

function renderConclusion(doc: jsPDF, section: BilanSection, diagnostic: GlobalDiagnostic, pageWidth: number) {
  addHeader(doc, section.title, section.icon, pageWidth)

  let yPos = 40

  // Diagnostic global
  doc.setFontSize(FONTS.heading)
  doc.setFont('helvetica', 'bold')
  doc.text('Diagnostic global', 14, yPos)
  yPos += 8

  // Forces
  doc.setFontSize(FONTS.body)
  doc.setFont('helvetica', 'normal')

  for (const force of diagnostic.forces) {
    doc.setTextColor(...COLORS.secondary)
    doc.text(`[+] ${force}`, 14, yPos)
    yPos += 6
  }

  yPos += 3

  // Vigilances
  for (const vigilance of diagnostic.vigilances) {
    doc.setTextColor(...COLORS.warning)
    doc.text(`[!] ${vigilance}`, 14, yPos)
    yPos += 6
  }

  yPos += 10

  // Recommandations
  doc.setTextColor(...COLORS.dark)
  doc.setFontSize(FONTS.heading)
  doc.setFont('helvetica', 'bold')
  doc.text('Recommandations prioritaires', 14, yPos)
  yPos += 8

  doc.setFontSize(FONTS.body)
  doc.setFont('helvetica', 'normal')

  diagnostic.recommandations.forEach((rec, index) => {
    doc.text(`${index + 1}. ${rec}`, 14, yPos)
    yPos += 6
  })

  yPos += 10

  // Verdict
  const verdictColor = diagnostic.verdict.color === 'green' ? COLORS.secondary : diagnostic.verdict.color === 'orange' ? COLORS.warning : COLORS.danger

  drawRoundedRect(doc, 14, yPos, pageWidth - 28, 30, 4, verdictColor)

  doc.setTextColor(...COLORS.white)
  doc.setFontSize(FONTS.heading)
  doc.setFont('helvetica', 'bold')
  doc.text(`${diagnostic.verdict.icon} ${diagnostic.verdict.label}`, pageWidth / 2, yPos + 12, { align: 'center' })

  doc.setFontSize(FONTS.small)
  doc.setFont('helvetica', 'normal')
  const verdictLines = doc.splitTextToSize(diagnostic.verdict.comment, pageWidth - 40)
  doc.text(verdictLines, pageWidth / 2, yPos + 22, { align: 'center' })

  yPos += 45

  // End of conclusion page
}

// ============================================================
// GÉNÉRATEUR PRINCIPAL
// ============================================================

export function generateBilanPDF(bilan: BilanComplet): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const clientName = `${bilan.client.prenom} ${bilan.client.nom}`
  const totalPages = bilan.sections.length

  bilan.sections.forEach((section, index) => {
    if (index > 0) {
      doc.addPage()
    }

    if (section.id === 'couverture') {
      renderCouverture(doc, section, clientName, bilan.client.email || '')
    } else if (section.id === 'conclusion') {
      renderConclusion(doc, section, bilan.diagnostic, pageWidth)
    } else {
      renderStandardPage(doc, section, pageWidth)
    }

    addFooter(doc, index + 1, totalPages, clientName)
  })

  return doc.output('blob')
}

export function downloadBilanPDF(bilan: BilanComplet, filename?: string): void {
  const blob = generateBilanPDF(bilan)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `bilan-patrimonial-${bilan.client.nom}-${formatDate(new Date()).replace(/ /g, '-')}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
