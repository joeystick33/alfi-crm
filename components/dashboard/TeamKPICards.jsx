'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  Briefcase,
  Target,
  Calendar,
  Award
} from 'lucide-react';
import { apiCall } from '@/lib/api-client';

export default function TeamKPICards() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamKPIs();
  }, []);

  const loadTeamKPIs = async () => {
    try {
      const response = await apiCall('/api/management/team/kpi');
      setData(response.data || response);
    } catch (error) {
      console.error('Erreur chargement KPIs équipe:', error);
      setData(null);
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

  const getAchievementColor = (rate) => {
    if (rate >= 100) return 'text-green-600 bg-green-50 border-green-200';
    if (rate >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (rate >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getTrendColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  const getTrendIcon = (value) => {
    if (value > 0) return TrendingUp;
    if (value < 0) return TrendingDown;
    return null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border-slate-200">
            <CardContent className="p-6">
              <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <p className="text-sm text-slate-600 text-center">
            Impossible de charger les KPIs de l'équipe
          </p>
        </CardContent>
      </Card>
    );
  }

  const revenue = data.revenue || {};
  const achievementRate = revenue.achievementRate || 0;
  const TrendIcon = getTrendIcon(revenue.growth);

  const kpiCards = [
    {
      id: 'revenue',
      title: 'Chiffre d\'affaires',
      value: formatCurrency(revenue.actual),
      target: formatCurrency(revenue.target),
      icon: DollarSign,
      iconColor: 'text-green-600 bg-green-100',
      trend: revenue.growth,
      achievement: achievementRate,
      subtitle: `Objectif: ${formatCurrency(revenue.target)}`,
      footer: `${achievementRate}% de l'objectif`
    },
    {
      id: 'clients',
      title: 'Clients totaux',
      value: formatNumber(data.totalClients),
      icon: Users,
      iconColor: 'text-blue-600 bg-blue-100',
      subtitle: `${formatNumber(data.totalClients / data.totalAdvisors)} par conseiller`,
      footer: `${data.totalAdvisors} conseillers`
    },
    {
      id: 'aum',
      title: 'Actifs sous gestion',
      value: formatAUM(data.totalAUM),
      icon: Briefcase,
      iconColor: 'text-purple-600 bg-purple-100',
      subtitle: `${formatAUM(data.totalAUM / data.totalAdvisors)} par conseiller`,
      footer: 'Patrimoine total'
    },
    {
      id: 'appointments',
      title: 'RDV ce mois',
      value: formatNumber(data.appointmentsThisMonth),
      icon: Calendar,
      iconColor: 'text-orange-600 bg-orange-100',
      subtitle: `${Math.round(data.appointmentsThisMonth / data.totalAdvisors)} par conseiller`,
      footer: 'Rendez-vous planifiés'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          const achievementColor = kpi.achievement ? getAchievementColor(kpi.achievement) : '';

          return (
            <Card key={kpi.id} className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${kpi.iconColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {kpi.trend !== undefined && TrendIcon && (
                    <div className={`flex items-center gap-1 ${getTrendColor(kpi.trend)}`}>
                      <TrendIcon className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        {Math.abs(kpi.trend).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-sm font-medium text-slate-600 mb-1">
                  {kpi.title}
                </h3>

                {/* Value */}
                <p className="text-2xl font-bold text-slate-900 mb-1">
                  {kpi.value}
                </p>

                {/* Subtitle */}
                {kpi.subtitle && (
                  <p className="text-xs text-slate-500 mb-3">
                    {kpi.subtitle}
                  </p>
                )}

                {/* Achievement Bar */}
                {kpi.achievement !== undefined && (
                  <div className="mb-2">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          kpi.achievement >= 100 ? 'bg-green-500' :
                          kpi.achievement >= 80 ? 'bg-blue-500' :
                          kpi.achievement >= 60 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(kpi.achievement, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer */}
                {kpi.footer && (
                  <p className={`text-xs font-medium ${achievementColor || 'text-slate-600'}`}>
                    {kpi.footer}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Averages Section */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              Moyennes par conseiller
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue per Advisor */}
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">CA moyen</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(revenue.actual / data.totalAdvisors)}
                </p>
              </div>
            </div>

            {/* Clients per Advisor */}
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Clients moyens</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatNumber(Math.round(data.totalClients / data.totalAdvisors))}
                </p>
              </div>
            </div>

            {/* AUM per Advisor */}
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">AUM moyen</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatAUM(data.totalAUM / data.totalAdvisors)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Performance Summary */}
      <Card className="border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-white shadow-sm">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Performance de l'équipe
                </h3>
                <p className="text-sm text-slate-600">
                  {data.totalAdvisors} conseillers • {formatNumber(data.totalClients)} clients
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-600 mb-1">Taux de réalisation</p>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-bold ${
                  achievementRate >= 100 ? 'text-green-600' :
                  achievementRate >= 80 ? 'text-blue-600' :
                  achievementRate >= 60 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {achievementRate}%
                </p>
                {TrendIcon && (
                  <div className={`flex items-center ${getTrendColor(revenue.growth)}`}>
                    <TrendIcon className="h-5 w-5" />
                    <span className="text-sm font-semibold">
                      {Math.abs(revenue.growth).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
