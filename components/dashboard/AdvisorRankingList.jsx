'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Trophy,
  Users,
  DollarSign,
  Briefcase,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Medal,
  Award
} from 'lucide-react';
import { apiCall } from '@/lib/api';

export default function AdvisorRankingList() {
  const router = useRouter();
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAdvisors();
  }, []);

  const loadAdvisors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall('/management/team/advisors');
      setAdvisors(response.data || response || []);
    } catch (err) {
      console.error('Erreur chargement conseillers:', err);
      setError('Impossible de charger les données des conseillers');
    } finally {
      setLoading(false);
    }
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

  const formatNumber = (value) => {
    if (!value) return '0';
    return new Intl.NumberFormat('fr-FR').format(value);
  };

  const formatAUM = (value) => {
    if (!value) return '0 M€';
    const millions = value / 1000000;
    return `${millions.toFixed(1)} M€`;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'ATTEINT':
        return {
          label: 'Objectif atteint',
          color: 'bg-green-100 text-green-700 border-green-200',
          dotColor: 'bg-green-500'
        };
      case 'EN_COURS':
        return {
          label: 'En cours',
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          dotColor: 'bg-blue-500'
        };
      case 'DANGER':
        return {
          label: 'Attention',
          color: 'bg-red-100 text-red-700 border-red-200',
          dotColor: 'bg-red-500'
        };
      default:
        return {
          label: 'Non défini',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          dotColor: 'bg-slate-500'
        };
    }
  };

  const getRankingIcon = (ranking) => {
    if (ranking === 1) return { Icon: Trophy, color: 'text-yellow-500' };
    if (ranking === 2) return { Icon: Medal, color: 'text-slate-400' };
    if (ranking === 3) return { Icon: Award, color: 'text-amber-600' };
    return null;
  };

  const handleAdvisorClick = (advisorId) => {
    router.push(`/dashboard/management/advisors/${advisorId}`);
  };

  if (loading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Classement des conseillers
            </h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Classement des conseillers
            </h3>
          </div>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <button
              onClick={loadAdvisors}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Réessayer
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!advisors || advisors.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Classement des conseillers
            </h3>
          </div>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">
              Aucun conseiller à afficher
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Classement des conseillers
            </h3>
          </div>
          <span className="text-sm text-slate-500">
            {advisors.length} conseiller{advisors.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Advisors List */}
        <div className="space-y-3">
          {advisors.map((advisor) => {
            const statusConfig = getStatusConfig(advisor.status);
            const rankingIcon = getRankingIcon(advisor.ranking);
            const achievementRate = advisor.kpi?.revenue?.achievementRate || 0;
            const hasUrgentAlerts = advisor.kpi?.alerts?.urgent > 0;

            return (
              <div
                key={advisor._id}
                onClick={() => handleAdvisorClick(advisor._id)}
                className="group relative bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
              >
                {/* Ranking Badge */}
                <div className="absolute -left-2 -top-2 flex items-center justify-center w-8 h-8 bg-slate-900 text-white rounded-full text-sm font-bold shadow-md">
                  {advisor.ranking}
                </div>

                {/* Top Row: Name, Status, Arrow */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Ranking Icon for Top 3 */}
                    {rankingIcon && (
                      <rankingIcon.Icon className={`h-6 w-6 ${rankingIcon.color}`} />
                    )}

                    {/* Name and Email */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {advisor.firstName} {advisor.lastName}
                      </h4>
                      <p className="text-xs text-slate-500 truncate">
                        {advisor.email}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge and Arrow */}
                  <div className="flex items-center gap-2 ml-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}></span>
                      {statusConfig.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>

                {/* KPIs Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  {/* Revenue */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-50">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">CA</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {formatCurrency(advisor.kpi?.revenue?.actual)}
                      </p>
                    </div>
                  </div>

                  {/* Clients */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Clients</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatNumber(advisor.kpi?.clientsCount)}
                      </p>
                    </div>
                  </div>

                  {/* AUM */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <Briefcase className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">AUM</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {formatAUM(advisor.kpi?.aum)}
                      </p>
                    </div>
                  </div>

                  {/* Meetings */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-orange-50">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">RDV</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatNumber(advisor.kpi?.meetingsThisMonth)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Achievement Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Réalisation objectif</span>
                    <span className={`font-semibold ${
                      achievementRate >= 100 ? 'text-green-600' :
                      achievementRate >= 80 ? 'text-blue-600' :
                      achievementRate >= 60 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {achievementRate}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        achievementRate >= 100 ? 'bg-green-500' :
                        achievementRate >= 80 ? 'bg-blue-500' :
                        achievementRate >= 60 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(achievementRate, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{formatCurrency(advisor.kpi?.revenue?.actual)}</span>
                    <span>Objectif: {formatCurrency(advisor.kpi?.revenue?.target)}</span>
                  </div>
                </div>

                {/* Urgent Alerts Badge */}
                {hasUrgentAlerts && (
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700">
                      {advisor.kpi.alerts.urgent} alerte{advisor.kpi.alerts.urgent > 1 ? 's' : ''} urgente{advisor.kpi.alerts.urgent > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
