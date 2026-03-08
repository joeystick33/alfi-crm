/**
 * PDF Components — Bibliothèque de composants HTML réutilisables pour PDF
 * 
 * Chaque composant génère du HTML sémantique compatible WeasyPrint,
 * utilisant les classes CSS définies dans pdf-styles-premium.ts.
 * 
 * RÈGLE : Tous les templates PDF doivent utiliser ces composants.
 * Aucun template ne doit construire manuellement du HTML pour ces éléments.
 */

import {
  fmtEur,
  fmtEurPrecis,
  fmtNum,
  fmtPct,
  fmtPctEntier,
  fmtDateLongue,
  fmtValeurUnite,
  escapeHtml,
  nl2br,
  valOu,
  getBadgeColors,
  type BadgeVariant,
} from './pdf-utils'

// ============================================================================
// TYPES
// ============================================================================

export interface CoverData {
  /** Titre principal du document (ex: "Bilan Patrimonial") */
  titre: string
  /** Sous-titre optionnel (ex: "Analyse complète de votre situation") */
  sousTitre?: string
  /** Badge type document (ex: "AUDIT", "SIMULATION", "CONFIDENTIEL") */
  badge?: string
  /** Nom du client ou foyer */
  clientNom: string
  /** Info complémentaire client (ex: email, référence) */
  clientInfo?: string
  /** Nom du cabinet */
  cabinetNom: string
  /** Première lettre ou logo du cabinet */
  cabinetInitiale?: string
  /** Date d'édition */
  date: Date | string
  /** Référence du dossier */
  reference?: string
  /** Nom du conseiller */
  conseillerNom?: string
  /** Version ou statut (ex: "BROUILLON", "V2.1") */
  statut?: string
}

export interface TocItem {
  /** Numéro de la section (affiché dans le badge) */
  numero: number | string
  /** Titre de la section */
  titre: string
  /** Description courte optionnelle */
  description?: string
  /** Couleur du badge (défaut: accent) */
  couleur?: string
}

export interface SectionHeaderData {
  /** Titre de la section */
  titre: string
  /** Sous-titre optionnel */
  sousTitre?: string
  /** Icône emoji ou SVG inline */
  icone?: string
}

export interface KpiData {
  /** Libellé du KPI */
  label: string
  /** Valeur formatée (ex: "125 000 €") */
  valeur: string
  /** Variation ou info complémentaire */
  complement?: string
  /** Style de la variation: positive, negative, ou neutre */
  complementStyle?: 'positive' | 'negative' | 'neutral'
  /** Si true, le KPI utilise le style mis en avant (fond accent) */
  highlight?: boolean
}

export interface TableColumn {
  /** Clé de la propriété dans les données */
  key: string
  /** Libellé de l'en-tête */
  label: string
  /** Alignement (défaut: left) */
  align?: 'left' | 'right' | 'center'
  /** Largeur CSS (ex: "30%", "120px") */
  width?: string
  /** Formatter personnalisé */
  format?: (value: any, row: any) => string
  /** Classe CSS additionnelle sur les cellules */
  cellClass?: string
}

export interface EncadreData {
  /** Type d'encadré */
  type: 'info' | 'attention' | 'alerte' | 'recommandation' | 'hypothese' | 'definition' | 'commentaire' | 'synthese'
  /** Titre de l'encadré */
  titre?: string
  /** Contenu texte (supporte HTML) */
  contenu: string
}

export interface PreconisationData {
  /** Numéro d'ordre (auto-assigné par renderPreconisations si absent) */
  numero?: number
  /** Titre de la préconisation */
  titre: string
  /** Description détaillée */
  description: string
  /** Priorité */
  priorite: 'haute' | 'moyenne' | 'basse' | 'HAUTE' | 'MOYENNE' | 'BASSE'
  /** Détails clés (label → valeur) */
  details?: Array<{ label: string; valeur: string }>
  /** Avantages / bénéfices (texte libre) */
  benefices?: string
  /** Produit recommandé */
  produit?: string
  /** Montant estimé */
  montant?: number
  /** Liste d'avantages */
  avantages?: string[]
  /** Liste d'inconvénients / points de vigilance */
  inconvenients?: string[]
  /** Prochaines étapes */
  etapesSuivantes?: string[]
}

