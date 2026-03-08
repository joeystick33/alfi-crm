/* eslint-disable @typescript-eslint/no-explicit-any */
import { PdfDocumentBuilder } from './pdf-document-builder'
import { fmtDateLongue, escapeHtml } from './pdf-utils'
import { renderSignature } from './pdf-components'

export interface EntreeRelationData {
  reference: string
  date: Date
  client: {
    civilite?: string
    nom: string
    prenom: string
    dateNaissance?: Date | string
    lieuNaissance?: string
    nationalite?: string
    adresse?: string
    codePostal?: string
    ville?: string
    email?: string
    telephone?: string
    profession?: string
    situationFamiliale?: string
    regimeMatrimonial?: string
  }
  conseiller: {
    nom: string
    prenom: string
    email?: string
    telephone?: string
    titre?: string
    numCIF?: string
    numOrias?: string
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
    rcPro?: string
    mediateur?: string
  }
  // Informations réglementaires
  statuts: {
    cif?: boolean       // Conseil en Investissements Financiers
    iobsp?: boolean     // Courtier en crédit
    ias?: boolean       // Courtier en assurance
    cjA?: boolean       // Compétence Juridique Appropriée
    dpmFi?: boolean     // Démarchage produits financiers
  }
  remuneration: {
    honoraires?: boolean
    commissions?: boolean
    retrocessions?: boolean
    description?: string
  }
  conflitsInterets?: string
  reclamation?: {
    procedure?: string
    mediateur?: string
    contact?: string
  }
}


// CSS spécifique au document d'entrée en relation
const derStyles = `
  .der-section { margin-bottom: 24px; page-break-inside: avoid; }
  .der-section h2 { font-size: 14px; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #2B7A78; padding-bottom: 6px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .der-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .der-table td { padding: 6px 10px; border: 1px solid #e2e8f0; vertical-align: top; }
  .der-table td:first-child { background: #f8fafc; font-weight: 600; width: 35%; color: #475569; }
  .der-legal { font-size: 9px; color: #64748b; line-height: 1.5; margin-top: 16px; }
  .der-check { display: inline-block; width: 12px; height: 12px; border: 1px solid #94a3b8; margin-right: 6px; vertical-align: middle; text-align: center; font-size: 9px; line-height: 12px; }
  .der-check.checked { background: #2B7A78; color: white; border-color: #2B7A78; }
  .der-header { text-align: center; margin-bottom: 30px; }
  .der-header h1 { font-size: 20px; color: #1e3a5f; margin: 0 0 4px; }
  .der-header .subtitle { font-size: 12px; color: #64748b; }
  .der-header .ref { font-size: 10px; color: #94a3b8; margin-top: 8px; }
`

