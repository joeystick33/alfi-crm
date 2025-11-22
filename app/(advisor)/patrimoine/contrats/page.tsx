'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText,
  Plus,
  Download,
  RefreshCw,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { apiCall } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

/**
 * Page Contrats
 * Gestion de tous les contrats des clients (assurances, placements, etc.)
 */
export default function ContratsPage() {
  const [contrats, setContrats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');

  useEffect(() => {
    loadContrats();
  }, [filterType, filterStatut]);

  const loadContrats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      if (filterStatut !== 'all') {
        params.append('statut', filterStatut);
      }
      const response = await apiCall(`/api/contrats?${params.toString()}`);
      setContrats(response.data || []);
    } catch (error) {
      console.error('Erreur chargement contrats:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les contrats',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      return;
    }

    try {
      await apiCall(`/api/contrats/${id}`, { method: 'DELETE' });
      toast({
        title: 'Succès',
        description: 'Contrat supprimé avec succès'
      });
      loadContrats();
    } catch (error) {
      console.error('Erreur suppression contrat:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le contrat',
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
      ASSURANCE_VIE: 'Assurance Vie',
      PER: 'PER',
      ASSURANCE_DECES: 'Assurance Décès',
      ASSURANCE_SANTE: 'Assurance Santé',
      ASSURANCE_HABITATION: 'Assurance Habitation',
      ASSURANCE_AUTO: 'Assurance Auto',
      PREVOYANCE: 'Prévoyance',
      CAPITALISATION: 'Capitalisation',
      AUTRE: 'Autre'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ASSURANCE_VIE: 'bg-purple-100 text-purple-700',
      PER: 'bg-indigo-100 text-indigo-700',
      ASSURANCE_DECES: 'bg-slate-100 text-slate-700',
      ASSURANCE_SANTE: 'bg-green-100 text-green-700',
      ASSURANCE_HABITATION: 'bg-blue-100 text-blue-700',
      ASSURANCE_AUTO: 'bg-cyan-100 text-cyan-700',
      PREVOYANCE: 'bg-amber-100 text-amber-700',
      CAPITALISATION: 'bg-pink-100 text-pink-700',
      AUTRE: 'bg-gray-100 text-gray-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      ACTIF: 'Actif',
      EN_ATTENTE: 'En attente',
      EXPIRE: 'Expiré',
      RESILIE: 'Résilié',
      SUSPENDU: 'Suspendu'
    };
    return labels[statut] || statut;
  };

  const getStatutColor = (statut: string) => {
    const colors: Record<string, string> = {
      ACTIF: 'bg-green-100 text-green-700',
      EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
      EXPIRE: 'bg-red-100 text-red-700',
      RESILIE: 'bg-gray-100 text-gray-700',
      SUSPENDU: 'bg-orange-100 text-orange-700'
    };
    return colors[statut] || 'bg-gray-100 text-gray-700';
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'ACTIF':
        return <CheckCircle className="w-4 h-4" />;
      case 'EN_ATTENTE':
        return <Clock className="w-4 h-4" />;
      case 'EXPIRE':
      case 'RESILIE':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredContrats = contrats.filter(contrat => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      contrat.numeroContrat?.toLowerCase().includes(search) ||
      contrat.nom?.toLowerCase().includes(search) ||
      contrat.client?.firstName?.toLowerCase().includes(search) ||
      contrat.client?.lastName?.toLowerCase().includes(search) ||
      contrat.compagnie?.toLowerCase().includes(search)
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
      key: 'numeroContrat',
      label: 'N° Contrat',
      render: (row: any) => (
        <span className="font-mono text-sm text-slate-900">{row.numeroContrat}</span>
      )
    },
    {
      key: 'nom',
      label: 'Nom du contrat',
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
      key: 'compagnie',
      label: 'Compagnie',
      render: (row: any) => (
        <span className="text-slate-600">{row.compagnie || '-'}</span>
      )
    },
    {
      key: 'valeur',
      label: 'Valeur',
      render: (row: any) => (
        <span className="font-semibold text-slate-900">
          {formatCurrency(row.valeur)}
        </span>
      )
    },
    {
      key: 'primeAnnuelle',
      label: 'Prime Annuelle',
      render: (row: any) => (
        <span className="text-slate-900">
          {formatCurrency(row.primeAnnuelle)}
        </span>
      )
    },
    {
      key: 'dateEcheance',
      label: 'Échéance',
      render: (row: any) => (
        <span className="text-slate-600">{formatDate(row.dateEcheance)}</span>
      )
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (row: any) => (
        <Badge className={getStatutColor(row.statut)}>
          <span className="flex items-center gap-1">
            {getStatutIcon(row.statut)}
            {getStatutLabel(row.statut)}
          </span>
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

  const totalValeur = filteredContrats.reduce((sum: any, contrat: any) => sum + (contrat.valeur || 0), 0);
  const totalPrimes = filteredContrats.reduce((sum: any, contrat: any) => sum + (contrat.primeAnnuelle || 0), 0);
  const contratsActifs = filteredContrats.filter(c => c.statut === 'ACTIF').length;

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
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              Gestion des Contrats
            </h1>
            <p className="text-slate-600 mt-1">
              {filteredContrats.length} contrat{filteredContrats.length > 1 ? 's' : ''} • 
              {contratsActifs} actif{contratsActifs > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadContrats}>
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
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600">Valeur Totale</p>
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-700">
              {formatCurrency(totalValeur)}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              {filteredContrats.length} contrats
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600">Contrats Actifs</p>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-700">
              {contratsActifs}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              {((contratsActifs / filteredContrats.length) * 100).toFixed(0)}% du total
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-600">Primes Annuelles</p>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-700">
              {formatCurrency(totalPrimes)}
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Total par an
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
                  placeholder="Rechercher un contrat, client, compagnie..."
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
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tous les types</option>
                <option value="ASSURANCE_VIE">Assurance Vie</option>
                <option value="PER">PER</option>
                <option value="ASSURANCE_DECES">Assurance Décès</option>
                <option value="ASSURANCE_SANTE">Assurance Santé</option>
                <option value="ASSURANCE_HABITATION">Assurance Habitation</option>
                <option value="ASSURANCE_AUTO">Assurance Auto</option>
                <option value="PREVOYANCE">Prévoyance</option>
              </select>
              <select
                value={filterStatut}
                onChange={(e: any) => setFilterStatut(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="ACTIF">Actif</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="EXPIRE">Expiré</option>
                <option value="RESILIE">Résilié</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Contrats</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Chargement des contrats...</p>
            </div>
          ) : filteredContrats.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Aucun contrat trouvé</p>
            </div>
          ) : (
            <DataTable
              data={filteredContrats}
              columns={columns}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