export interface SignatureData {
  /** Texte d'introduction avant les blocs de signature */
  introTexte?: string
  /** Bloc gauche — rôle + nom */
  roleGauche?: string
  nomGauche?: string
  /** Bloc droit — rôle + nom */
  roleDroit?: string
  nomDroit?: string
  /** Date de signature */
  dateLieu?: string
  /** Raccourci : nom du conseiller (génère roleGauche='Le Conseiller') */
  conseillerNom?: string
  /** Raccourci : titre du conseiller */
  conseillerTitre?: string
  /** Raccourci : nom du client (génère roleDroit='Le Client') */
  clientNom?: string
  /** Date (objet Date, sera formatée) */
  date?: Date
  /** Mention sous le nom du client (ex: 'Lu et approuvé') */
  mention?: string
}

// ============================================================================
// 1. PAGE DE COUVERTURE
// ============================================================================

export function renderCover(data: CoverData): string {
  const dateStr = fmtDateLongue(data.date)
  const initiale = data.cabinetInitiale || data.cabinetNom.charAt(0).toUpperCase()

  return `
  <div class="cover">
    <div class="cover-accent"></div>
    <div class="cover-header">
      <div class="cover-logo">
        <div class="cover-logo-icon">${escapeHtml(initiale)}</div>
        <span class="cover-logo-text">${escapeHtml(data.cabinetNom)}</span>
      </div>
      <div class="cover-date">${dateStr}</div>
    </div>

    <div class="cover-main">
      ${data.badge ? `<div class="cover-badge">${escapeHtml(data.badge)}</div>` : ''}
      <h1 class="cover-title">${escapeHtml(data.titre)}</h1>
      ${data.sousTitre ? `<p class="cover-subtitle">${escapeHtml(data.sousTitre)}</p>` : ''}

      <div class="cover-client-card">
        <div class="cover-client-label">Établi pour</div>
        <div class="cover-client-name">${escapeHtml(data.clientNom)}</div>
        ${data.clientInfo ? `<div class="cover-client-info">${escapeHtml(data.clientInfo)}</div>` : ''}
      </div>
    </div>

    <div class="cover-footer">
      ${data.reference ? `
        <div class="cover-footer-item">
          <span>Référence</span><br>
          <span class="cover-footer-value">${escapeHtml(data.reference)}</span>
        </div>
      ` : ''}
      ${data.conseillerNom ? `
        <div class="cover-footer-item">
          <span>Conseiller</span><br>
          <span class="cover-footer-value">${escapeHtml(data.conseillerNom)}</span>
        </div>
      ` : ''}
      <div class="cover-footer-item">
        <span>Date</span><br>
        <span class="cover-footer-value">${dateStr}</span>
      </div>
      ${data.statut ? `
        <div class="cover-footer-item">
          <span>Statut</span><br>
          <span class="cover-footer-value">${escapeHtml(data.statut)}</span>
        </div>
      ` : ''}
    </div>
  </div>`
}

// ============================================================================
// 2. SOMMAIRE (TABLE OF CONTENTS)
// ============================================================================

const TOC_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#6366f1', '#14b8a6', '#ec4899', '#f97316', '#06b6d4',
]

export function renderToc(
  items: TocItem[],
  options?: { titre?: string; intro?: string; noteFinale?: string }
): string {
  const titre = options?.titre || 'Sommaire'
  const intro = options?.intro || ''

  const itemsHtml = items.map((item, i) => {
    const couleur = item.couleur || TOC_COLORS[i % TOC_COLORS.length]
    return `
      <li class="toc-item">
        <div class="toc-num" style="background: ${couleur};">${item.numero}</div>
        <div class="toc-label">
          <div class="toc-label-title">${escapeHtml(item.titre)}</div>
          ${item.description ? `<div class="toc-label-desc">${escapeHtml(item.description)}</div>` : ''}
        </div>
      </li>`
  }).join('')

  return `
  <div class="toc-section content-page" data-page-label="${escapeHtml(titre)}">
    <div class="page-header">
      <h2 class="page-title">${escapeHtml(titre)}</h2>
    </div>
    ${intro ? `<p class="toc-intro" style="color: var(--text-muted); font-size: 10pt; margin-bottom: 24px;">${escapeHtml(intro)}</p>` : ''}
    <ul class="toc-list">
      ${itemsHtml}
    </ul>
    ${options?.noteFinale ? `
      <div class="toc-note">
        <p style="font-size: 9pt; color: var(--text-muted);">${options.noteFinale}</p>
      </div>
    ` : ''}
  </div>`
}

