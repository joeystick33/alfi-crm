/**
 * PDF Utils — Fonctions utilitaires centralisées pour tous les templates PDF
 * 
 * Toutes les fonctions de formatage, de calcul et d'échappement HTML
 * utilisées par les templates PDF doivent être importées depuis ce fichier.
 * Aucun template ne doit redéfinir ces fonctions localement.
 */

// ============================================================================
// FORMATAGE MONÉTAIRE
// ============================================================================

/** Formate un montant en euros (ex: 125 000 €) — sans décimales */
export function fmtEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Formate un montant en euros avec 2 décimales (ex: 1 250,75 €) */
export function fmtEurPrecis(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** Formate un nombre sans devise (ex: 125 000) */
export function fmtNum(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)
}

/** Formate un nombre avec décimales (ex: 3,75) */
export function fmtNumPrecis(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

// ============================================================================
// FORMATAGE POURCENTAGES
// ============================================================================

/** Formate un pourcentage depuis une valeur décimale (0.0425 → "4,25 %") */
export function fmtPctFromDecimal(value: number): string {
  return `${(value * 100).toFixed(2)} %`
}

/** Formate un pourcentage depuis une valeur entière (4.25 → "4,25 %") */
export function fmtPct(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals).replace('.', ',')} %`
}

/** Formate un pourcentage entier (42.7 → "43 %") */
export function fmtPctEntier(value: number): string {
  return `${Math.round(value)} %`
}

// ============================================================================
// FORMATAGE DATES
// ============================================================================

/** Formate une date longue (ex: "6 mars 2025") */
export function fmtDateLongue(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Formate une date courte (ex: "06/03/2025") */
export function fmtDateCourte(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Formate une date avec jour et mois (ex: "06 mars") */
export function fmtDateJourMois(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  })
}

/** Formate un mois et année (ex: "mars 2025") */
export function fmtMoisAnnee(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

// ============================================================================
// FORMATAGE CONDITIONNEL
// ============================================================================

/** Formate une valeur selon son unité (€, %, texte) */
export function fmtValeurUnite(
  valeur: string | number,
  unite?: string
): string {
  if (typeof valeur === 'string') return valeur
  if (unite === '€') return fmtEur(valeur)
  if (unite === '%') return fmtPctFromDecimal(valeur)
  if (unite === 'ans' || unite === 'années') return `${valeur} ${unite}`
  if (unite === 'mois') return `${valeur} mois`
  if (unite) return `${fmtNum(valeur)} ${unite}`
  return fmtNum(valeur)
}

/** Retourne la classe CSS pour un montant positif/négatif */
export function amountClass(value: number): string {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return ''
}

/** Retourne + ou - devant un montant formaté */
export function fmtEurSigne(value: number): string {
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${fmtEur(value)}`
}

// ============================================================================
// HTML HELPERS
// ============================================================================

/** Échappe les caractères HTML dangereux */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Convertit les sauts de ligne en <br> */
export function nl2br(str: string | null | undefined): string {
  if (!str) return ''
  return escapeHtml(str).replace(/\n/g, '<br>')
}

/** Retourne une valeur ou un tiret si vide/null/undefined */
export function valOu(value: string | number | null | undefined, fallback: string = '—'): string {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

// ============================================================================
// BADGES & STATUTS
// ============================================================================

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

/** Retourne les couleurs CSS pour un badge selon la variante */
export function getBadgeColors(variant: BadgeVariant): { bg: string; color: string } {
  switch (variant) {
    case 'success': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }
    case 'warning': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }
    case 'danger':  return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }
    case 'info':    return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }
    case 'neutral': return { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b' }
  }
}

/** Convertit une priorité métier en variante de badge */
export function prioriteToVariant(priorite: string): BadgeVariant {
  const p = priorite.toUpperCase()
  if (p === 'HAUTE' || p === 'HIGH' || p === 'URGENTE') return 'danger'
  if (p === 'MOYENNE' || p === 'MEDIUM' || p === 'NORMALE') return 'warning'
  if (p === 'BASSE' || p === 'LOW' || p === 'FAIBLE') return 'success'
  return 'neutral'
}

/** Convertit un statut métier en variante de badge */
export function statutToVariant(statut: string): BadgeVariant {
  const s = statut.toUpperCase()
  if (['PAYEE', 'ACTIVE', 'VALIDEE', 'TERMINEE', 'COMPLETE', 'ACCEPTEE'].includes(s)) return 'success'
  if (['ENVOYEE', 'EN_COURS', 'PENDING', 'EN_ATTENTE'].includes(s)) return 'info'
  if (['BROUILLON', 'DRAFT', 'INACTIF', 'INCONNUE'].includes(s)) return 'neutral'
  if (['EN_RETARD', 'REJETEE', 'ANNULEE', 'ERREUR', 'ECHOUEE'].includes(s)) return 'danger'
  if (['A_REVOIR', 'ATTENTION'].includes(s)) return 'warning'
  return 'neutral'
}

// ============================================================================
// LABELS MÉTIER
// ============================================================================

const CATEGORY_LABELS: Record<string, string> = {
  IMMOBILIER: 'Immobilier',
  FINANCIER: 'Financier',
  EPARGNE_SALARIALE: 'Épargne salariale',
  EPARGNE_RETRAITE: 'Épargne retraite',
  PROFESSIONNEL: 'Professionnel',
  MOBILIER: 'Mobilier',
  AUTRE: 'Autre',
}

/** Convertit un code catégorie en label lisible */
export function fmtCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, ' ')
}

const SITUATION_LABELS: Record<string, string> = {
  CELIBATAIRE: 'Célibataire',
  MARIE: 'Marié(e)',
  PACSE: 'Pacsé(e)',
  DIVORCE: 'Divorcé(e)',
  VEUF: 'Veuf(ve)',
  CONCUBINAGE: 'Concubinage',
  UNION_LIBRE: 'Union libre',
}

/** Convertit un code situation familiale en label lisible */
export function fmtSituationLabel(situation: string | null | undefined): string {
  if (!situation) return '—'
  return SITUATION_LABELS[situation.toUpperCase()] || situation
}

const REGIME_LABELS: Record<string, string> = {
  COMMUNAUTE_REDUITE_AUX_ACQUETS: 'Communauté réduite aux acquêts',
  COMMUNAUTE_UNIVERSELLE: 'Communauté universelle',
  SEPARATION_DE_BIENS: 'Séparation de biens',
  PARTICIPATION_AUX_ACQUETS: 'Participation aux acquêts',
}

/** Convertit un code régime matrimonial en label lisible */
export function fmtRegimeLabel(regime: string | null | undefined): string {
  if (!regime) return '—'
  return REGIME_LABELS[regime.toUpperCase()] || regime
}
