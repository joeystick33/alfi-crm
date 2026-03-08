/**
 * PDF Document Builder — Moteur de composition documentaire unifié
 * 
 * Ce builder impose une structure documentaire standard à TOUS les exports PDF du CRM.
 * Il garantit :
 * - Même gabarit (couverture → sommaire → corps → conclusion → annexes)
 * - Même CSS (premiumReportStyles)
 * - Même pagination (@page WeasyPrint)
 * - Même qualité visuelle
 * - Même discipline de mise en page
 * 
 * Usage :
 * ```ts
 * const html = new PdfDocumentBuilder()
 *   .setCover({ titre: 'Bilan Patrimonial', ... })
 *   .addToc([...])
 *   .addChapter('Situation patrimoniale', sectionHtml)
 *   .addChapter('Analyse fiscale', sectionHtml)
 *   .addAnnexe('Détail des actifs', annexeHtml)
 *   .setMentions({ cabinetNom: '...', ... })
 *   .build()
 * ```
 */

import { premiumReportStyles } from './pdf-styles-premium'
import {
  renderCover,
  renderToc,
  renderMentionsFinales,
  type CoverData,
  type TocItem,
} from './pdf-components'
import { escapeHtml, fmtDateLongue } from './pdf-utils'

// ============================================================================
// TYPES
// ============================================================================

interface ChapterEntry {
  titre: string
  sousTitre?: string
  pageLabel?: string
  contenu: string
  /** Si true, ne force pas de saut de page avant ce chapitre */
  noBreakBefore?: boolean
}

interface AnnexeEntry {
  titre: string
  contenu: string
}

interface MentionsData {
  cabinetNom: string
  cabinetAdresse?: string
  reference?: string
  date?: Date | string
  mentions?: string[]
  confidentialite?: boolean
}

interface SignatureBlock {
  introTexte?: string
  roleGauche: string
  nomGauche: string
  roleDroit: string
  nomDroit: string
  dateLieu?: string
}

export interface DocumentMeta {
  /** Titre du document pour la balise <title> */
  titre: string
  /** Langue du document (défaut: fr) */
  langue?: string
}

// ============================================================================
// BUILDER
// ============================================================================

export class PdfDocumentBuilder {
  private meta: DocumentMeta = { titre: 'Document', langue: 'fr' }
  private coverData: CoverData | null = null
  private tocItems: TocItem[] = []
  private tocOptions: { titre?: string; intro?: string; noteFinale?: string } = {}
  private showToc: boolean = false
  private chapters: ChapterEntry[] = []
  private annexes: AnnexeEntry[] = []
  private mentionsData: MentionsData | null = null
  private signatureData: SignatureBlock | null = null
  private customStyles: string = ''
  private introHtml: string = ''

  // --------------------------------------------------------------------------
  // CONFIGURATION
  // --------------------------------------------------------------------------

  /** Définit les métadonnées du document */
  setMeta(meta: DocumentMeta): this {
    this.meta = meta
    return this
  }

  /** Ajoute des styles CSS personnalisés (en plus du socle commun) */
  addCustomStyles(css: string): this {
    this.customStyles += css
    return this
  }

  // --------------------------------------------------------------------------
  // PAGE DE COUVERTURE
  // --------------------------------------------------------------------------

  /** Définit la page de couverture */
  setCover(data: CoverData): this {
    this.coverData = data
    this.meta.titre = data.titre
    return this
  }

  // --------------------------------------------------------------------------
  // SOMMAIRE
  // --------------------------------------------------------------------------

  /** Active le sommaire avec les entrées fournies */
  addToc(items: TocItem[], options?: { titre?: string; intro?: string; noteFinale?: string }): this {
    this.tocItems = items
    this.tocOptions = options || {}
    this.showToc = true
    return this
  }

