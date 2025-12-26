/**
 * Pages Patrimoine et Evolution
 */

import type { BilanPremiumData } from '../bilan-premium.types'
import { COLORS } from './styles'
import { formatCurrency, formatPercent, generateFooter } from './utils'

export function generatePatrimoinePage(data: BilanPremiumData): string {
  const clientName = `${data.client.prenom} ${data.client.nom}`
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Patrimoine Global</div>
        <div class="page-number">Page 3</div>
      </div>
      
      <div class="grid grid-2 mb-3">
        <div class="card">
          <div class="card-header">Indicateurs Cles</div>
          <table>
            <tr><td>Total Actifs</td><td class="text-right font-bold">${formatCurrency(data.patrimoine.totalActifs)}</td></tr>
            <tr><td>Total Passifs</td><td class="text-right font-bold text-danger">${formatCurrency(-data.patrimoine.totalPassifs)}</td></tr>
            <tr style="background: #f0fdf4;"><td class="font-bold">Patrimoine Net</td><td class="text-right font-bold text-success">${formatCurrency(data.patrimoine.patrimoineNet)}</td></tr>
            <tr><td>Patrimoine Gere</td><td class="text-right">${formatCurrency(data.patrimoine.patrimoineGere)}</td></tr>
            <tr><td>Taux de Gestion</td><td class="text-right">${formatPercent(data.patrimoine.tauxGestion)}</td></tr>
          </table>
        </div>
        
        <div class="card">
          <div class="card-header">Repartition Patrimoniale</div>
          <div class="chart-container">
            <canvas id="chartRepartition"></canvas>
          </div>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-header">Comparaison vs Profil Similaire</div>
        <table>
          <thead>
            <tr>
              <th>Indicateur</th>
              <th class="text-right">Votre Situation</th>
              <th class="text-right">Moyenne Profil</th>
              <th class="text-right">Ecart</th>
            </tr>
          </thead>
          <tbody>
            ${data.benchmarks.slice(0, 4).map(b => `
              <tr>
                <td>${b.categorie}</td>
                <td class="text-right">${formatCurrency(b.votreSituation)}</td>
                <td class="text-right">${formatCurrency(b.moyenneProfil)}</td>
                <td class="text-right ${b.ecart >= 0 ? 'text-success' : 'text-danger'}">${b.ecart >= 0 ? '+' : ''}${formatPercent(b.ecart)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="card">
        <div class="card-header">Analyse</div>
        <p style="font-size: 10px; line-height: 1.6;">
          Le patrimoine global de ${clientName} s'eleve a ${formatCurrency(data.patrimoine.totalActifs)}, 
          pour un patrimoine net de ${formatCurrency(data.patrimoine.patrimoineNet)}. 
          ${data.patrimoine.tauxGestion < 50 
            ? `Actuellement, ${formatPercent(data.patrimoine.tauxGestion)} du patrimoine beneficie d'un accompagnement structure. Un elargissement de la gestion permettrait d'optimiser la performance globale.`
            : `La majorite du patrimoine (${formatPercent(data.patrimoine.tauxGestion)}) beneficie d'un accompagnement structure, ce qui permet un suivi optimal.`
          }
        </p>
      </div>
      
      ${generateFooter(clientName, data.dateGeneration)}
    </div>
  `
}

export function generateEvolutionPage(data: BilanPremiumData): string {
  const clientName = `${data.client.prenom} ${data.client.nom}`
  const isPositive = data.patrimoine.evolutionAnnuelle > 0
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Evolution du Patrimoine</div>
        <div class="page-number">Page 4</div>
      </div>
      
      <div class="grid grid-3 mb-3">
        <div class="card ${isPositive ? 'card-success' : 'card-warning'}">
          <div class="kpi">
            <div class="kpi-value ${isPositive ? 'text-success' : 'text-danger'}">${isPositive ? '+' : ''}${formatCurrency(data.patrimoine.evolutionAnnuelle)}</div>
            <div class="kpi-label">Evolution Annuelle</div>
          </div>
        </div>
        <div class="card">
          <div class="kpi">
            <div class="kpi-value">${isPositive ? '+' : ''}${formatPercent(data.patrimoine.tauxCroissance)}</div>
            <div class="kpi-label">Taux de Croissance</div>
          </div>
        </div>
        <div class="card">
          <div class="kpi">
            <div class="kpi-value">${formatCurrency(data.patrimoine.totalPassifs)}</div>
            <div class="kpi-label">Encours Dettes</div>
          </div>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-header">Evolution sur 12 mois</div>
        <div class="chart-container chart-container-large">
          <canvas id="chartEvolution"></canvas>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">Projection a 10 ans</div>
        <div class="chart-container">
          <canvas id="chartProjection"></canvas>
        </div>
        <div style="font-size: 9px; color: ${COLORS.muted}; margin-top: 5px;">
          * Projections basees sur le taux de croissance actuel. Scenario median avec inflation 2%/an.
        </div>
      </div>
      
      ${generateFooter(clientName, data.dateGeneration)}
    </div>
  `
}
