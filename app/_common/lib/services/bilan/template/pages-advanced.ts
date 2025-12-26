/**
 * Pages Avancées : Allocation, Protection, Succession
 */

import type { BilanPremiumData } from '../bilan-premium.types'
import { COLORS } from './styles'
import { formatCurrency, formatPercent, getStatutBadge, generateFooter } from './utils'

export function generateAllocationPage(data: BilanPremiumData): string {
  const clientName = `${data.client.prenom} ${data.client.nom}`
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Allocation Detaillee</div>
        <div class="page-number">Page 10</div>
      </div>
      
      <div class="card mb-3">
        <div class="card-header">Inventaire Complet des Actifs</div>
        <table>
          <thead>
            <tr>
              <th>Libelle</th>
              <th>Categorie</th>
              <th class="text-right">Valeur</th>
              <th class="text-center">Liquidite</th>
              <th class="text-right">Performance</th>
            </tr>
          </thead>
          <tbody>
            ${data.actifs.length > 0 ? data.actifs.map(a => `
              <tr>
                <td>${a.libelle}</td>
                <td>${a.categorie}</td>
                <td class="text-right font-bold">${formatCurrency(a.valeur)}</td>
                <td class="text-center">
                  <span style="font-size: 9px; padding: 2px 6px; border-radius: 3px; background: ${
                    a.liquidite === 'IMMEDIATE' ? COLORS.secondary : 
                    a.liquidite === 'COURT_TERME' ? '#06b6d4' :
                    a.liquidite === 'MOYEN_TERME' ? COLORS.warning : COLORS.muted
                  }; color: white;">
                    ${a.liquidite.replace(/_/g, ' ')}
                  </span>
                </td>
                <td class="text-right ${(a.performance || 0) >= 0 ? 'text-success' : 'text-danger'}">
                  ${a.performance !== undefined ? ((a.performance >= 0 ? '+' : '') + formatPercent(a.performance)) : '-'}
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="5" class="text-center text-muted">Aucun actif detaille renseigne</td></tr>
            `}
          </tbody>
        </table>
      </div>
      
      <div class="grid grid-2">
        <div class="card">
          <div class="card-header">Repartition par Liquidite</div>
          <div class="chart-container chart-container-small">
            <canvas id="chartLiquidite"></canvas>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">Repartition Geographique</div>
          <div class="chart-container chart-container-small">
            <canvas id="chartGeo"></canvas>
          </div>
        </div>
      </div>
      
      ${generateFooter(clientName, data.dateGeneration)}
    </div>
  `
}

export function generateProtectionPage(data: BilanPremiumData): string {
  const clientName = `${data.client.prenom} ${data.client.nom}`
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Protection & Prevoyance</div>
        <div class="page-number">Page 11</div>
      </div>
      
      <div class="card ${data.protection.couvertureDecès.statut === 'SUFFISANT' ? 'card-success' : data.protection.couvertureDecès.statut === 'INSUFFISANT' ? 'card-warning' : 'card-danger'} mb-3">
        <div class="card-header">Couverture Deces ${getStatutBadge(data.protection.couvertureDecès.statut)}</div>
        <div class="grid grid-3">
          <div>
            <div style="font-size: 9px; color: ${COLORS.muted};">Capital Garanti</div>
            <div style="font-size: 16px; font-weight: 700;">${formatCurrency(data.protection.couvertureDecès.capital)}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: ${COLORS.muted};">Besoins Estimes</div>
            <div style="font-size: 16px; font-weight: 700;">${formatCurrency(data.protection.couvertureDecès.besoins)}</div>
          </div>
          <div>
            <div style="font-size: 9px; color: ${COLORS.muted};">Ecart</div>
            <div style="font-size: 16px; font-weight: 700; color: ${data.protection.couvertureDecès.ecart >= 0 ? COLORS.secondary : COLORS.danger};">
              ${data.protection.couvertureDecès.ecart >= 0 ? '+' : ''}${formatCurrency(data.protection.couvertureDecès.ecart)}
            </div>
          </div>
        </div>
      </div>
      
      <div class="card ${data.protection.couvertureInvalidite.statut === 'SUFFISANT' ? 'card-success' : data.protection.couvertureInvalidite.statut === 'INSUFFISANT' ? 'card-warning' : 'card-danger'} mb-3">
        <div class="card-header">Couverture Invalidite ${getStatutBadge(data.protection.couvertureInvalidite.statut)}</div>
        <div class="grid grid-3">
          <div>
            <div style="font-size: 9px; color: ${COLORS.muted};">Revenu Garanti</div>
            <div style="font-size: 16px; font-weight: 700;">${formatCurrency(data.protection.couvertureInvalidite.revenuGaranti)}/mois</div>
          </div>
          <div>
            <div style="font-size: 9px; color: ${COLORS.muted};">Besoins Estimes</div>
            <div style="font-size: 16px; font-weight: 700;">${formatCurrency(data.protection.couvertureInvalidite.besoins)}/mois</div>
          </div>
          <div>
            <div style="font-size: 9px; color: ${COLORS.muted};">Ecart</div>
            <div style="font-size: 16px; font-weight: 700; color: ${data.protection.couvertureInvalidite.ecart >= 0 ? COLORS.secondary : COLORS.danger};">
              ${data.protection.couvertureInvalidite.ecart >= 0 ? '+' : ''}${formatCurrency(data.protection.couvertureInvalidite.ecart)}/mois
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">Contrats de Prevoyance</div>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Assureur</th>
              <th class="text-right">Capital</th>
              <th class="text-right">Prime Annuelle</th>
            </tr>
          </thead>
          <tbody>
            ${data.protection.contrats.length > 0 ? data.protection.contrats.map(c => `
              <tr>
                <td>${c.type}</td>
                <td>${c.assureur}</td>
                <td class="text-right font-bold">${formatCurrency(c.capital)}</td>
                <td class="text-right">${formatCurrency(c.primeAnnuelle)}</td>
              </tr>
            `).join('') : `
              <tr><td colspan="4" class="text-center text-muted">Aucun contrat de prevoyance renseigne</td></tr>
            `}
          </tbody>
        </table>
      </div>
      
      ${generateFooter(clientName, data.dateGeneration)}
    </div>
  `
}

export function generateSuccessionPage(data: BilanPremiumData): string {
  const clientName = `${data.client.prenom} ${data.client.nom}`
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Analyse Successorale</div>
        <div class="page-number">Page 12</div>
      </div>
      
      <div class="card card-warning mb-3">
        <div class="card-header">Droits de Succession Estimes</div>
        <div style="text-align: center; padding: 15px;">
          <div style="font-size: 28px; font-weight: 700; color: ${COLORS.danger};">${formatCurrency(data.succession.droitsEstimes)}</div>
          <div style="font-size: 10px; color: ${COLORS.muted};">Estimation basee sur la situation actuelle</div>
        </div>
      </div>
      
      <div class="grid grid-2 mb-3">
        <div class="card">
          <div class="card-header">Abattements Disponibles</div>
          <table>
            <thead>
              <tr>
                <th>Beneficiaire</th>
                <th class="text-right">Montant</th>
                <th class="text-right">Utilise</th>
              </tr>
            </thead>
            <tbody>
              ${data.succession.abattements.map(a => `
                <tr>
                  <td>${a.beneficiaire}</td>
                  <td class="text-right">${formatCurrency(a.montant)}</td>
                  <td class="text-right">${formatCurrency(a.utilise)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="card">
          <div class="card-header">Strategies d'Optimisation</div>
          <div style="font-size: 10px;">
            ${data.succession.strategies.map(s => `
              <div style="margin-bottom: 8px; padding: 8px; background: #f9fafb; border-radius: 4px;">
                <div style="font-weight: 600;">${s.nom}</div>
                <div style="color: ${COLORS.muted}; margin: 3px 0;">${s.description}</div>
                <div style="color: ${COLORS.secondary}; font-weight: 600;">Economie potentielle : ${formatCurrency(s.economie)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">Schema de Transmission</div>
        <table>
          <thead>
            <tr>
              <th>De</th>
              <th>Vers</th>
              <th class="text-right">Montant</th>
              <th class="text-right">Droits Estimes</th>
            </tr>
          </thead>
          <tbody>
            ${data.succession.schema.map(s => `
              <tr>
                <td>${s.de}</td>
                <td>${s.vers}</td>
                <td class="text-right">${formatCurrency(s.montant)}</td>
                <td class="text-right text-danger">${formatCurrency(s.droits)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      ${generateFooter(clientName, data.dateGeneration)}
    </div>
  `
}
