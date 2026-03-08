/* eslint-disable @typescript-eslint/no-explicit-any */
import { PdfDocumentBuilder } from './pdf-document-builder'
import {
  fmtEur,
  fmtDateLongue,
  escapeHtml,
} from './pdf-utils'
import {
  renderEncadre,
  renderEncadreList,
  renderPreconisations,
  renderSignature,
  type PreconisationData,
} from './pdf-components'

export interface RapportConseilData {
  dossier: {
    id: string
    reference: string
    type: string
    categorie?: string
    createdAt: Date
    objet: string
  }
  client: {
    nom: string
    prenom: string
    email?: string
    telephone?: string
  }
  conseiller: {
    nom: string
    prenom: string
    email?: string
    telephone?: string
    titre?: string
  }
  cabinet?: {
    nom: string
    adresse?: string
    telephone?: string
    email?: string
  }
  contexte: string
  objectifs: string[]
  analyse: {
    situation: string
    constats: string[]
    opportunites: string[]
    risques: string[]
  }
  recommandations: Array<{
    titre: string
    description: string
    priorite: 'HAUTE' | 'MOYENNE' | 'BASSE'
    produit?: string
    montant?: number
    avantages?: string[]
    inconvenients?: string[]
    prochaines_etapes?: string[]
  }>
  conclusion: string
}

export function generateRapportConseilHtml(data: RapportConseilData): string {
  const cabinetNom = data.cabinet?.nom || 'Cabinet de Conseil'
  const builder = new PdfDocumentBuilder()

  // Couverture
  builder.setCover({
    titre: 'Rapport de Conseil',
    sousTitre: data.dossier.objet,
    badge: 'Rapport Confidentiel',
    clientNom: `${data.client.prenom} ${data.client.nom}`,
    clientInfo: [
      data.client.email || '',
      data.client.telephone || '',
    ].filter(Boolean).join(' • ') || undefined,
    cabinetNom,
    date: data.dossier.createdAt,
    reference: data.dossier.reference,
    conseillerNom: `${data.conseiller.prenom} ${data.conseiller.nom}`,
  })

  // Chapitre : Contexte & Objectifs
  const objectifsHtml = data.objectifs.map((obj, i) => `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="width: 24px; height: 24px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 10pt; flex-shrink: 0;">${i + 1}</div>
      <p style="color: #1e293b; font-size: 10pt; line-height: 1.6; padding-top: 2px;">${escapeHtml(obj)}</p>
    </div>
  `).join('')

  builder.addChapter('Contexte & Objectifs', `
    <div class="section">
      ${renderEncadre({ type: 'info', titre: 'Contexte de la mission', contenu: `<p style="color: #64748b; line-height: 1.8;">${escapeHtml(data.contexte)}</p>` })}
    </div>
    <div class="section">
      <div class="card">
        <div class="card-header"><span class="card-title">Objectifs identifiés</span></div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${objectifsHtml}
        </div>
      </div>
    </div>
  `)

  // Chapitre : Analyse
  const risquesHtml = data.analyse.risques.length > 0
    ? `<div class="section" style="margin-top: 16px;">
        ${renderEncadreList('attention', 'Points d\'attention', data.analyse.risques)}
      </div>`
    : ''

  builder.addChapter('Analyse de la Situation', `
    <div class="section">
      <div class="card">
        <div class="card-header"><span class="card-title">Situation actuelle</span></div>
        <p style="color: #64748b; line-height: 1.8;">${escapeHtml(data.analyse.situation)}</p>
      </div>
    </div>

    <div class="grid-2">
      <div class="card" style="border-left: 4px solid #3b82f6;">
        <div class="card-header"><span class="card-title" style="color: #3b82f6;">📋 Constats</span></div>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px;">
          ${data.analyse.constats.map(c => `
            <li style="display: flex; align-items: flex-start; gap: 8px; font-size: 10pt; color: #475569;">
              <span style="color: #3b82f6;">•</span> ${escapeHtml(c)}
            </li>
          `).join('')}
        </ul>
      </div>
      <div class="card" style="border-left: 4px solid #10b981;">
        <div class="card-header"><span class="card-title" style="color: #10b981;">🎯 Opportunités</span></div>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 8px;">
          ${data.analyse.opportunites.map(o => `
            <li style="display: flex; align-items: flex-start; gap: 8px; font-size: 10pt; color: #475569;">
              <span style="color: #10b981;">•</span> ${escapeHtml(o)}
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
    ${risquesHtml}
  `)

  // Chapitre : Recommandations
  const precos: PreconisationData[] = data.recommandations.map(reco => ({
    titre: reco.titre,
    description: reco.description,
    priorite: reco.priorite === 'HAUTE' ? 'haute' : reco.priorite === 'MOYENNE' ? 'moyenne' : 'basse',
    produit: reco.produit,
    montant: reco.montant,
    avantages: reco.avantages,
    inconvenients: reco.inconvenients,
    etapesSuivantes: reco.prochaines_etapes,
  }))

  builder.addChapter('Nos Recommandations', renderPreconisations(precos))

  // Chapitre : Conclusion & Signatures
  const signatureHtml = renderSignature({
    conseillerNom: `${data.conseiller.prenom} ${data.conseiller.nom}`,
    conseillerTitre: data.conseiller.titre || 'Conseiller en Gestion de Patrimoine',
    clientNom: `${data.client.prenom} ${data.client.nom}`,
    date: new Date(),
    mention: 'Lu et approuvé',
  })

  builder.addChapter('Conclusion', `
    <div class="section">
      <div class="card">
        <p style="color: #1e293b; line-height: 1.8; font-size: 11pt;">${escapeHtml(data.conclusion)}</p>
      </div>
    </div>
    <div class="signature-section">
      <div class="signature-intro">
        <p style="margin-bottom: 12px;">Ce rapport a été établi sur la base des informations communiquées par le client et d'une analyse approfondie de sa situation. Les recommandations formulées constituent des conseils personnalisés tenant compte des objectifs exprimés.</p>
        <p>Ce document ne constitue pas une offre commerciale et les projections présentées sont données à titre indicatif. Toute décision d'investissement doit faire l'objet d'une étude complémentaire.</p>
      </div>
      ${signatureHtml}
    </div>
  `)

  // Mentions finales
  builder.setMentions({
    cabinetNom,
    cabinetAdresse: data.cabinet?.adresse,
    reference: data.dossier.reference,
    confidentialite: true,
  })

  return builder.build()
}

export default generateRapportConseilHtml
