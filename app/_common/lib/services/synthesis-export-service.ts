/**
 * Service d'export PDF de la Synthèse Client
 * Génère un rapport PDF professionnel avec toutes les données de synthèse
 */

import type { ClientSynthesis, PatrimoineSummary, BudgetSummary, ObjectifSummary, ProjetSummary, AlerteSynthese, IndicateurCle } from './synthesis-service'

export interface SynthesisExportOptions {
  includeLogo?: boolean
  includeDisclaimer?: boolean
  cabinetName?: string
  advisorName?: string
  advisorEmail?: string
  exportDate?: Date
}

// Formatters
const formatCurrency = (value: number): string => 
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)

const formatPercent = (value: number): string => `${Math.round(value * 10) / 10}%`

const formatDate = (date: Date | string | null): string => {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Génère le contenu HTML complet pour l'export PDF de la synthèse
 */
export function generateSynthesisPDFContent(
  synthesis: ClientSynthesis,
  options: SynthesisExportOptions = {}
): string {
  const {
    includeLogo = true,
    includeDisclaimer = true,
    cabinetName = 'Cabinet',
    advisorName,
    exportDate = new Date(),
  } = options

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Synthèse Client - ${synthesis.clientName}</title>
  <style>${getStyles()}</style>
</head>
<body>
  ${renderHeader(synthesis, cabinetName, includeLogo, exportDate)}
  ${renderClientInfo(synthesis)}
  ${synthesis.alertes.length > 0 ? renderAlertes(synthesis.alertes) : ''}
  ${renderPatrimoine(synthesis.patrimoine)}
  ${renderBudget(synthesis.budget)}
  ${renderIndicateurs(synthesis.indicateurs)}
  <div class="page-break"></div>
  ${renderObjectifs(synthesis.objectifs)}
  ${renderProjets(synthesis.projets)}
  ${renderMetadata(synthesis)}
  ${includeDisclaimer ? renderDisclaimer() : ''}
  ${renderFooter(cabinetName, advisorName)}
</body>
</html>`
}

function getStyles(): string {
  return `
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',sans-serif;font-size:11px;line-height:1.5;color:#1f2937;background:#fff;padding:30px 40px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #2563eb;padding-bottom:20px;margin-bottom:25px}
    .header-left h1{color:#2563eb;font-size:22px;font-weight:700;margin-bottom:4px}
    .header-left .subtitle{color:#6b7280;font-size:11px}
    .header-right{text-align:right;font-size:10px;color:#6b7280}
    .header-right strong{color:#1f2937}
    .client-info{background:#f8fafc;border-radius:8px;padding:15px 20px;margin-bottom:25px}
    .client-name{font-size:18px;font-weight:700;color:#1f2937;margin-bottom:5px}
    .client-meta{display:flex;gap:20px;font-size:10px;color:#6b7280}
    .section{margin-bottom:25px;page-break-inside:avoid}
    .section-title{background:#f1f5f9;color:#1e40af;padding:10px 15px;font-size:13px;font-weight:600;border-left:4px solid #2563eb;margin-bottom:15px;border-radius:0 6px 6px 0}
    .section-content{padding:0 10px}
    .grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:15px}
    .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}
    .grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
    .metric-card{background:#f8fafc;border-radius:8px;padding:15px;text-align:center}
    .metric-card.highlight{background:#2563eb;color:white}
    .metric-card.positive{background:#ecfdf5}
    .metric-card.negative{background:#fef2f2}
    .metric-card.warning{background:#fffbeb}
    .metric-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px}
    .metric-card.highlight .metric-label{color:rgba(255,255,255,0.85)}
    .metric-card.positive .metric-label{color:#059669}
    .metric-card.negative .metric-label{color:#dc2626}
    .metric-value{font-size:18px;font-weight:700;color:#1f2937}
    .metric-card.highlight .metric-value{color:white}
    .metric-card.positive .metric-value{color:#059669}
    .metric-card.negative .metric-value{color:#dc2626}
    .metric-card.warning .metric-value{color:#d97706}
    .metric-sub{font-size:9px;color:#9ca3af;margin-top:4px}
    .alerte{display:flex;align-items:flex-start;gap:12px;padding:12px 15px;border-radius:8px;margin-bottom:10px}
    .alerte.critical{background:#fef2f2;border-left:4px solid #dc2626}
    .alerte.warning{background:#fffbeb;border-left:4px solid #f59e0b}
    .alerte.info{background:#eff6ff;border-left:4px solid #3b82f6}
    .alerte-message{font-weight:600;font-size:11px;margin-bottom:3px}
    .alerte.critical .alerte-message{color:#dc2626}
    .alerte.warning .alerte-message{color:#d97706}
    .alerte.info .alerte-message{color:#2563eb}
    .alerte-recommendation{font-size:10px;color:#6b7280}
    .alerte-badge{font-size:9px;padding:2px 8px;border-radius:10px;background:rgba(0,0,0,0.05);color:#6b7280}
    .progress-bar{height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;margin-top:4px}
    .progress-fill{height:100%;border-radius:4px}
    .progress-fill.immo{background:#2563eb}
    .progress-fill.fin{background:#16a34a}
    .progress-fill.pro{background:#9333ea}
    .progress-fill.autre{background:#6b7280}
    table{width:100%;border-collapse:collapse;margin:10px 0}
    th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #e5e7eb}
    th{background:#f8fafc;font-weight:600;font-size:10px;text-transform:uppercase;color:#6b7280}
    td{font-size:11px;color:#374151}
    .badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:9px;font-weight:600}
    .badge.completed{background:#dcfce7;color:#166534}
    .badge.on-track{background:#dbeafe;color:#1e40af}
    .badge.at-risk{background:#fef3c7;color:#92400e}
    .badge.overdue{background:#fee2e2;color:#991b1b}
    .badge.draft{background:#f3f4f6;color:#6b7280}
    .indicateur{background:#f8fafc;border-radius:8px;padding:12px;border:1px solid #e5e7eb}
    .indicateur.good{border-left:3px solid #16a34a}
    .indicateur.warning{border-left:3px solid #f59e0b}
    .indicateur.critical{border-left:3px solid #dc2626}
    .indicateur.neutral{border-left:3px solid #6b7280}
    .indicateur.premium{background:#f9fafb;border:1px dashed #d1d5db}
    .indicateur-name{font-size:10px;color:#6b7280;margin-bottom:4px}
    .indicateur-value{font-size:14px;font-weight:700;color:#1f2937}
    .indicateur.good .indicateur-value{color:#16a34a}
    .indicateur.premium .indicateur-value{color:#9ca3af}
    .indicateur-desc{font-size:9px;color:#9ca3af;margin-top:4px}
    .disclaimer{background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:15px 20px;margin-top:30px;font-size:9px;color:#6b7280}
    .footer{margin-top:30px;padding-top:20px;border-top:2px solid #e5e7eb;display:flex;justify-content:space-between;font-size:9px;color:#9ca3af}
    .page-break{page-break-before:always;margin-top:20px}
    @media print{body{padding:15px 25px}.page-break{page-break-before:always}.section{page-break-inside:avoid}}
  `
}

function renderHeader(synthesis: ClientSynthesis, cabinetName: string, includeLogo: boolean, exportDate: Date): string {
  return `<div class="header">
    <div class="header-left">
      ${includeLogo ? `<h1>${cabinetName}</h1>` : ''}
      <p class="subtitle">Synthèse Patrimoniale Client</p>
    </div>
    <div class="header-right">
      <p><strong>Date d'export :</strong> ${formatDate(exportDate)}</p>
      <p><strong>Mise à jour :</strong> ${formatDate(synthesis.calculatedAt)}</p>
      <p><strong>Réf :</strong> SYN-${synthesis.clientId.substring(0, 8).toUpperCase()}</p>
    </div>
  </div>`
}

function renderClientInfo(synthesis: ClientSynthesis): string {
  return `<div class="client-info">
    <div class="client-name">${synthesis.clientName}</div>
    <div class="client-meta">
      <span>ID: ${synthesis.clientId}</span>
      <span>•</span>
      <span>Complétude: ${synthesis.dataCompleteness}%</span>
    </div>
  </div>`
}

function renderAlertes(alertes: AlerteSynthese[]): string {
  const getClass = (type: string) => type === 'CRITIQUE' ? 'critical' : type === 'WARNING' ? 'warning' : 'info'
  const getIcon = (type: string) => type === 'CRITIQUE' ? '⚠️' : type === 'WARNING' ? '⚡' : 'ℹ️'
  
  return `<div class="section">
    <div class="section-title">⚠️ Points d'Attention</div>
    <div class="section-content">
      ${alertes.map(a => `<div class="alerte ${getClass(a.type)}">
        <span>${getIcon(a.type)}</span>
        <div style="flex:1">
          <div class="alerte-message">${a.message}</div>
          <div class="alerte-recommendation">${a.recommendation}</div>
        </div>
        <span class="alerte-badge">${a.category}</span>
      </div>`).join('')}
    </div>
  </div>`
}

function renderPatrimoine(p: PatrimoineSummary): string {
  const cats = [
    { key: 'immobilier', label: 'Immobilier', cls: 'immo' },
    { key: 'financier', label: 'Financier', cls: 'fin' },
    { key: 'professionnel', label: 'Professionnel', cls: 'pro' },
    { key: 'autre', label: 'Autre', cls: 'autre' },
  ]
  
  return `<div class="section">
    <div class="section-title">🏦 Patrimoine</div>
    <div class="section-content">
      <div class="grid-3">
        <div class="metric-card"><div class="metric-label">Patrimoine Brut</div><div class="metric-value">${formatCurrency(p.patrimoineBrut)}</div></div>
        <div class="metric-card negative"><div class="metric-label">Passifs</div><div class="metric-value">- ${formatCurrency(p.totalPassifs)}</div></div>
        <div class="metric-card highlight"><div class="metric-label">Patrimoine Net</div><div class="metric-value">${formatCurrency(p.patrimoineNet)}</div></div>
      </div>
      <div style="margin-top:20px">
        <h4 style="font-size:11px;color:#6b7280;margin-bottom:12px">Répartition</h4>
        ${cats.map(c => {
          const val = p.repartition[c.key as keyof typeof p.repartition]
          const pct = p.repartitionPourcentage[c.key as keyof typeof p.repartitionPourcentage]
          if (val === 0) return ''
          return `<div style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:4px">
              <span>${c.label}</span><span>${formatCurrency(val)} (${formatPercent(pct)})</span>
            </div>
            <div class="progress-bar"><div class="progress-fill ${c.cls}" style="width:${pct}%"></div></div>
          </div>`
        }).join('')}
      </div>
      <div style="margin-top:15px;padding-top:15px;border-top:1px solid #e5e7eb">
        <div class="grid-2">
          <div class="metric-card" style="padding:10px"><div class="metric-label">Actifs gérés</div><div class="metric-value" style="font-size:14px">${formatCurrency(p.actifsGeres)}</div><div class="metric-sub">Taux: ${formatPercent(p.tauxGestion)}</div></div>
          <div class="metric-card" style="padding:10px"><div class="metric-label">Non gérés</div><div class="metric-value" style="font-size:14px">${formatCurrency(p.actifsNonGeres)}</div></div>
        </div>
      </div>
    </div>
  </div>`
}

function renderBudget(b: BudgetSummary): string {
  const endCls = b.tauxEndettement > 35 ? 'negative' : b.tauxEndettement > 30 ? 'warning' : ''
  const epCls = b.tauxEpargne < 10 ? 'warning' : 'positive'
  
  return `<div class="section">
    <div class="section-title">💰 Budget Mensuel</div>
    <div class="section-content">
      <div class="grid-4">
        <div class="metric-card positive"><div class="metric-label">Revenus</div><div class="metric-value">${formatCurrency(b.revenusMensuels)}</div><div class="metric-sub">${formatCurrency(b.revenusAnnuels)}/an</div></div>
        <div class="metric-card negative"><div class="metric-label">Charges</div><div class="metric-value">${formatCurrency(b.chargesMensuelles)}</div><div class="metric-sub">crédits: ${formatCurrency(b.mensualitesCredits)}</div></div>
        <div class="metric-card ${epCls}"><div class="metric-label">Épargne</div><div class="metric-value">${formatCurrency(b.capaciteEpargneMensuelle)}</div><div class="metric-sub">Taux: ${formatPercent(b.tauxEpargne)}</div></div>
        <div class="metric-card ${endCls}"><div class="metric-label">Endettement</div><div class="metric-value">${formatPercent(b.tauxEndettement)}</div><div class="metric-sub">RAV: ${formatCurrency(b.resteAVivre)}</div></div>
      </div>
    </div>
  </div>`
}

function renderIndicateurs(indicateurs: IndicateurCle[]): string {
  const getCls = (i: IndicateurCle) => i.isPremium ? 'premium' : i.status.toLowerCase()
  const getVal = (i: IndicateurCle) => {
    if (i.isPremium) return '🔒 Premium'
    if (typeof i.value === 'number') return i.unit === '€' ? formatCurrency(i.value) : `${Math.round(i.value * 10) / 10}${i.unit || ''}`
    return String(i.value)
  }
  
  return `<div class="section">
    <div class="section-title">📊 Indicateurs Clés</div>
    <div class="section-content">
      <div class="grid-3">
        ${indicateurs.map(i => `<div class="indicateur ${getCls(i)}">
          <div class="indicateur-name">${i.name}</div>
          <div class="indicateur-value">${getVal(i)}</div>
          ${i.description ? `<div class="indicateur-desc">${i.description}</div>` : ''}
        </div>`).join('')}
      </div>
    </div>
  </div>`
}

function renderObjectifs(objectifs: ObjectifSummary[]): string {
  if (objectifs.length === 0) return `<div class="section"><div class="section-title">🎯 Objectifs</div><div class="section-content"><p style="color:#9ca3af;text-align:center;padding:20px">Aucun objectif défini</p></div></div>`
  
  const getBadge = (s: string) => {
    const map: Record<string, { l: string; c: string }> = { 'TERMINE': { l: 'Atteint', c: 'completed' }, 'ON_TRACK': { l: 'En bonne voie', c: 'on-track' }, 'AT_RISK': { l: 'À surveiller', c: 'at-risk' }, 'EN_RETARD': { l: 'En retard', c: 'overdue' } }
    return map[s] || { l: s, c: 'draft' }
  }
  
  return `<div class="section">
    <div class="section-title">🎯 Objectifs</div>
    <div class="section-content">
      <table><thead><tr><th>Objectif</th><th>Type</th><th>Progression</th><th>Montant</th><th>Échéance</th><th>Statut</th></tr></thead>
      <tbody>${objectifs.map(o => {
        const b = getBadge(o.status)
        return `<tr><td><strong>${o.name}</strong></td><td>${o.type}</td><td>${formatPercent(o.progress)}</td><td>${formatCurrency(o.currentAmount)} / ${formatCurrency(o.targetAmount)}</td><td>${formatDate(o.targetDate)}</td><td><span class="badge ${b.c}">${b.l}</span></td></tr>`
      }).join('')}</tbody></table>
    </div>
  </div>`
}

function renderProjets(projets: ProjetSummary[]): string {
  if (projets.length === 0) return `<div class="section"><div class="section-title">📁 Projets</div><div class="section-content"><p style="color:#9ca3af;text-align:center;padding:20px">Aucun projet en cours</p></div></div>`
  
  return `<div class="section">
    <div class="section-title">📁 Projets</div>
    <div class="section-content">
      <table><thead><tr><th>Projet</th><th>Type</th><th>Budget</th><th>Début</th><th>Fin</th><th>Statut</th></tr></thead>
      <tbody>${projets.map(p => `<tr><td><strong>${p.name}</strong></td><td>${p.type}</td><td>${formatCurrency(p.budget)}</td><td>${formatDate(p.startDate)}</td><td>${formatDate(p.endDate)}</td><td><span class="badge draft">${p.status}</span></td></tr>`).join('')}</tbody></table>
    </div>
  </div>`
}

function renderMetadata(synthesis: ClientSynthesis): string {
  return `<div style="background:#f8fafc;border-radius:8px;padding:15px 20px;margin-top:20px">
    <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:10px">Métadonnées</div>
    <div class="grid-4">
      <div><div style="font-size:9px;color:#9ca3af;text-transform:uppercase">Calculé le</div><div style="font-size:11px">${formatDate(synthesis.calculatedAt)}</div></div>
      <div><div style="font-size:9px;color:#9ca3af;text-transform:uppercase">Patrimoine MAJ</div><div style="font-size:11px">${formatDate(synthesis.lastPatrimoineUpdate)}</div></div>
      <div><div style="font-size:9px;color:#9ca3af;text-transform:uppercase">Budget MAJ</div><div style="font-size:11px">${formatDate(synthesis.lastBudgetUpdate)}</div></div>
      <div><div style="font-size:9px;color:#9ca3af;text-transform:uppercase">Complétude</div><div style="font-size:11px">${synthesis.dataCompleteness}%</div></div>
    </div>
  </div>`
}

function renderDisclaimer(): string {
  return `<div class="disclaimer">
    <strong>Avertissement :</strong> Ce document est fourni à titre informatif uniquement. Les résultats sont basés sur les données disponibles à la date d'export. 
    Ils ne constituent pas un conseil en investissement, fiscal ou juridique. Consultez un professionnel qualifié avant toute décision financière.
  </div>`
}

function renderFooter(cabinetName: string, advisorName?: string): string {
  return `<div class="footer">
    <div>
      <p>Document généré par ${cabinetName}</p>
      ${advisorName ? `<p>Conseiller: ${advisorName}</p>` : ''}
    </div>
    <div style="text-align:right">
      <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
      <p>© ${new Date().getFullYear()} Aura CRM</p>
    </div>
  </div>`
}

/**
 * Télécharge le rapport HTML (utilisable côté client)
 */
export function downloadSynthesisReport(htmlContent: string, clientName: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `synthese_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Ouvre le rapport dans une nouvelle fenêtre pour impression PDF
 */
export function openSynthesisReportForPrint(htmlContent: string): void {
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }
}
