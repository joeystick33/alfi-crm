'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  TrendingDown,
  Plus,
  Download,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import type { Passif, PassifType } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Input } from '@/app/_common/components/ui/Input';
import { Badge } from '@/app/_common/components/ui/Badge';
import { DataTable } from '@/app/_common/components/ui/DataTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog';
import { useToast } from '@/app/_common/hooks/use-toast';
import { usePassifs, useDeletePassif } from '@/app/(advisor)/(frontend)/hooks/use-patrimoine';
import { PassifFormWizard } from '@/app/(advisor)/(frontend)/components/patrimoine/PassifFormWizard';

/**
 * Page Passifs
 * Gestion de tous les passifs (dettes, crédits) des clients
 */
export default function PassifsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editPassif, setEditPassif] = useState<Passif | null>(null);

  const filters = useMemo(() => {
    return filterType !== 'all' ? { type: filterType as PassifType } : {};
  }, [filterType]);

  const { data: passifs = [], isLoading: loading, refetch } = usePassifs(filters);
  const deletePassif = useDeletePassif();

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce passif ?')) {
      return;
    }

    try {
      await deletePassif.mutateAsync(id);
      toast({
        title: 'Succès',
        description: 'Passif supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur suppression passif:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le passif',
        variant: 'destructive'
      });
    }
  };

  const handleEditClick = (passif: Passif) => {
    setEditPassif(passif);
  };

  const handleFormSuccess = () => {
    setCreateOpen(false);
    setEditPassif(null);
    refetch();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatDate = (date: string | Date | null) => {
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

  const getTypeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'> = {
      CREDIT_IMMOBILIER: 'destructive',
      CREDIT_CONSOMMATION: 'warning',
      PRET_PERSONNEL: 'warning',
      PRET_ETUDIANT: 'warning',
      CREDIT_AUTO: 'secondary',
      DECOUVERT: 'destructive',
      AUTRE: 'secondary'
    };
    return variants[type] || 'secondary';
  };

  const filteredPassifs = passifs?.filter((passif) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      passif.name?.toLowerCase().includes(search) ||
      passif.type?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      key: 'name',
      label: 'Nom du passif',
      render: (row: Passif) => (
        <span className="font-medium text-foreground">{row.name as string}</span>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (row: Passif) => (
        <Badge variant={getTypeVariant(row.type as string)}>
          {getTypeLabel(row.type as string)}
        </Badge>
      )
    },
    {
      key: 'remainingAmount',
      label: 'Montant Restant',
      render: (row: Passif) => (
        <span className="font-semibold text-destructive">
          {formatCurrency(Number(row.remainingAmount))}
        </span>
      )
    },
    {
      key: 'interestRate',
      label: 'Taux',
      render: (row: Passif) => (
        <span className="text-foreground">
          {row.interestRate ? `${Number(row.interestRate).toFixed(2)}%` : '-'}
        </span>
      )
    },
    {
      key: 'monthlyPayment',
      label: 'Mensualité',
      render: (row: Passif) => (
        <span className="text-foreground">
          {formatCurrency(Number(row.monthlyPayment))}
        </span>
      )
    },
    {
      key: 'endDate',
      label: 'Date Fin',
      render: (row: Passif) => (
        <span className="text-muted-foreground">{formatDate(row.endDate)}</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Passif) => (
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
            onClick={() => handleDelete(row.id as string)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  const totalPassifs = filteredPassifs.reduce((sum: number, passif: Passif) => sum + (Number(passif.remainingAmount) || 0), 0);
  const totalMensualites = filteredPassifs.reduce((sum: number, passif: Passif) => sum + (Number(passif.monthlyPayment) || 0), 0);
  const avgTaux = filteredPassifs.length > 0
    ? filteredPassifs.reduce((sum: number, passif: Passif) => sum + (Number(passif.interestRate) || 0), 0) / filteredPassifs.length
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
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 bg-destructive rounded-lg">
                <CreditCard className="w-6 h-6 text-destructive-foreground" />
              </div>
              Gestion des Passifs
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredPassifs.length} passif{filteredPassifs.length > 1 ? 's' : ''} •
              Total: {formatCurrency(totalPassifs)}
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
            Créer un passif
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Passifs</p>
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-3xl font-bold text-destructive">
              {formatCurrency(totalPassifs)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {filteredPassifs.length} passifs actifs
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Mensualités Totales</p>
              <TrendingDown className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-bold text-warning">
              {formatCurrency(totalMensualites)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Par mois
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Taux Moyen</p>
              <CreditCard className="w-5 h-5 text-warning" />
            </div>
            <p className="text-3xl font-bold text-warning">
              {avgTaux.toFixed(2)}%
            </p>
            <p className="text-sm text-muted-foreground mt-2">
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher un passif, client, organisme..."
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
              <p className="text-muted-foreground">Chargement des passifs...</p>
            </div>
          ) : filteredPassifs.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun passif trouvé</p>
            </div>
          ) : (
            <DataTable
              data={filteredPassifs}
              columns={columns}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Créer un passif</DialogTitle>
          </DialogHeader>
          <PassifFormWizard
            mode="create"
            onSuccess={handleFormSuccess}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editPassif} onOpenChange={(open) => !open && setEditPassif(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modifier le passif</DialogTitle>
          </DialogHeader>
          <PassifFormWizard
            mode="edit"
            initialData={{
              id: editPassif?.id,
              name: editPassif?.name,
              type: editPassif?.type,
              initialAmount: editPassif?.initialAmount,
              remainingAmount: editPassif?.remainingAmount,
              interestRate: editPassif?.interestRate,
              monthlyPayment: editPassif?.monthlyPayment,
              startDate: editPassif?.startDate,
              endDate: editPassif?.endDate,
              description: editPassif?.description,
              linkedActifId: editPassif?.linkedActifId,
              clientId: editPassif?.clientId,
            }}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditPassif(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
