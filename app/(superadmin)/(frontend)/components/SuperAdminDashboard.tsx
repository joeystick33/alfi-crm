 
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/_common/hooks/use-auth';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  UserCheck,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  LogOut,
  Plus,
} from 'lucide-react';
import CreateOrganizationModal from './CreateOrganizationModal';

interface Metrics {
  totalOrganizations: number;
  activeOrganizations: number;
  totalAdvisors: number;
  totalClients: number;
  mrr: number;
  avgClientsPerOrg: number;
  activationRate: number;
  planDistribution: Record<string, number>;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  plan: string;
  status: string;
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  trialEndsAt?: Date;
  createdAt: Date;
  advisorsCount: number;
  clientsCount: number;
}

export default function SuperAdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user) {
      loadData();
    }
  }, [user, isLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les métriques
      const metricsRes = await fetch('/api/superadmin/metrics');
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      // Charger les organisations
      const orgsRes = await fetch('/api/superadmin/organizations');
      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        setOrganizations(orgsData.organizations || []);
      }
    } catch (error: any) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/login');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Aura</h1>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCreateOrgModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nouveau Cabinet
              </button>

              <div className="text-right ml-4">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">Super Administrateur</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Métriques Globales */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Vue d'ensemble de la plateforme
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Organisations */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Cabinets
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {metrics?.totalOrganizations || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Cabinets CGP
              </div>
            </div>

            {/* Total Conseillers */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <UserCheck className="w-8 h-8 text-green-600" />
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                  Actifs
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {metrics?.totalAdvisors || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Conseillers
              </div>
            </div>

            {/* Total Clients */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-purple-600" />
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  Clients
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {metrics?.totalClients || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Clients Finaux
              </div>
            </div>

            {/* MRR */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-yellow-600" />
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                  Revenus
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  minimumFractionDigits: 0,
                }).format(metrics?.mrr || 0)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                MRR (Mensuel)
              </div>
            </div>
          </div>
        </div>

        {/* Liste des Organisations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Cabinets CGP Enregistrés
            </h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
              {organizations.length} cabinet{organizations.length > 1 ? 's' : ''}
            </span>
          </div>

          {organizations.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun cabinet enregistré</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org: any) => (
                <div
                  key={org.id}
                  className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {org.name}
                        </h4>
                        {org.status === 'ACTIVE' && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Actif
                          </span>
                        )}
                        {org.status === 'TRIALING' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Essai
                          </span>
                        )}
                        {org.status === 'SUSPENDED' && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Suspendu
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Conseillers</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {org.advisorsCount || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Clients</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {org.clientsCount || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Plan</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {org.plan}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Créé le</p>
                          <p className="text-sm text-gray-900">
                            {new Date(org.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {org.trialEndsAt && (
                        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Essai jusqu'au{' '}
                            {new Date(org.trialEndsAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Paramètres"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistiques Détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Répartition des Plans */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Répartition des Plans
            </h3>
            <div className="space-y-3">
              {['TRIAL', 'STARTER', 'BUSINESS', 'PREMIUM', 'ENTERPRISE'].map((plan: any) => (
                <div key={plan} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{plan}</span>
                  <span className="font-semibold text-blue-600">
                    {metrics?.planDistribution?.[plan] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Santé de la Plateforme */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Santé de la Plateforme
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Taux d'activation</span>
                <span className="text-2xl font-bold text-green-600">
                  {metrics?.activationRate || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Cabinets actifs</span>
                <span className="text-2xl font-bold text-blue-600">
                  {metrics?.activeOrganizations || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Moyenne clients/cabinet</span>
                <span className="text-2xl font-bold text-purple-600">
                  {metrics?.avgClientsPerOrg || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showCreateOrgModal && (
        <CreateOrganizationModal
          onClose={() => setShowCreateOrgModal(false)}
          onSuccess={() => {
            loadData();
            setShowCreateOrgModal(false);
          }}
        />
      )}
    </div>
  );
}
