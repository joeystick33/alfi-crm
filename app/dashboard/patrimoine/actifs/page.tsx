'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  RefreshCw,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { apiCall } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

/**
 * Page Actifs
 * Gestion de tous les actifs des clients
 */
export default function ActifsPage() {
  const [actifs, setActifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadActifs();
  }, [filterType]);

  const loadActifs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      const response = await apiCall(`/api/actifs?${params.toString()}`);
      setActifs(response.data || []);
    } catch (error) {
      console.error('Erreur chargement actifs:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les actifs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet actif ?')) {
      return;
    }

    try {
      await apiCall(`/api/actifs/${id}`, { method: 'DELETE' });
      toast({
        title: 'Succès',
        description: 'Actif supprimé avec succès'
      });
      loadActifs();
    } catch (error) {
      console.error('Erreur suppression actif:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'actif',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      IMMOBILIER: 'Immobilier',
      PLACEMENT: 'Placement',
      EPARGNE: 'Épargne',
      ASSURANCE_VIE: 'Assurance Vie',
      PER: 'PER',
      COMPTE_TITRES: 'Compte Titres',
      PEA: 'PEA',
      AUTRE: 'Autre'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      IMMOBILIER: 'bg-blue-100 text-blue-700',
      PLACEMENT: 'bg-green-100 text-green-700',
      EPARGNE: 'bg-purple-100 text-purple-700',
      ASSURANCE_VIE: 'bg-amber-100 text-amber-700',
      PER: 'bg-indigo-100 text-indigo-700',
      COMPTE_TITRES: 'bg-pink-100 text-pink-700',
      PEA: 'bg-teal-100 text-teal-700',
      AUTRE: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const filteredActifs = actifs.filter(actif => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      actif.nom?.toLowerCase().includes(search) ||
      actif.client?.firstName?.toLowerCase().includes(search) ||
      actif.client?.lastName?.toLowerCase().includes(search) ||
      actif.type?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      key: 'client',
      label: 'Client',
      render: (row: any) => (
        <Link 
          href={`/dashboard/clients/${row.clientId}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {row.client?.firstName} {row.client?.lastName}
        </Link>
      )
    },
    {
      key: 'nom',
      label: 'Nom de l\'actif',
      render: (row: any) => (
        <span className="font-medium text-slate-900">{row.nom}</span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (row: any) => (
        <Badge className={getTypeColor(row.type)}>
          {getTypeLabel(row.type)}
        </Badge>
      )
    },
    {
      key: 'valeurActuelle',
      label: 'Valeur',
      render: (row: any) => (
        <span className="font-semibold text-slate-900">
          {formatCurrency(row.valeurActuelle)}
        </span>
      )
    },
    {
      key: 'performance',
      label: 'Performance',
      render: (row: any) => {
        const value = row.performance;
        if (!value) return <span className="text-slate-400">-</span>;
        const isPositive = value >= 0;
        return (
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-medium">
              {isPositive ? '+' : ''}{value.toFixed(2)}%
            </span>
          </div>
        );
      }
    },
    {
      key: 'gere',
      label: 'Gestion',
      render: (row: any) => (
        <Badge variant={row.gere ? 'default' : 'secondary'}>
          {row.gere ? 'Géré' : 'Non géré'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/clients/${row.clientId}`}>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      )
    }
  ];

  const totalValue = filteredActifs.reduce((sum, actif) => sum + (actif.valeurActuelle || 0), 0);
  const gereValue = filteredActifs
    .filter(a => a.gere)
    .reduce((sum, actif) => sum + (actif.valeurActuelle || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/patrimoine">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              Gestion des Actifs
            </h1>
            <p className="text-slate-600 mt-1">
              {filteredActifs.length} actif{filteredActifs.length > 1 ? 's' : ''} • 
              Valeur totale: {formatCurrency(totalValue)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadActifs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Valeur Totale</p>
            <p className="text-3xl font-bold text-blue-700">
              {formatCurrency(totalValue)}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              {filteredActifs.length} actifs
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Actifs Gérés</p>
            <p className="text-3xl font-bold text-green-700">
              {formatCurrency(gereValue)}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              {((gereValue / totalValue) * 100).toFixed(0)}% du total
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 mb-1">Actifs Non Gérés</p>
            <p className="text-3xl font-bold text-purple-700">
              {formatCurrency(totalValue - gereValue)}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              {(((totalValue - gereValue) / totalValue) * 100).toFixed(0)}% du total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un actif, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les types</option>
                <option value="IMMOBILIER">Immobilier</option>
                <option value="PLACEMENT">Placement</option>
                <option value="EPARGNE">Épargne</option>
                <option value="ASSURANCE_VIE">Assurance Vie</option>
                <option value="PER">PER</option>
                <option value="COMPTE_TITRES">Compte Titres</option>
                <option value="PEA">PEA</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Actifs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Chargement des actifs...</p>
            </div>
          ) : filteredActifs.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Aucun actif trouvé</p>
            </div>
          ) : (
            <DataTable
              data={filteredActifs}
              columns={columns}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
