/**
 * Page Conclusion
 */

import type { BilanPremiumData } from '../bilan-premium.types'
import { COLORS } from './styles'
import { generateFooter } from './utils'

export function generateConclusionPage(data: BilanPremiumData): string {
  const clientName = `${data.client.prenom} ${data.client.nom}`
  const isGood = data.diagnostic.verdict.level === 'EXCELLENT' || data.diagnostic.verdict.level === 'GOOD'
  
  return `
    <div class="page">
      <div class="page-header">
        <div class="page-title">Conclusion & Recommandations</div>
        <div class="page-number">Page 13</div>
      </div>
      
      <div class="card ${isGood ? 'card-success' : 'card-warning'} mb-3">
        <div class="card-header">Verdict Global</div>
        <div style="text-align: center; padding: 15px;">
          <div style="font-size: 22px; font-weight: 700; color: ${isGood ? COLORS.secondary : COLORS.warning};">${data.diagnostic.verdict.label}</div>
          <div style="font-size: 11px; color: ${COLORS.muted}; margin-top: 5px;">${data.diagnostic.verdict.comment}</div>
        </div>
      </div>
      
      <div class="grid grid-2 mb-3">
        <div class="card">
          <div class="card-header">Points Forts</div>
          <div style="font-size: 10px;">
            ${data.diagnostic.forces.length > 0 ? data.diagnostic.forces.map(f => `
              <div style="padding: 6px 0; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px;">
                <span style="color: ${COLORS.secondary}; font-weight: bold;">[+]</span>
                <span>${f}</span>
              </div>
            `).join('') : '<p class="text-muted">Aucun point fort identifie</p>'}
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">Points de Vigilance</div>
          <div style="font-size: 10px;">
            ${data.diagnostic.vigilances.length > 0 ? data.diagnostic.vigilances.map(v => `
              <div style="padding: 6px 0; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px;">
                <span style="color: ${COLORS.warning}; font-weight: bold;">[!]</span>
                <span>${v}</span>
              </div>
            `).join('') : '<p class="text-muted">Aucun point de vigilance identifie</p>'}
          </div>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-header">Recommandations Prioritaires</div>
        <div style="font-size: 10px;">
          ${data.diagnostic.recommandations.length > 0 ? data.diagnostic.recommandations.map((r, i) => `
            <div style="padding: 10px; margin-bottom: 8px; background: #f9fafb; border-radius: 6px; border-left: 3px solid ${COLORS.primary};">
              <span style="font-weight: 700; color: ${COLORS.primary};">${i + 1}.</span>
              <span style="margin-left: 8px;">${r}</span>
            </div>
          `).join('') : '<p class="text-muted">Aucune recommandation a ce stade</p>'}
        </div>
      </div>
      
      <div class="card" style="background: linear-gradient(135deg, ${COLORS.primary}10 0%, ${COLORS.secondary}10 100%);">
        <div class="card-header">Qualite du Rapport</div>
        <div class="grid grid-4" style="text-align: center; font-size: 10px;">
          <div>
            <div style="color: ${COLORS.secondary}; font-size: 16px; font-weight: 700;">[OK]</div>
            <div>Presentable a une banque</div>
          </div>
          <div>
            <div style="color: ${COLORS.secondary}; font-size: 16px; font-weight: 700;">[OK]</div>
            <div>Exploitable en RDV CGP</div>
          </div>
          <div>
            <div style="color: ${COLORS.secondary}; font-size: 16px; font-weight: 700;">[OK]</div>
            <div>Comprehensible client</div>
          </div>
          <div>
            <div style="color: ${COLORS.secondary}; font-size: 16px; font-weight: 700;">[OK]</div>
            <div>Premium / Fintech</div>
          </div>
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: center; font-size: 9px; color: ${COLORS.muted};">
        <p>Ce document est fourni a titre informatif. Il ne constitue pas un conseil en investissement personnalise.</p>
        <p>Pour toute question, contactez votre conseiller en gestion de patrimoine.</p>
      </div>
      
      ${generateFooter(clientName, data.dateGeneration)}
    </div>
  `
}
