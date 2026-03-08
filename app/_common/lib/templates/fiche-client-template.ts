/* eslint-disable @typescript-eslint/no-explicit-any */
import { PdfDocumentBuilder } from './pdf-document-builder'
import { generateDonutChart } from './pdf-styles-premium'
import { fmtEur, fmtDateLongue, fmtPctFromDecimal, escapeHtml, valOu } from './pdf-utils'
import {
  renderKpiRow,
  renderTable,
  renderBadge,
  renderEncadre,
  type TableColumn,
} from './pdf-components'

export interface FicheClientData {
  client: {
    id: string
    civilite?: string
    nom: string
    prenom: string
    nomUsage?: string
    dateNaissance?: Date | null
    age?: number
    lieuNaissance?: string
    nationalite?: string
    situationFamiliale?: string
    regimeMatrimonial?: string
    enfants?: number
    personnesACharge?: number
    profession?: string
    categorieProfession?: string
    employeur?: string
    typeContrat?: string
    secteurActivite?: string
    revenuAnnuel?: number
    email?: string
    telephone?: string
    mobile?: string
    adresse?: string
    codePostal?: string
    ville?: string
    pays?: string
    residenceFiscale?: string
    dateCreation?: Date
    segmentation?: string
    conseillerId?: string
    profilRisque?: string
    horizonInvestissement?: string
    kycStatus?: string
    isPEP?: boolean
    origineDesFonds?: string
  }
  conseiller?: {
    nom: string
    prenom: string
    email?: string
    telephone?: string
  }
  cabinet?: {
    nom: string
    adresse?: string
    telephone?: string
    email?: string
    siret?: string
    orias?: string
  }
  patrimoine?: {
    totalActifs: number
    totalPassifs: number
    patrimoineNet: number
    repartition: Array<{ label: string; value: number; color: string }>
    actifs?: Array<{
      categorie: string
      type: string
      nom: string
      valeur: number
      description?: string
    }>
    passifs?: Array<{
      type: string
      nom: string
      capitalInitial: number
      capitalRestant: number
      mensualite: number
      taux: number
      dateDebut: Date
      dateFin: Date
    }>
  }
  famille?: Array<{
    relation: string
    prenom: string
    nom?: string
    dateNaissance?: Date | null
    aCharge?: boolean
  }>
  fiscalite?: {
    trancheMarginal?: string
    tauxIR?: number
    assujettIFI?: boolean
    montantIFI?: number
  }
  revenus?: {
    total: number
    details?: Array<{ type: string; montant: number }>
  }
  objectifs?: Array<{
    titre: string
    description?: string
    echeance?: Date | string | null
    priorite?: string
    montantCible?: number
    statut?: string
  }>
  contrats?: Array<{
    type: string
    assureur?: string
    numero?: string
    statut: string
    dateOuverture?: Date | null
    valeur?: number
  }>
  documents?: {
    total: number
    parType: Array<{ type: string; count: number }>
  }
  dernieresActivites?: Array<{
    date: Date
    type: string
    description: string
  }>
}

function calculateAge(birthDate: Date | null | undefined): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

/** Champ info label/valeur pour grilles d'informations */
function infoField(label: string, value: string | number | null | undefined, options?: { color?: string; fontWeight?: string }): string {
  const val = valOu(value != null ? String(value) : null, '-')
  const style = options?.color ? `color: ${options.color};` : 'color: #0f172a;'
  const fw = options?.fontWeight || '500'
  return `
    <div>
      <div style="font-size: 9pt; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">${escapeHtml(label)}</div>
      <div style="font-size: 10pt; font-weight: ${fw}; ${style}">${escapeHtml(val)}</div>
    </div>`
}

