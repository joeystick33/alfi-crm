 
/**
 * Service d'export des simulations en PDF
 * Génère des rapports PDF professionnels pour les simulations
 */

import type { SimulationType } from '@/app/_common/lib/constants/reference-types'

export interface SimulationExportData {
  simulation: {
    id?: string
    type: SimulationType | string
    name: string
    description?: string
    parameters: Record<string, unknown>
    results: Record<string, unknown>
    recommendations?: unknown
    createdAt?: Date
  }
  client?: {
    firstName: string
    lastName: string
    email?: string
  }
  advisor?: {
    firstName: string
    lastName: string
    cabinet?: string
  }
}

export interface PDFSection {
  title: string
  content: string | string[]
  type: 'text' | 'table' | 'list' | 'chart'
  data?: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toNumberOrZero(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/**
 * Génère le contenu HTML pour le PDF
 */
export function generatePDFContent(data: SimulationExportData): string {
  const { simulation, client, advisor } = data
  const date = simulation.createdAt ? new Date(simulation.createdAt) : new Date()
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  
  const formatPercent = (value: number) => 
    `${(value * 100).toFixed(2)}%`

  const formatDate = (d: Date) => 
    new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(d)

  // Générer les sections selon le type de simulation
  const sections = generateSections(simulation, formatCurrency, formatPercent)

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport de Simulation - ${simulation.name}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 40px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-section h1 {
      color: #2563eb;
      font-size: 24px;
      margin-bottom: 5px;
    }
    .logo-section p {
      color: #64748b;
      font-size: 11px;
    }
    .meta-section {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    .meta-section strong {
      color: #333;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-title {
      background: #f1f5f9;
      color: #1e40af;
      padding: 10px 15px;
      font-size: 14px;
      font-weight: 600;
      border-left: 4px solid #2563eb;
      margin-bottom: 15px;
    }
    .section-content {
      padding: 0 15px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .info-item {
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
    }
    .info-item label {
      display: block;
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .info-item value {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }
    .highlight-box {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .highlight-box h3 {
      font-size: 12px;
      opacity: 0.9;
      margin-bottom: 8px;
    }
    .highlight-box .value {
      font-size: 28px;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #475569;
      font-size: 11px;
      text-transform: uppercase;
    }
    td {
      color: #334155;
    }
    .recommendation {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 10px 0;
      border-radius: 0 6px 6px 0;
    }
    .recommendation-title {
      color: #059669;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 10px 0;
      border-radius: 0 6px 6px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
    }
    .disclaimer {
      background: #f8fafc;
      padding: 15px;
      border-radius: 6px;
      font-size: 10px;
      color: #64748b;
      margin-top: 30px;
    }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <h1>Aura CRM</h1>
      <p>Rapport de Simulation Patrimoniale</p>
    </div>
    <div class="meta-section">
      <p><strong>Date :</strong> ${formatDate(date)}</p>
      <p><strong>Référence :</strong> ${simulation.id || 'Non enregistré'}</p>
      ${client ? `<p><strong>Client :</strong> ${client.firstName} ${client.lastName}</p>` : ''}
      ${advisor ? `<p><strong>Conseiller :</strong> ${advisor.firstName} ${advisor.lastName}</p>` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Informations de la Simulation</div>
    <div class="section-content">
      <div class="info-grid">
        <div class="info-item">
          <label>Type de simulation</label>
          <value>${getSimulationTypeLabel(simulation.type)}</value>
        </div>
        <div class="info-item">
          <label>Nom</label>
          <value>${simulation.name}</value>
        </div>
      </div>
      ${simulation.description ? `<p style="margin-top: 15px; color: #64748b;">${simulation.description}</p>` : ''}
    </div>
  </div>

  ${sections.map(section => `
  <div class="section">
    <div class="section-title">${section.title}</div>
    <div class="section-content">
      ${renderSection(section, formatCurrency, formatPercent)}
    </div>
  </div>
  `).join('')}

  ${simulation.recommendations ? `
  <div class="section">
    <div class="section-title">Recommandations</div>
    <div class="section-content">
      ${Array.isArray(simulation.recommendations) 
        ? (simulation.recommendations as unknown[]).map((rec) => {
            const title = isRecord(rec) ? toStringOrEmpty(rec.title) : ''
            const description = isRecord(rec) ? (toStringOrEmpty(rec.description) || String(rec)) : String(rec)
            return `
          <div class="recommendation">
            <div class="recommendation-title">${title || 'Recommandation'}</div>
            <p>${description}</p>
          </div>
        `
          }).join('')
        : `<div class="recommendation"><p>${simulation.recommendations}</p></div>`
      }
    </div>
  </div>
  ` : ''}

  <div class="disclaimer">
    <strong>Avertissement :</strong> Ce document est fourni à titre informatif uniquement. Les résultats de cette simulation sont basés sur les hypothèses et paramètres fournis. 
    Ils ne constituent pas un conseil en investissement, fiscal ou juridique. Les performances passées ne préjugent pas des performances futures.
    Consultez un professionnel qualifié avant de prendre toute décision financière.
  </div>

  <div class="footer">
    <p>Document généré automatiquement par Aura le ${formatDate(new Date())} à ${new Date().toLocaleTimeString('fr-FR')}</p>
    <p>  ${new Date().getFullYear()} Aura CRM - Tous droits réservés</p>
  </div>
</body>
</html>
  `
}

function getSimulationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'RETRAITE': 'Simulation Retraite',
    'SUCCESSION': 'Simulation Succession',
    'OPTIMISATION_FISCALE': 'Optimisation Fiscale',
    'REAL_ESTATE': 'Investissement Immobilier',
    'ASSURANCE_VIE': 'Assurance-Vie',
    'PER': 'Plan Épargne Retraite',
    'PEA': 'Plan Épargne Actions',
    'CTO': 'Compte-Titres Ordinaire',
    'LMNP': 'LMNP',
    'CAPACITE_EMPRUNT': 'Capacité d\'Emprunt',
    'MENSUALITE': 'Mensualité Crédit',
    'PTZ': 'Prêt à Taux Zéro',
    'EPARGNE': 'Épargne',
    'PREVOYANCE_TNS': 'Prévoyance TNS',
    'AUTRE': 'Autre',
  }
  return labels[type] || type
}

function generateSections(
  simulation: SimulationExportData['simulation'],
  _formatCurrency: (n: number) => string,
  _formatPercent: (n: number) => string
): PDFSection[] {
  const sections: PDFSection[] = []
  const { parameters, results } = simulation

  // Section Paramètres
  if (parameters && Object.keys(parameters).length > 0) {
    sections.push({
      title: 'Paramètres de la Simulation',
      type: 'table',
      content: '',
      data: parameters,
    })
  }

  // Section Résultats principaux
  if (results) {
    sections.push({
      title: 'Résultats Principaux',
      type: 'table',
      content: '',
      data: results,
    })
  }

  return sections
}

function renderSection(section: PDFSection, formatCurrency: (n: number) => string, formatPercent: (n: number) => string): string {
  if (section.type === 'table' && section.data) {
    return renderDataAsTable(section.data, formatCurrency, formatPercent)
  }
  
  if (section.type === 'list' && Array.isArray(section.content)) {
    return `<ul>${section.content.map(item => `<li>${item}</li>`).join('')}</ul>`
  }
  
  return `<p>${section.content}</p>`
}

function renderDataAsTable(data: unknown, formatCurrency: (n: number) => string, formatPercent: (n: number) => string, depth = 0): string {
  if (typeof data !== 'object' || data === null) {
    return formatValue(data, formatCurrency, formatPercent)
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return '<p>Aucune donnée</p>'
    
    // Si c'est un tableau d'objets, créer un vrai tableau HTML
    if (isRecord(data[0])) {
      const headers = Object.keys(data[0])
      return `
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${formatLabel(h)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>${headers.map(h => `<td>${formatValue(isRecord(row) ? row[h] : undefined, formatCurrency, formatPercent)}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      `
    }
    
    return `<ul>${data.map(item => `<li>${formatValue(item, formatCurrency, formatPercent)}</li>`).join('')}</ul>`
  }

  // Object
  if (!isRecord(data)) {
    return formatValue(data, formatCurrency, formatPercent)
  }

  const entries = Object.entries(data)
  if (entries.length === 0) return '<p>Aucune donnée</p>'

  if (depth > 1) {
    // Pour les objets profonds, utiliser une liste
    return `<div class="info-grid">${
      entries.map(([key, value]) => `
        <div class="info-item">
          <label>${formatLabel(key)}</label>
          <value>${typeof value === 'object' ? renderDataAsTable(value, formatCurrency, formatPercent, depth + 1) : formatValue(value, formatCurrency, formatPercent)}</value>
        </div>
      `).join('')
    }</div>`
  }

  return `<div class="info-grid">${
    entries.map(([key, value]) => `
      <div class="info-item">
        <label>${formatLabel(key)}</label>
        <value>${typeof value === 'object' ? renderDataAsTable(value, formatCurrency, formatPercent, depth + 1) : formatValue(value, formatCurrency, formatPercent)}</value>
      </div>
    `).join('')
  }</div>`
}

function _formatLabelLegacy(key: string): string {
  // Convertir camelCase en mots séparés
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
}

function formatValue(value: unknown, formatCurrency: (n: number) => string, formatPercent: (n: number) => string): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (typeof value === 'number') {
    // Détecter si c'est un pourcentage (entre 0 et 1 avec décimales ou explicitement < 1)
    if (value > 0 && value < 1 && value.toString().includes('.')) {
      return formatPercent(value)
    }
    // Détecter si c'est une somme d'argent (grand nombre)
    if (value >= 100) {
      return formatCurrency(value)
    }
    return value.toLocaleString('fr-FR')
  }
  if (value instanceof Date) {
    return new Intl.DateTimeFormat('fr-FR').format(value)
  }
  return String(value)
}

/**
 * Génère un vrai PDF à partir des données de simulation
 * Utilise jsPDF pour générer un PDF natif
 */
export async function generateSimulationPDF(data: SimulationExportData): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const { simulation, client, advisor: _advisor } = data
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  
  const formatDate = (d: Date) => 
    new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(d)

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('RAPPORT DE SIMULATION', pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(simulation.name, pageWidth / 2, 30, { align: 'center' })
  
  doc.setFontSize(10)
  if (client) {
    doc.text(`Client: ${client.firstName} ${client.lastName}`, pageWidth / 2, 38, { align: 'center' })
  }
  doc.text(`Généré le ${formatDate(new Date())}`, pageWidth / 2, 45, { align: 'center' })
  
  let yPos = 60
  
  // Type de simulation
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Type de simulation', 14, yPos)
  doc.setFont('helvetica', 'normal')
  doc.text(getSimulationTypeLabel(simulation.type), 70, yPos)
  yPos += 15
  
  // Paramètres
  if (simulation.parameters && Object.keys(simulation.parameters).length > 0) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Paramètres', 14, yPos)
    yPos += 8
    
    const paramData = Object.entries(simulation.parameters).map(([key, value]) => [
      formatLabel(key),
      formatValueForPDF(value, formatCurrency)
    ])
    
    autoTable(doc, {
      startY: yPos,
      head: [['Paramètre', 'Valeur']],
      body: paramData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    })
    
    const docWithAutoTable = doc as unknown as { lastAutoTable?: { finalY?: number } }
    yPos = (docWithAutoTable.lastAutoTable?.finalY ?? yPos) + 15
  }
  
  // Résultats
  if (simulation.results && Object.keys(simulation.results).length > 0) {
    if (yPos > 220) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Résultats', 14, yPos)
    yPos += 8
    
    // Traiter les résultats (peut être un objet ou un tableau)
    const results = simulation.results as Record<string, unknown>
    
    // Si c'est un tableau (ex: enveloppes fiscales)
    if (results.enveloppes && Array.isArray(results.enveloppes)) {
      const enveloppeData = (results.enveloppes as unknown[]).map((e) => {
        const nom = isRecord(e) ? toStringOrEmpty(e.nom) : ''
        const plafond = isRecord(e) ? toNumberOrZero(e.plafond) : 0
        const utilise = isRecord(e) ? toNumberOrZero(e.utilise) : 0
        const reste = isRecord(e) ? toNumberOrZero(e.reste) : 0
        return [
          nom || '-',
          formatCurrency(plafond),
          formatCurrency(utilise),
          formatCurrency(reste),
        ]
      })
      
      autoTable(doc, {
        startY: yPos,
        head: [['Enveloppe', 'Plafond', 'Utilisé', 'Reste']],
        body: enveloppeData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 14, right: 14 },
      })
      
      const docWithAutoTable = doc as unknown as { lastAutoTable?: { finalY?: number } }
      yPos = (docWithAutoTable.lastAutoTable?.finalY ?? yPos) + 10
    }
    
    // Autres résultats
    const otherResults = Object.entries(results)
      .filter(([key]) => key !== 'enveloppes')
      .map(([key, value]) => [
        formatLabel(key),
        formatValueForPDF(value, formatCurrency)
      ])
    
    if (otherResults.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Indicateur', 'Valeur']],
        body: otherResults,
        theme: 'striped',
        headStyles: { fillColor: [115, 115, 255] },
        margin: { left: 14, right: 14 },
      })
      
      const docWithAutoTable = doc as unknown as { lastAutoTable?: { finalY?: number } }
      yPos = (docWithAutoTable.lastAutoTable?.finalY ?? yPos) + 15
    }
  }
  
  // Recommandations
  if (simulation.recommendations) {
    if (yPos > 220) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Recommandations', 14, yPos)
    yPos += 8
    
    const recs = Array.isArray(simulation.recommendations) 
      ? simulation.recommendations 
      : [simulation.recommendations]
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    for (const rec of recs) {
      const text =
        isRecord(rec) && typeof rec.description === 'string'
          ? rec.description
          : isRecord(rec)
            ? JSON.stringify(rec)
            : String(rec)
      const lines = doc.splitTextToSize(text, pageWidth - 28)
      doc.text(lines, 14, yPos)
      yPos += lines.length * 5 + 5
    }
  }
  
  // Disclaimer
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 100, 100)
  const disclaimer = 'Ce document est fourni à titre informatif uniquement. Les résultats de cette simulation sont basés sur les hypothèses et paramètres fournis. Ils ne constituent pas un conseil en investissement, fiscal ou juridique.'
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 28)
  doc.text(disclaimerLines, 14, yPos)
  
  // Footer sur toutes les pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} / ${pageCount} - Aura CRM - ${formatDate(new Date())}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    )
  }
  
