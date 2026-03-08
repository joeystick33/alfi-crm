/* eslint-disable @typescript-eslint/no-explicit-any */
import { PdfDocumentBuilder } from './pdf-document-builder'
import { fmtEur, fmtDateLongue, escapeHtml } from './pdf-utils'
import { renderSignature } from './pdf-components'

export interface DeclarationAdequationData {
  reference: string
  date: Date
  client: {
    civilite?: string
    nom: string
    prenom: string
    dateNaissance?: Date | string
    adresse?: string
    codePostal?: string
    ville?: string
    email?: string
    telephone?: string
    situationFamiliale?: string
    regimeMatrimonial?: string
    profession?: string
    revenuAnnuel?: number
    patrimoineTotal?: number
    capaciteEpargne?: number
    endettement?: number
  }
  conseiller: {
    nom: string
    prenom: string
    titre?: string
  }
  cabinet: {
    nom: string
    adresse?: string
    codePostal?: string
    ville?: string
    orias?: string
  }
  // Profil investisseur (MIF II)
  profilInvestisseur: {
    objectifs: string[]
    horizonPlacement: string
    toleranceRisque: 'PRUDENT' | 'EQUILIBRE' | 'DYNAMIQUE' | 'OFFENSIF'
    connaissancesFinancieres: 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE' | 'EXPERT'
    experienceInvestissement?: string
    capacitePertes?: string
  }
  // Analyse des besoins
  analyseBesoins: {
    objectifPrincipal: string
    contraintes: string[]
    horizonTemporel: string
    besoinLiquidite?: string
    fiscalite?: string
  }
  // Recommandations
  recommandations: Array<{
    produit: string
    type: string
    fournisseur?: string
    montant?: number
    description: string
    avantages: string[]
    risques: string[]
    frais?: string
    adequation: string
  }>
  // Alternatives étudiées mais non retenues
  alternativesEcartees?: Array<{
    produit: string
    motifRejet: string
  }>
  // Avertissements
  avertissements?: string[]
}

function fmtEurOu(value: number | undefined): string {
  if (!value) return 'Non renseigné'
  return fmtEur(value)
}

const RISQUE_LABELS: Record<string, string> = {
  PRUDENT: 'Prudent — Priorité à la sécurité du capital',
  EQUILIBRE: 'Équilibré — Compromis rendement/risque',
  DYNAMIQUE: 'Dynamique — Accepte une volatilité significative',
  OFFENSIF: 'Offensif — Recherche de performance maximale',
}

const CONNAISSANCE_LABELS: Record<string, string> = {
  DEBUTANT: 'Débutant — Connaissances limitées',
  INTERMEDIAIRE: 'Intermédiaire — Connaissances de base',
  AVANCE: 'Avancé — Bonne maîtrise des produits financiers',
  EXPERT: 'Expert — Maîtrise approfondie',
}

// CSS spécifique à la déclaration d'adéquation
const daStyles = `
  .da-section { margin-bottom: 24px; page-break-inside: avoid; }
  .da-section h2 { font-size: 14px; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #D4A84B; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .da-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .da-table td, .da-table th { padding: 6px 10px; border: 1px solid #e2e8f0; vertical-align: top; }
  .da-table td:first-child { background: #f8fafc; font-weight: 600; width: 35%; color: #475569; }
  .da-legal { font-size: 9px; color: #64748b; line-height: 1.5; }
  .da-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
  .da-badge-green { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  .da-badge-blue { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
  .da-badge-amber { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
`

