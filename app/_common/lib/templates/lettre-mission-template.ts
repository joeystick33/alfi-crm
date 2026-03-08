/* eslint-disable @typescript-eslint/no-explicit-any */
import { PdfDocumentBuilder } from './pdf-document-builder'
import { fmtDateLongue, fmtEurPrecis, escapeHtml } from './pdf-utils'

export interface LettreMissionData {
  reference: string
  date: Date
  client: {
    civilite?: string
    nom: string
    prenom: string
    adresse?: string
    codePostal?: string
    ville?: string
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
  cabinet: {
    nom: string
    adresse?: string
    codePostal?: string
    ville?: string
    telephone?: string
    email?: string
    siret?: string
    orias?: string
  }
  mission: {
    type: string
    objet: string
    perimetre: string[]
    duree?: string
    honoraires?: {
      type: 'FORFAIT' | 'POURCENTAGE' | 'HORAIRE'
      montant: number
      details?: string
    }
  }
  obligations: {
    conseiller: string[]
    client: string[]
  }
  confidentialite: string
  conflitsInterets?: string
}

/** CSS spécifique au format lettre (ajouté en plus du socle premium) */
const LETTRE_STYLES = `
  .letter-page {
    padding: 50px 60px;
    background: white;
    font-size: 10.5pt;
    line-height: 1.7;
  }
  .letter-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 50px;
  }
  .letter-sender { max-width: 280px; }
  .letter-sender-name { font-size: 14pt; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
  .letter-sender-info { font-size: 9pt; color: #64748b; line-height: 1.6; }
  .letter-recipient { text-align: right; max-width: 280px; }
  .letter-recipient-name { font-weight: 600; color: #0f172a; margin-bottom: 4px; }
  .letter-recipient-address { font-size: 10pt; color: #475569; }
  .letter-date { text-align: right; color: #64748b; margin-bottom: 30px; }
  .letter-object { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 20px; margin-bottom: 30px; }
  .letter-object-label { font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .letter-object-value { font-weight: 600; color: #0f172a; }
  .letter-salutation { margin-bottom: 20px; }
  .letter-body p { margin-bottom: 16px; text-align: justify; }
  .letter-section { margin: 30px 0; }
  .letter-section-title { font-size: 11pt; font-weight: 700; color: #0f172a; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; break-after: avoid; }
  .letter-list { list-style: none; padding: 0; }
  .letter-list li { position: relative; padding-left: 24px; margin-bottom: 10px; }
  .letter-list li::before { content: '\\2192'; position: absolute; left: 0; color: #3b82f6; font-weight: 600; }
  .letter-honoraires { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0; break-inside: avoid; }
  .letter-honoraires-label { font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .letter-honoraires-value { font-size: 20pt; font-weight: 800; color: #0f172a; }
  .letter-honoraires-details { font-size: 9pt; color: #64748b; margin-top: 8px; }
  .letter-signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; break-inside: avoid; }
  .letter-signature-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
  .letter-signature-title { font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
  .letter-signature-name { font-weight: 600; color: #0f172a; margin-bottom: 4px; }
  .letter-signature-role { font-size: 9pt; color: #64748b; margin-bottom: 30px; }
  .letter-signature-line { border-bottom: 1px dashed #cbd5e1; height: 60px; margin-bottom: 8px; }
  .letter-signature-date { font-size: 9pt; color: #94a3b8; }
  .letter-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #94a3b8; text-align: center; }
`

export function generateLettreMissionHtml(data: LettreMissionData): string {
  const civiliteLabel = data.client.civilite === 'Mme' ? 'Madame' : data.client.civilite === 'M.' ? 'Monsieur' : 'Madame, Monsieur'
  const sectionCount = { n: 0 }
  const nextSection = () => { sectionCount.n++; return sectionCount.n }

  const builder = new PdfDocumentBuilder()
    .setMeta({ titre: `Lettre de Mission - ${data.client.prenom} ${data.client.nom}` })
    .addCustomStyles(LETTRE_STYLES)

  // Couverture
  builder.setCover({
    titre: 'Lettre de Mission',
    sousTitre: data.mission.objet,
    badge: 'Document contractuel',
    clientNom: `${data.client.prenom} ${data.client.nom}`,
    clientInfo: `Référence : ${data.reference}`,
    cabinetNom: data.cabinet.nom,
    date: data.date,
    reference: data.reference,
    conseillerNom: `${data.conseiller.prenom} ${data.conseiller.nom}`,
  })

  // Page 1 : En-tête lettre + Introduction + Périmètre
  const honorairesHtml = data.mission.honoraires ? `
    <div class="letter-section">
      <div class="letter-section-title">${nextSection()}. Honoraires</div>
      <div class="letter-honoraires">
        <div class="letter-honoraires-label">
          ${data.mission.honoraires.type === 'FORFAIT' ? 'Forfait de mission' :
            data.mission.honoraires.type === 'POURCENTAGE' ? 'Commission' : 'Taux horaire'}
        </div>
        <div class="letter-honoraires-value">
          ${data.mission.honoraires.type === 'POURCENTAGE'
            ? `${data.mission.honoraires.montant}%`
            : fmtEurPrecis(data.mission.honoraires.montant)}
          ${data.mission.honoraires.type === 'HORAIRE' ? ' HT / heure' : ' HT'}
        </div>
        ${data.mission.honoraires.details ? `<div class="letter-honoraires-details">${escapeHtml(data.mission.honoraires.details)}</div>` : ''}
      </div>
      <p style="font-size: 9pt; color: #64748b;">Ces honoraires s'entendent hors taxes. La TVA au taux en vigueur sera appliquée le cas échéant.</p>
    </div>` : ''

  builder.addChapter('', `
    <div class="letter-page" style="padding: 0;">
      <div class="letter-header">
        <div class="letter-sender">
          <div class="letter-sender-name">${escapeHtml(data.cabinet.nom)}</div>
          <div class="letter-sender-info">
            ${data.cabinet.adresse ? `${escapeHtml(data.cabinet.adresse)}<br>` : ''}
            ${data.cabinet.codePostal ? `${escapeHtml(data.cabinet.codePostal)} ` : ''}${escapeHtml(data.cabinet.ville || '')}<br>
            ${data.cabinet.telephone ? `Tél : ${escapeHtml(data.cabinet.telephone)}<br>` : ''}
            ${data.cabinet.email ? `Email : ${escapeHtml(data.cabinet.email)}<br>` : ''}
            ${data.cabinet.orias ? `<br>N° ORIAS : ${escapeHtml(data.cabinet.orias)}` : ''}
            ${data.cabinet.siret ? `<br>SIRET : ${escapeHtml(data.cabinet.siret)}` : ''}
          </div>
        </div>
        <div class="letter-recipient">
          <div class="letter-recipient-name">${data.client.civilite ? escapeHtml(data.client.civilite) + ' ' : ''}${escapeHtml(data.client.prenom)} ${escapeHtml(data.client.nom)}</div>
          <div class="letter-recipient-address">
            ${data.client.adresse ? `${escapeHtml(data.client.adresse)}<br>` : ''}
            ${data.client.codePostal ? `${escapeHtml(data.client.codePostal)} ` : ''}${escapeHtml(data.client.ville || '')}
          </div>
        </div>
      </div>

      <div class="letter-date">${escapeHtml(data.cabinet.ville || 'Fait')}, le ${fmtDateLongue(data.date)}</div>

      <div class="letter-object">
        <div class="letter-object-label">Objet</div>
        <div class="letter-object-value">Lettre de mission - ${escapeHtml(data.mission.objet)}</div>
      </div>

      <div class="letter-salutation">${civiliteLabel},</div>

      <div class="letter-body">
        <p>Nous avons l'honneur de vous confirmer notre accord concernant la mission de conseil que vous nous avez confiée. La présente lettre a pour objet de définir les modalités de notre intervention ainsi que les engagements réciproques des parties.</p>
      </div>

      <div class="letter-section">
        <div class="letter-section-title">${nextSection()}. Nature et périmètre de la mission</div>
        <p style="margin-bottom: 16px;">Dans le cadre de notre mission de <strong>${escapeHtml(data.mission.type)}</strong>, nous nous engageons à intervenir sur les domaines suivants :</p>
        <ul class="letter-list">
          ${data.mission.perimetre.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
        </ul>
        ${data.mission.duree ? `<p style="margin-top: 16px;"><strong>Durée de la mission :</strong> ${escapeHtml(data.mission.duree)}</p>` : ''}
      </div>

      ${honorairesHtml}
    </div>
  `, { noBreakBefore: true })

  // Page 2 : Obligations, confidentialité, conflits, signatures
  builder.addChapter('', `
    <div class="letter-page" style="padding: 0;">
      <div class="letter-section">
        <div class="letter-section-title">${nextSection()}. Obligations du conseiller</div>
        <ul class="letter-list">
          ${data.obligations.conseiller.map(o => `<li>${escapeHtml(o)}</li>`).join('')}
        </ul>
      </div>

      <div class="letter-section">
        <div class="letter-section-title">${nextSection()}. Obligations du client</div>
        <ul class="letter-list">
          ${data.obligations.client.map(o => `<li>${escapeHtml(o)}</li>`).join('')}
        </ul>
      </div>

      <div class="letter-section">
        <div class="letter-section-title">${nextSection()}. Confidentialité</div>
        <p>${escapeHtml(data.confidentialite)}</p>
      </div>

      ${data.conflitsInterets ? `
      <div class="letter-section">
        <div class="letter-section-title">${nextSection()}. Prévention des conflits d'intérêts</div>
        <p>${escapeHtml(data.conflitsInterets)}</p>
      </div>` : ''}

      <div class="letter-body" style="margin-top: 30px;">
        <p>Nous vous prions de bien vouloir nous retourner un exemplaire de la présente lettre, daté et signé, précédé de la mention manuscrite "Lu et approuvé, bon pour accord".</p>
        <p>Nous restons à votre disposition pour tout renseignement complémentaire et vous prions d'agréer, ${civiliteLabel}, l'expression de nos salutations distinguées.</p>
      </div>

      <div class="letter-signature-section">
        <div class="letter-signature-box">
          <div class="letter-signature-title">Le Conseiller</div>
          <div class="letter-signature-name">${escapeHtml(data.conseiller.prenom)} ${escapeHtml(data.conseiller.nom)}</div>
          <div class="letter-signature-role">${escapeHtml(data.conseiller.titre || 'Conseiller en Gestion de Patrimoine')}</div>
          <div class="letter-signature-line"></div>
          <div class="letter-signature-date">Signature</div>
        </div>
        <div class="letter-signature-box">
          <div class="letter-signature-title">Le Client</div>
          <div class="letter-signature-name">${escapeHtml(data.client.prenom)} ${escapeHtml(data.client.nom)}</div>
          <div class="letter-signature-role">Lu et approuvé, bon pour accord</div>
          <div class="letter-signature-line"></div>
          <div class="letter-signature-date">Date et signature</div>
        </div>
      </div>

      <div class="letter-footer">
        <p>${escapeHtml(data.cabinet.nom)} • ${data.cabinet.adresse ? escapeHtml(data.cabinet.adresse) + ' • ' : ''}${escapeHtml(data.cabinet.codePostal || '')} ${escapeHtml(data.cabinet.ville || '')}</p>
        ${data.cabinet.orias ? `<p>Conseiller en Investissements Financiers enregistré à l'ORIAS sous le n° ${escapeHtml(data.cabinet.orias)}</p>` : ''}
        <p style="margin-top: 8px;">Référence : ${escapeHtml(data.reference)}</p>
      </div>
    </div>
  `)

  return builder.build()
}

export default generateLettreMissionHtml
