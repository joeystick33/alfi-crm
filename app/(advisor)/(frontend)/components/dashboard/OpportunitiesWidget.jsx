'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card';
import { Badge } from '@/app/_common/components/ui/Badge';
import { Button } from '@/app/_common/components/ui/Button';
import { 
  Lightbulb, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Euro,
  Target,
  CheckCircle
} from 'lucide-react';
import { apiCall } from '@/app/_common/lib/api-client';
import { useRouter } from 'next/navigation';
import { usePresentationMode } from '@/app/(advisor)/(frontend)/components/dashboard/PresentationModeContext';

export default function OpportunitiesWidget({ maxItems = 5 }) {
  const router = useRouter();
  const presentationMode = usePresentationMode();
  const [opportunities, setOpportunities] = useState([]);
  const [totalPipelineValue, setTotalPipelineValue] = useState(0);
  const [stats, setStats] = useState({
    active: 0,
    requiresAction: 0,
    avgScore: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOpportunities();
  }, [maxItems]);

  const loadOpportunities = async () => {
    try {
      const data = await apiCall(`/api/advisor/opportunities?status=active&limit=${maxItems}`);
      setOpportunities(data.opportunities || []);
      setTotalPipelineValue(data.totalPipelineValue || 0);
      setStats({
        active: data.stats?.active || 0,
        requiresAction: data.requiresAction || 0,
        avgScore: data.stats?.avgScore || 0
      });
    } catch (error) {
      console.error('Erreur chargement opportunités:', error);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase() || 'detected';
    const configs = {
      'detected': {
        label: 'Détectée',
        color: 'bg-blue-100 text-blue-700',
        icon: Lightbulb
      },
      'qualified': {
        label: 'Qualifiée',
        color: 'bg-purple-100 text-purple-700',
        icon: Target
      },
      'contacted': {
        label: 'Contactée',
        color: 'bg-indigo-100 text-indigo-700',
        icon: Calendar
      },
      'presented': {
        label: 'Présentée',
        color: 'bg-orange-100 text-orange-700',
        icon: TrendingUp
      },
      'accepted': {
        label: 'Acceptée',
        color: 'bg-green-100 text-green-700',
        icon: CheckCircle
      }
    };
    return configs[statusLower] || configs.detected;
  };

  const getPriorityConfig = (priority) => {
    const priorityLower = priority?.toLowerCase() || 'medium';
    const configs = {
      'urgent': {
        color: 'border-red-300 bg-red-50',
        badge: 'destructive',
        label: 'Urgent'
      },
      'high': {
        color: 'border-orange-300 bg-orange-50',
        badge: 'warning',
        label: 'Haute'
      },
      'medium': {
        color: 'border-amber-300 bg-amber-50',
        badge: 'default',
        label: 'Moyenne'
      },
      'low': {
        color: 'border-slate-300 bg-slate-50',
        badge: 'secondary',
        label: 'Basse'
      }
    };
    return configs[priorityLower] || configs.medium;
  };

  const getTypeLabel = (type) => {
    const labels = {
      'ASSURANCE_VIE': 'Assurance Vie',
      'IMMOBILIER': 'Immobilier',
      'PLACEMENT': 'Placement',
      'CREDIT': 'Crédit',
      'RETRAITE': 'Retraite',
      'SUCCESSION': 'Succession',
      'FISCALITE': 'Fiscalité',
      'PREVOYANCE': 'Prévoyance',
      'OTHER': 'Autre'
    };
    return labels[type] || type;
  };

  const formatCurrency = (value) => {
    if (!value) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    const now = new Date();
    const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'En retard', urgent: true };
    if (diffDays === 0) return { text: 'Aujourd\'hui', urgent: true };
    if (diffDays === 1) return { text: 'Demain', urgent: true };
    if (diffDays <= 7) return { text: `${diffDays}j`, urgent: true };
    if (diffDays <= 30) return { text: `${diffDays}j`, urgent: false };
    
    return { text: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), urgent: false };
  };

  const getProgressPercentage = (status) => {
    const statusLower = status?.toLowerCase() || 'detected';
    const statusProgress = {
      'detected': 20,
      'qualified': 40,
      'contacted': 60,
      'presented': 80,
      'accepted': 100
    };
    return statusProgress[statusLower] || 0;
  };

  return (
    <Card className="border-slate-200" role="region" aria-label="Widget des opportunités commerciales">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900" id="opportunities-widget-title">
            <TrendingUp className="h-5 w-5 text-green-600" aria-hidden="true" />
            Opportunités
          </CardTitle>
          {stats.requiresAction > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1" aria-label={`${stats.requiresAction} opportunités nécessitant une action`}>
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              {stats.requiresAction}
            </Badge>
          )}
        </div>
        
        {/* Pipeline Summary */}
        <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200" role="status" aria-label={`Pipeline total: ${presentationMode ? 'données masquées' : formatCurrency(totalPipelineValue)}, ${stats.active} opportunités actives, score moyen ${stats.avgScore}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-medium mb-1" id="pipeline-total-label">Pipeline Total</p>
              <p className="text-2xl font-bold text-green-900" aria-labelledby="pipeline-total-label">
                {presentationMode ? '••• €' : formatCurrency(totalPipelineValue)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-700 mb-1">{stats.active} actives</p>
              <div className="flex items-center gap-1 text-xs text-green-700">
                <Target className="h-3 w-3" aria-hidden="true" />
                <span aria-label={`Score moyen: ${stats.avgScore}`}>Score moy: {presentationMode ? '—' : stats.avgScore}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3" role="status" aria-label="Chargement des opportunités" aria-live="polite">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" aria-hidden="true"></div>
            ))}
            <span className="sr-only">Chargement en cours...</span>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-8" role="status">
            <Lightbulb className="h-12 w-12 text-slate-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-slate-600 font-medium">
              Aucune opportunité active
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Les nouvelles opportunités apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-labelledby="opportunities-widget-title">
            {opportunities.map((opp) => {
              const rawClientName = opp.particulierId?.firstName && opp.particulierId?.lastName 
                ? `${opp.particulierId.firstName} ${opp.particulierId.lastName}`
                : 'Client';
              const clientName = presentationMode ? 'Client' : rawClientName;
              
              const priorityConfig = getPriorityConfig(opp.priority);
              const statusConfig = getStatusConfig(opp.status);
              const StatusIcon = statusConfig.icon;
              const deadline = formatDeadline(opp.actionDeadline);
              const progress = getProgressPercentage(opp.status);
              const requiresAction = opp.actionDeadline && new Date(opp.actionDeadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              const oppAriaLabel = `Opportunité ${getTypeLabel(opp.type)} pour ${clientName}, valeur estimée ${presentationMode ? 'données masquées' : formatCurrency(opp.estimatedValue)}, statut ${statusConfig.label}, progression ${progress}%${requiresAction ? ', action requise' : ''}`;

              return (
                <div
                  key={opp.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${priorityConfig.color}`}
                  onClick={() => router.push(`/dashboard/opportunities/${opp.id}`)}
                  role="listitem"
                  aria-label={oppAriaLabel}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/dashboard/opportunities/${opp.id}`);
                    }
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(opp.type)}
                      </Badge>
                      <Badge className={`text-xs ${statusConfig.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      {requiresAction && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Action requise
                        </Badge>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-50 hover:opacity-100 hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                  
                  {/* Title and Client */}
                  <p className="text-sm font-semibold text-slate-900 mb-1">
                    {opp.title}
                  </p>
                  <p className="text-xs text-slate-600 mb-2">
                    {clientName}
                  </p>
                  
                  {/* Metrics */}
                  <div className="flex items-center gap-3 mb-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Euro className="h-3 w-3 text-slate-500" />
                      <span className="font-medium text-slate-700">
                        {presentationMode ? '••• €' : formatCurrency(opp.estimatedValue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-slate-500" />
                      <span className="text-slate-600">
                        {presentationMode ? '—' : `${opp.confidence}% confiance`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-slate-500" />
                      <span className="font-medium text-slate-700">
                        Score: {presentationMode ? '—' : opp.score}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progression de l'opportunité: ${progress}%`}>
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                      <span>Progression</span>
                      <span className="font-medium" aria-hidden="true">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  
                  {/* Deadline */}
                  {deadline && (
                    <div className={`flex items-center gap-1 text-xs ${deadline.urgent ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
                      <Calendar className="h-3 w-3" />
                      <span>Échéance: {deadline.text}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* View all button */}
        {!loading && opportunities.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => router.push('/dashboard/opportunities')}
          >
            Voir toutes les opportunités ({stats.active})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
