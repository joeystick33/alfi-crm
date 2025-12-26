/**
 * Pages Couverture et Synthèse
 */

import type { BilanPremiumData } from '../bilan-premium.types'
import { COLORS } from './styles'
import { formatCurrency, formatPercent, formatDate, getProfilLabel, getImpactBadge, getScoreColor, generateScoreBar, generateFooter } from './utils'

export function generateCoverPage(data: BilanPremiumData): string {
  const scoreColor = getScoreColor(data.score.global)
  
  return `
    <div class="page">
      <div class="cover">
        <div class="cover-logo">AURA</div>
        <div class="cover-title">Rapport de Synthese Patrimoniale</div>
        <div class="cover-subtitle">Analyse complete et recommandations personnalisees</div>
        
        <div class="score-circle" style="border-color: ${scoreColor};">
          <div class="score-value" style="color: ${scoreColor};">${data.score.global}</div>
          <div class="score-label">Score Global</div>
        </div>
        
        <div class="cover-client">${data.client.prenom} ${data.client.nom}</div>
        <div class="cover-date">Genere le ${formatDate(data.dateGeneration)}</div>
        
        <div style="margin-top: 40px; padding: 15px 30px; background: #f9fafb; border-radius: 8px;">
          <div style="font-size: 12px; color: ${COLORS.muted}; margin-bottom: 5px;">Profil Investisseur</div>
          <div style="font-size: 18px; font-weight: 600; color: ${COLORS.primary};">${getProfilLabel(data.profilInvestisseur)}</div>
        </div>
      </div>
      
      <div class="page-footer">
        Ce document est confidentiel et destine uniquement a son destinataire. Il ne constitue pas un conseil en investissement.
      </div>
    </div>
  `
}

export function generateSynthesePage(data: BilanPremiumData): string {
  const actionsHtml = data.actionsPrioritaires.slice(0, 3).map((action, i) => `
    <div class="action-item">
      <div class="action-number">${i + 1}</div>
      <div class="action-content">
        <div class="action-title">${action.titre} ${getImpactBadge(action.impact)}</div>
        <div class="action-desc">${action.description}</div>
      </div>
    </div>
  `).join('')
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Synthese Executive</div>
        <div class="page-number">Page 2</div>
      </div>
      
      <div class="grid grid-4 mb-3">
        <div class="card">
          <div class="kpi">
            <div class="kpi-value">${formatCurrency(data.patrimoine.patrimoineNet)}</div>
            <div class="kpi-label">Patrimoine Net</div>
            <div class="kpi-trend positive">+${formatPercent(data.patrimoine.tauxCroissance)} /an</div>
          </div>
        </div>
        <div class="card">
          <div class="kpi">
            <div class="kpi-value">${formatPercent(data.budget.tauxEndettement)}</div>
            <div class="kpi-label">Taux d'Endettement</div>
            <div class="kpi-trend ${data.budget.tauxEndettement <= 33 ? 'positive' : 'negative'}">
              ${data.budget.tauxEndettement <= 33 ? 'Conforme HCSF' : 'Attention'}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="kpi">
            <div class="kpi-value">${formatCurrency(data.budget.epargne)}</div>
            <div class="kpi-label">Epargne Mensuelle</div>
            <div class="kpi-trend positive">${formatPercent(data.budget.tauxEpargne)} du revenu</div>
          </div>
        </div>
        <div class="card">
          <div class="kpi">
            <div class="kpi-value">${data.fiscalite.tmi}%</div>
            <div class="kpi-label">TMI</div>
            <div class="kpi-trend ${data.fiscalite.tmi >= 41 ? 'negative' : 'positive'}">
              ${data.fiscalite.tmi >= 41 ? 'Optimisation possible' : 'Pression moderee'}
            </div>
          </div>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-header">Scores par Domaine</div>
        <div class="grid" style="grid-template-columns: repeat(5, 1fr);">
          ${generateScoreBar('Patrimoine', data.score.patrimoine)}
          ${generateScoreBar('Budget', data.score.budget)}
          ${generateScoreBar('Fiscalite', data.score.fiscalite)}
          ${generateScoreBar('Objectifs', data.score.objectifs)}
          ${generateScoreBar('Diversification', data.score.diversification)}
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">Top 3 Actions Prioritaires</div>
        ${actionsHtml || '<p class="text-muted">Aucune action prioritaire identifiee</p>'}
      </div>
      
      <div class="card ${data.diagnostic.verdict.level === 'EXCELLENT' || data.diagnostic.verdict.level === 'GOOD' ? 'card-success' : 'card-warning'} mt-3">
        <div style="font-weight: 600; margin-bottom: 5px;">${data.diagnostic.verdict.label}</div>
        <div style="font-size: 10px;">${data.diagnostic.verdict.comment}</div>
      </div>
      
      ${generateFooter(`${data.client.prenom} ${data.client.nom}`, data.dateGeneration)}
    </div>
  `
}