// ============================================================================
// 3. EN-TÊTE DE PAGE DE CONTENU
// ============================================================================

export function renderPageHeader(titre: string, options?: { sousTitre?: string; pageLabel?: string }): string {
  return `
  <div class="content-page chapter-break" data-page-label="${escapeHtml(options?.pageLabel || titre)}">
    <div class="page-header">
      <div>
        <h2 class="page-title">${escapeHtml(titre)}</h2>
        ${options?.sousTitre ? `<p style="font-size: 10pt; color: var(--text-muted); margin-top: 4px;">${escapeHtml(options.sousTitre)}</p>` : ''}
      </div>
    </div>`
}

export function renderPageClose(): string {
  return `</div>`
}

// ============================================================================
// 4. SECTIONS & SOUS-SECTIONS
// ============================================================================

export function renderSectionHeader(data: SectionHeaderData): string {
  return `
    <div class="section-header">
      ${data.icone ? `<div class="section-icon">${data.icone}</div>` : ''}
      <div>
        <div class="section-title">${escapeHtml(data.titre)}</div>
        ${data.sousTitre ? `<div class="section-subtitle">${escapeHtml(data.sousTitre)}</div>` : ''}
      </div>
    </div>`
}

export function renderSubsectionTitle(titre: string): string {
  return `<h4 class="subsection-title" style="font-size: 11pt; font-weight: 700; color: var(--primary); margin: 20px 0 12px 0; padding-bottom: 6px; border-bottom: 1px solid var(--border);">${escapeHtml(titre)}</h4>`
}

// ============================================================================
// 5. KPI / CHIFFRES CLÉS
// ============================================================================

/** Grille de KPIs (1 à 4 par ligne) */
export function renderKpiRow(kpis: KpiData[]): string {
  const cards = kpis.map(kpi => {
    const highlightClass = kpi.highlight ? ' highlight' : ''
    let complementHtml = ''
    if (kpi.complement) {
      const style = kpi.complementStyle === 'positive' ? ' positive'
        : kpi.complementStyle === 'negative' ? ' negative' : ''
      complementHtml = `<div class="stat-change${style}">${escapeHtml(kpi.complement)}</div>`
    }
    return `
      <div class="stat-card${highlightClass}">
        <div class="stat-label">${escapeHtml(kpi.label)}</div>
        <div class="stat-value">${kpi.valeur}</div>
        ${complementHtml}
      </div>`
  }).join('')

  return `<div class="stats-row">${cards}</div>`
}

/** KPI unique mis en valeur */
export function renderKpiSingle(label: string, valeur: string, options?: {
  complement?: string
  complementStyle?: 'positive' | 'negative' | 'neutral'
  size?: 'normal' | 'large'
}): string {
  const fontSize = options?.size === 'large' ? '28pt' : '22pt'
  let complementHtml = ''
  if (options?.complement) {
    const style = options.complementStyle === 'positive' ? 'color: var(--success);'
      : options.complementStyle === 'negative' ? 'color: var(--danger);' : 'color: var(--text-muted);'
    complementHtml = `<div style="font-size: 9pt; ${style} margin-top: 4px;">${escapeHtml(options.complement)}</div>`
  }
  return `
    <div class="stat-card" style="text-align: center; break-inside: avoid;">
      <div class="stat-label" style="text-align: center;">${escapeHtml(label)}</div>
      <div class="stat-value" style="text-align: center; font-size: ${fontSize};">${valeur}</div>
      ${complementHtml}
    </div>`
}

