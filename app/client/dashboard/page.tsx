"use client";

import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  FileText, 
  Calendar, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/client/dashboard?clientId=${user.id}`)
        .then(res => {
          if (res.status === 401 || res.status === 403) {
            // Déconnexion automatique
            fetch('/api/auth/logout', { method: 'POST' }).then(() => {
              window.location.href = '/login?error=unauthorized'
            })
            throw new Error('Non autorisé')
          }
          if (!res.ok) throw new Error('Erreur de chargement');
          return res.json();
        })
        .then(data => {
          setData(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur: {error || 'Données non disponibles'}</p>
      </div>
    );
  }

  const patrimoine = data.patrimoine || { total: 0, evolution: 0, repartition: [] };
  const stats = [
    {
      label: 'Patrimoine Total',
      value: `${patrimoine.total.toLocaleString('fr-FR')} €`,
      evolution: patrimoine.evolution > 0 ? `+${patrimoine.evolution}%` : `${patrimoine.evolution}%`,
      positive: patrimoine.evolution >= 0,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Documents',
      value: data.stats?.documentsCount || '0',
      subtitle: data.stats?.newDocumentsCount ? `${data.stats.newDocumentsCount} nouveaux` : '',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Prochain RDV',
      value: data.nextAppointment?.date || 'Aucun',
      subtitle: data.nextAppointment?.time || '',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Objectifs',
      value: `${data.stats?.activeObjectivesCount || 0}/${data.stats?.totalObjectivesCount || 0}`,
      subtitle: 'En cours',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
  ];

  const recentActivity = data.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour {user?.firstName || 'Client'} 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Voici un aperçu de votre patrimoine
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat: any, index: any) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                {stat.evolution && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.positive ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.evolution}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Répartition du Patrimoine */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Répartition du Patrimoine
            </h2>
            <Link
              href="/client/patrimoine"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Voir détails →
            </Link>
          </div>

          <div className="space-y-4">
            {patrimoine.repartition.map((item: any, index: any) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {item.value.toLocaleString('fr-FR')} € ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-blue-600">
                {patrimoine.total.toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
        </div>

        {/* Activité Récente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Activité Récente
          </h2>

          <div className="space-y-4">
            {recentActivity.map((activity: any, index: any) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-lg bg-gray-100`}>
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/client/notifications"
            className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Voir toutes les notifications
          </Link>
        </div>
      </div>

      {/* Actions Rapides */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/client/messages"
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all"
          >
            <h3 className="font-semibold mb-1">Contacter mon conseiller</h3>
            <p className="text-sm text-blue-100">Posez vos questions</p>
          </Link>
          <Link
            href="/client/rendez-vous"
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all"
          >
            <h3 className="font-semibold mb-1">Prendre rendez-vous</h3>
            <p className="text-sm text-blue-100">Planifier un entretien</p>
          </Link>
          <Link
            href="/client/documents"
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all"
          >
            <h3 className="font-semibold mb-1">Mes documents</h3>
            <p className="text-sm text-blue-100">Consulter et télécharger</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
