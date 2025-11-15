"use client";

import { useState } from 'react';
import { FileText, Download, Eye, Search, Filter, Calendar } from 'lucide-react';

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const documents = [
    {
      id: 1,
      name: 'Bilan patrimonial 2024',
      type: 'Bilan',
      date: '2024-11-05',
      size: '2.4 MB',
      isNew: true,
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      id: 2,
      name: 'Contrat assurance-vie',
      type: 'Contrat',
      date: '2024-10-15',
      size: '1.8 MB',
      isNew: true,
      icon: FileText,
      color: 'text-green-600'
    },
    {
      id: 3,
      name: 'Rapport de gestion Q3 2024',
      type: 'Rapport',
      date: '2024-09-30',
      size: '3.2 MB',
      isNew: false,
      icon: FileText,
      color: 'text-purple-600'
    },
    {
      id: 4,
      name: 'Attestation fiscale 2023',
      type: 'Fiscal',
      date: '2024-01-15',
      size: '0.8 MB',
      isNew: false,
      icon: FileText,
      color: 'text-orange-600'
    },
    {
      id: 5,
      name: 'Relevé de compte Octobre',
      type: 'Relevé',
      date: '2024-10-31',
      size: '0.5 MB',
      isNew: false,
      icon: FileText,
      color: 'text-gray-600'
    }
  ];

  const types = [
    { value: 'all', label: 'Tous les documents' },
    { value: 'Bilan', label: 'Bilans' },
    { value: 'Contrat', label: 'Contrats' },
    { value: 'Rapport', label: 'Rapports' },
    { value: 'Fiscal', label: 'Documents fiscaux' },
    { value: 'Relevé', label: 'Relevés' }
  ];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mes Documents</h1>
        <p className="text-gray-600 mt-1">
          {documents.length} documents • {documents.filter(d => d.isNew).length} nouveaux
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un document..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtre Type */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              {types.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des Documents */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun document trouvé</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const Icon = doc.icon;
            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`p-3 bg-gray-50 rounded-lg ${doc.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {doc.name}
                      </h3>
                      {doc.isNew && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                          Nouveau
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(doc.date).toLocaleDateString('fr-FR')}
                      </span>
                      <span>{doc.size}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {doc.type}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
