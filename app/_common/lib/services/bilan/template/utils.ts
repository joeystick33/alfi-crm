/**
 * Utilitaires de formatage pour le template premium
 */

import { COLORS } from './styles'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getProfilLabel(profil: string): string {
  const labels: Record<string, string> = {
    SECURITAIRE: 'Securitaire',
    PRUDENT: 'Prudent',
    EQUILIBRE: 'Equilibre',
    DYNAMIQUE: 'Dynamique',
    OFFENSIF: 'Offensif',
  }
  return labels[profil] || profil
}

export function getImpactBadge(impact: string): string {
  const colors: Record<string, string> = {
    FORT: COLORS.danger,
    MOYEN: COLORS.warning,
    FAIBLE: COLORS.secondary,
  }
  return `<span style="background: ${colors[impact] || COLORS.muted}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px;">${impact}</span>`
}

export function getStatutBadge(statut: string): string {
  const config: Record<string, { color: string; label: string }> = {
    SUFFISANT: { color: COLORS.secondary, label: 'Suffisant' },
    INSUFFISANT: { color: COLORS.warning, label: 'Insuffisant' },
    ABSENT: { color: COLORS.danger, label: 'Absent' },
  }
  const c = config[statut] || { color: COLORS.muted, label: statut }
  return `<span style="background: ${c.color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px;">${c.label}</span>`
}

export function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.secondary
  if (score >= 60) return COLORS.primary
  if (score >= 40) return COLORS.warning
  return COLORS.danger
}

export function generateScoreBar(label: string, score: number): string {
  const color = getScoreColor(score)
  return `
    <div style="text-align: center;">
      <div style="font-size: 16px; font-weight: 700; color: ${color};">${score}</div>
      <div class="progress" style="height: 6px;">
        <div class="progress-fill" style="width: ${score}%; background: ${color};"></div>
      </div>
      <div style="font-size: 9px; color: ${COLORS.muted};">${label}</div>
    </div>
  `
}

export function generateFooter(clientName: string, date: Date): string {
  return `
    <div class="page-footer">
      Bilan Patrimonial - ${clientName} | AURA | ${formatDate(date)}
    </div>
  `
}
