/**
 * Index des templates PDF Premium
 * Export centralisé de tous les templates de génération de documents
 * 
 * ARCHITECTURE UNIFIÉE :
 * 1. pdf-utils.ts         — Formatters centralisés (fmtEur, fmtDate, etc.)
 * 2. pdf-components.ts    — Composants HTML réutilisables (cover, TOC, table, KPI, encadré, etc.)
 * 3. pdf-document-builder.ts — Moteur de composition (PdfDocumentBuilder)
 * 4. pdf-styles-premium.ts — CSS @page WeasyPrint + styles visuels
 * 5. Templates métier      — Utilisent le builder + composants + utils
 */

// ============================================================================
// SYSTÈME UNIFIÉ — Nouveau standard
// ============================================================================

// Formatters centralisés
export {
  fmtEur, fmtEurPrecis, fmtNum, fmtNumPrecis,
  fmtPctFromDecimal, fmtPct, fmtPctEntier,
  fmtDateLongue, fmtDateCourte, fmtDateJourMois, fmtMoisAnnee,
  fmtValeurUnite, amountClass, fmtEurSigne,
  escapeHtml, nl2br, valOu,
  getBadgeColors, prioriteToVariant, statutToVariant,
  fmtCategoryLabel, fmtSituationLabel, fmtRegimeLabel,
  type BadgeVariant,
} from './pdf-utils'

// Composants HTML réutilisables
export {
  renderCover, renderToc, renderPageHeader, renderPageClose,
  renderSectionHeader, renderSubsectionTitle,
  renderKpiRow, renderKpiSingle,
  renderTable, renderKeyValueTable,
  renderEncadre, renderEncadreList,
  renderPreconisation, renderPreconisations,
  renderBadge, renderSignature,
  renderMentionsFinales, renderCard,
  renderParagraphe, renderListe, renderSeparateur, renderEspace,
  type CoverData, type TocItem, type SectionHeaderData, type KpiData,
  type TableColumn, type EncadreData, type PreconisationData, type SignatureData,
} from './pdf-components'

// Moteur de composition documentaire
export {
  PdfDocumentBuilder,
  createRapportBuilder, createSimulationBuilder,
  createDocumentReglementaireBuilder, createFactureBuilder,
  type DocumentMeta,
} from './pdf-document-builder'

// Styles partagés + Charts SVG
export { premiumReportStyles, generateDonutChart, generateHorizontalBarChart, generateGauge } from './pdf-styles-premium'

// Templates Premium
export { generateBilanPatrimonialPremiumHtml } from './bilan-patrimonial-premium'
export type { BilanPatrimonialPremiumData } from './bilan-patrimonial-premium'

export { generateRapportConseilHtml } from './rapport-conseil-template'
export type { RapportConseilData } from './rapport-conseil-template'

export { generateLettreMissionHtml } from './lettre-mission-template'
export type { LettreMissionData } from './lettre-mission-template'

export { generateFicheClientHtml } from './fiche-client-template'
export type { FicheClientData } from './fiche-client-template'

export { generateRapportSimulationHtml } from './rapport-simulation-template'
export type { RapportSimulationData } from './rapport-simulation-template'

export { generateFactureHtml } from './facture-template'
export type { FactureData } from './facture-template'

export { generateDiagnosticSuccessoralHtml } from './diagnostic-successoral-template'
export type { DiagnosticSuccessoralData } from './diagnostic-successoral-template'

// Documents réglementaires CGP
export { generateEntreeRelationHtml } from './entree-relation-template'
export type { EntreeRelationData } from './entree-relation-template'

export { generateDeclarationAdequationHtml } from './declaration-adequation-template'
export type { DeclarationAdequationData } from './declaration-adequation-template'

// Rapports Intelligents — Simulateurs
export { generateRapportPrevoyanceTnsHtml } from './rapport-prevoyance-tns-template'
export type { RapportPrevoyanceTnsData } from './rapport-prevoyance-tns-template'

// Legacy template (pour compatibilité)
export { generateBilanPatrimonialHtml } from './bilan-patrimonial-template'
export type { BilanPatrimonialData } from './bilan-patrimonial-template'