  /** Génère automatiquement le sommaire à partir des chapitres ajoutés */
  autoToc(options?: { titre?: string; intro?: string; noteFinale?: string }): this {
    this.tocOptions = options || {}
    this.showToc = true
    // Les items seront générés dans build() à partir des chapitres
    return this
  }

  // --------------------------------------------------------------------------
  // INTRODUCTION / CONTEXTE
  // --------------------------------------------------------------------------

  /** Ajoute un bloc d'introduction / contexte après le sommaire */
  setIntro(html: string): this {
    this.introHtml = html
    return this
  }

  // --------------------------------------------------------------------------
  // CHAPITRES (CORPS PRINCIPAL)
  // --------------------------------------------------------------------------

  /** Ajoute un chapitre au corps principal */
  addChapter(titre: string, contenu: string, options?: {
    sousTitre?: string
    pageLabel?: string
    noBreakBefore?: boolean
  }): this {
    this.chapters.push({
      titre,
      sousTitre: options?.sousTitre,
      pageLabel: options?.pageLabel,
      contenu,
      noBreakBefore: options?.noBreakBefore,
    })
    return this
  }

  /** Ajoute du HTML brut sans en-tête de chapitre (pour continuation de section) */
  addRawContent(contenu: string): this {
    this.chapters.push({
      titre: '',
      contenu,
      noBreakBefore: true,
    })
    return this
  }

  // --------------------------------------------------------------------------
  // ANNEXES
  // --------------------------------------------------------------------------

  /** Ajoute une annexe */
  addAnnexe(titre: string, contenu: string): this {
    this.annexes.push({ titre, contenu })
    return this
  }

  // --------------------------------------------------------------------------
  // SIGNATURE
  // --------------------------------------------------------------------------

  /** Ajoute un bloc de signature */
  setSignature(data: SignatureBlock): this {
    this.signatureData = data
    return this
  }

  // --------------------------------------------------------------------------
  // MENTIONS FINALES
  // --------------------------------------------------------------------------

  /** Définit les mentions légales de fin de document */
  setMentions(data: MentionsData): this {
    this.mentionsData = data
    return this
  }

  // --------------------------------------------------------------------------
  // BUILD — ASSEMBLAGE FINAL
  // --------------------------------------------------------------------------

