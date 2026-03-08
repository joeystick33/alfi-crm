// ============================================================
// API Route: POST /api/advisor/simulators/succession-smp/pdf
// Génère un rapport PDF professionnel à partir des données de simulation
// Utilise jsPDF + jspdf-autotable côté serveur
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { logger } from '@/app/_common/lib/logger'
interface ReportDataDTO {
  simulationData: any
  base: any
  clientName: string
  isMarie: boolean
  isPacse: boolean
  isConcubin: boolean
  isCelibataire: boolean
  ddvSelected: boolean
  hasTestament?: boolean
  allCommonChildren?: boolean
  nbEnfants: number
  bestLegal: any
  bestDdv: any
  legalChartData: any[]
  ddvChartData: any[]
  conseillerNom?: string
  conseillerEmail?: string
  conseillerTel?: string
  conseillerSiteWeb?: string
  cabinetNom?: string
  resultatInverse?: any
}

// ── Helpers ──────────────────────────────────────────────────
const fmtEur = (v: number | null | undefined): string => {
  if (v == null || isNaN(v)) return '0 €'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}

const pctFmt = (v: number | null | undefined): string => {
  if (v == null) return '0 %'
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v) + ' %'
}

const USF_SCALE: [number, number][] = [
  [20, 90], [30, 80], [40, 70], [50, 60], [60, 50], [70, 40], [80, 30], [90, 20], [91, 10],
]
const getUsfPct = (age: number) => {
  for (const [maxAge, pct] of USF_SCALE) { if (age <= maxAge) return pct }
  return 10
}