// ============================================================================
// 6. TABLEAUX
// ============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Tableau structuré avec colonnes typées */
export function renderTable(
  columns: TableColumn[],
  rows: any[],
  options?: {
    titre?: string
    titreBadge?: string
    footerRow?: Record<string, string>
    emptyMessage?: string
    maxRows?: number
    showOverflowMessage?: boolean
  }
): string {
  if (rows.length === 0) {
    const msg = options?.emptyMessage || 'Aucune donnée disponible'
    return `
      <div class="table-container" style="margin-bottom: 16px;">
        ${options?.titre ? `
          <div class="table-header">
            <span class="table-title">${escapeHtml(options.titre)}</span>
            ${options?.titreBadge ? `<span class="card-badge badge-info" style="background: rgba(59,130,246,0.1); color: #3b82f6;">${escapeHtml(options.titreBadge)}</span>` : ''}
          </div>` : ''}
        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 10pt;">${escapeHtml(msg)}</div>
      </div>`
  }

  const displayRows = options?.maxRows ? rows.slice(0, options.maxRows) : rows
  const hiddenCount = options?.maxRows && rows.length > options.maxRows ? rows.length - options.maxRows : 0

  const headerHtml = columns.map(col => {
    const align = col.align === 'right' ? 'text-align: right;' : col.align === 'center' ? 'text-align: center;' : ''
    const width = col.width ? `width: ${col.width};` : ''
    return `<th style="${align} ${width}">${escapeHtml(col.label)}</th>`
  }).join('')

  const bodyHtml = displayRows.map(row => {
    const cells = columns.map(col => {
      const rawValue = row[col.key]
      const formattedValue = col.format ? col.format(rawValue, row) : valOu(rawValue)
      const align = col.align === 'right' ? 'text-align: right;' : col.align === 'center' ? 'text-align: center;' : ''
      const cellClass = col.cellClass ? ` class="${col.cellClass}"` : ''
      return `<td style="${align}"${cellClass}>${formattedValue}</td>`
    }).join('')
    return `<tr>${cells}</tr>`
  }).join('')

  let footerHtml = ''
  if (options?.footerRow) {
    const cells = columns.map(col => {
      const val = options.footerRow![col.key] || ''
      const align = col.align === 'right' ? 'text-align: right;' : col.align === 'center' ? 'text-align: center;' : ''
      return `<td style="${align}">${val}</td>`
    }).join('')
    footerHtml = `<tr class="table-footer">${cells}</tr>`
  }

  let overflowHtml = ''
  if (hiddenCount > 0 && options?.showOverflowMessage !== false) {
    overflowHtml = `<tr><td colspan="${columns.length}" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 12px;">… ${hiddenCount} ligne${hiddenCount > 1 ? 's' : ''} supplémentaire${hiddenCount > 1 ? 's' : ''} non affichée${hiddenCount > 1 ? 's' : ''}</td></tr>`
  }

  return `
    <div class="table-container" style="margin-bottom: 16px;">
      ${options?.titre ? `
        <div class="table-header">
          <span class="table-title">${escapeHtml(options.titre)}</span>
          ${options?.titreBadge ? `<span class="card-badge badge-info" style="background: rgba(59,130,246,0.1); color: #3b82f6;">${escapeHtml(options.titreBadge)}</span>` : ''}
        </div>` : ''}
      <table>
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>
          ${bodyHtml}
          ${overflowHtml}
        </tbody>
        ${footerHtml ? `<tfoot>${footerHtml}</tfoot>` : ''}
      </table>
    </div>`
}

