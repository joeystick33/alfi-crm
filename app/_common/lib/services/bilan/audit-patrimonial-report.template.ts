/**
 * Template HTML Premium pour le Rapport d'Audit Patrimonial
 * Génère un document PDF de qualité professionnelle CGP
 */

import type { RapportAuditPatrimonial, SectionRapport, ScoreDetaille } from './audit-patrimonial-report.types'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#22c55e'
  if (score >= 40) return '#f59e0b'
  if (score >= 20) return '#f97316'
  return '#ef4444'
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'success': return '#10b981'
    case 'warning': return '#f59e0b'
    case 'danger': return '#ef4444'
    default: return '#6b7280'
  }
}

function generateScoreGauge(score: ScoreDetaille, size: number = 120): string {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score.valeur / 100) * circumference
  const color = getScoreColor(score.valeur)

  return `
    <div class="score-gauge" style="width: ${size}px; height: ${size}px; position: relative;">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle
          cx="${size / 2}"
          cy="${size / 2}"
          r="${radius}"
          fill="none"
          stroke="#e5e7eb"
          stroke-width="${strokeWidth}"
        />
        <circle
          cx="${size / 2}"
          cy="${size / 2}"
          r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="${strokeWidth}"
          stroke-linecap="round"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${circumference - progress}"
          transform="rotate(-90 ${size / 2} ${size / 2})"
        />
      </svg>
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
        <div style="font-size: 24px; font-weight: 700; color: ${color};">${score.valeur}</div>
        <div style="font-size: 10px; color: #6b7280;">/100</div>
      </div>
    </div>
  `
}

