'use client';

import { useState, useMemo } from 'react';
import { ActifType } from '@prisma/client';

// Type local pour les actifs
interface Actif {
  id: string;
  name: string;
  type: ActifType;
  category?: string;
  value: number;
  performance?: number;
  acquisitionDate?: string;
  acquisitionValue?: number;
  description?: string;
  managedByFirm?: boolean;
  managementFees?: number;
  annualIncome?: number;
}
import Link from 'next/link';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Input } from '@/app/_common/components/ui/Input';
import { Badge } from '@/app/_common/components/ui/Badge';
import { DataTable } from '@/app/_common/components/ui/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog';
import { useToast } from '@/app/_common/hooks/use-toast';
import { useActifs, useDeleteActif } from '@/app/(advisor)/(frontend)/hooks/use-patrimoine';
import { ActifFormWizard } from '@/app/(advisor)/(frontend)/components/patrimoine/ActifFormWizard';

/**
 * Page Actifs
 * Gestion de tous les actifs des clients
 */
export default function ActifsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editActif, setEditActif] = useState<Actif | null>(null);

  const filters = useMemo(() => {
    return filterType !== 'all' ? { type: filterType as ActifType } : {};
  }, [filterType]);

  const { data: actifs = [], isLoading: loading, refetch } = useActifs(filters);
  const deleteActif = useDeleteActif();

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet actif ?')) {
      return;
    }

    try {
      await deleteActif.mutateAsync(id);
      toast({
        title: 'Succès',
        description: 'Actif supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur suppression actif:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'actif',
        variant: 'destructive'
      });
    }
  };

  const handleEditClick = (actif: Actif) => {
    setEditActif(actif);
  };

  const handleFormSuccess = () => {
    setCreateOpen(false);
    setEditActif(null);
    refetch();
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

  const getTypeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'> = {
      IMMOBILIER: 'primary' as 'default',
      PLACEMENT: 'success',
      EPARGNE: 'info',
      ASSURANCE_VIE: 'warning',
      PER: 'default',
      COMPTE_TITRES: 'secondary',
      PEA: 'info',
      AUTRE: 'secondary'
    };
    return variants[type] || 'secondary';
  };

  const filteredActifs = (actifs as unknown as Actif[]).filter((actif: Actif) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      actif.name?.toLowerCase().includes(search) ||
      actif.type?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      key: 'name',
      label: 'Nom de l\'actif',
      render: (row: Actif) => (
        <span className="font-medium text-foreground">{row.name}</span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (row: Actif) => (
        <Badge variant={getTypeVariant(row.type)}>
          {getTypeLabel(row.type)}
        </Badge>
      )
    },
    {
      key: 'value',
      label: 'Valeur',
      render: (row: Actif) => (
        <span className="font-semibold text-foreground">
          {formatCurrency(row.value)}
        </span>
      )
    },
    {
      key: 'performance',
      label: 'Performance',
      render: (row: Actif) => {
        const value = row.performance;
        if (value === undefined || value === null) return <span className="text-muted-foreground">-</span>;
        const isPositive = value >= 0;
        return (
          <div className={`flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-medium">
              {isPositive ? '+' : ''}{value.toFixed(2)}%
            </span>
          </div>
        );
      }
    },
    {
      key: 'managedByFirm',
      label: 'Gestion',
      render: (row: Actif) => (
        <Badge variant={row.managedByFirm ? 'default' : 'secondary'}>
          {row.managedByFirm ? 'Géré' : 'Non géré'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Actif) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditClick(row)}
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  const totalValue = filteredActifs.reduce((sum: number, actif) => sum + (Number(actif.value) || 0), 0);
  const gereValue = filteredActifs
    .filter((a) => a.managedByFirm)
    .reduce((sum: number, actif) => sum + (Number(actif.value) || 0), 0);

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
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              Gestion des Actifs
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredActifs.length} actif{filteredActifs.length > 1 ? 's' : ''} •
              Valeur totale: {formatCurrency(totalValue)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Créer un actif
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Valeur Totale</p>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(totalValue)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {filteredActifs.length} actifs
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Actifs Gérés</p>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(gereValue)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {((gereValue / totalValue) * 100).toFixed(0)}% du total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Actifs Non Gérés</p>
            <p className="text-3xl font-bold text-info">
              {formatCurrency(totalValue - gereValue)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher un actif, client..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value)}
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
              <p className="text-muted-foreground">Chargement des actifs...</p>
            </div>
          ) : filteredActifs.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun actif trouvé</p>
            </div>
          ) : (
            <DataTable
              data={filteredActifs}
              columns={columns}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Créer un actif</DialogTitle>
          </DialogHeader>
          <ActifFormWizard
            mode="create"
            onSuccess={handleFormSuccess}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editActif} onOpenChange={(open) => !open && setEditActif(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modifier l'actif</DialogTitle>
          </DialogHeader>
          <ActifFormWizard
            mode="edit"
            initialData={{
              id: editActif?.id,
              name: editActif?.name,
              type: editActif?.type,
              category: editActif?.category,
              value: editActif?.value,
              acquisitionDate: editActif?.acquisitionDate,
              acquisitionValue: editActif?.acquisitionValue,
              description: editActif?.description,
              managedByFirm: editActif?.managedByFirm,
              managementFees: editActif?.managementFees,
              annualIncome: editActif?.annualIncome,
            }}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditActif(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