export function generateFicheClientHtml(data: FicheClientData): string {
  const clientAge = data.client.age || calculateAge(data.client.dateNaissance)
  const patrimoineNet = data.patrimoine?.patrimoineNet || 0
  const cabinetNom = data.cabinet?.nom || 'Cabinet de Conseil'

  const builder = new PdfDocumentBuilder()

  // Couverture
  builder.setCover({
    titre: 'Fiche Client',
    sousTitre: 'Synthèse complète du dossier',
    badge: 'CONFIDENTIEL',
    clientNom: `${data.client.civilite ? data.client.civilite + ' ' : ''}${data.client.prenom} ${data.client.nom}`,
    clientInfo: data.client.email || undefined,
    cabinetNom,
    date: new Date(),
    conseillerNom: data.conseiller ? `${data.conseiller.prenom} ${data.conseiller.nom}` : undefined,
  })

  // ================================================================
  // CHAPITRE 1 : Identité & Contact
  // ================================================================
  const subtitleParts = [
    clientAge ? `${clientAge} ans` : '',
    data.client.profession || '',
    data.client.segmentation || '',
  ].filter(Boolean).join(' • ')

  const clientHeaderHtml = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
      <div>
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 8px;">
          <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24pt; font-weight: 800;">
            ${escapeHtml(data.client.prenom.charAt(0))}${escapeHtml(data.client.nom.charAt(0))}
          </div>
          <div>
            <h1 style="font-size: 24pt; font-weight: 800; color: #0f172a; margin: 0;">
              ${data.client.civilite ? escapeHtml(data.client.civilite) + ' ' : ''}${escapeHtml(data.client.prenom)} ${escapeHtml(data.client.nom)}
            </h1>
            <p style="font-size: 11pt; color: #64748b; margin: 4px 0 0 0;">${escapeHtml(subtitleParts)}</p>
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <p style="font-size: 9pt; color: #94a3b8; margin: 0;">Fiche éditée le</p>
        <p style="font-size: 11pt; font-weight: 600; color: #0f172a; margin: 4px 0 0 0;">${fmtDateLongue(new Date())}</p>
        ${data.conseiller ? `
          <p style="font-size: 9pt; color: #94a3b8; margin: 12px 0 0 0;">Conseiller</p>
          <p style="font-size: 10pt; color: #0f172a; margin: 2px 0 0 0;">${escapeHtml(data.conseiller.prenom)} ${escapeHtml(data.conseiller.nom)}</p>
        ` : ''}
      </div>
    </div>`

  const infoPersoHtml = `
    <div class="section">
      <div class="card">
        <div class="card-header"><span class="card-title">Informations personnelles</span></div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
          ${infoField('Date de naissance', fmtDateLongue(data.client.dateNaissance))}
          ${infoField('Lieu de naissance', data.client.lieuNaissance)}
          ${infoField('Nationalité', data.client.nationalite || 'Française')}
          ${infoField('Situation familiale', data.client.situationFamiliale)}
          ${infoField('Régime matrimonial', data.client.regimeMatrimonial)}
          ${infoField('Enfants', data.client.enfants != null ? String(data.client.enfants) : '0')}
        </div>
      </div>
    </div>`

  const contactHtml = `
    <div class="section">
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><span class="card-title">📱 Contact</span></div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 32px; height: 32px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div>
                <div style="font-size: 9pt; color: #94a3b8;">Email</div>
                <div style="font-size: 10pt; font-weight: 500; color: #0f172a;">${escapeHtml(data.client.email || '-')}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 32px; height: 32px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div>
                <div style="font-size: 9pt; color: #94a3b8;">Téléphone</div>
                <div style="font-size: 10pt; font-weight: 500; color: #0f172a;">${escapeHtml(data.client.telephone || data.client.mobile || '-')}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">📍 Adresse</span></div>
          <div style="font-size: 10pt; color: #475569; line-height: 1.6;">
            ${escapeHtml(data.client.adresse || '')}<br>
            ${data.client.codePostal ? escapeHtml(data.client.codePostal) + ' ' : ''}${escapeHtml(data.client.ville || '')}<br>
            ${escapeHtml(data.client.pays || 'France')}
          </div>
        </div>
      </div>
    </div>`

  const professionHtml = `
    <div class="section">
      <div class="card">
        <div class="card-header"><span class="card-title">💼 Situation professionnelle</span></div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
          ${infoField('Profession', data.client.profession)}
          ${infoField('Employeur', data.client.employeur)}
          ${infoField('Type de contrat', data.client.typeContrat)}
          ${data.client.revenuAnnuel ? infoField('Revenu annuel', fmtEur(data.client.revenuAnnuel), { color: '#10b981', fontWeight: '600' }) : ''}
        </div>
      </div>
    </div>`

  let profilInvestisseurHtml = ''
  if (data.client.profilRisque || data.client.horizonInvestissement || data.fiscalite) {
    profilInvestisseurHtml = `
      <div class="section">
        <div class="card">
          <div class="card-header"><span class="card-title">📈 Profil investisseur & Fiscalité</span></div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
            ${data.client.profilRisque ? infoField('Profil de risque', data.client.profilRisque) : ''}
            ${data.client.horizonInvestissement ? infoField('Horizon investissement', data.client.horizonInvestissement) : ''}
            ${data.fiscalite?.tauxIR ? infoField('TMI', `${data.fiscalite.tauxIR}%`) : ''}
            ${data.fiscalite?.assujettIFI ? infoField('IFI', `Assujetti${data.fiscalite.montantIFI ? ` (${fmtEur(data.fiscalite.montantIFI)})` : ''}`, { color: '#ef4444' }) : ''}
            ${data.client.isPEP ? infoField('Statut PEP', 'Oui', { color: '#f59e0b' }) : ''}
          </div>
        </div>
      </div>`
  }

  let patrimoineHtml = ''
  if (data.patrimoine) {
    patrimoineHtml = `
      <div class="section">
        <div class="card">
          <div class="card-header"><span class="card-title">📊 Synthèse patrimoniale</span></div>
          <div style="display: flex; align-items: center; gap: 40px;">
            ${data.patrimoine.repartition && data.patrimoine.repartition.length > 0 ? `
              <div class="chart-container" style="flex-shrink: 0;">
                ${generateDonutChart(data.patrimoine.repartition, 140, 18)}
              </div>
            ` : ''}
            <div style="flex: 1;">
              ${renderKpiRow([
                { label: 'Actifs', valeur: fmtEur(data.patrimoine.totalActifs), complementStyle: 'positive' },
                { label: 'Passifs', valeur: fmtEur(data.patrimoine.totalPassifs), complementStyle: 'negative' },
                { label: 'Patrimoine net', valeur: fmtEur(patrimoineNet), highlight: true },
              ])}
            </div>
          </div>
        </div>
      </div>`
  }

  builder.addChapter('Identité & Situation', `
    ${clientHeaderHtml}
    ${infoPersoHtml}
    ${contactHtml}
    ${professionHtml}
    ${profilInvestisseurHtml}
    ${patrimoineHtml}
  `)

  // ================================================================
  // CHAPITRE 2 : Famille & Patrimoine détaillé
  // ================================================================
  const hasFamille = data.famille && data.famille.length > 0
  const hasActifs = data.patrimoine?.actifs && data.patrimoine.actifs.length > 0
  const hasPassifs = data.patrimoine?.passifs && data.patrimoine.passifs.length > 0

  if (hasFamille || hasActifs || hasPassifs) {
    let familleTableHtml = ''
    if (hasFamille) {
      familleTableHtml = renderTable(
        [
          { key: 'relation', label: 'Relation', cellClass: 'td-main' },
          { key: 'prenom', label: 'Prénom' },
          { key: 'nom', label: 'Nom', format: (v: any) => v || '-' },
          { key: 'dateNaissance', label: 'Date de naissance', format: (v: any) => fmtDateLongue(v) },
          { key: 'aCharge', label: 'À charge', format: (v: any) => v ? renderBadge('Oui', 'success') : renderBadge('Non', 'neutral') },
        ],
        data.famille!,
        { titre: '👨‍👩‍👧‍👦 Composition familiale', titreBadge: `${data.famille!.length} membre(s)` }
      )
    }

    let actifsTableHtml = ''
    if (hasActifs) {
      actifsTableHtml = renderTable(
        [
          { key: 'categorie', label: 'Catégorie' },
          { key: 'type', label: 'Type' },
          { key: 'nom', label: 'Désignation', cellClass: 'td-main' },
          { key: 'valeur', label: 'Valeur', align: 'right', format: (v: number) => `<span style="font-weight:600;color:#10b981;">${fmtEur(v)}</span>` },
        ],
        data.patrimoine!.actifs!,
        { titre: '� Détail des actifs', titreBadge: fmtEur(data.patrimoine!.totalActifs) }
      )
    }

    let passifsTableHtml = ''
    if (hasPassifs) {
      passifsTableHtml = renderTable(
        [
          { key: 'type', label: 'Type' },
          { key: 'nom', label: 'Désignation', cellClass: 'td-main' },
          { key: 'capitalInitial', label: 'Capital initial', align: 'right', format: (v: number) => fmtEur(v) },
          { key: 'capitalRestant', label: 'CRD', align: 'right', format: (v: number) => `<span style="font-weight:600;color:#ef4444;">${fmtEur(v)}</span>` },
          { key: 'mensualite', label: 'Mensualité', align: 'right', format: (v: number) => `${fmtEur(v)}/mois` },
          { key: 'taux', label: 'Taux', align: 'right', format: (v: number) => fmtPctFromDecimal(v) },
        ],
        data.patrimoine!.passifs!,
        { titre: '📉 Détail des passifs (crédits)', titreBadge: fmtEur(data.patrimoine!.totalPassifs) }
      )
    }

    builder.addChapter('Famille & Patrimoine détaillé', `
      ${familleTableHtml ? `<div class="section">${familleTableHtml}</div>` : ''}
      ${actifsTableHtml ? `<div class="section">${actifsTableHtml}</div>` : ''}
      ${passifsTableHtml ? `<div class="section">${passifsTableHtml}</div>` : ''}
    `)
  }

  // ================================================================
  // CHAPITRE 3 : Objectifs & Contrats
  // ================================================================
  const hasObjectifs = data.objectifs && data.objectifs.length > 0
  const hasContrats = data.contrats && data.contrats.length > 0
  const hasActivites = data.dernieresActivites && data.dernieresActivites.length > 0

  if (hasObjectifs || hasContrats || hasActivites) {
    let objectifsHtml = ''
    if (hasObjectifs) {
      objectifsHtml = renderTable(
        [
          { key: 'titre', label: 'Objectif', cellClass: 'td-main' },
          { key: 'description', label: 'Description', format: (v: any) => v || '-' },
          { key: 'montantCible', label: 'Montant cible', align: 'right', format: (v: any) => v ? fmtEur(v) : '-' },
          { key: 'echeance', label: 'Échéance', format: (v: any) => v ? fmtDateLongue(v) : '-' },
          { key: 'priorite', label: 'Priorité', format: (v: any) => {
            if (v === 'HAUTE') return renderBadge(v, 'danger')
            if (v === 'MOYENNE') return renderBadge(v, 'warning')
            return renderBadge(v || 'Normale', 'success')
          }},
          { key: 'statut', label: 'Statut', format: (v: any) => {
            if (v === 'ATTEINT') return renderBadge(v, 'success')
            if (v === 'EN_COURS') return renderBadge(v, 'info')
            return renderBadge(v || 'En cours', 'neutral')
          }},
        ],
        data.objectifs!,
        { titre: '🎯 Objectifs du client' }
      )
    }

    let contratsHtml = ''
    if (hasContrats) {
      contratsHtml = renderTable(
        [
          { key: 'type', label: 'Type', cellClass: 'td-main' },
          { key: 'assureur', label: 'Assureur / Fournisseur', format: (v: any) => v || '-' },
          { key: 'numero', label: 'Numéro', format: (v: any) => v ? `<span style="font-family:monospace;">${escapeHtml(v)}</span>` : '-' },
          { key: 'statut', label: 'Statut', format: (v: any) => v === 'ACTIF' ? renderBadge(v, 'success') : renderBadge(v, 'warning') },
        ],
        data.contrats!,
        { titre: '📄 Contrats en portefeuille', titreBadge: `${data.contrats!.length} contrat(s)` }
      )
    }

    let activitesHtml = ''
    if (hasActivites) {
      activitesHtml = `
        <div class="card">
          <div class="card-header"><span class="card-title">📅 Dernières activités</span></div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${data.dernieresActivites!.slice(0, 5).map(act => `
              <div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 8px;">
                <div style="font-size: 9pt; color: #94a3b8; white-space: nowrap;">${fmtDateLongue(act.date)}</div>
                <div style="flex: 1;">
                  <div style="font-size: 10pt; font-weight: 500; color: #0f172a;">${escapeHtml(act.type)}</div>
                  <div style="font-size: 9pt; color: #64748b;">${escapeHtml(act.description)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>`
    }

    builder.addChapter('Objectifs & Contrats', `
      ${objectifsHtml ? `<div class="section">${objectifsHtml}</div>` : ''}
      ${contratsHtml ? `<div class="section">${contratsHtml}</div>` : ''}
      ${activitesHtml ? `<div class="section">${activitesHtml}</div>` : ''}
    `)
  }

  // Mentions finales
  builder.setMentions({
    cabinetNom,
    cabinetAdresse: data.cabinet?.adresse,
    date: new Date(),
    confidentialite: true,
  })

  return builder.build()
}

export default generateFicheClientHtml
