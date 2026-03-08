'use client'

/**
 * Page SuperAdmin — Gestion des Règles Fiscales Centralisées
 *
 * Interface complète pour modifier toutes les règles fiscales, sociales,
 * et financières du CRM sans toucher au code.
 *
 * Fonctionnalités :
 * - Navigation par sections (IR, IFI, PS, PER, AV, Succession, Immobilier…)
 * - Édition en ligne de chaque valeur
 * - Détection automatique du type (montant, taux, pourcentage, texte)
 * - Historique des modifications (surcharges)
 * - Réinitialisation aux valeurs par défaut
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  Save,
  RefreshCw,
  Search,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Building2,
  Landmark,
  PiggyBank,
  Shield,
  Home,
  TrendingUp,
  Heart,
  Gavel,
  Percent,
  RotateCcw,
  FileText,
  Users,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface RulesSection {
  key: string
  label: string
  fieldCount: number
}

interface PendingChange {
  path: string
  value: unknown
  originalValue: unknown
  label: string
}

// ============================================================================
// ICÔNES PAR SECTION
// ============================================================================

const SECTION_ICONS: Record<string, React.ReactNode> = {
  ir: <Scale className="w-5 h-5" />,
  ifi: <Landmark className="w-5 h-5" />,
  ps: <Percent className="w-5 h-5" />,
  per: <PiggyBank className="w-5 h-5" />,
  av: <Shield className="w-5 h-5" />,
  succession: <Users className="w-5 h-5" />,
  donation: <Heart className="w-5 h-5" />,
  demembrement: <FileText className="w-5 h-5" />,
  immobilier: <Home className="w-5 h-5" />,
  placements: <TrendingUp className="w-5 h-5" />,
  retraite: <Building2 className="w-5 h-5" />,
  social: <Users className="w-5 h-5" />,
  optimisations: <TrendingUp className="w-5 h-5" />,
  jurisprudence: <Gavel className="w-5 h-5" />,
}

// ============================================================================
// HELPERS
// ============================================================================

function formatValue(value: unknown, key: string): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (typeof value === 'string') return value
  if (typeof value === 'number') {
    const isRate = key.includes('taux') || key.includes('rate') || key.includes('coefficient')
    const isPercentage = isRate && value <= 1
    if (isPercentage) return `${(value * 100).toFixed(2)} %`
    if (isRate) return `${value.toFixed(4)}`
    if (value >= 1000) return value.toLocaleString('fr-FR')
    return String(value)
  }
  return JSON.stringify(value)
}

function humanLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, s => s.toUpperCase())
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix: string = '',
  result: { path: string; key: string; value: unknown; depth: number }[] = []
): { path: string; key: string; value: unknown; depth: number }[] {
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_meta') continue
    const fullPath = prefix ? `${prefix}.${key}` : key
    const depth = fullPath.split('.').length - 1

    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      flattenObject(value as Record<string, unknown>, fullPath, result)
    } else {
      result.push({ path: fullPath, key, value, depth })
    }
  }
  return result
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function FiscalRulesPage() {
  const { toast } = useToast()

  // State
  const [sections, setSections] = useState<RulesSection[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [sectionData, setSectionData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSection, setLoadingSection] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasOverrides, setHasOverrides] = useState(false)
  const [meta, setMeta] = useState<{ lastModifiedBy: string | null; lastModifiedAt: string | null; version: string } | null>(null)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // ---- Chargement des sections ----
  const loadSections = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/fiscal-rules?sections=true')
      if (!res.ok) throw new Error('Erreur chargement sections')
      const data = await res.json()
      setSections(data.sections || [])
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les sections des règles fiscales.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // ---- Chargement d'une section ----
  const loadSection = useCallback(async (sectionKey: string) => {
    try {
      setLoadingSection(true)
      setPendingChanges([])
      const res = await fetch(`/api/superadmin/fiscal-rules?section=${sectionKey}`)
      if (!res.ok) throw new Error('Erreur chargement section')
      const data = await res.json()
      setSectionData(data.data || {})
      setHasOverrides(data.hasOverrides || false)
      setMeta(data.meta || null)
      setActiveSection(sectionKey)
    } catch (err) {
      toast({
        title: 'Erreur',
        description: `Impossible de charger la section ${sectionKey}.`,
        variant: 'destructive',
      })
    } finally {
      setLoadingSection(false)
    }
  }, [toast])

  useEffect(() => {
    loadSections()
  }, [loadSections])

  // ---- Gestion des modifications ----
  const handleValueChange = (path: string, newValue: unknown, originalValue: unknown, label: string) => {
    setPendingChanges(prev => {
      const existing = prev.findIndex(c => c.path === path)
      if (existing >= 0) {
        // Si la nouvelle valeur = originale, retirer le changement
        if (newValue === originalValue) {
          return prev.filter((_, i) => i !== existing)
        }
        const updated = [...prev]
        updated[existing] = { path, value: newValue, originalValue, label }
        return updated
      }
      if (newValue === originalValue) return prev
      return [...prev, { path, value: newValue, originalValue, label }]
    })
  }

  // ---- Sauvegarde ----
  const saveChanges = async () => {
    if (pendingChanges.length === 0) return

    try {
      setSaving(true)
      const res = await fetch('/api/superadmin/fiscal-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changes: pendingChanges.map(c => ({
            path: c.path,
            value: c.value,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erreur sauvegarde')
      }

      const result = await res.json()
      toast({
        title: 'Modifications enregistrées',
        description: result.message,
      })
      setPendingChanges([])

      // Recharger la section
      if (activeSection) {
        await loadSection(activeSection)
      }
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // ---- Réinitialisation ----
  const resetAll = async () => {
    if (!confirm('Réinitialiser toutes les surcharges ? Les valeurs par défaut du code source seront restaurées.')) return

    try {
      const res = await fetch('/api/superadmin/fiscal-rules', { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur réinitialisation')
      const result = await res.json()
      toast({
        title: 'Réinitialisé',
        description: result.message,
      })
      setPendingChanges([])
      if (activeSection) {
        await loadSection(activeSection)
      }
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la réinitialisation.',
        variant: 'destructive',
      })
    }
  }

  // ---- Rendu d'un champ éditable ----
  const renderField = (field: { path: string; key: string; value: unknown; depth: number }) => {
    const { path, key, value, depth } = field
    const fullPath = `${activeSection}.${path}`
    const pending = pendingChanges.find(c => c.path === fullPath)
    const currentValue = pending ? pending.value : value
    const isModified = pending !== undefined

    const isRate = key.includes('taux') || key.includes('rate') || key.includes('coefficient')
    const isPercentage = isRate && typeof value === 'number' && (value as number) <= 1

    // Filtre de recherche
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!key.toLowerCase().includes(q) && !humanLabel(key).toLowerCase().includes(q) && !path.toLowerCase().includes(q)) {
        return null
      }
    }

    return (
      <div
        key={path}
        className={`flex items-center gap-4 py-3 px-4 rounded-lg border transition-all ${
          isModified
            ? 'border-amber-300 bg-amber-50/50'
            : 'border-gray-100 bg-white hover:border-gray-200'
        }`}
        style={{ paddingLeft: `${16 + depth * 16}px` }}
      >
        <div className="flex-1 min-w-0">
          <Label className="text-sm font-medium text-gray-700 block">
            {humanLabel(key)}
          </Label>
          <span className="text-xs text-gray-400 font-mono">{fullPath}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {typeof value === 'boolean' ? (
            <button
              onClick={() =>
                handleValueChange(fullPath, !currentValue, value, humanLabel(key))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                currentValue ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  currentValue ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          ) : typeof value === 'number' ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step={isPercentage ? '0.001' : isRate ? '0.0001' : '1'}
                value={isPercentage ? Number(((currentValue as number) * 100).toFixed(4)) : (currentValue as number)}
                onChange={e => {
                  const raw = parseFloat(e.target.value)
                  if (isNaN(raw)) return
                  const finalValue = isPercentage ? raw / 100 : raw
                  handleValueChange(fullPath, finalValue, value, humanLabel(key))
                }}
                className="w-40 text-right font-mono text-sm"
              />
              {isPercentage && <span className="text-sm text-gray-500">%</span>}
              {!isPercentage && typeof value === 'number' && value >= 1000 && (
                <span className="text-sm text-gray-500">€</span>
              )}
            </div>
          ) : typeof value === 'string' ? (
            <Input
              type="text"
              value={currentValue as string}
              onChange={e =>
                handleValueChange(fullPath, e.target.value, value, humanLabel(key))
              }
              className="w-64 text-sm"
            />
          ) : Array.isArray(value) ? (
            <span className="text-sm text-gray-500 italic">
              [{value.length} éléments] — édition via code
            </span>
          ) : (
            <span className="text-sm text-gray-500">{formatValue(value, key)}</span>
          )}

          {isModified && (
            <button
              onClick={() =>
                handleValueChange(fullPath, value, value, humanLabel(key))
              }
              className="text-amber-600 hover:text-amber-800 transition-colors"
              title="Annuler cette modification"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // ---- Rendu des tableaux (barèmes) ----
  const renderArray = (path: string, arr: unknown[], parentKey: string) => {
    if (!Array.isArray(arr) || arr.length === 0) return null

    const firstItem = arr[0]
    if (typeof firstItem !== 'object' || firstItem === null) return null

    const columns = Object.keys(firstItem as Record<string, unknown>)

    // Filtre de recherche
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!parentKey.toLowerCase().includes(q) && !humanLabel(parentKey).toLowerCase().includes(q)) {
        return null
      }
    }

    return (
      <div key={path} className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" />
          {humanLabel(parentKey)}
          <span className="text-xs text-gray-400 font-mono">({path})</span>
        </h4>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                {columns.map(col => (
                  <th key={col} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {humanLabel(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {arr.map((item, idx) => {
                const row = item as Record<string, unknown>
                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-2 text-xs text-gray-400 font-mono">{idx}</td>
                    {columns.map(col => {
                      const cellPath = `${activeSection}.${path}.${idx}.${col}`
                      const cellValue = row[col]
                      const pending = pendingChanges.find(c => c.path === cellPath)
                      const currentCellValue = pending ? pending.value : cellValue
                      const isCellModified = pending !== undefined

                      const isRate = col.includes('taux') || col.includes('rate')
                      const isPercentage = isRate && typeof cellValue === 'number' && (cellValue as number) <= 1

                      return (
                        <td
                          key={col}
                          className={`px-3 py-2 ${isCellModified ? 'bg-amber-50' : ''}`}
                        >
                          {typeof cellValue === 'number' ? (
                            <Input
                              type="number"
                              step={isPercentage ? '0.001' : isRate ? '0.0001' : '1'}
                              value={isPercentage ? Number(((currentCellValue as number) * 100).toFixed(4)) : (currentCellValue as number)}
                              onChange={e => {
                                const raw = parseFloat(e.target.value)
                                if (isNaN(raw)) return
                                const finalValue = isPercentage ? raw / 100 : raw
                                handleValueChange(cellPath, finalValue, cellValue, `${humanLabel(parentKey)} [${idx}].${col}`)
                              }}
                              className={`w-28 text-right font-mono text-xs ${isCellModified ? 'border-amber-300' : ''}`}
                            />
                          ) : (
                            <span className="text-sm font-mono">
                              {formatValue(cellValue, col)}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ---- Rendu du contenu d'une section ----
  const renderSectionContent = () => {
    if (!sectionData || !activeSection) return null

    const fields = flattenObject(sectionData as Record<string, unknown>)
    const arrays: { path: string; key: string; value: unknown[] }[] = []

    // Extraire les tableaux du sectionData
    const extractArrays = (obj: Record<string, unknown>, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (key === '_meta') continue
        const fullPath = prefix ? `${prefix}.${key}` : key
        if (Array.isArray(value)) {
          arrays.push({ path: fullPath, key, value })
        } else if (value && typeof value === 'object') {
          extractArrays(value as Record<string, unknown>, fullPath)
        }
      }
    }
    extractArrays(sectionData as Record<string, unknown>)

    const scalarFields = fields.filter(f => !Array.isArray(f.value))
    const filteredFields = scalarFields.map(f => renderField(f)).filter(Boolean)

    return (
      <div className="space-y-4">
        {/* Champs scalaires */}
        {filteredFields.length > 0 && (
          <div className="space-y-2">
            {filteredFields}
          </div>
        )}

        {/* Tableaux (barèmes) */}
        {arrays.map(arr => renderArray(arr.path, arr.value, arr.key))}

        {filteredFields.length === 0 && arrays.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {searchQuery ? 'Aucun résultat pour cette recherche.' : 'Aucun champ éditable dans cette section.'}
          </div>
        )}
      </div>
    )
  }

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Scale className="w-7 h-7 text-indigo-600" />
                Règles Fiscales & Réglementaires
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Configuration centralisée — Toutes les modifications impactent automatiquement l&apos;ensemble du CRM
              </p>
            </div>

            <div className="flex items-center gap-3">
              {hasOverrides && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetAll}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
              )}
              {pendingChanges.length > 0 && (
                <Button
                  onClick={saveChanges}
                  disabled={saving}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer ({pendingChanges.length})
                </Button>
              )}
            </div>
          </div>

          {/* Meta info */}
          {meta && (
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
              <span>Version : <span className="font-mono text-gray-600">{meta.version}</span></span>
              {meta.lastModifiedBy && (
                <span>
                  Dernière modification : <span className="text-gray-600">{meta.lastModifiedBy}</span>
                  {meta.lastModifiedAt && (
                    <span> le {new Date(meta.lastModifiedAt).toLocaleString('fr-FR')}</span>
                  )}
                </span>
              )}
              {hasOverrides && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="w-3 h-3" /> Des surcharges sont actives
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Barre de modifications en attente */}
      {pendingChanges.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 sticky top-[105px] z-10">
          <div className="max-w-[1600px] mx-auto px-6 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-sm text-amber-800 font-medium">
                {pendingChanges.length} modification(s) en attente
              </span>
              <div className="flex-1 flex gap-2 overflow-x-auto">
                {pendingChanges.slice(0, 5).map(c => (
                  <span
                    key={c.path}
                    className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-mono whitespace-nowrap"
                  >
                    {c.label}
                  </span>
                ))}
                {pendingChanges.length > 5 && (
                  <span className="text-xs text-amber-600">+{pendingChanges.length - 5} autres</span>
                )}
              </div>
              <Button
                onClick={saveChanges}
                disabled={saving}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar — Sections */}
          <div className="w-72 shrink-0">
            <Card className="sticky top-44">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">Sections</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <nav className="space-y-0.5 pb-3">
                    {sections.map(section => (
                      <button
                        key={section.key}
                        onClick={() => loadSection(section.key)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-all ${
                          activeSection === section.key
                            ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span className={activeSection === section.key ? 'text-indigo-600' : 'text-gray-400'}>
                          {SECTION_ICONS[section.key] || <FileText className="w-5 h-5" />}
                        </span>
                        <span className="flex-1 truncate">{section.label}</span>
                        <span className="text-xs text-gray-400 tabular-nums">{section.fieldCount}</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          activeSection === section.key ? 'rotate-90 text-indigo-500' : 'text-gray-300'
                        }`} />
                      </button>
                    ))}
                  </nav>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Zone principale — Édition */}
          <div className="flex-1 min-w-0">
            {!activeSection ? (
              <Card>
                <CardContent className="py-20 text-center">
                  <Scale className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-700 mb-2">
                    Sélectionnez une section
                  </h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Choisissez une catégorie dans le menu de gauche pour visualiser et modifier
                    les règles fiscales, sociales et financières du CRM.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg mx-auto text-sm text-gray-500">
                    <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>LF 2026 à jour</span>
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                      <Scale className="w-4 h-4 text-indigo-500" />
                      <span>CDHR incluse</span>
                    </div>
                    <div className="flex items-center gap-2 bg-rose-50 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Pinel supprimé</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : loadingSection ? (
              <Card>
                <CardContent className="py-12">
                  <div className="space-y-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-indigo-600">
                        {SECTION_ICONS[activeSection] || <FileText className="w-6 h-6" />}
                      </span>
                      <div>
                        <CardTitle className="text-lg">
                          {sections.find(s => s.key === activeSection)?.label || activeSection}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs">
                          RULES.{activeSection}
                        </CardDescription>
                      </div>
                    </div>

                    {/* Recherche */}
                    <div className="relative w-64">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="text"
                        placeholder="Rechercher un champ..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 text-sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderSectionContent()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
