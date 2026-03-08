/* eslint-disable @typescript-eslint/no-explicit-any */
import { PdfDocumentBuilder } from './pdf-document-builder'
import { fmtEurPrecis, fmtDateLongue, escapeHtml, statutToVariant, getBadgeColors } from './pdf-utils'
import { renderTable, type TableColumn } from './pdf-components'

export interface FactureData {
  numero: string
  date: Date
  dateEcheance: Date
  statut: 'BROUILLON' | 'ENVOYEE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE'
  emetteur: {
    nom: string
    adresse?: string
    codePostal?: string
    ville?: string
    siret?: string
    tva?: string
    email?: string
    telephone?: string
    iban?: string
    bic?: string
  }
  client: {
    nom: string
    prenom?: string
    societe?: string
    adresse?: string
    codePostal?: string
    ville?: string
    email?: string
  }
  lignes: Array<{
    description: string
    quantite: number
    prixUnitaire: number
    tva: number
    total: number
  }>
  sousTotal: number
  totalTVA: number
  totalTTC: number
  acompte?: number
  resteAPayer?: number
  conditions?: string
  notes?: string
  mentionsLegales?: string
}

function getStatutLabel(statut: string): string {
  switch (statut) {
    case 'PAYEE': return 'Payée'
    case 'ENVOYEE': return 'Envoyée'
    case 'EN_RETARD': return 'En retard'
    case 'ANNULEE': return 'Annulée'
    default: return 'Brouillon'
  }
}

/** CSS spécifique au format facture */
const FACTURE_STYLES = `
  .invoice-page { padding: 40px 50px; background: white; font-size: 10pt; }
  .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .invoice-emetteur { max-width: 250px; }
  .invoice-logo { width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24pt; font-weight: 800; margin-bottom: 16px; }
  .invoice-title-section { text-align: right; }
  .invoice-title { font-size: 32pt; font-weight: 800; color: #0f172a; letter-spacing: -1px; margin: 0; }
  .invoice-numero { font-size: 14pt; color: #64748b; margin-top: 8px; }
  .invoice-statut { display: inline-block; padding: 6px 16px; border-radius: 100px; font-size: 10pt; font-weight: 600; margin-top: 12px; }
  .invoice-parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
  .invoice-party-box { background: #f8fafc; border-radius: 12px; padding: 24px; }
  .invoice-party-label { font-size: 9pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
  .invoice-party-name { font-size: 14pt; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
  .invoice-party-info { font-size: 10pt; color: #475569; line-height: 1.6; }
  .invoice-dates { display: flex; gap: 40px; margin-bottom: 40px; }
  .invoice-date-item { display: flex; flex-direction: column; gap: 4px; }
  .invoice-date-label { font-size: 9pt; color: #94a3b8; text-transform: uppercase; }
  .invoice-date-value { font-size: 11pt; font-weight: 600; color: #0f172a; }
  .invoice-table { margin-bottom: 30px; }
  .invoice-totaux { display: flex; justify-content: flex-end; margin-bottom: 40px; }
  .invoice-totaux-box { width: 280px; }
  .invoice-total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
  .invoice-total-row.final { border-bottom: none; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; margin: 8px -16px -8px; padding: 16px; border-radius: 0 0 12px 12px; }
  .invoice-total-label { color: #64748b; }
  .invoice-total-row.final .invoice-total-label { color: rgba(255,255,255,0.8); }
  .invoice-total-value { font-weight: 600; }
  .invoice-total-row.final .invoice-total-value { font-size: 16pt; font-weight: 800; }
  .invoice-paiement { background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 30px; break-inside: avoid; }
  .invoice-paiement-title { font-size: 11pt; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
  .invoice-paiement-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-size: 10pt; }
  .invoice-paiement-item { display: flex; flex-direction: column; gap: 2px; }
  .invoice-paiement-label { font-size: 9pt; color: #94a3b8; }
  .invoice-paiement-value { font-weight: 500; color: #0f172a; font-family: monospace; }
  .invoice-footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #94a3b8; text-align: center; }
`

