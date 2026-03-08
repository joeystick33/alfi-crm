/**
 * =============================================================================
 * SERVICE ADMIN — Lecture / Écriture des règles fiscales
 * =============================================================================
 *
 * Ce module fournit les fonctions pour :
 * 1. Lire les règles actuelles (défauts + surcharges)
 * 2. Appliquer des surcharges runtime via un fichier JSON
 * 3. Réinitialiser les surcharges
 *
 * Les surcharges sont stockées dans fiscal-rules-overrides.json
 * et prennent priorité sur les valeurs par défaut de fiscal-rules.ts.
 */

import fs from 'fs'
import path from 'path'
import {
  RULES,
  type FiscalRules,
  _patchRulesInPlace,
  _isOverridesApplied,
  _setOverridesApplied,
} from './fiscal-rules'

const OVERRIDES_PATH = path.join(
  process.cwd(),
  'app/_common/lib/rules/fiscal-rules-overrides.json'
)

// ============================================================================
// TYPES
// ============================================================================

export interface OverridesMeta {
  description: string
  lastModifiedBy: string | null
  lastModifiedAt: string | null
  version: string
}

export interface OverridesFile {
  _meta: OverridesMeta
  [key: string]: unknown
}

export interface RuleChange {
  path: string      // e.g. "ir.bareme.0.max"
  oldValue: unknown
  newValue: unknown
  changedAt: string
  changedBy: string
}

// ============================================================================
// LECTURE DES SURCHARGES
// ============================================================================

function readOverridesFile(): OverridesFile {
  try {
    if (!fs.existsSync(OVERRIDES_PATH)) {
      return {
        _meta: {
          description: 'Surcharges runtime des règles fiscales.',
          lastModifiedBy: null,
          lastModifiedAt: null,
          version: '2026.1.0',
        },
      }
    }
    const raw = fs.readFileSync(OVERRIDES_PATH, 'utf-8')
    return JSON.parse(raw) as OverridesFile
  } catch {
    return {
      _meta: {
        description: 'Surcharges runtime des règles fiscales.',
        lastModifiedBy: null,
        lastModifiedAt: null,
        version: '2026.1.0',
      },
    }
  }
}

function writeOverridesFile(data: OverridesFile): void {
  fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

// ============================================================================
// DEEP MERGE UTILS
// ============================================================================

function deepGet(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

function deepSet(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  let current: Record<string, unknown> = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  current[keys[keys.length - 1]] = value
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (key === '_meta') continue
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] !== null &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      )
    } else {
      result[key] = source[key]
    }
  }
  return result
}

// ============================================================================
// API PUBLIQUES
// ============================================================================

/**
 * Retourne les règles actuelles (défauts + surcharges fusionnées)
 */
export function getCurrentRules(): { rules: FiscalRules; overrides: OverridesFile; hasOverrides: boolean } {
  const overrides = readOverridesFile()
  const { _meta, ...overrideValues } = overrides
  const hasOverrides = Object.keys(overrideValues).length > 0

  if (!hasOverrides) {
    return { rules: RULES, overrides, hasOverrides: false }
  }

  const merged = deepMerge(
    JSON.parse(JSON.stringify(RULES)) as Record<string, unknown>,
    overrideValues
  ) as unknown as FiscalRules

  return { rules: merged, overrides, hasOverrides: true }
}

/**
 * Applique une ou plusieurs surcharges
 */
export function applyOverrides(
  changes: { path: string; value: unknown }[],
  changedBy: string
): { success: boolean; changelog: RuleChange[] } {
  const overrides = readOverridesFile()
  const changelog: RuleChange[] = []

  for (const change of changes) {
    const oldValue = deepGet(JSON.parse(JSON.stringify(RULES)) as Record<string, unknown>, change.path)
    deepSet(overrides as unknown as Record<string, unknown>, change.path, change.value)

    changelog.push({
      path: change.path,
      oldValue,
      newValue: change.value,
      changedAt: new Date().toISOString(),
      changedBy,
    })
  }

  overrides._meta.lastModifiedBy = changedBy
  overrides._meta.lastModifiedAt = new Date().toISOString()

  writeOverridesFile(overrides)

  // Appliquer les surcharges directement sur l'objet RULES en mémoire
  // pour que TOUS les modules voient les nouvelles valeurs immédiatement
  const { _meta: _m, ...liveOverrides } = readOverridesFile()
  if (Object.keys(liveOverrides).length > 0) {
    _patchRulesInPlace(liveOverrides)
  }

  return { success: true, changelog }
}

/**
 * Réinitialise toutes les surcharges (retour aux défauts)
 */
