
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  Building2,
  CreditCard,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card';
import { Button } from '@/app/_common/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs';
import { apiCall } from '@/app/_common/lib/api-client';

/**
 * Page Patrimoine Global
 * Vue d'ensemble du patrimoine de tous les clients
 */
interface PatrimoineStats {
  totalWealth: number;
  wealthGrowth: number;
  totalActifs: number;
  actifsCount: number;
  totalPassifs: number;
  passifsCount: number;
  contratsCount: number;
}

export default function PatrimoinePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PatrimoineStats | null>(null);

  useEffect(() => {
    loadPatrimoineStats();
  }, []);

  const loadPatrimoineStats = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/patrimoine/stats');
      setStats((response as { data: PatrimoineStats }).data);
    } catch (error) {
      console.error('Erreur chargement stats patrimoine:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement patrimoine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 bg-success rounded-lg">
              <Wallet className="w-6 h-6 text-success-foreground" />
            </div>
            Patrimoine Global
          </h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble du patrimoine de vos clients</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadPatrimoineStats}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Patrimoine Total</p>
              <Wallet className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(stats?.totalWealth || 0)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-success font-medium">
                +{stats?.wealthGrowth || 0}%
              </span>
              <span className="text-muted-foreground">cette année</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Actifs Totaux</p>
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary">
              {formatCurrency(stats?.totalActifs || 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {stats?.actifsCount || 0} actifs
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Passifs Totaux</p>
              <CreditCard className="w-5 h-5 text-destructive" />
            </div>
            <p className="text-3xl font-bold text-destructive">
              {formatCurrency(stats?.totalPassifs || 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {stats?.passifsCount || 0} passifs
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Contrats</p>
              <FileText className="w-5 h-5 text-info" />
            </div>
            <p className="text-3xl font-bold text-info">
              {stats?.contratsCount || 0}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Contrats actifs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="actifs">Actifs</TabsTrigger>
          <TabsTrigger value="passifs">Passifs</TabsTrigger>
          <TabsTrigger value="contrats">Contrats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/patrimoine/actifs" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Building2 className="w-5 h-5" />
                    Gérer les Actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Consultez et gérez tous les actifs de vos clients (immobilier, placements, épargne)
                  </p>
                  <Button className="w-full" variant="outline">
                    Accéder aux actifs
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/patrimoine/passifs" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <CreditCard className="w-5 h-5" />
                    Gérer les Passifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Consultez et gérez tous les passifs de vos clients (crédits, dettes)
                  </p>
                  <Button className="w-full" variant="outline">
                    Accéder aux passifs
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/patrimoine/contrats" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-info">
                    <FileText className="w-5 h-5" />
                    Gérer les Contrats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">
                    Consultez et gérez tous les contrats de vos clients (assurances, placements)
                  </p>
                  <Button className="w-full" variant="outline">
                    Accéder aux contrats
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="actifs" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des Actifs</CardTitle>
                <Link href="/dashboard/patrimoine/actifs">
                  <Button size="sm">
                    Voir tous les actifs
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Consultez la page dédiée pour gérer tous les actifs
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passifs" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des Passifs</CardTitle>
                <Link href="/dashboard/patrimoine/passifs">
                  <Button size="sm">
                    Voir tous les passifs
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Consultez la page dédiée pour gérer tous les passifs
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contrats" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Liste des Contrats</CardTitle>
                <Link href="/dashboard/patrimoine/contrats">
                  <Button size="sm">
                    Voir tous les contrats
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Consultez la page dédiée pour gérer tous les contrats
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