// ── PDF Generation ──────────────────────────────────────────
function generatePDF(d: ReportDataDTO): Uint8Array {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let y = 20

  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > 270) {
      doc.addPage()
      y = 20
    }
  }

  // ── PAGE DE GARDE ──────────────────────────────────────────
  doc.setFillColor(30, 58, 95) // brand.500
  doc.rect(0, 0, pageWidth, 100, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.text('Diagnostic Successoral', pageWidth / 2, 40, { align: 'center' })

  doc.setFontSize(14)
  doc.text('Rapport Professionnel', pageWidth / 2, 55, { align: 'center' })

  doc.setFontSize(12)
  const clientName = d.clientName || d.simulationData?.identite?.prenom || 'Client'
  doc.text(`Établi pour : ${clientName}`, pageWidth / 2, 75, { align: 'center' })
  doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 85, { align: 'center' })

  // Informations conseiller
  doc.setTextColor(0, 0, 0)
  y = 120
  if (d.conseillerNom || d.cabinetNom) {
    doc.setFontSize(11)
    if (d.cabinetNom) { doc.text(`Cabinet : ${d.cabinetNom}`, margin, y); y += 7 }
    if (d.conseillerNom) { doc.text(`Conseiller : ${d.conseillerNom}`, margin, y); y += 7 }
    if (d.conseillerEmail) { doc.text(`Email : ${d.conseillerEmail}`, margin, y); y += 7 }
    if (d.conseillerTel) { doc.text(`Tél : ${d.conseillerTel}`, margin, y); y += 7 }
    if (d.conseillerSiteWeb) { doc.text(`Web : ${d.conseillerSiteWeb}`, margin, y); y += 7 }
  }

  // Situation familiale
  y += 10
  doc.setFontSize(10)
  const statut = d.isMarie ? 'Marié(e)' : d.isPacse ? 'Pacsé(e)' : d.isConcubin ? 'Concubin(e)' : 'Célibataire'
  doc.text(`Situation : ${statut}`, margin, y); y += 6
  doc.text(`Enfants : ${d.nbEnfants}`, margin, y); y += 6
  if (d.ddvSelected) { doc.text('Donation au dernier vivant : Oui', margin, y); y += 6 }
  if (d.hasTestament) { doc.text('Testament : Oui', margin, y); y += 6 }

  // ── PAGE 2 : SYNTHÈSE FINANCIÈRE ──────────────────────────
  doc.addPage()
  y = 20

  doc.setFillColor(30, 58, 95)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.rect(margin, y - 5, contentWidth, 10, 'F')
  doc.text('1. Synthèse financière', margin + 3, y + 2)
  y += 15
  doc.setTextColor(0, 0, 0)

  const base = d.base || {}
  const sc1 = base.scenario1 || base
  const patrimoine = base.patrimoine || {}
  const patrimoineNet = patrimoine.actifNet ?? sc1.netAsset ?? sc1.actifNet ?? 0
  const masseSuccessorale = sc1.fiscalInheritanceAsset ?? sc1.masseSuccessorale ?? sc1.grossAsset ?? patrimoineNet
  const droitsTotal = sc1.totalRights ?? sc1.droitsNets ?? 0
  const fraisNotaire = base.scenarioMeta?.notaryFees ?? Math.round(masseSuccessorale * 0.02)
  const netTransmis = Math.max(0, masseSuccessorale - droitsTotal - fraisNotaire)

  const kpis = [
    ['Patrimoine net global', fmtEur(patrimoineNet)],
    ['Masse successorale', fmtEur(masseSuccessorale)],
    ['Droits de succession estimés', fmtEur(droitsTotal)],
    ['Frais de notaire estimés', fmtEur(fraisNotaire)],
    ['Net transmis aux héritiers', fmtEur(netTransmis)],
    ['Taux effectif d\'imposition', pctFmt(masseSuccessorale > 0 ? droitsTotal / masseSuccessorale * 100 : 0)],
  ]

  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Montant']],
    body: kpis,
    margin: { left: margin, right: margin },
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  })
  y = (doc as any).lastAutoTable.finalY + 10

  // ── HÉRITIERS 1er DÉCÈS ────────────────────────────────────
  addNewPageIfNeeded(40)
  doc.setFillColor(30, 58, 95)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.rect(margin, y - 5, contentWidth, 10, 'F')
  doc.text('2. Répartition entre héritiers — 1er décès', margin + 3, y + 2)
  y += 15
  doc.setTextColor(0, 0, 0)

  const heirs = sc1.heirs || sc1.heritiers || []
  if (heirs.length > 0) {
    const heirRows = heirs.map((h: any) => {
      const name = h.name || h.nom || '—'
      const relation = h.relationship || h.lien || '—'
      const quota = pctFmt(h.quotaPercentage ?? h.quotaPct ?? 0)
      const received = fmtEur(h.grossValueReceived ?? h.montantBrut ?? 0)
      const rights = fmtEur(h.rights ?? h.droits ?? 0)
      return [name, relation, quota, received, rights]
    })

    autoTable(doc, {
      startY: y,
      head: [['Héritier', 'Lien', 'Quote-part', 'Montant brut', 'Droits']],
      body: heirRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── 2nd DÉCÈS (si marié/pacsé) ────────────────────────────
  const sc2 = base.scenario2 || base.secondDeathResult
  if (sc2 && (d.isMarie || (d.isPacse && d.hasTestament))) {
    addNewPageIfNeeded(40)
    doc.setFillColor(30, 58, 95)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.rect(margin, y - 5, contentWidth, 10, 'F')
    doc.text('3. Répartition — 2nd décès (conjoint survivant)', margin + 3, y + 2)
    y += 15
    doc.setTextColor(0, 0, 0)

    const heirs2 = sc2.heirs || sc2.heritiers || []
    if (heirs2.length > 0) {
      const heirRows2 = heirs2.map((h: any) => [
        h.name || h.nom || '—',
        pctFmt(h.quotaPercentage ?? h.quotaPct ?? 0),
        fmtEur(h.grossValueReceived ?? h.montantBrut ?? 0),
        fmtEur(h.rights ?? h.droits ?? 0),
      ])
      autoTable(doc, {
        startY: y,
        head: [['Héritier', 'Quote-part', 'Montant brut', 'Droits']],
        body: heirRows2,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      })
      y = (doc as any).lastAutoTable.finalY + 10

      // Cumul double décès
      const droits2 = sc2.totalRights ?? sc2.droitsNets ?? 0
      const cumulDroits = droitsTotal + droits2
      addNewPageIfNeeded(20)
      doc.setFontSize(11)
      doc.setFont(undefined as any, 'bold')
      doc.text(`Cumul droits (1er + 2nd décès) : ${fmtEur(cumulDroits)}`, margin, y)
      doc.setFont(undefined as any, 'normal')
      y += 10
    }
  }

  // ── SCÉNARIOS LÉGAUX (DDV) ─────────────────────────────────
  const legalScenarios = base.scenariosLegaux || d.legalChartData || []
  if (legalScenarios.length > 0) {
    addNewPageIfNeeded(40)
    doc.setFillColor(30, 58, 95)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.rect(margin, y - 5, contentWidth, 10, 'F')
    doc.text('4. Comparatif des options successorales', margin + 3, y + 2)
    y += 15
    doc.setTextColor(0, 0, 0)

    const scRows = legalScenarios.map((s: any) => [
      s.name || s.label || s.option || '—',
      fmtEur(s.droits ?? s.totalRights ?? 0),
      fmtEur(s.netTransmis ?? 0),
    ])
    autoTable(doc, {
      startY: y,
      head: [['Option', 'Droits estimés', 'Net transmis']],
      body: scRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  // ── RECOMMANDATIONS ────────────────────────────────────────
  addNewPageIfNeeded(30)
  doc.setFillColor(30, 58, 95)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.rect(margin, y - 5, contentWidth, 10, 'F')
  doc.text('5. Recommandations', margin + 3, y + 2)
  y += 15
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)

  const recommandations: string[] = []
  if (d.isMarie && !d.ddvSelected) {
    recommandations.push('Priorité : Mettre en place une Donation au Dernier Vivant (DDV) pour protéger le conjoint survivant.')
  }
  if (d.nbEnfants > 0) {
    recommandations.push('Étudier la faisabilité de donations anticipées aux enfants pour bénéficier des abattements renouvelables tous les 15 ans.')
  }
  recommandations.push('Optimiser les contrats d\'assurance-vie (clause bénéficiaire, versements avant/après 70 ans).')
  recommandations.push('Prenez rendez-vous avec votre notaire pour valider les préconisations.')
  recommandations.push('Revoir ce diagnostic dans 2 à 3 ans ou en cas de changement de situation.')

  for (const r of recommandations) {
    addNewPageIfNeeded(10)
    doc.text(`• ${r}`, margin, y, { maxWidth: contentWidth })
    const lines = doc.splitTextToSize(`• ${r}`, contentWidth)
    y += lines.length * 5 + 3
  }

  // ── AVERTISSEMENT ──────────────────────────────────────────
  addNewPageIfNeeded(30)
  y += 10
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  const disclaimer = `Avertissement : Ce document a un caractère informatif et pédagogique. Il est établi sur la base des informations déclarées et de la législation fiscale en vigueur au ${new Date().toLocaleDateString('fr-FR')}. Il ne constitue ni un acte juridique, ni un conseil fiscal personnalisé, ni une recommandation d'investissement. Les montants indiqués sont des estimations. Consultez votre notaire ou conseiller en gestion de patrimoine pour toute mise en œuvre.`
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth)
  doc.text(disclaimerLines, margin, y)

  // ── PIED DE PAGE ──────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    const footer = `${d.cabinetNom || 'Cabinet'} — ${d.conseillerNom || ''} — Page ${i}/${pageCount}`
    doc.text(footer, pageWidth / 2, 290, { align: 'center' })
  }

  // Return as Uint8Array (compatible with NextResponse)
  const ab = doc.output('arraybuffer')
  return new Uint8Array(ab)
}

// ── POST handler ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body: ReportDataDTO = await request.json()

    if (!body.clientName && !body.simulationData) {
      return NextResponse.json(
        { error: 'Données de simulation manquantes' },
        { status: 400 }
      )
    }

    const pdfBytes = generatePDF(body)

    const clientSlug = (body.clientName || 'client').replace(/\s+/g, '-')
    const dateStr = new Date().toISOString().split('T')[0]

    return new NextResponse(pdfBytes as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="diagnostic-successoral-${clientSlug}-${dateStr}.pdf"`,
        'Content-Length': String(pdfBytes.byteLength),
      },
    })
  } catch (error) {
    logger.error('[PDF] Erreur génération:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF', details: String(error) },
      { status: 500 }
    )
  }
}
