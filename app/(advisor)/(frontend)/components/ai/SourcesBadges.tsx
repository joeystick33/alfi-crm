'use client'

import { Database, Globe, Scale, ExternalLink, BookOpen } from 'lucide-react'
import type { RAGSource } from '../../hooks/useAI'

/** Map internal source identifiers to human-readable French labels */
const SOURCE_LABELS: Record<string, string> = {
  'simulator-prevoyance': 'Prévoyance',
  'simulator-donation': 'Donations',
  'simulator-per': 'PER',
  'simulator-ir': 'Impôt sur le revenu',
  'simulator-ifi': 'IFI',
  'simulator-succession': 'Successions',
  'simulator-av': 'Assurance-vie',
  'simulator-retraite': 'Retraite',
  'simulator-immobilier': 'Immobilier',
  'simulator-budget': 'Budget',
  'knowledge-pro': 'Base patrimoniale',
  'knowledge-fiscal': 'Fiscalité',
  'knowledge-legal': 'Juridique',
  'knowledge-assurance': 'Assurance',
  'knowledge-immobilier': 'Immobilier',
  'knowledge-retraite': 'Retraite',
  'knowledge-transmission': 'Transmission',
  'knowledge-social': 'Protection sociale',
  'parameters-ir-2025': 'Barème IR',
  'parameters-ir': 'Barème IR',
  'parameters-2025': 'Paramètres fiscaux',
  'parameters': 'Paramètres fiscaux',
  'regulatory-config': 'Réglementation en vigueur',
}

function getReadableLabel(sourceName: string): string {
  if (SOURCE_LABELS[sourceName]) return SOURCE_LABELS[sourceName]
  // Fallback: clean up the raw name
  return sourceName
    .replace(/^(simulator|knowledge|parameters)-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

/** Deduplicate sources by label (keep highest relevance) */
function deduplicateSources(sources: RAGSource[]): RAGSource[] {
  const map = new Map<string, RAGSource>()
  for (const s of sources) {
    const label = getReadableLabel(s.sourceName)
    const existing = map.get(label)
    if (!existing || s.relevance > existing.relevance) {
      map.set(label, s)
    }
  }
  return Array.from(map.values())
}

export function SourcesBadges({ sources }: { sources: RAGSource[] }) {
  if (!sources || sources.length === 0) return null

  const legalSources = deduplicateSources(sources.filter(s => s.type === 'legal'))
  const crmSources = deduplicateSources(sources.filter(s => s.type === 'crm'))
  const webSources = deduplicateSources(sources.filter(s => s.type === 'web'))

  const hasAny = legalSources.length > 0 || crmSources.length > 0 || webSources.length > 0
  if (!hasAny) return null

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mr-0.5">Sources</span>
      {legalSources.map((s, i) => (
        <SourceBadge
          key={`legal-${i}`}
          label={getReadableLabel(s.sourceName)}
          title={s.title}
          url={s.url}
          icon={<Scale className="h-2.5 w-2.5 shrink-0" />}
          colors="bg-purple-50/80 text-purple-600 border-purple-100/60 hover:bg-purple-100/80"
        />
      ))}
      {crmSources.map((s, i) => (
        <SourceBadge
          key={`crm-${i}`}
          label={getReadableLabel(s.sourceName)}
          title={s.title}
          url={s.url}
          icon={<BookOpen className="h-2.5 w-2.5 shrink-0" />}
          colors="bg-indigo-50/80 text-indigo-600 border-indigo-100/60 hover:bg-indigo-100/80"
        />
      ))}
      {webSources.map((s, i) => (
        <SourceBadge
          key={`web-${i}`}
          label={getReadableLabel(s.sourceName)}
          title={s.title}
          url={s.url}
          icon={<Globe className="h-2.5 w-2.5 shrink-0" />}
          colors="bg-emerald-50/80 text-emerald-600 border-emerald-100/60 hover:bg-emerald-100/80"
        />
      ))}
    </div>
  )
}

function SourceBadge({ label, title, url, icon, colors }: {
  label: string
  title: string
  url?: string
  icon: React.ReactNode
  colors: string
}) {
  const className = `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${colors}`
  
  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className} title={title}>
        {icon}
        <span className="truncate max-w-[100px]">{label}</span>
        <ExternalLink className="h-2 w-2 shrink-0 opacity-50" />
      </a>
    )
  }

  return (
    <span className={className} title={title}>
      {icon}
      <span className="truncate max-w-[100px]">{label}</span>
    </span>
  )
}