/** Tableau simple clé-valeur (2 colonnes) */
export function renderKeyValueTable(
  entries: Array<{ label: string; valeur: string | number; unite?: string; important?: boolean }>,
  options?: { titre?: string }
): string {
  const rows = entries.map(e => {
    const val = typeof e.valeur === 'number' ? fmtValeurUnite(e.valeur, e.unite) : e.valeur
    const importantStyle = e.important ? ' style="background: #f0fdf4; font-weight: 600;"' : ''
    const valStyle = e.important ? ' style="font-weight: 700; color: var(--success); font-size: 12pt; text-align: right;"' : ' style="text-align: right; font-weight: 600;"'
    return `<tr${importantStyle}><td>${escapeHtml(e.label)}</td><td${valStyle}>${escapeHtml(String(val))}</td></tr>`
  }).join('')

  return `
    <div class="table-container" style="margin-bottom: 16px;">
      ${options?.titre ? `<div class="table-header"><span class="table-title">${escapeHtml(options.titre)}</span></div>` : ''}
      <table>
        <thead><tr><th style="width: 55%;">Élément</th><th style="width: 45%; text-align: right;">Valeur</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
}

// ============================================================================
// 7. ENCADRÉS MÉTIER
// ============================================================================

const ENCADRE_STYLES: Record<EncadreData['type'], { borderColor: string; bgColor: string; iconColor: string; icon: string; defaultTitre: string }> = {
  info:            { borderColor: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.03)',  iconColor: '#3b82f6', icon: 'ℹ️',  defaultTitre: 'Information' },
  attention:       { borderColor: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.03)', iconColor: '#f59e0b', icon: '⚠️',  defaultTitre: 'Point d\'attention' },
  alerte:          { borderColor: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.03)',  iconColor: '#ef4444', icon: '🚨',  defaultTitre: 'Alerte' },
  recommandation:  { borderColor: '#10b981', bgColor: 'rgba(16, 185, 129, 0.03)', iconColor: '#10b981', icon: '✅',  defaultTitre: 'Recommandation' },
  hypothese:       { borderColor: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.03)', iconColor: '#8b5cf6', icon: '📐',  defaultTitre: 'Hypothèses' },
  definition:      { borderColor: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.03)', iconColor: '#6366f1', icon: '📖',  defaultTitre: 'Définition' },
  commentaire:     { borderColor: '#64748b', bgColor: 'rgba(100, 116, 139, 0.03)', iconColor: '#64748b', icon: '💬', defaultTitre: 'Commentaire du conseiller' },
  synthese:        { borderColor: '#0f172a', bgColor: 'rgba(15, 23, 42, 0.03)',   iconColor: '#0f172a', icon: '📋',  defaultTitre: 'Synthèse' },
}

export function renderEncadre(data: EncadreData): string {
  const style = ENCADRE_STYLES[data.type]
  const titre = data.titre || style.defaultTitre

  return `
    <div class="card encadre" style="border-left: 4px solid ${style.borderColor}; background: ${style.bgColor}; break-inside: avoid; margin-bottom: 16px;">
      <div class="card-header" style="margin-bottom: 8px;">
        <span class="card-title" style="color: ${style.iconColor}; display: flex; align-items: center; gap: 8px;">
          ${style.icon} ${escapeHtml(titre)}
        </span>
      </div>
      <div style="font-size: 10pt; color: var(--text); line-height: 1.7;">
        ${data.contenu}
      </div>
    </div>`
}

/** Liste de points dans un encadré */
export function renderEncadreList(
  type: EncadreData['type'],
  titre: string,
  items: string[]
): string {
  if (items.length === 0) return ''
  const listHtml = items.map(item =>
    `<li style="display: flex; align-items: flex-start; gap: 8px; font-size: 10pt; color: #475569; margin-bottom: 6px;">
      <span style="color: ${ENCADRE_STYLES[type].iconColor}; flex-shrink: 0;">•</span>
      <span>${escapeHtml(item)}</span>
    </li>`
  ).join('')

  return renderEncadre({
    type,
    titre,
    contenu: `<ul style="list-style: none; margin: 0; padding: 0;">${listHtml}</ul>`,
  })
}

// ============================================================================
// 8. PRÉCONISATIONS
// ============================================================================

export function renderPreconisation(data: PreconisationData): string {
  const pNorm = data.priorite.toUpperCase()
  const prioriteClass = pNorm === 'HAUTE' ? 'priority-high' : pNorm === 'MOYENNE' ? 'priority-medium' : 'priority-low'
  const prioriteLabel = pNorm === 'HAUTE' ? '⚡ Priorité haute' : pNorm === 'MOYENNE' ? '📌 Priorité moyenne' : '📋 À considérer'

  let detailsHtml = ''
  if (data.details && data.details.length > 0) {
    const detailItems = data.details.map(d =>
      `<div class="preco-detail">
        <div class="preco-detail-label">${escapeHtml(d.label)}</div>
        <div class="preco-detail-value">${escapeHtml(d.valeur)}</div>
      </div>`
    ).join('')
    detailsHtml = `<div class="preco-details">${detailItems}</div>`
  }

  let beneficesHtml = ''
  if (data.benefices) {
    beneficesHtml = `
      <div class="preco-benefits">
        <div class="preco-benefits-title">✨ Bénéfices attendus</div>
        <div class="preco-benefits-text">${escapeHtml(data.benefices)}</div>
      </div>`
  }

  const produitHtml = data.produit
    ? `<div style="font-size: 9pt; color: #64748b; margin-top: 4px;">Produit : ${escapeHtml(data.produit)}</div>`
    : ''

  const montantHtml = data.montant
    ? `<div style="background: #f8fafc; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: inline-block;">
        <span style="font-size: 9pt; color: #64748b;">Montant estimé :</span>
        <span style="font-size: 14pt; font-weight: 700; color: #0f172a; margin-left: 8px;">${fmtEur(data.montant)}</span>
      </div>`
    : ''

  let avantagesInconvenientsHtml = ''
  if (data.avantages && data.avantages.length > 0) {
    avantagesInconvenientsHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
        <div style="background: rgba(16, 185, 129, 0.05); border-radius: 8px; padding: 16px;">
          <div style="font-size: 9pt; font-weight: 600; color: #10b981; margin-bottom: 8px;">✓ Avantages</div>
          <ul style="list-style: none; font-size: 9pt; color: #475569;">
            ${data.avantages.map(a => `<li style="margin-bottom: 4px;">• ${escapeHtml(a)}</li>`).join('')}
          </ul>
        </div>
        ${data.inconvenients && data.inconvenients.length > 0 ? `
          <div style="background: rgba(239, 68, 68, 0.05); border-radius: 8px; padding: 16px;">
            <div style="font-size: 9pt; font-weight: 600; color: #ef4444; margin-bottom: 8px;">✗ Points de vigilance</div>
            <ul style="list-style: none; font-size: 9pt; color: #475569;">
              ${data.inconvenients.map(i => `<li style="margin-bottom: 4px;">• ${escapeHtml(i)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>`
  }

  let etapesHtml = ''
  if (data.etapesSuivantes && data.etapesSuivantes.length > 0) {
    etapesHtml = `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <div style="font-size: 9pt; font-weight: 600; color: #3b82f6; margin-bottom: 8px;">→ Prochaines étapes</div>
        <ol style="list-style: decimal; margin-left: 16px; font-size: 9pt; color: #475569;">
          ${data.etapesSuivantes.map(e => `<li style="margin-bottom: 4px;">${escapeHtml(e)}</li>`).join('')}
        </ol>
      </div>`
  }

  const num = data.numero || 0

  return `
    <div class="preco-card ${prioriteClass}" style="break-inside: avoid;">
      <div class="preco-header">
        <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1;">
          <div class="preco-number">${num}</div>
          <div>
            <div class="preco-title">${escapeHtml(data.titre)}</div>
            ${produitHtml}
          </div>
        </div>
        <span class="preco-priority ${prioriteClass}">${prioriteLabel}</span>
      </div>
      <div class="preco-description">${escapeHtml(data.description)}</div>
      ${montantHtml}
      ${detailsHtml}
      ${beneficesHtml}
      ${avantagesInconvenientsHtml}
      ${etapesHtml}
    </div>`
}

/** Liste de préconisations (auto-numérote si numero absent) */
export function renderPreconisations(precos: PreconisationData[]): string {
  if (precos.length === 0) return ''
  return precos.map((p, idx) => renderPreconisation({ ...p, numero: p.numero ?? (idx + 1) })).join('')
}

// ============================================================================
// 9. BADGES
// ============================================================================

export function renderBadge(label: string, variant: BadgeVariant): string {
  const colors = getBadgeColors(variant)
  return `<span class="card-badge" style="background: ${colors.bg}; color: ${colors.color}; font-size: 8pt; padding: 4px 10px; border-radius: 100px; font-weight: 600;">${escapeHtml(label)}</span>`
}

// ============================================================================
// 10. SIGNATURE
// ============================================================================

export function renderSignature(data: SignatureData): string {
  const roleG = data.roleGauche || (data.conseillerNom ? 'Le Conseiller' : '')
  const nomG = data.nomGauche || data.conseillerNom || ''
  const roleD = data.roleDroit || (data.clientNom ? 'Le Client' : '')
  const nomD = data.nomDroit || data.clientNom || ''
  const dateStr = data.dateLieu || (data.date ? `Le ${fmtDateLongue(data.date)}` : '')

  let conseillerTitreHtml = ''
  if (data.conseillerTitre) {
    conseillerTitreHtml = `<div style="font-size: 9pt; color: #64748b;">${escapeHtml(data.conseillerTitre)}</div>`
  }

  let mentionHtml = ''
  if (data.mention) {
    mentionHtml = `<div class="signature-date">${escapeHtml(data.mention)}</div>`
  }

  return `
    <div class="signature-section" style="break-inside: avoid;">
      ${data.introTexte ? `
        <div class="signature-intro">
          <p>${data.introTexte}</p>
        </div>
      ` : ''}
      <div class="signature-grid">
        <div class="signature-box">
          <div class="signature-role">${escapeHtml(roleG)}</div>
          <div class="signature-line"></div>
          <div class="signature-name">${escapeHtml(nomG)}</div>
          ${conseillerTitreHtml}
          ${dateStr ? `<div class="signature-date">${escapeHtml(dateStr)}</div>` : ''}
        </div>
        <div class="signature-box">
          <div class="signature-role">${escapeHtml(roleD)}</div>
          <div class="signature-line"></div>
          <div class="signature-name">${escapeHtml(nomD)}</div>
          ${mentionHtml}
        </div>
      </div>
    </div>`
}

// ============================================================================
// 11. MENTIONS LÉGALES / PIED DE DOCUMENT
// ============================================================================

export function renderMentionsFinales(options: {
  cabinetNom: string
  cabinetAdresse?: string
  reference?: string
  date?: Date | string
  mentions?: string[]
  confidentialite?: boolean
}): string {
  const mentionsHtml = (options.mentions || []).map(m =>
    `<p style="margin-bottom: 8px;">${escapeHtml(m)}</p>`
  ).join('')

  return `
    <div class="section" style="margin-top: 40px; break-inside: avoid;">
      <div class="signature-intro">
        ${mentionsHtml}
        ${options.confidentialite !== false ? `
          <p style="margin-bottom: 8px;">
            Ce document est strictement confidentiel et destiné exclusivement à son destinataire. 
            Toute reproduction, diffusion ou utilisation non autorisée est interdite.
          </p>
        ` : ''}
        <p>
          Document généré le ${fmtDateLongue(options.date || new Date())}${options.reference ? ` — Référence : ${escapeHtml(options.reference)}` : ''}
        </p>
      </div>
      <div style="margin-top: 24px; text-align: center; color: var(--text-light); font-size: 9pt;">
        <p><strong>${escapeHtml(options.cabinetNom)}</strong></p>
        ${options.cabinetAdresse ? `<p>${escapeHtml(options.cabinetAdresse)}</p>` : ''}
        ${options.confidentialite !== false ? `<p style="margin-top: 8px;">Document confidentiel${options.reference ? ` • Réf: ${escapeHtml(options.reference)}` : ''}</p>` : ''}
      </div>
    </div>`
}

// ============================================================================
// 12. CARTES (CARD)
// ============================================================================

/** Carte générique avec titre et contenu */
export function renderCard(titre: string, contenuHtml: string, options?: {
  badge?: { label: string; variant: BadgeVariant }
  noPadding?: boolean
}): string {
  return `
    <div class="card" style="break-inside: avoid;">
      <div class="card-header">
        <span class="card-title">${escapeHtml(titre)}</span>
        ${options?.badge ? renderBadge(options.badge.label, options.badge.variant) : ''}
      </div>
      <div${options?.noPadding ? ' style="margin: -24px; margin-top: 0;"' : ''}>
        ${contenuHtml}
      </div>
    </div>`
}

// ============================================================================
// 13. PARAGRAPHE / TEXTE STRUCTURÉ
// ============================================================================

/** Paragraphe de texte avec style document */
export function renderParagraphe(texte: string): string {
  return `<p style="font-size: 10pt; color: var(--text); line-height: 1.7; margin-bottom: 12px;">${texte}</p>`
}

/** Liste à puces simple */
export function renderListe(items: string[], options?: { style?: 'bullet' | 'numbered' }): string {
  if (items.length === 0) return ''
  const tag = options?.style === 'numbered' ? 'ol' : 'ul'
  const itemsHtml = items.map(item =>
    `<li style="font-size: 10pt; color: var(--text); line-height: 1.7; margin-bottom: 6px;">${escapeHtml(item)}</li>`
  ).join('')
  return `<${tag} style="padding-left: 20px; margin-bottom: 16px;">${itemsHtml}</${tag}>`
}

// ============================================================================
// 14. SÉPARATEUR
// ============================================================================

export function renderSeparateur(): string {
  return `<hr style="border: none; border-top: 1px solid var(--border); margin: 24px 0;">`
}

// ============================================================================
// 15. ESPACEMENT VERTICAL
// ============================================================================

export function renderEspace(hauteur: number = 24): string {
  return `<div style="height: ${hauteur}px;"></div>`
}