  /** Assemble le document HTML complet prêt pour WeasyPrint */
  build(): string {
    const parts: string[] = []

    // 1. Page de couverture
    if (this.coverData) {
      parts.push(renderCover(this.coverData))
    }

    // 2. Sommaire
    if (this.showToc) {
      const tocEntries = this.tocItems.length > 0
        ? this.tocItems
        : this.buildAutoTocItems()
      
      if (tocEntries.length > 0) {
        parts.push(renderToc(tocEntries, this.tocOptions))
      }
    }

    // 3. Introduction
    if (this.introHtml) {
      parts.push(`
        <div class="content-page chapter-break" data-page-label="Introduction">
          <div class="page-header">
            <h2 class="page-title">Introduction</h2>
          </div>
          <div class="section">
            ${this.introHtml}
          </div>
        </div>`)
    }

    // 4. Chapitres (corps principal)
    for (const chapter of this.chapters) {
      if (!chapter.titre && chapter.contenu) {
        // Contenu brut sans en-tête
        parts.push(chapter.contenu)
        continue
      }

      const breakClass = chapter.noBreakBefore ? '' : ' chapter-break'
      const pageLabel = chapter.pageLabel || chapter.titre

      parts.push(`
        <div class="content-page${breakClass}" data-page-label="${escapeHtml(pageLabel)}">
          <div class="page-header">
            <div>
              <h2 class="page-title">${escapeHtml(chapter.titre)}</h2>
              ${chapter.sousTitre ? `<p style="font-size: 10pt; color: var(--text-muted); margin-top: 4px;">${escapeHtml(chapter.sousTitre)}</p>` : ''}
            </div>
          </div>
          ${chapter.contenu}
        </div>`)
    }

    // 5. Signature
    if (this.signatureData) {
      parts.push(`
        <div class="content-page" data-page-label="Signatures">
          <div class="signature-section" style="break-inside: avoid;">
            ${this.signatureData.introTexte ? `
              <div class="signature-intro">
                <p>${this.signatureData.introTexte}</p>
              </div>
            ` : ''}
            <div class="signature-grid">
              <div class="signature-box">
                <div class="signature-role">${escapeHtml(this.signatureData.roleGauche)}</div>
                <div class="signature-line"></div>
                <div class="signature-name">${escapeHtml(this.signatureData.nomGauche)}</div>
                ${this.signatureData.dateLieu ? `<div class="signature-date">${escapeHtml(this.signatureData.dateLieu)}</div>` : ''}
              </div>
              <div class="signature-box">
                <div class="signature-role">${escapeHtml(this.signatureData.roleDroit)}</div>
                <div class="signature-line"></div>
                <div class="signature-name">${escapeHtml(this.signatureData.nomDroit)}</div>
                ${this.signatureData.dateLieu ? `<div class="signature-date">${escapeHtml(this.signatureData.dateLieu)}</div>` : ''}
              </div>
            </div>
          </div>
        </div>`)
    }

    // 6. Annexes
    if (this.annexes.length > 0) {
      for (let i = 0; i < this.annexes.length; i++) {
        const annexe = this.annexes[i]
        const annexeNum = i + 1
        parts.push(`
          <div class="content-page chapter-break" data-page-label="Annexe ${annexeNum}">
            <div class="page-header">
              <div>
                <h2 class="page-title">Annexe ${annexeNum}</h2>
                <p style="font-size: 10pt; color: var(--text-muted); margin-top: 4px;">${escapeHtml(annexe.titre)}</p>
              </div>
            </div>
            ${annexe.contenu}
          </div>`)
      }
    }

    // 7. Mentions finales
    if (this.mentionsData) {
      parts.push(`
        <div class="content-page" data-page-label="Mentions">
          ${renderMentionsFinales(this.mentionsData)}
        </div>`)
    }

    // Assemblage HTML complet
    return `<!DOCTYPE html>
<html lang="${this.meta.langue || 'fr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(this.meta.titre)}</title>
  <style>
    ${premiumReportStyles}
    ${this.customStyles}
  </style>
</head>
<body>
  ${parts.join('\n')}
</body>
</html>`
  }

  // --------------------------------------------------------------------------
  // HELPERS INTERNES
  // --------------------------------------------------------------------------

  private buildAutoTocItems(): TocItem[] {
    return this.chapters
      .filter(ch => ch.titre) // Exclure le contenu brut sans titre
      .map((ch, i) => ({
        numero: i + 1,
        titre: ch.titre,
        description: ch.sousTitre,
      }))
  }
}

// ============================================================================
// FACTORY — Raccourcis pour les types de documents courants
// ============================================================================

/** Crée un builder pré-configuré pour un rapport standard */
export function createRapportBuilder(cover: CoverData): PdfDocumentBuilder {
  return new PdfDocumentBuilder()
    .setCover(cover)
    .autoToc({ intro: 'Ce document présente l\'ensemble des analyses et recommandations réalisées dans le cadre de votre accompagnement.' })
}

/** Crée un builder pré-configuré pour une simulation */
export function createSimulationBuilder(cover: CoverData): PdfDocumentBuilder {
  return new PdfDocumentBuilder()
    .setCover(cover)
}

/** Crée un builder pré-configuré pour un document réglementaire */
export function createDocumentReglementaireBuilder(cover: CoverData): PdfDocumentBuilder {
  return new PdfDocumentBuilder()
    .setCover(cover)
}

/** Crée un builder pré-configuré pour une facture (pas de couverture pleine page) */
export function createFactureBuilder(): PdfDocumentBuilder {
  return new PdfDocumentBuilder()
}
