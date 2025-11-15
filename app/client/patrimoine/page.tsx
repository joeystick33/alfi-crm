"use client";

import { useState } from 'react';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';

export default function PatrimoinePage() {
  const [period, setPeriod] = useState('1Y');

  const patrimoine = {
    total: 850000,
    evolution: {
      value: 42000,
      percentage: 5.2,
      positive: true
    },
    categories: [
      {
        name: 'Immobilier',
        value: 450000,
        percentage: 53,
        evolution: 3.2,
        color: 'bg-blue-500',
        items: [
          { label: 'Résidence principale', value: 350000 },
          { label: 'Investissement locatif', value: 100000 }
        ]
      },
      {
        name: 'Assurance-vie',
        value: 250000,
        percentage: 29,
        evolution: 8.5,
        color: 'bg-green-500',
        items: [
          { label: 'Contrat A', value: 150000 },
          { label: 'Contrat B', value: 100000 }
        ]
      },
      {
        name: 'Actions & Titres',
        value: 100000,
        percentage: 12,
        evolution: 12.3,
        color: 'bg-purple-500',
        items: [
          { label: 'PEA', value: 60000 },
          { label: 'Compte-titres', value: 40000 }
        ]
      },
      {
        name: 'Liquidités',
        value: 50000,
        percentage: 6,
        evolution: 0.5,
        color: 'bg-yellow-500',
        items: [
          { label: 'Livret A', value: 30000 },
          { label: 'Compte courant', value: 20000 }
        ]
      }
    ]
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
            {periods.map((p) => (
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
            {patrimoine.categories.map((cat, index) => (
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
            {patrimoine.categories.map((cat, index) => (
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
        {patrimoine.categories.map((cat, index) => (
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
              {cat.items.map((item, idx) => (
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