export function generateFactureHtml(data: FactureData): string {
  const badgeColors = getBadgeColors(statutToVariant(data.statut))
  const statutLabel = getStatutLabel(data.statut)

  const columns: TableColumn[] = [
    { key: 'description', label: 'Description', width: '45%', cellClass: 'td-main' },
    { key: 'quantite', label: 'Qté', align: 'center' },
    { key: 'prixUnitaire', label: 'Prix unitaire HT', align: 'right', format: (v: number) => fmtEurPrecis(v) },
    { key: 'tva', label: 'TVA', align: 'center', format: (v: number) => `${v}%` },
    { key: 'total', label: 'Total HT', align: 'right', format: (v: number) => fmtEurPrecis(v) },
  ]

  const lignesTableHtml = renderTable(columns, data.lignes)

  const builder = new PdfDocumentBuilder()
    .setMeta({ titre: `Facture ${data.numero}` })
    .addCustomStyles(FACTURE_STYLES)

  // Facture : pas de couverture pleine page, contenu direct
  builder.addChapter('', `
    <div class="invoice-page" style="padding: 0;">
      <div class="invoice-header">
        <div class="invoice-emetteur">
          <div class="invoice-logo">${escapeHtml(data.emetteur.nom.charAt(0))}</div>
          <div style="font-size: 14pt; font-weight: 700; color: #0f172a; margin-bottom: 8px;">${escapeHtml(data.emetteur.nom)}</div>
          <div style="font-size: 9pt; color: #64748b; line-height: 1.6;">
            ${data.emetteur.adresse ? escapeHtml(data.emetteur.adresse) + '<br>' : ''}
            ${data.emetteur.codePostal ? escapeHtml(data.emetteur.codePostal) + ' ' : ''}${escapeHtml(data.emetteur.ville || '')}<br>
            ${data.emetteur.siret ? 'SIRET : ' + escapeHtml(data.emetteur.siret) + '<br>' : ''}
            ${data.emetteur.tva ? 'TVA : ' + escapeHtml(data.emetteur.tva) : ''}
          </div>
        </div>
        <div class="invoice-title-section">
          <h1 class="invoice-title">FACTURE</h1>
          <div class="invoice-numero">${escapeHtml(data.numero)}</div>
          <div class="invoice-statut" style="background: ${badgeColors.bg}; color: ${badgeColors.color};">${statutLabel}</div>
        </div>
      </div>

      <div class="invoice-parties">
        <div class="invoice-party-box">
          <div class="invoice-party-label">Émetteur</div>
          <div class="invoice-party-name">${escapeHtml(data.emetteur.nom)}</div>
          <div class="invoice-party-info">
            ${data.emetteur.email ? escapeHtml(data.emetteur.email) + '<br>' : ''}
            ${escapeHtml(data.emetteur.telephone || '')}
          </div>
        </div>
        <div class="invoice-party-box">
          <div class="invoice-party-label">Facturé à</div>
          <div class="invoice-party-name">${escapeHtml(data.client.societe || (data.client.prenom ? data.client.prenom + ' ' : '') + data.client.nom)}</div>
          <div class="invoice-party-info">
            ${data.client.adresse ? escapeHtml(data.client.adresse) + '<br>' : ''}
            ${data.client.codePostal ? escapeHtml(data.client.codePostal) + ' ' : ''}${escapeHtml(data.client.ville || '')}<br>
            ${escapeHtml(data.client.email || '')}
          </div>
        </div>
      </div>

      <div class="invoice-dates">
        <div class="invoice-date-item">
          <span class="invoice-date-label">Date de facturation</span>
          <span class="invoice-date-value">${fmtDateLongue(data.date)}</span>
        </div>
        <div class="invoice-date-item">
          <span class="invoice-date-label">Date d'échéance</span>
          <span class="invoice-date-value">${fmtDateLongue(data.dateEcheance)}</span>
        </div>
      </div>

      <div class="invoice-table">${lignesTableHtml}</div>

      <div class="invoice-totaux">
        <div class="invoice-totaux-box card" style="padding: 16px;">
          <div class="invoice-total-row">
            <span class="invoice-total-label">Sous-total HT</span>
            <span class="invoice-total-value">${fmtEurPrecis(data.sousTotal)}</span>
          </div>
          <div class="invoice-total-row">
            <span class="invoice-total-label">TVA</span>
            <span class="invoice-total-value">${fmtEurPrecis(data.totalTVA)}</span>
          </div>
          ${data.acompte ? `
            <div class="invoice-total-row">
              <span class="invoice-total-label">Acompte versé</span>
              <span class="invoice-total-value" style="color: #10b981;">- ${fmtEurPrecis(data.acompte)}</span>
            </div>
          ` : ''}
          <div class="invoice-total-row final">
            <span class="invoice-total-label">${data.acompte ? 'Reste à payer' : 'Total TTC'}</span>
            <span class="invoice-total-value">${fmtEurPrecis(data.resteAPayer || data.totalTTC)}</span>
          </div>
        </div>
      </div>

      ${data.emetteur.iban ? `
      <div class="invoice-paiement">
        <div class="invoice-paiement-title">💳 Informations de paiement</div>
        <div class="invoice-paiement-info">
          <div class="invoice-paiement-item">
            <span class="invoice-paiement-label">IBAN</span>
            <span class="invoice-paiement-value">${escapeHtml(data.emetteur.iban)}</span>
          </div>
          ${data.emetteur.bic ? `
            <div class="invoice-paiement-item">
              <span class="invoice-paiement-label">BIC</span>
              <span class="invoice-paiement-value">${escapeHtml(data.emetteur.bic)}</span>
            </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      ${data.conditions ? `
      <div style="margin-bottom: 20px;">
        <div style="font-size: 10pt; font-weight: 600; color: #0f172a; margin-bottom: 8px;">Conditions de paiement</div>
        <p style="font-size: 9pt; color: #64748b; line-height: 1.6;">${escapeHtml(data.conditions)}</p>
      </div>
      ` : ''}

      ${data.notes ? `
      <div style="margin-bottom: 20px;">
        <div style="font-size: 10pt; font-weight: 600; color: #0f172a; margin-bottom: 8px;">Notes</div>
        <p style="font-size: 9pt; color: #64748b; line-height: 1.6;">${escapeHtml(data.notes)}</p>
      </div>
      ` : ''}

      <div class="invoice-footer">
        <p>${escapeHtml(data.emetteur.nom)} • ${data.emetteur.adresse ? escapeHtml(data.emetteur.adresse) + ' • ' : ''}${escapeHtml(data.emetteur.codePostal || '')} ${escapeHtml(data.emetteur.ville || '')}</p>
        ${data.emetteur.siret ? `<p>SIRET : ${escapeHtml(data.emetteur.siret)}${data.emetteur.tva ? ' • TVA : ' + escapeHtml(data.emetteur.tva) : ''}</p>` : ''}
        ${data.mentionsLegales ? `<p style="margin-top: 8px;">${escapeHtml(data.mentionsLegales)}</p>` : ''}
      </div>
    </div>
  `, { noBreakBefore: true })

  return builder.build()
}

export default generateFactureHtml
