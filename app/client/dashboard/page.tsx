"use client";

import { useSession } from 'next-auth/react';
import { 
  TrendingUp, 
  FileText, 
  Calendar, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

export default function ClientDashboardPage() {
  const { data: session } = useSession();

  // Données mockées (à remplacer par de vraies données depuis Prisma)
  const patrimoine = {
    total: 850000,
    evolution: 5.2,
    repartition: [
      { label: 'Immobilier', value: 450000, percentage: 53, color: 'bg-blue-500' },
      { label: 'Assurance-vie', value: 250000, percentage: 29, color: 'bg-green-500' },
      { label: 'Actions', value: 100000, percentage: 12, color: 'bg-purple-500' },
      { label: 'Liquidités', value: 50000, percentage: 6, color: 'bg-yellow-500' },
    ]
  };

  const stats = [
    {
      label: 'Patrimoine Total',
      value: '850 000 €',
      evolution: '+5.2%',
      positive: true,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Documents',
      value: '12',
      subtitle: '2 nouveaux',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      label: 'Prochain RDV',
      value: '15 Nov',
      subtitle: '14h00',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      label: 'Objectifs',
      value: '3/5',
      subtitle: 'En cours',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
  ];

  const recentActivity = [
    {
      type: 'document',
      title: 'Nouveau document: Bilan patrimonial 2024',
      date: 'Il y a 2 jours',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      type: 'message',
      title: 'Message de Sophie Martin',
      date: 'Il y a 3 jours',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      type: 'appointment',
      title: 'Rendez-vous confirmé pour le 15/11',
      date: 'Il y a 5 jours',
      icon: Calendar,
      color: 'text-purple-600'
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour {session?.user?.name?.split(' ')[0] || 'Client'} 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Voici un aperçu de votre patrimoine
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
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
            {patrimoine.repartition.map((item, index) => (
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
            {recentActivity.map((activity, index) => {
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
