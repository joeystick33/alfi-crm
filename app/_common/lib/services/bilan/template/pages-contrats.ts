/**
 * Pages Contrats, Objectifs et Performance
 */

import type { BilanPremiumData } from '../bilan-premium.types'
import { COLORS } from './styles'
import { formatCurrency, formatPercent, generateFooter } from './utils'

export function generateContratsPage(data: BilanPremiumData): string {
  const clientName = `${data.client.prenom} ${data.client.nom}`
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Contrats & Enveloppes</div>
        <div class="page-number">Page 7</div>
      </div>
      
      <div class="card mb-3">
        <div class="card-header">Inventaire des Contrats</div>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Nom / Assureur</th>
              <th class="text-right">Encours</th>
              <th class="text-right">Performance</th>
              <th class="text-center">Liquidite</th>
            </tr>
          </thead>
          <tbody>
            ${data.contrats.length > 0 ? data.contrats.map(c => `
              <tr>
                <td>${c.type.replace(/_/g, ' ')}</td>
                <td>${c.nom}<br><span style="font-size: 9px; color: ${COLORS.muted};">${c.assureur}</span></td>
                <td class="text-right font-bold">${formatCurrency(c.encours)}</td>
                <td class="text-right ${c.performance >= 0 ? 'text-success' : 'text-danger'}">
                  ${c.performance >= 0 ? '+' : ''}${formatPercent(c.performance)}
                </td>
                <td class="text-center">
                  <span style="font-size: 9px; padding: 2px 6px; border-radius: 3px; background: ${c.liquidite === 'IMMEDIATE' ? COLORS.secondary : c.liquidite === 'BLOQUEE' ? COLORS.danger : COLORS.warning}; color: white;">
                    ${c.liquidite}
                  </span>
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="5" class="text-center text-muted">Aucun contrat renseigne</td></tr>
            `}
          </tbody>
        </table>
      </div>
      
      <div class="grid grid-2">
        <div class="card">
          <div class="card-header">Repartition par Type</div>
          <div class="chart-container chart-container-small">
            <canvas id="chartContrats"></canvas>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">Points de Vigilance</div>
          <div style="font-size: 10px;">
            <div style="margin-bottom: 8px; padding: 8px; background: #fffbeb; border-radius: 4px;">
              <strong>Clauses beneficiaires</strong><br>
              Verifier l'adequation avec la situation familiale actuelle.
            </div>
            <div style="padding: 8px; background: #f0fdf4; border-radius: 4px;">
              <strong>Diversification</strong><br>
              S'assurer de la coherence globale de l'allocation.
            </div>
          </div>
        </div>
      </div>
      
      ${generateFooter(clientName, data.dateGeneration)}
    </div>
  `
}

export function generateObjectifsPage(data: BilanPremiumData): string {
  const clientName = `${data.client.prenom} ${data.client.nom}`
  const isOnTrack = data.objectifs.progression >= 50
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Objectifs Patrimoniaux</div>
        <div class="page-number">Page 8</div>
      </div>
      
      <div class="card card-highlight mb-3">
        <div class="card-header">Objectif Principal : ${data.objectifs.principal}</div>
        <div class="grid grid-3">
          <div>
            <div style="font-size: 9px; color: ${COLORS.muted};">Montant Cible</div>
            <div style="font-size: 18px; font-weight: 700;">${formatCurrency(data.objectifs.montantCible)}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: ${COLORS.muted};">Encours Actuel</div>
            <div style="font-size: 18px; font-weight: 700; color: ${COLORS.primary};">${formatCurrency(data.objectifs.montantActuel)}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: ${COLORS.muted};">Horizon</div>
            <div style="font-size: 18px; font-weight: 700;">${data.objectifs.horizon}</div>
          </div>
        </div>
        
        <div style="margin-top: 15px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 3px;">
            <span>Progression</span>
            <span style="font-weight: 600; color: ${isOnTrack ? COLORS.secondary : COLORS.warning};">${formatPercent(data.objectifs.progression)}</span>
          </div>
          <div class="progress" style="height: 12px;">
            <div class="progress-fill" style="width: ${data.objectifs.progression}%; background: ${isOnTrack ? COLORS.secondary : COLORS.warning};"></div>
          </div>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-header">Trajectoire vers l'Objectif</div>
        <div class="chart-container chart-container-large">
          <canvas id="chartObjectifs"></canvas>
        </div>
      </div>
      
      <div class="card ${isOnTrack ? 'card-success' : 'card-warning'}">
        <div style="font-weight: 600; margin-bottom: 5px;">
          ${isOnTrack ? 'Sur la bonne trajectoire' : 'Ajustement recommande'}
        </div>
        <div style="font-size: 10px;">
          ${isOnTrack 
            ? `L'objectif est en bonne voie d'atteinte. Maintenir l'effort actuel permettra de securiser cette trajectoire.`
            : `Un ajustement de la strategie d'epargne ou de l'objectif pourrait etre envisage pour renforcer la probabilite de reussite.`
          }
        </div>
      </div>
      
      ${generateFooter(clientName, data.dateGeneration)}
    </div>
  `
}

export function generatePerformancePage(data: BilanPremiumData): string {
  const clientName = `${data.client.prenom} ${data.client.nom}`
  const capitalInvesti = data.patrimoine.patrimoineGere * 0.8
  const plusValue = data.patrimoine.totalActifs - capitalInvesti
  const performance = capitalInvesti > 0 ? ((data.patrimoine.totalActifs / capitalInvesti) - 1) * 100 : 0
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Reporting Investissement</div>
        <div class="page-number">Page 9</div>
      </div>
      
      <div class="grid grid-4 mb-3">
        <div class="card">
          <div class="kpi">
            <div class="kpi-value">${formatCurrency(data.patrimoine.totalActifs)}</div>
            <div class="kpi-label">Valeur Actuelle</div>
          </div>
        </div>
        <div class="card">
          <div class="kpi">
            <div class="kpi-value">${formatCurrency(capitalInvesti)}</div>
            <div class="kpi-label">Capital Investi</div>
          </div>
        </div>
        <div class="card card-success">
          <div class="kpi">
            <div class="kpi-value text-success">+${formatCurrency(plusValue)}</div>
            <div class="kpi-label">Plus-value Latente</div>
          </div>
        </div>
        <div class="card">
          <div class="kpi">
            <div class="kpi-value text-success">+${formatPercent(performance)}</div>
            <div class="kpi-label">Performance Globale</div>
          </div>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-header">Performance vs Benchmark</div>
        <div class="chart-container chart-container-large">
          <canvas id="chartPerformance"></canvas>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">Performance par Classe d'Actifs</div>
        <table>
          <thead>
            <tr>
              <th>Classe d'Actifs</th>
              <th class="text-right">Votre Performance</th>
              <th class="text-right">Benchmark</th>
              <th class="text-right">Ecart</th>
            </tr>
          </thead>
          <tbody>
            ${data.charts.performance.parClasse.map(p => `
              <tr>
                <td>${p.classe}</td>
                <td class="text-right ${p.performance >= 0 ? 'text-success' : 'text-danger'}">${p.performance >= 0 ? '+' : ''}${formatPercent(p.performance)}</td>
                <td class="text-right">${p.benchmark >= 0 ? '+' : ''}${formatPercent(p.benchmark)}</td>
                <td class="text-right ${p.performance - p.benchmark >= 0 ? 'text-success' : 'text-danger'}">${p.performance - p.benchmark >= 0 ? '+' : ''}${formatPercent(p.performance - p.benchmark)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      ${generateFooter(clientName, data.dateGeneration)}
    </div>
  `
}
