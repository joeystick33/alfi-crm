"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { TrendingUp, TrendingDown, Download, Loader2 } from 'lucide-react';

export default function PatrimoinePage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('1Y');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/client/patrimoine?clientId=${session.user.id}`)
        .then(res => {
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
  }, [session]);

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

  const patrimoine = {
    total: data.totalValue || 0,
    evolution: {
      value: data.evolution?.value || 0,
      percentage: data.evolution?.percentage || 0,
      positive: (data.evolution?.percentage || 0) >= 0
    },
    categories: data.categories || []
  };

  const periods = [
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: '1A', value: '1Y' },
    { label: 'Tout', value: 'ALL' }
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Patrimoine</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble de vos actifs</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter PDF
        </button>
      </div>

      {/* Valeur Totale */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-100 mb-2">Patrimoine Total</p>
            <h2 className="text-4xl font-bold mb-4">
              {patrimoine.total.toLocaleString('fr-FR')} €
            </h2>
            <div className="flex items-center gap-2">
              {patrimoine.evolution.positive ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span className="text-lg font-semibold">
                +{patrimoine.evolution.value.toLocaleString('fr-FR')} € 
                ({patrimoine.evolution.percentage}%)
              </span>
              <span className="text-blue-100">sur 1 an</span>
            </div>
          </div>
          <div className="flex gap-2">
            {periods.map((p: any) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Répartition</h3>
          <div className="space-y-4">
            {patrimoine.categories.map((cat: any, index: any) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                    <span className="text-sm font-medium text-gray-700">
                      {cat.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {cat.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${cat.color} h-2 rounded-full transition-all`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Performance</h3>
          <div className="space-y-4">
            {patrimoine.categories.map((cat: any, index: any) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{cat.name}</p>
                  <p className="text-sm text-gray-500">
                    {cat.value.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div className={`flex items-center gap-1 font-semibold ${
                  cat.evolution > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {cat.evolution > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {cat.evolution}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Détails par Catégorie */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Détails par Catégorie</h3>
        {patrimoine.categories.map((cat: any, index: any) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${cat.color}`} />
                <h4 className="text-lg font-bold text-gray-900">{cat.name}</h4>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {cat.value.toLocaleString('fr-FR')} €
                </p>
                <p className="text-sm text-gray-500">{cat.percentage}% du total</p>
              </div>
            </div>
            <div className="space-y-2">
              {cat.items.map((item: any, idx: any) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {item.value.toLocaleString('fr-FR')} €
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