export function generateEntreeRelationHtml(data: EntreeRelationData): string {
  const { client, conseiller, cabinet, statuts, remuneration } = data

  const builder = new PdfDocumentBuilder()
    .setMeta({ titre: `Document d'entrée en relation — ${client.prenom} ${client.nom}` })
    .addCustomStyles(derStyles)

  // Corps du document (pas de couverture pleine page pour ce type réglementaire)
  const bodyHtml = `
  <div style="max-width: 800px; margin: 0 auto; padding: 40px 30px; font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b;">

    <!-- En-tête cabinet -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
      <div>
        <div style="font-size: 18px; font-weight: 700; color: #1e3a5f;">${escapeHtml(cabinet.nom)}</div>
        ${cabinet.adresse ? `<div style="font-size: 10px; color: #64748b;">${escapeHtml(cabinet.adresse)}${cabinet.codePostal ? `, ${escapeHtml(cabinet.codePostal)}` : ''}${cabinet.ville ? ` ${escapeHtml(cabinet.ville)}` : ''}</div>` : ''}
        ${cabinet.telephone ? `<div style="font-size: 10px; color: #64748b;">Tél : ${escapeHtml(cabinet.telephone)}</div>` : ''}
        ${cabinet.email ? `<div style="font-size: 10px; color: #64748b;">${escapeHtml(cabinet.email)}</div>` : ''}
        ${cabinet.siret ? `<div style="font-size: 9px; color: #94a3b8;">SIRET : ${escapeHtml(cabinet.siret)}</div>` : ''}
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10px; color: #64748b;">${fmtDateLongue(data.date)}</div>
        <div style="font-size: 9px; color: #94a3b8;">Réf. ${escapeHtml(data.reference)}</div>
      </div>
    </div>

    <!-- Titre -->
    <div class="der-header">
      <h1>DOCUMENT D'ENTRÉE EN RELATION</h1>
      <div class="subtitle">Conformément aux articles L.541-8-1, D.325-3 et R.519-20 du Code Monétaire et Financier</div>
      <div class="ref">et aux directives MIF II (2014/65/UE) et DDA (2016/97/UE)</div>
    </div>

    <!-- 1. Présentation du cabinet -->
    <div class="der-section">
      <h2>1. Présentation du cabinet et du conseiller</h2>
      <table class="der-table">
        <tr><td>Cabinet</td><td>${escapeHtml(cabinet.nom)}</td></tr>
        ${cabinet.siret ? `<tr><td>SIRET</td><td>${escapeHtml(cabinet.siret)}</td></tr>` : ''}
        ${cabinet.orias ? `<tr><td>N° ORIAS</td><td>${escapeHtml(cabinet.orias)} — <a href="https://www.orias.fr" style="color:#2B7A78;">vérifiable sur www.orias.fr</a></td></tr>` : ''}
        ${cabinet.rcPro ? `<tr><td>RC Professionnelle</td><td>${escapeHtml(cabinet.rcPro)}</td></tr>` : ''}
        <tr><td>Conseiller</td><td>${escapeHtml(conseiller.prenom)} ${escapeHtml(conseiller.nom)}${conseiller.titre ? ` — ${escapeHtml(conseiller.titre)}` : ''}</td></tr>
        ${conseiller.email ? `<tr><td>Email conseiller</td><td>${escapeHtml(conseiller.email)}</td></tr>` : ''}
        ${conseiller.telephone ? `<tr><td>Téléphone conseiller</td><td>${escapeHtml(conseiller.telephone)}</td></tr>` : ''}
      </table>
    </div>

    <!-- 2. Statuts réglementaires -->
    <div class="der-section">
      <h2>2. Statuts réglementaires</h2>
      <table class="der-table">
        <tr>
          <td>Conseil en Investissements Financiers (CIF)</td>
          <td><span class="der-check ${statuts.cif ? 'checked' : ''}">${statuts.cif ? '\u2713' : ''}</span> ${statuts.cif ? 'Oui — Membre d\'une association agréée AMF' : 'Non concerné'}</td>
        </tr>
        <tr>
          <td>Courtier en opérations de banque (IOBSP)</td>
          <td><span class="der-check ${statuts.iobsp ? 'checked' : ''}">${statuts.iobsp ? '\u2713' : ''}</span> ${statuts.iobsp ? 'Oui — Catégorie courtier' : 'Non concerné'}</td>
        </tr>
        <tr>
          <td>Courtier en assurance (IAS)</td>
          <td><span class="der-check ${statuts.ias ? 'checked' : ''}">${statuts.ias ? '\u2713' : ''}</span> ${statuts.ias ? 'Oui' : 'Non concerné'}</td>
        </tr>
        <tr>
          <td>Compétence Juridique Appropriée</td>
          <td><span class="der-check ${statuts.cjA ? 'checked' : ''}">${statuts.cjA ? '\u2713' : ''}</span> ${statuts.cjA ? 'Oui — Art. L. 541-10 CMF' : 'Non'}</td>
        </tr>
      </table>
    </div>

    <!-- 3. Nature de la rémunération -->
    <div class="der-section">
      <h2>3. Mode de rémunération</h2>
      <p style="font-size: 11px; margin-bottom: 8px;">Le cabinet perçoit sa rémunération sous les formes suivantes :</p>
      <table class="der-table">
        <tr>
          <td>Honoraires de conseil</td>
          <td><span class="der-check ${remuneration.honoraires ? 'checked' : ''}">${remuneration.honoraires ? '\u2713' : ''}</span> ${remuneration.honoraires ? 'Oui — Facturés directement au client' : 'Non'}</td>
        </tr>
        <tr>
          <td>Commissions sur produits</td>
          <td><span class="der-check ${remuneration.commissions ? 'checked' : ''}">${remuneration.commissions ? '\u2713' : ''}</span> ${remuneration.commissions ? 'Oui — Versées par les fournisseurs de produits' : 'Non'}</td>
        </tr>
        <tr>
          <td>Rétrocessions</td>
          <td><span class="der-check ${remuneration.retrocessions ? 'checked' : ''}">${remuneration.retrocessions ? '\u2713' : ''}</span> ${remuneration.retrocessions ? 'Oui — Rétrocessions sur encours' : 'Non'}</td>
        </tr>
        ${remuneration.description ? `<tr><td>Précisions</td><td>${escapeHtml(remuneration.description)}</td></tr>` : ''}
      </table>
      <div class="der-legal">
        Le détail des rémunérations perçues sera communiqué avant chaque opération, conformément à la directive MIF II.
        Les rétrocessions seront détaillées annuellement dans le rapport d'adéquation.
      </div>
    </div>

    <!-- 4. Gestion des conflits d'intérêts -->
    <div class="der-section">
      <h2>4. Politique de gestion des conflits d'intérêts</h2>
      <p style="font-size: 11px;">
        ${escapeHtml(data.conflitsInterets || `Le cabinet ${cabinet.nom} a mis en place une politique de gestion des conflits d'intérêts conformément aux articles 313-18 à 313-24 du Règlement Général de l'AMF. Cette politique est disponible sur demande. Le cabinet s'engage à agir de manière honnête, loyale et professionnelle, au mieux des intérêts du client.`)}
      </p>
    </div>

    <!-- 5. Réclamations -->
    <div class="der-section">
      <h2>5. Procédure de réclamation</h2>
      <p style="font-size: 11px;">Toute réclamation peut être adressée :</p>
      <ul style="font-size: 11px; padding-left: 20px;">
        <li>Par courrier : ${escapeHtml(cabinet.adresse || cabinet.nom)}${cabinet.codePostal ? `, ${escapeHtml(cabinet.codePostal)}` : ''}${cabinet.ville ? ` ${escapeHtml(cabinet.ville)}` : ''}</li>
        ${cabinet.email ? `<li>Par email : ${escapeHtml(cabinet.email)}</li>` : ''}
      </ul>
      <p style="font-size: 11px; margin-top: 8px;">En cas de réponse insatisfaisante dans un délai de 2 mois, le client peut saisir le Médiateur :</p>
      <p style="font-size: 11px; font-weight: 600;">
        ${escapeHtml(data.reclamation?.mediateur || cabinet.mediateur || 'Médiateur de l\'AMF — 17, place de la Bourse, 75082 Paris Cedex 02 — www.amf-france.org')}
      </p>
    </div>

    <!-- 6. Identification du client -->
    <div class="der-section">
      <h2>6. Identification du client</h2>
      <table class="der-table">
        <tr><td>Nom</td><td>${client.civilite ? escapeHtml(client.civilite) + ' ' : ''}${escapeHtml(client.prenom)} ${escapeHtml(client.nom)}</td></tr>
        ${client.dateNaissance ? `<tr><td>Date de naissance</td><td>${fmtDateLongue(client.dateNaissance)}</td></tr>` : ''}
        ${client.lieuNaissance ? `<tr><td>Lieu de naissance</td><td>${escapeHtml(client.lieuNaissance)}</td></tr>` : ''}
        ${client.nationalite ? `<tr><td>Nationalité</td><td>${escapeHtml(client.nationalite)}</td></tr>` : ''}
        ${client.adresse ? `<tr><td>Adresse</td><td>${escapeHtml(client.adresse)}${client.codePostal ? `, ${escapeHtml(client.codePostal)}` : ''}${client.ville ? ` ${escapeHtml(client.ville)}` : ''}</td></tr>` : ''}
        ${client.email ? `<tr><td>Email</td><td>${escapeHtml(client.email)}</td></tr>` : ''}
        ${client.telephone ? `<tr><td>Téléphone</td><td>${escapeHtml(client.telephone)}</td></tr>` : ''}
        ${client.profession ? `<tr><td>Profession</td><td>${escapeHtml(client.profession)}</td></tr>` : ''}
        ${client.situationFamiliale ? `<tr><td>Situation familiale</td><td>${escapeHtml(client.situationFamiliale)}</td></tr>` : ''}
      </table>
    </div>

    <!-- 7. Prise de connaissance -->
    <div class="der-section">
      <h2>7. Accusé de réception</h2>
      <p style="font-size: 11px;">
        Je soussigné(e) ${client.civilite ? escapeHtml(client.civilite) + ' ' : ''}${escapeHtml(client.prenom)} ${escapeHtml(client.nom)}, 
        reconnais avoir reçu, préalablement à toute prestation de conseil, le présent document d'entrée en relation.
        J'ai pris connaissance des informations relatives au statut du cabinet, à ses modes de rémunération,
        à sa politique de gestion des conflits d'intérêts et à la procédure de réclamation.
      </p>
    </div>

    <!-- Signatures -->
    ${renderSignature({
      conseillerNom: `${conseiller.prenom} ${conseiller.nom}`,
      conseillerTitre: conseiller.titre,
      clientNom: `${client.prenom} ${client.nom}`,
      date: data.date,
      mention: 'Lu et approuvé',
    })}

    <!-- Mentions légales -->
    <div class="der-legal" style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
      <p>Document établi conformément aux articles L.541-8-1, D.325-3 et R.519-20 du Code Monétaire et Financier, 
      à la directive 2014/65/UE (MIF II) et à la directive 2016/97/UE (DDA).</p>
      <p>Autorité de contrôle : AMF (Autorité des Marchés Financiers) — 17, place de la Bourse, 75082 Paris Cedex 02</p>
      <p>ACPR (Autorité de Contrôle Prudentiel et de Résolution) — 4, place de Budapest, CS 92459, 75436 Paris Cedex 09</p>
    </div>

  </div>`

  builder.addRawContent(bodyHtml)
  return builder.build()
}
