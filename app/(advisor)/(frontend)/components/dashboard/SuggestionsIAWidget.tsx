'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Lightbulb, TrendingUp, Shield, Target, ArrowRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface Suggestion {
  id: string
  type: 'Fiscalité' | 'Conformité' | 'Opportunité' | string
  client: string
  suggestion: string
  impact: string
  confidence: number
  icon?: LucideIcon
  color?: string
  bgColor?: string
}

interface SuggestionsIAWidgetProps {
  suggestions?: Suggestion[]
}

const iconMap: Record<string, LucideIcon> = {
  'Fiscalité': TrendingUp,
  'Conformité': Shield,
  'Opportunité': Target,
}

const colorMap: Record<string, { color: string; bgColor: string }> = {
  'Fiscalité': { color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  'Conformité': { color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Opportunité': { color: 'text-purple-600', bgColor: 'bg-purple-50' },
}

const defaultColors = { color: 'text-slate-600', bgColor: 'bg-slate-50' }

function getConfidenceBadge(confidence: number) {
  if (confidence >= 90) {
    return <Badge className="bg-emerald-500 text-xs">Haute confiance</Badge>
  } else if (confidence >= 70) {
    return <Badge variant="secondary" className="text-xs">Moyenne</Badge>
  }
  return <Badge variant="outline" className="text-xs">À vérifier</Badge>
}

export default function SuggestionsIAWidget({ suggestions = [] }: SuggestionsIAWidgetProps) {
  const enrichedSuggestions = suggestions.map((sugg) => ({
    ...sugg,
    icon: sugg.icon || iconMap[sugg.type] || Lightbulb,
    color: sugg.color || (colorMap[sugg.type] || defaultColors).color,
    bgColor: sugg.bgColor || (colorMap[sugg.type] || defaultColors).bgColor,
  }))

  return (
    <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg">
              <Lightbulb className="w-4 h-4 text-amber-600" />
            </div>
            Suggestions IA
          </CardTitle>
          <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-yellow-500">
            {enrichedSuggestions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {enrichedSuggestions.map((sugg) => {
          const Icon = sugg.icon
          return (
            <div
              key={sugg.id}
              className="p-3 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className={`${sugg.bgColor} p-2 rounded-lg flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${sugg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {sugg.type}
                    </Badge>
                    {getConfidenceBadge(sugg.confidence)}
                  </div>
                  <p className="text-sm font-medium text-slate-900 mb-1">
                    {sugg.client}
                  </p>
                  <p className="text-xs text-slate-600 mb-2">
                    {sugg.suggestion}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-600">
                      {sugg.impact}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 text-xs"
                    >
                      Créer projet
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {enrichedSuggestions.length === 0 && (
          <div className="text-center py-6 text-sm text-slate-500">
            <Lightbulb className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            Aucune suggestion pour le moment
          </div>
        )}

        <Link href="/dashboard/opportunities">
          <Button variant="outline" className="w-full mt-2" size="sm">
            Voir toutes les suggestions
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