export function resetOverrides(resetBy: string): { success: boolean; requiresRestart: boolean } {
  const freshOverrides: OverridesFile = {
    _meta: {
      description: 'Surcharges runtime des règles fiscales.',
      lastModifiedBy: resetBy,
      lastModifiedAt: new Date().toISOString(),
      version: RULES.meta.version,
    },
  }
  writeOverridesFile(freshOverrides)
  // Note: le fichier JSON est nettoyé, mais l'objet RULES en mémoire conserve
  // les anciennes surcharges jusqu'au prochain redémarrage du serveur.
  return { success: true, requiresRestart: true }
}

/**
 * Retourne la structure des règles avec les types de chaque champ
 * pour l'UI admin (auto-génération de formulaire)
 */
export function getRulesSchema(): Record<string, unknown> {
  return buildSchema(JSON.parse(JSON.stringify(RULES)) as Record<string, unknown>, '')
}

function buildSchema(obj: Record<string, unknown>, prefix: string): Record<string, unknown> {
  const schema: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (key === '_meta') continue
    const fullPath = prefix ? `${prefix}.${key}` : key

    if (value === null || value === undefined) {
      schema[key] = { type: 'null', path: fullPath, value }
    } else if (typeof value === 'number') {
      // Détection automatique du type de nombre
      const isRate = key.includes('taux') || key.includes('rate') || key.includes('coefficient')
      const isPercentage = isRate && (value as number) <= 1
      schema[key] = {
        type: 'number',
        subtype: isPercentage ? 'percentage' : isRate ? 'rate' : 'amount',
        path: fullPath,
        value,
      }
    } else if (typeof value === 'string') {
      schema[key] = { type: 'string', path: fullPath, value }
    } else if (typeof value === 'boolean') {
      schema[key] = { type: 'boolean', path: fullPath, value }
    } else if (Array.isArray(value)) {
      schema[key] = {
        type: 'array',
        path: fullPath,
        value,
        itemCount: value.length,
        itemSchema: value.length > 0 ? buildSchema(
          typeof value[0] === 'object' && value[0] !== null
            ? value[0] as Record<string, unknown>
            : { _value: value[0] },
          `${fullPath}.0`
        ) : {},
      }
    } else if (typeof value === 'object') {
      schema[key] = {
        type: 'object',
        path: fullPath,
        children: buildSchema(value as Record<string, unknown>, fullPath),
      }
    }
  }

  return schema
}

/**
 * Retourne les sections de premier niveau pour la navigation admin
 */
/**
 * Initialise RULES avec les surcharges JSON au démarrage du serveur.
 * Appelé automatiquement au premier import côté serveur.
 * Idempotent : ne s'exécute qu'une seule fois.
 */
export function initRulesOverrides(): void {
  if (_isOverridesApplied()) return
  _setOverridesApplied(true)

  try {
    if (!fs.existsSync(OVERRIDES_PATH)) return
    const raw = fs.readFileSync(OVERRIDES_PATH, 'utf-8')
    const data = JSON.parse(raw) as OverridesFile
    const { _meta, ...overrideValues } = data
    if (Object.keys(overrideValues).length > 0) {
      _patchRulesInPlace(overrideValues)
      console.log(
        `[fiscal-rules] ${Object.keys(overrideValues).length} section(s) de surcharges appliquées depuis fiscal-rules-overrides.json`
      )
    }
  } catch (err) {
    console.warn('[fiscal-rules] Impossible de lire les surcharges :', err)
  }
}

// Auto-init au premier import côté serveur
initRulesOverrides()

export function getRulesSections(): { key: string; label: string; fieldCount: number }[] {
  const sections: { key: string; label: string; fieldCount: number }[] = []

  const labelMap: Record<string, string> = {
    ir: 'Impôt sur le Revenu (IR)',
    ifi: 'Impôt sur la Fortune Immobilière (IFI)',
    ps: 'Prélèvements Sociaux',
    per: 'Plan Épargne Retraite (PER)',
    av: 'Assurance-Vie',
    succession: 'Succession & Donation',
    donation: 'Donation',
    demembrement: 'Démembrement (art. 669)',
    immobilier: 'Immobilier',
    placements: 'Placements Réglementés',
    retraite: 'Retraite',
    social: 'Charges Sociales',
    optimisations: 'Optimisations Fiscales',
    jurisprudence: 'Jurisprudence',
  }

  function countFields(obj: unknown): number {
    if (obj === null || obj === undefined) return 0
    if (typeof obj !== 'object') return 1
    if (Array.isArray(obj)) return obj.length
    let count = 0
    for (const val of Object.values(obj as Record<string, unknown>)) {
      count += countFields(val)
    }
    return count
  }

  for (const [key, value] of Object.entries(RULES)) {
    if (key === '_meta') continue
    sections.push({
      key,
      label: labelMap[key] || key,
      fieldCount: countFields(value),
    })
  }

  return sections
}
