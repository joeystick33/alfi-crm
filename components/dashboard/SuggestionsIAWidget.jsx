'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Lightbulb, TrendingUp, Shield, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Widget Suggestions IA
 * Détection automatique opportunités et optimisations
 * NOUVEAU - Différenciateur
 */
export default function SuggestionsIAWidget({ suggestions = [] }) {
  // Mock data (TODO: connecter à l'IA)
  const mockSuggestions = suggestions.length > 0 ? suggestions : [
    {
      id: 1,
      type: 'Fiscalité',
      client: 'Paul Girard',
      suggestion: 'Optimisation TMI via PER',
      impact: '+2 400 € économie fiscale',
      confidence: 95,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      id: 2,
      type: 'Conformité',
      client: 'Marie Blanc',
      suggestion: 'KYC à renouveler (expire dans 15j)',
      impact: 'Obligation réglementaire',
      confidence: 100,
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 3,
      type: 'Opportunité',
      client: 'Luc Fontaine',
      suggestion: 'Arbitrage AV (sous-performance)',
      impact: '+1.2% rendement potentiel',
      confidence: 87,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 90) {
      return <Badge className="bg-emerald-500 text-xs">Haute confiance</Badge>;
    } else if (confidence >= 70) {
      return <Badge variant="secondary" className="text-xs">Moyenne</Badge>;
    }
    return <Badge variant="outline" className="text-xs">À vérifier</Badge>;
  };

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
            {mockSuggestions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockSuggestions.map((sugg) => {
          const Icon = sugg.icon;
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
          );
        })}

        {mockSuggestions.length === 0 && (
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
  );
}
