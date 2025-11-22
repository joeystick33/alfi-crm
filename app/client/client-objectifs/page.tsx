"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Target, TrendingUp, Calendar, DollarSign, Loader2 } from 'lucide-react';

export default function ObjectifsPage() {
  const { user } = useAuth();
  const [objectifs, setObjectifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/client/objectives?clientId=${session.user.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Erreur de chargement');
          return res.json();
        })
        .then(data => {
          setObjectifs(data.objectives || []);
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erreur: {error}</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'on_track':
        return 'bg-blue-100 text-blue-700';
      case 'at_risk':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Atteint';
      case 'on_track':
        return 'En bonne voie';
      case 'at_risk':
        return 'À surveiller';
      default:
        return 'En cours';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mes Objectifs</h1>
        <p className="text-gray-600 mt-1">
          {objectifs.filter(o => o.status !== 'completed').length} objectifs en cours
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Objectifs atteints</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {objectifs.filter(o => o.status === 'completed').length}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">En bonne voie</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {objectifs.filter(o => o.status === 'on_track').length}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-600">À surveiller</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {objectifs.filter(o => o.status === 'at_risk').length}
          </p>
        </div>
      </div>

      {/* Liste des Objectifs */}
      <div className="space-y-4">
        {objectifs.map((obj: any) => (
          <div
            key={obj.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="text-4xl">{obj.icon}</div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {obj.title}
                    </h3>
                    <p className="text-sm text-gray-600">{obj.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(obj.status)}`}>
                    {getStatusLabel(obj.status)}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progression
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {obj.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${getProgressColor(obj.percentage)} h-3 rounded-full transition-all`}
                      style={{ width: `${Math.min(obj.percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      {obj.current.toLocaleString('fr-FR')} € / {obj.target.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Échéance: {new Date(obj.deadline).toLocaleDateString('fr-FR', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Target className="w-4 h-4" />
                    <span>
                      Reste: {(obj.target - obj.current).toLocaleString('fr-FR')} €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Conseils */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-3">Conseils de votre conseiller</h3>
        <div className="space-y-2 text-blue-100">
          <p>• Votre épargne de précaution est constituée, félicitations ! 🎉</p>
          <p>• Pour l'investissement locatif, pensez à optimiser votre capacité d'emprunt</p>
          <p>• Vos objectifs retraite sont bien calibrés avec votre horizon de placement</p>
        </div>
        <button className="mt-4 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors">
          Discuter avec Sophie
        </button>
      </div>
    </div>
  );
}