export function generateDeclarationAdequationHtml(data: DeclarationAdequationData): string {
  const { client, conseiller, cabinet, profilInvestisseur, analyseBesoins, recommandations } = data

  const builder = new PdfDocumentBuilder()
    .setMeta({ titre: `Déclaration d'adéquation — ${client.prenom} ${client.nom}` })
    .addCustomStyles(daStyles)

  const recommandationsHtml = recommandations.map((r, i) => `
    <div class="da-reco" style="margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; page-break-inside: avoid;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h3 style="font-size: 13px; font-weight: 700; color: #1e3a5f; margin: 0;">Recommandation ${i + 1} : ${escapeHtml(r.produit)}</h3>
        ${r.montant ? `<span style="font-size: 12px; font-weight: 700; color: #2B7A78;">${fmtEurOu(r.montant)}</span>` : ''}
      </div>
      <table class="da-table" style="margin-bottom: 8px;">
        <tr><td>Type</td><td>${escapeHtml(r.type)}</td></tr>
        ${r.fournisseur ? `<tr><td>Fournisseur</td><td>${escapeHtml(r.fournisseur)}</td></tr>` : ''}
        <tr><td>Description</td><td>${escapeHtml(r.description)}</td></tr>
        ${r.frais ? `<tr><td>Frais</td><td>${escapeHtml(r.frais)}</td></tr>` : ''}
      </table>
      <div style="display: flex; gap: 16px; margin-bottom: 8px;">
        <div style="flex: 1;">
          <div style="font-size: 10px; font-weight: 600; color: #166534; margin-bottom: 4px;">AVANTAGES</div>
          <ul style="font-size: 10px; padding-left: 16px; margin: 0; color: #166534;">
            ${r.avantages.map(a => `<li>${escapeHtml(a)}</li>`).join('')}
          </ul>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 10px; font-weight: 600; color: #991b1b; margin-bottom: 4px;">RISQUES</div>
          <ul style="font-size: 10px; padding-left: 16px; margin: 0; color: #991b1b;">
            ${r.risques.map(ri => `<li>${escapeHtml(ri)}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 8px; font-size: 10px;">
        <strong style="color: #166534;">Justification d'adéquation :</strong> ${escapeHtml(r.adequation)}
      </div>
    </div>
  `).join('')

  const alternativesHtml = data.alternativesEcartees?.length ? `
    <div class="da-section">
      <h2>6. Alternatives étudiées et non retenues</h2>
      <table class="da-table">
        <thead><tr><th style="text-align:left;padding:6px;background:#f1f5f9;font-size:10px;">Produit</th><th style="text-align:left;padding:6px;background:#f1f5f9;font-size:10px;">Motif de non-sélection</th></tr></thead>
        <tbody>
          ${data.alternativesEcartees.map(a => `<tr><td>${escapeHtml(a.produit)}</td><td>${escapeHtml(a.motifRejet)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  ` : ''

  const bodyHtml = `
  <div style="max-width: 800px; margin: 0 auto; padding: 40px 30px; font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b;">

    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div>
        <div style="font-size: 18px; font-weight: 700; color: #1e3a5f;">${escapeHtml(cabinet.nom)}</div>
        ${cabinet.orias ? `<div style="font-size: 9px; color: #94a3b8;">ORIAS : ${escapeHtml(cabinet.orias)}</div>` : ''}
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10px; color: #64748b;">${fmtDateLongue(data.date)}</div>
        <div style="font-size: 9px; color: #94a3b8;">Réf. ${escapeHtml(data.reference)}</div>
      </div>
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 20px; color: #1e3a5f; margin: 0 0 4px;">DÉCLARATION D'ADÉQUATION</h1>
      <div style="font-size: 12px; color: #64748b;">Articles L.541-8-1 CMF et directive MIF II (2014/65/UE)</div>
    </div>

    <div class="da-section">
      <h2>1. Identification du client</h2>
      <table class="da-table">
        <tr><td>Nom</td><td>${client.civilite ? escapeHtml(client.civilite) + ' ' : ''}${escapeHtml(client.prenom)} ${escapeHtml(client.nom)}</td></tr>
        ${client.dateNaissance ? `<tr><td>Date de naissance</td><td>${fmtDateLongue(client.dateNaissance)}</td></tr>` : ''}
        ${client.situationFamiliale ? `<tr><td>Situation familiale</td><td>${escapeHtml(client.situationFamiliale)}${client.regimeMatrimonial ? ` — ${escapeHtml(client.regimeMatrimonial)}` : ''}</td></tr>` : ''}
        ${client.profession ? `<tr><td>Profession</td><td>${escapeHtml(client.profession)}</td></tr>` : ''}
        ${client.revenuAnnuel ? `<tr><td>Revenus annuels</td><td>${fmtEurOu(client.revenuAnnuel)}</td></tr>` : ''}
        ${client.patrimoineTotal ? `<tr><td>Patrimoine total estimé</td><td>${fmtEurOu(client.patrimoineTotal)}</td></tr>` : ''}
        ${client.capaciteEpargne ? `<tr><td>Capacité d'épargne mensuelle</td><td>${fmtEurOu(client.capaciteEpargne)}</td></tr>` : ''}
        ${client.endettement ? `<tr><td>Taux d'endettement</td><td>${client.endettement}%</td></tr>` : ''}
      </table>
    </div>

    <div class="da-section">
      <h2>2. Profil investisseur (MIF II)</h2>
      <table class="da-table">
        <tr><td>Objectifs d'investissement</td><td>${profilInvestisseur.objectifs.map(o => escapeHtml(o)).join(', ')}</td></tr>
        <tr><td>Horizon de placement</td><td>${escapeHtml(profilInvestisseur.horizonPlacement)}</td></tr>
        <tr><td>Tolérance au risque</td><td><span class="da-badge ${profilInvestisseur.toleranceRisque === 'PRUDENT' ? 'da-badge-green' : profilInvestisseur.toleranceRisque === 'OFFENSIF' ? 'da-badge-amber' : 'da-badge-blue'}">${RISQUE_LABELS[profilInvestisseur.toleranceRisque] || profilInvestisseur.toleranceRisque}</span></td></tr>
        <tr><td>Connaissances financières</td><td>${CONNAISSANCE_LABELS[profilInvestisseur.connaissancesFinancieres] || profilInvestisseur.connaissancesFinancieres}</td></tr>
        ${profilInvestisseur.experienceInvestissement ? `<tr><td>Expérience</td><td>${escapeHtml(profilInvestisseur.experienceInvestissement)}</td></tr>` : ''}
        ${profilInvestisseur.capacitePertes ? `<tr><td>Capacité à supporter des pertes</td><td>${escapeHtml(profilInvestisseur.capacitePertes)}</td></tr>` : ''}
      </table>
    </div>

    <div class="da-section">
      <h2>3. Analyse des besoins et objectifs</h2>
      <table class="da-table">
        <tr><td>Objectif principal</td><td><strong>${escapeHtml(analyseBesoins.objectifPrincipal)}</strong></td></tr>
        <tr><td>Horizon temporel</td><td>${escapeHtml(analyseBesoins.horizonTemporel)}</td></tr>
        ${analyseBesoins.contraintes.length > 0 ? `<tr><td>Contraintes identifiées</td><td><ul style="margin:0;padding-left:16px;">${analyseBesoins.contraintes.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul></td></tr>` : ''}
        ${analyseBesoins.besoinLiquidite ? `<tr><td>Besoin de liquidité</td><td>${escapeHtml(analyseBesoins.besoinLiquidite)}</td></tr>` : ''}
        ${analyseBesoins.fiscalite ? `<tr><td>Contrainte fiscale</td><td>${escapeHtml(analyseBesoins.fiscalite)}</td></tr>` : ''}
      </table>
    </div>

    <div class="da-section">
      <h2>4. Nature du conseil</h2>
      <p style="font-size: 11px;">
        Le présent conseil est formulé à titre <strong>non indépendant</strong> au sens de la directive MIF II (art. 24§7).
        Le cabinet ${escapeHtml(cabinet.nom)} perçoit des rémunérations de la part de fournisseurs de produits sous forme de commissions
        et/ou rétrocessions, qui contribuent à améliorer la qualité du service rendu au client.
        Le détail de ces rémunérations est communiqué ci-après pour chaque recommandation.
      </p>
    </div>

    <div class="da-section">
      <h2>5. Recommandations personnalisées</h2>
      <p style="font-size: 11px; margin-bottom: 12px;">
        Sur la base de l'analyse de votre situation, de vos objectifs et de votre profil de risque,
        nous vous recommandons les solutions suivantes :
      </p>
      ${recommandationsHtml}
    </div>

    ${alternativesHtml}

    ${data.avertissements?.length ? `
    <div class="da-section">
      <h2>${data.alternativesEcartees?.length ? '7' : '6'}. Avertissements</h2>
      <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 12px;">
        <ul style="font-size: 11px; margin: 0; padding-left: 16px; color: #92400e;">
          ${data.avertissements.map(a => `<li style="margin-bottom: 4px;">${escapeHtml(a)}</li>`).join('')}
        </ul>
      </div>
    </div>
    ` : ''}

    ${renderSignature({
      conseillerNom: `${conseiller.prenom} ${conseiller.nom}`,
      conseillerTitre: conseiller.titre,
      clientNom: `${client.prenom} ${client.nom}`,
      date: data.date,
      mention: 'Lu et approuvé, je reconnais avoir reçu les informations sur les risques',
    })}

    <div class="da-legal" style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
      <p>Document établi conformément aux articles L.541-8-1 du CMF et à la directive MIF II (2014/65/UE).
      Les performances passées ne préjugent pas des performances futures. Tout investissement comporte un risque de perte en capital.</p>
    </div>

  </div>`

  builder.addRawContent(bodyHtml)
  return builder.build()
}
