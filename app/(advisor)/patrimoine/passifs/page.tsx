'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard,
  TrendingDown,
  Plus,
  Download,
  RefreshCw,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { apiCall } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

/**
 * Page Passifs
 * Gestion de tous les passifs (dettes, crédits) des clients
 */
export default function PassifsPage() {
  const [passifs, setPassifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadPassifs();
  }, [filterType]);

  const loadPassifs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      const response = await apiCall(`/api/passifs?${params.toString()}`);
      setPassifs(response.data || []);
    } catch (error) {
      console.error('Erreur chargement passifs:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les passifs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce passif ?')) {
      return;
    }

    try {
      await apiCall(`/api/passifs/${id}`, { method: 'DELETE' });
      toast({
        title: 'Succès',
        description: 'Passif supprimé avec succès'
      });
      loadPassifs();
    } catch (error) {
      console.error('Erreur suppression passif:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le passif',
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

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CREDIT_IMMOBILIER: 'Crédit Immobilier',
      CREDIT_CONSOMMATION: 'Crédit Consommation',
      PRET_PERSONNEL: 'Prêt Personnel',
      PRET_ETUDIANT: 'Prêt Étudiant',
      CREDIT_AUTO: 'Crédit Auto',
      DECOUVERT: 'Découvert',
      AUTRE: 'Autre'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CREDIT_IMMOBILIER: 'bg-red-100 text-red-700',
      CREDIT_CONSOMMATION: 'bg-orange-100 text-orange-700',
      PRET_PERSONNEL: 'bg-amber-100 text-amber-700',
      PRET_ETUDIANT: 'bg-yellow-100 text-yellow-700',
      CREDIT_AUTO: 'bg-pink-100 text-pink-700',
      DECOUVERT: 'bg-rose-100 text-rose-700',
      AUTRE: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const filteredPassifs = passifs.filter(passif => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      passif.nom?.toLowerCase().includes(search) ||
      passif.client?.firstName?.toLowerCase().includes(search) ||
      passif.client?.lastName?.toLowerCase().includes(search) ||
      passif.type?.toLowerCase().includes(search) ||
      passif.organisme?.toLowerCase().includes(search)
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
      label: 'Nom du passif',
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
      key: 'organisme',
      label: 'Organisme',
      render: (row: any) => (
        <span className="text-slate-600">{row.organisme || '-'}</span>
      )
    },
    {
      key: 'montantRestant',
      label: 'Montant Restant',
      render: (row: any) => (
        <span className="font-semibold text-red-700">
          {formatCurrency(row.montantRestant)}
        </span>
      )
    },
    {
      key: 'tauxInteret',
      label: 'Taux',
      render: (row: any) => (
        <span className="text-slate-900">
          {row.tauxInteret ? `${row.tauxInteret.toFixed(2)}%` : '-'}
        </span>
      )
    },
    {
      key: 'mensualite',
      label: 'Mensualité',
      render: (row: any) => (
        <span className="text-slate-900">
          {formatCurrency(row.mensualite)}
        </span>
      )
    },
    {
      key: 'dateFin',
      label: 'Date Fin',
      render: (row: any) => (
        <span className="text-slate-600">{formatDate(row.dateFin)}</span>
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

  const totalPassifs = filteredPassifs.reduce((sum: any, passif: any) => sum + (passif.montantRestant || 0), 0);
  const totalMensualites = filteredPassifs.reduce((sum: any, passif: any) => sum + (passif.mensualite || 0), 0);
  const avgTaux = filteredPassifs.length > 0
    ? filteredPassifs.reduce((sum: any, passif: any) => sum + (passif.tauxInteret || 0), 0) / filteredPassifs.length
    : 0;

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
              <div className="p-2 bg-gradient-to-br from-red-600 to-rose-600 rounded-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              Gestion des Passifs
            </h1>
            <p className="text-slate-600 mt-1">
              {filteredPassifs.length} passif{filteredPassifs.length > 1 ? 's' : ''} • 
              Total: {formatCurrency(totalPassifs)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadPassifs}>
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
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600">Total Passifs</p>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-700">
              {formatCurrency(totalPassifs)}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              {filteredPassifs.length} passifs actifs
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600">Mensualités Totales</p>
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-700">
              {formatCurrency(totalMensualites)}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Par mois
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600">Taux Moyen</p>
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-700">
              {avgTaux.toFixed(2)}%
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Taux d'intérêt moyen
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
                  placeholder="Rechercher un passif, client, organisme..."
                  value={searchTerm}
                  onChange={(e: any) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e: any) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Tous les types</option>
                <option value="CREDIT_IMMOBILIER">Crédit Immobilier</option>
                <option value="CREDIT_CONSOMMATION">Crédit Consommation</option>
                <option value="PRET_PERSONNEL">Prêt Personnel</option>
                <option value="PRET_ETUDIANT">Prêt Étudiant</option>
                <option value="CREDIT_AUTO">Crédit Auto</option>
                <option value="DECOUVERT">Découvert</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Passifs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Chargement des passifs...</p>
            </div>
          ) : filteredPassifs.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Aucun passif trouvé</p>
            </div>
          ) : (
            <DataTable
              data={filteredPassifs}
              columns={columns}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