  return doc.output('blob')
}

function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    beneficeAnnuel: 'Bénéfice annuel',
    chargesSociales: 'Charges sociales',
    trancheMarginal: 'TMI (%)',
    cotisationsMadelin: 'Cotisations Madelin',
    cotisationsPER: 'Cotisations PER',
    versementsAV: 'Versements AV',
    montantEmprunt: 'Montant emprunté',
    tauxInteret: 'Taux d\'intérêt',
    duree: 'Durée (mois)',
    mensualite: 'Mensualité',
    coutTotal: 'Coût total',
    economieIR: 'Économie IR',
    tauxOptimisation: 'Taux d\'optimisation (%)',
    enveloppeTotale: 'Enveloppe totale',
    utilise: 'Utilisé',
    reste: 'Reste à utiliser',
  }
  return labels[key] || key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ')
}

function formatValueForPDF(value: unknown, formatCurrency: (n: number) => string): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (typeof value === 'number') {
    if (value >= 100) return formatCurrency(value)
    return value.toLocaleString('fr-FR')
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.length + ' éléments'
    return JSON.stringify(value)
  }
  return String(value)
}

/**
 * Télécharge le rapport en tant que vrai PDF
 */
export async function downloadReportAsPDF(data: SimulationExportData, filename: string): Promise<void> {
  const blob = await generateSimulationPDF(data)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Génère un Blob PDF à partir du HTML (fallback)
 */
export async function generatePDFBlob(htmlContent: string): Promise<Blob> {
  return new Blob([htmlContent], { type: 'text/html' })
}

/**
 * Télécharge le rapport en tant que fichier HTML (legacy)
 */
export function downloadReport(content: string, filename: string, type: 'html' | 'pdf' = 'html') {
  const blob = new Blob([content], { 
    type: type === 'pdf' ? 'application/pdf' : 'text/html' 
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.${type}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