function generateRadarChart(donnees: { label: string; valeur: number }[]): string {
  const size = 300
  const center = size / 2
  const maxRadius = 120
  const points = donnees.length
  const angleStep = (2 * Math.PI) / points

  // Générer les points du polygone des données
  const dataPoints = donnees.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2
    const radius = (d.valeur / 100) * maxRadius
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    }
  })

  // Générer les grilles
  const grids = [20, 40, 60, 80, 100].map(level => {
    const r = (level / 100) * maxRadius
    const gridPoints = donnees.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
    })
    return `<polygon points="${gridPoints.join(' ')}" fill="none" stroke="#e5e7eb" stroke-width="1"/>`
  }).join('')

  // Générer les axes
  const axes = donnees.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2
    return `<line x1="${center}" y1="${center}" x2="${center + maxRadius * Math.cos(angle)}" y2="${center + maxRadius * Math.sin(angle)}" stroke="#e5e7eb" stroke-width="1"/>`
  }).join('')

  // Générer les labels
  const labels = donnees.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2
    const labelRadius = maxRadius + 25
    const x = center + labelRadius * Math.cos(angle)
    const y = center + labelRadius * Math.sin(angle)
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="#374151">${d.label}</text>`
  }).join('')

  // Polygone des données
  const dataPolygon = `<polygon points="${dataPoints.map(p => `${p.x},${p.y}`).join(' ')}" fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" stroke-width="2"/>`

  // Points
  const dataCircles = dataPoints.map(p => 
    `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#6366f1"/>`
  ).join('')

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${grids}
      ${axes}
      ${dataPolygon}
      ${dataCircles}
      ${labels}
    </svg>
  `
}

function generateSection(section: SectionRapport): string {
  return `
    <div class="section" style="page-break-inside: avoid; margin-bottom: 40px;">
      <div class="section-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #6366f1;">
        <span style="font-size: 28px;">${section.icone}</span>
        <div>
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #1f2937;">${section.numero}. ${section.titre}</h2>
          ${section.sousTitre ? `<p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">${section.sousTitre}</p>` : ''}
        </div>
      </div>

      ${section.indicateursClés?.length ? `
        <div class="kpis" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px;">
          ${section.indicateursClés.map(kpi => `
            <div class="kpi-card" style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 8px; padding: 14px; border-left: 3px solid ${getStatusColor(kpi.statut)};">
              <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">${kpi.label}</div>
              <div style="font-size: 18px; font-weight: 700; color: #1f2937; margin-top: 4px;">${kpi.valeur}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="section-content">
        ${section.contenu.map(p => `
          <div class="paragraph" style="margin-bottom: 16px; ${p.style === 'encadre' ? 'background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px;' : ''} ${p.style === 'important' ? 'background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px;' : ''}">
            ${p.titre ? `<h3 style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #374151;">${p.titre}</h3>` : ''}
            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #4b5563; white-space: pre-line;">${p.contenu}</p>
          </div>
        `).join('')}
      </div>

      ${section.tableaux?.length ? section.tableaux.map(table => `
        <div class="table-container" style="margin: 20px 0;">
          ${table.titre ? `<h4 style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #374151;">${table.titre}</h4>` : ''}
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f3f4f6;">
                ${table.entetes.map(h => `<th style="padding: 10px 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${table.lignes.map((row, i) => `
                <tr style="${i % 2 === 1 ? 'background: #f9fafb;' : ''}">
                  ${row.map(cell => `<td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
            ${table.totaux ? `
              <tfoot>
                <tr style="background: #f3f4f6; font-weight: 600;">
                  ${table.totaux.map(t => `<td style="padding: 10px 12px; border-top: 2px solid #e5e7eb; color: #1f2937;">${t}</td>`).join('')}
                </tr>
              </tfoot>
            ` : ''}
          </table>
        </div>
      `).join('') : ''}

      ${section.alertes?.length ? section.alertes.map(alerte => `
        <div class="alert" style="margin: 16px 0; padding: 14px 16px; border-radius: 8px; display: flex; gap: 12px; align-items: flex-start; ${
          alerte.type === 'success' ? 'background: #ecfdf5; border: 1px solid #10b981;' :
          alerte.type === 'warning' ? 'background: #fffbeb; border: 1px solid #f59e0b;' :
          alerte.type === 'danger' ? 'background: #fef2f2; border: 1px solid #ef4444;' :
          'background: #eff6ff; border: 1px solid #3b82f6;'
        }">
          <span style="font-size: 18px;">${
            alerte.type === 'success' ? '✅' :
            alerte.type === 'warning' ? '⚠️' :
            alerte.type === 'danger' ? '🚨' : 'ℹ️'
          }</span>
          <div>
            <div style="font-weight: 600; font-size: 13px; color: #1f2937;">${alerte.titre}</div>
            <div style="font-size: 12px; color: #4b5563; margin-top: 4px;">${alerte.message}</div>
            ${alerte.action ? `<div style="font-size: 11px; color: #6366f1; margin-top: 8px; font-weight: 500;">→ ${alerte.action}</div>` : ''}
          </div>
        </div>
      `).join('') : ''}

      ${section.recommandations?.length ? `
        <div class="recommandations" style="margin-top: 20px;">
          <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151;">Recommandations</h4>
          ${section.recommandations.map(r => `
            <div class="reco-card" style="background: #f9fafb; border-radius: 8px; padding: 14px; margin-bottom: 10px; border-left: 3px solid ${r.impact === 'FORT' ? '#ef4444' : r.impact === 'MOYEN' ? '#f59e0b' : '#10b981'};">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; font-size: 13px; color: #1f2937;">${r.numero}. ${r.titre}</span>
                <span style="font-size: 10px; padding: 2px 8px; border-radius: 12px; background: ${r.impact === 'FORT' ? '#fef2f2' : r.impact === 'MOYEN' ? '#fffbeb' : '#ecfdf5'}; color: ${r.impact === 'FORT' ? '#ef4444' : r.impact === 'MOYEN' ? '#f59e0b' : '#10b981'}; font-weight: 500;">Impact ${r.impact}</span>
              </div>
              <p style="margin: 8px 0 0; font-size: 12px; color: #4b5563;">${r.description}</p>
              ${r.economieEstimee ? `<div style="margin-top: 8px; font-size: 11px; color: #10b981; font-weight: 500;">💰 Économie estimée : ${formatCurrency(r.economieEstimee)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `
}

export function generateAuditReportTemplate(rapport: RapportAuditPatrimonial): string {
  const { client, cabinet, scores, syntheseExecutive, sections } = rapport

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'Audit Patrimonial - ${client.prenom} ${client.nom}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1f2937;
      background: #fff;
    }
    
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: #fff;
    }
    
    @media print {
      .page {
        page-break-after: always;
        margin: 0;
        padding: 15mm;
      }
      .no-print {
        display: none !important;
      }
    }
    
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <!-- PAGE DE COUVERTURE -->
  <div class="page" style="display: flex; flex-direction: column; justify-content: space-between;">
    <div>
      ${cabinet.logo ? `<img src="${cabinet.logo}" alt="${cabinet.nom}" style="height: 50px; margin-bottom: 20px;">` : ''}
      <div style="font-size: 12px; color: #6b7280;">${cabinet.nom}</div>
    </div>
    
    <div style="text-align: center; padding: 60px 0;">
      <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 3px; color: #6366f1; margin-bottom: 20px;">
        Rapport d'Audit Patrimonial
      </div>
      <h1 style="font-size: 36px; font-weight: 700; color: #1f2937; margin-bottom: 10px;">
        ${client.prenom} ${client.nom}
      </h1>
      <div style="font-size: 16px; color: #6b7280;">
        ${formatDate(rapport.dateGeneration)}
      </div>
      
      <div style="margin-top: 60px; display: flex; justify-content: center;">
        ${generateScoreGauge(scores.global, 180)}
      </div>
      <div style="margin-top: 20px; font-size: 14px; color: #6b7280;">
        Score Patrimonial Global
      </div>
      <div style="margin-top: 8px; font-size: 16px; font-weight: 600; color: ${scores.global.couleur};">
        ${scores.global.niveau}
      </div>
    </div>
    
    <div style="text-align: center; font-size: 11px; color: #9ca3af;">
      Document confidentiel - ${cabinet.nom}
      ${cabinet.orias ? `<br>ORIAS n°${cabinet.orias}` : ''}
    </div>
  </div>

  <!-- PAGE SYNTHÈSE EXÉCUTIVE -->
  <div class="page page-break">
    <h2 style="font-size: 24px; font-weight: 700; color: #1f2937; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 3px solid #6366f1;">
      Synthèse Exécutive
    </h2>
    
    <p style="font-size: 14px; line-height: 1.7; color: #4b5563; margin-bottom: 30px;">
      ${syntheseExecutive.introduction}
    </p>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px;">
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 20px;">
        <h3 style="font-size: 14px; font-weight: 600; color: #065f46; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span>✅</span> Points Forts
        </h3>
        <ul style="list-style: none; padding: 0;">
          ${syntheseExecutive.pointsForts.length > 0 
            ? syntheseExecutive.pointsForts.map(p => `<li style="font-size: 13px; color: #047857; padding: 6px 0; border-bottom: 1px solid #a7f3d0;">• ${p}</li>`).join('')
            : '<li style="font-size: 13px; color: #6b7280;">Aucun point fort majeur identifié</li>'
          }
        </ul>
      </div>
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px;">
        <h3 style="font-size: 14px; font-weight: 600; color: #92400e; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span>⚠️</span> Points de Vigilance
        </h3>
        <ul style="list-style: none; padding: 0;">
          ${syntheseExecutive.pointsVigilance.length > 0 
            ? syntheseExecutive.pointsVigilance.map(p => `<li style="font-size: 13px; color: #b45309; padding: 6px 0; border-bottom: 1px solid #fcd34d;">• ${p}</li>`).join('')
            : '<li style="font-size: 13px; color: #6b7280;">Aucun point de vigilance majeur</li>'
          }
        </ul>
      </div>
    </div>
    
    <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
      <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">
        Scores par Domaine
      </h3>
      <div style="display: flex; justify-content: center;">
        ${generateRadarChart([
          { label: 'Situation', valeur: scores.situationPersonnelle.valeur },
          { label: 'Patrimoine', valeur: scores.patrimoine.valeur },
          { label: 'Budget', valeur: scores.budget.valeur },
          { label: 'Fiscalité', valeur: scores.fiscalite.valeur },
          { label: 'Succession', valeur: scores.succession.valeur },
          { label: 'Objectifs', valeur: scores.objectifs.valeur },
          { label: 'Stratégie', valeur: scores.strategie.valeur },
        ])}
      </div>
    </div>
    
    ${syntheseExecutive.actionsImmediates.length > 0 ? `
      <div>
        <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">
          🎯 Actions Prioritaires
        </h3>
        ${syntheseExecutive.actionsImmediates.map((action, i) => `
          <div style="display: flex; gap: 16px; padding: 16px; background: ${i === 0 ? '#fef2f2' : '#f9fafb'}; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${i === 0 ? '#ef4444' : '#6366f1'};">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: ${i === 0 ? '#ef4444' : '#6366f1'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;">
              ${action.numero}
            </div>
            <div>
              <div style="font-weight: 600; font-size: 14px; color: #1f2937;">${action.titre}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${action.description}</div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  </div>

  <!-- SECTIONS DÉTAILLÉES -->
  <div class="page page-break">
    ${generateSection(sections.situationPersonnelle)}
  </div>

  <div class="page page-break">
    ${generateSection(sections.patrimoine)}
  </div>

  <div class="page page-break">
    ${generateSection(sections.budget)}
  </div>

  <div class="page page-break">
    ${generateSection(sections.fiscalite)}
  </div>

  <div class="page page-break">
    ${generateSection(sections.succession)}
  </div>

  <div class="page page-break">
    ${generateSection(sections.objectifs)}
  </div>

  <div class="page page-break">
    ${generateSection(sections.strategie)}
  </div>

  <div class="page page-break">
    ${generateSection(sections.conclusion)}
  </div>

  <!-- PAGE MENTIONS LÉGALES -->
  <div class="page page-break" style="display: flex; flex-direction: column; justify-content: space-between;">
    <div>
      <h2 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 20px;">
        Mentions Légales & Disclaimer
      </h2>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <p style="font-size: 11px; line-height: 1.7; color: #6b7280;">
          ${rapport.mentionsLegales}
        </p>
      </div>
      
      <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px;">
        <p style="font-size: 11px; line-height: 1.7; color: #92400e;">
          <strong>Avertissement :</strong> ${rapport.disclaimer}
        </p>
      </div>
    </div>
    
    <div style="text-align: center; padding-top: 40px; border-top: 1px solid #e5e7eb;">
      ${cabinet.logo ? `<img src="${cabinet.logo}" alt="${cabinet.nom}" style="height: 40px; margin-bottom: 12px;">` : ''}
      <div style="font-size: 14px; font-weight: 600; color: #1f2937;">${cabinet.nom}</div>
      <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Conseiller : ${cabinet.conseiller}</div>
      ${cabinet.email ? `<div style="font-size: 12px; color: #6b7280;">${cabinet.email}</div>` : ''}
      ${cabinet.telephone ? `<div style="font-size: 12px; color: #6b7280;">${cabinet.telephone}</div>` : ''}
      ${cabinet.orias ? `<div style="font-size: 11px; color: #9ca3af; margin-top: 8px;">ORIAS n°${cabinet.orias}</div>` : ''}
      
      <div style="margin-top: 20px; font-size: 10px; color: #9ca3af;">
        Document généré le ${formatDate(rapport.dateGeneration)}
      </div>
    </div>
  </div>

</body>
</html>
  `
}
