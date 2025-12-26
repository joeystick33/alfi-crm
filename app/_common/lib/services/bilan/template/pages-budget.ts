/**
 * Pages Budget et Fiscalité
 */

import type { BilanPremiumData } from '../bilan-premium.types'
import { COLORS } from './styles'
import { formatCurrency, formatPercent, generateFooter } from './utils'

export function generateBudgetPage(data: BilanPremiumData): string {
  const clientName = `${data.client.prenom} ${data.client.nom}`
  const isHCSFConforme = data.budget.tauxEndettement <= 35
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Budget & Capacite Financiere</div>
        <div class="page-number">Page 5</div>
      </div>
      
      <div class="grid grid-4 mb-3">
        <div class="card">
          <div class="kpi">
            <div class="kpi-value text-success">${formatCurrency(data.budget.revenusMensuels)}</div>
            <div class="kpi-label">Revenus Mensuels</div>
          </div>
        </div>
        <div class="card">
          <div class="kpi">
            <div class="kpi-value text-danger">${formatCurrency(data.budget.chargesMensuelles)}</div>
            <div class="kpi-label">Charges Mensuelles</div>
          </div>
        </div>
        <div class="card">
          <div class="kpi">
            <div class="kpi-value">${formatCurrency(data.budget.mensualitesCredits)}</div>
            <div class="kpi-label">Mensualites Credits</div>
          </div>
        </div>
        <div class="card card-success">
          <div class="kpi">
            <div class="kpi-value text-success">${formatCurrency(data.budget.epargne)}</div>
            <div class="kpi-label">Epargne Mensuelle</div>
          </div>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-header">Taux d'Endettement</div>
        <div class="gauge">
          <div class="gauge-value" style="left: ${Math.min(data.budget.tauxEndettement, 50)}%; color: ${data.budget.tauxEndettement <= 25 ? COLORS.secondary : data.budget.tauxEndettement <= 35 ? COLORS.warning : COLORS.danger};">
            ${formatPercent(data.budget.tauxEndettement)}
          </div>
          <div class="gauge-bar">
            <div class="gauge-fill" style="width: ${Math.min(data.budget.tauxEndettement * 2, 100)}%; background: linear-gradient(90deg, ${COLORS.secondary} 0%, ${COLORS.secondary} 50%, ${COLORS.warning} 70%, ${COLORS.danger} 100%);"></div>
          </div>
          <div class="gauge-labels">
            <span>0%</span>
            <span style="color: ${COLORS.secondary};">Excellent (25%)</span>
            <span style="color: ${COLORS.warning};">Seuil HCSF (35%)</span>
            <span>50%</span>
          </div>
        </div>
      </div>
      
      <div class="grid grid-2 mb-3">
        <div class="card">
          <div class="card-header">Repartition Budget</div>
          <div class="chart-container">
            <canvas id="chartBudget"></canvas>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">Indicateurs Bancaires</div>
          <table>
            <tr>
              <td>Taux d'endettement</td>
              <td class="text-right">${formatPercent(data.budget.tauxEndettement)}</td>
              <td class="text-center">${isHCSFConforme ? '<span style="color: ' + COLORS.secondary + ';">OK</span>' : '<span style="color: ' + COLORS.danger + ';">NON</span>'}</td>
            </tr>
            <tr>
              <td>Taux d'epargne</td>
              <td class="text-right">${formatPercent(data.budget.tauxEpargne)}</td>
              <td class="text-center">${data.budget.tauxEpargne >= 15 ? '<span style="color: ' + COLORS.secondary + ';">OK</span>' : '<span style="color: ' + COLORS.warning + ';">-</span>'}</td>
            </tr>
            <tr>
              <td>Conformite HCSF</td>
              <td class="text-right">${isHCSFConforme ? 'Conforme' : 'Non conforme'}</td>
              <td class="text-center">${isHCSFConforme ? '<span style="color: ' + COLORS.secondary + ';">OK</span>' : '<span style="color: ' + COLORS.danger + ';">NON</span>'}</td>
            </tr>
            <tr style="background: #f0fdf4;">
              <td class="font-bold">Capacite d'emprunt</td>
              <td class="text-right font-bold">${formatCurrency(data.budget.capaciteEmprunt)}</td>
              <td></td>
            </tr>
          </table>
        </div>
      </div>
      
      ${generateFooter(clientName, data.dateGeneration)}
    </div>
  `
}

export function generateFiscalitePage(data: BilanPremiumData): string {
  const clientName = `${data.client.prenom} ${data.client.nom}`
  const isTMIEleve = data.fiscalite.tmi >= 41
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Fiscalite</div>
        <div class="page-number">Page 6</div>
      </div>
      
      <div class="grid grid-4 mb-3">
        <div class="card">
          <div class="kpi">
            <div class="kpi-value">${formatCurrency(data.fiscalite.revenuImposable)}</div>
            <div class="kpi-label">Revenu Imposable</div>
          </div>
        </div>
        <div class="card ${isTMIEleve ? 'card-warning' : ''}">
          <div class="kpi">
            <div class="kpi-value">${data.fiscalite.tmi}%</div>
            <div class="kpi-label">TMI</div>
          </div>
        </div>
        <div class="card">
          <div class="kpi">
            <div class="kpi-value text-danger">${formatCurrency(data.fiscalite.impotRevenu)}</div>
            <div class="kpi-label">Impot sur le Revenu</div>
          </div>
        </div>
        <div class="card">
          <div class="kpi">
            <div class="kpi-value">${formatPercent(data.fiscalite.tauxEffectif)}</div>
            <div class="kpi-label">Taux Effectif</div>
          </div>
        </div>
      </div>
      
      <div class="grid grid-2 mb-3">
        <div class="card">
          <div class="card-header">Decomposition de l'Impot</div>
          <div class="chart-container">
            <canvas id="chartFiscalite"></canvas>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">Leviers d'Optimisation</div>
          <table>
            <thead>
              <tr>
                <th>Dispositif</th>
                <th class="text-right">Economie</th>
                <th class="text-center">Eligible</th>
              </tr>
            </thead>
            <tbody>
              ${data.charts.fiscalite.optimisations.map(o => `
                <tr>
                  <td>${o.dispositif}</td>
                  <td class="text-right text-success">${formatCurrency(o.economie)}</td>
                  <td class="text-center">${o.eligible ? '<span style="color: ' + COLORS.secondary + ';">Oui</span>' : '<span style="color: ' + COLORS.muted + ';">Non</span>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="card ${data.fiscalite.patrimoineImmobilierNet >= 1300000 ? 'card-warning' : 'card-success'}">
        <div class="card-header">IFI (Impot sur la Fortune Immobiliere)</div>
        <div class="grid grid-3">
          <div>
            <div style="font-size: 9px; color: ${COLORS.muted};">Patrimoine Immobilier Net</div>
            <div style="font-size: 14px; font-weight: 600;">${formatCurrency(data.fiscalite.patrimoineImmobilierNet)}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: ${COLORS.muted};">Seuil d'Assujettissement</div>
            <div style="font-size: 14px; font-weight: 600;">${formatCurrency(1300000)}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: ${COLORS.muted};">Statut</div>
            <div style="font-size: 14px; font-weight: 600; color: ${data.fiscalite.patrimoineImmobilierNet >= 1300000 ? COLORS.warning : COLORS.secondary};">
              ${data.fiscalite.patrimoineImmobilierNet >= 1300000 ? 'Assujetti' : 'Non assujetti'}
            </div>
          </div>
        </div>
      </div>
      
      ${generateFooter(clientName, data.dateGeneration)}
    </div>
  `
}
