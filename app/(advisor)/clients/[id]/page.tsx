'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useClient, useClientWealth } from '@/hooks/use-api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState, getErrorVariant } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { TabOverview } from '@/components/client360/TabOverview'
import { TabProfile } from '@/components/client360/TabProfile'
import { TabWealth } from '@/components/client360/TabWealth'
import { TabDocuments } from '@/components/client360/TabDocuments'
import { TabKYC } from '@/components/client360/TabKYC'
import { TabObjectives } from '@/components/client360/TabObjectives'
import { TabOpportunities } from '@/components/client360/TabOpportunities'
import { TabTimeline } from '@/components/client360/TabTimeline'
import { formatCurrency, getInitials } from '@/lib/utils'
import {
  ArrowLeft,
  Edit,
  FileDown,
  MoreVertical,
  User,
  Building2,
  UserX,
} from 'lucide-react'

interface ClientPageProps {
  params: Promise<{ id: string }>
}

export default function ClientPage({ params }: ClientPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: client, isLoading, isError, error, refetch } = useClient(id)
  const { data: wealth } = useClientWealth(id)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState variant="spinner" message="Chargement du client..." />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/clients')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux clients
        </Button>
        <ErrorState
          error={error as Error}
          variant={getErrorVariant(error as Error)}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/clients')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux clients
        </Button>
        <EmptyState
          icon={UserX}
          title="Client non trouvé"
          description="Ce client n'existe pas ou a été supprimé."
          action={{
            label: 'Retour à la liste',
            onClick: () => router.push('/dashboard/clients'),
          }}
        />
      </div>
    )
  }

  const TypeIcon = client.clientType === 'PROFESSIONNEL' ? Building2 : User

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/clients')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux clients
      </Button>

      {/* Client Header */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
              {getInitials(client.firstName, client.lastName)}
            </div>

            {/* Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {client.firstName} {client.lastName}
                </h1>
                <Badge variant={client.status === 'ACTIVE' ? 'success' : 'outline'}>
                  {client.status}
                </Badge>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TypeIcon className="h-4 w-4" />
                  <span className="text-sm">
                    {client.clientType === 'PARTICULIER' ? 'Particulier' : 'Professionnel'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {client.email && <span>{client.email}</span>}
                {client.phone && <span>{client.phone}</span>}
              </div>

              {/* KPIs */}
              <div className="flex items-center gap-6 pt-2">
                <div>
                  <p className="text-2xl font-bold text-success">
                    {wealth ? formatCurrency(wealth.patrimoineNet) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Patrimoine net</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {wealth ? formatCurrency(wealth.patrimoineGere) : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Patrimoine géré</p>
                </div>
                <div className="h-12 w-px bg-border" />
                <div>
                  <p className="text-2xl font-bold">
                    {client.kycStatus === 'COMPLETED' ? '100%' : '0%'}
                  </p>
                  <p className="text-xs text-muted-foreground">Score KYC</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Éditer
            </Button>
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="profile">Profil & Famille</TabsTrigger>
          <TabsTrigger value="wealth">Patrimoine</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="kyc">KYC & Conformité</TabsTrigger>
          <TabsTrigger value="objectives">Objectifs & Projets</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunités</TabsTrigger>
          <TabsTrigger value="timeline">Activité & Historique</TabsTrigger>
          <TabsTrigger value="reporting">Reporting</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TabOverview clientId={id} client={client} wealth={wealth} />
        </TabsContent>

        <TabsContent value="profile">
          <TabProfile clientId={id} client={client} />
        </TabsContent>

        <TabsContent value="wealth">
          <TabWealth clientId={id} client={client} wealth={wealth} />
        </TabsContent>

        <TabsContent value="documents">
          <TabDocuments clientId={id} client={client} />
        </TabsContent>

        <TabsContent value="kyc">
          <TabKYC clientId={id} />
        </TabsContent>

        <TabsContent value="objectives">
          <TabObjectives clientId={id} />
        </TabsContent>

        <TabsContent value="opportunities">
          <TabOpportunities clientId={id} />
        </TabsContent>

        <TabsContent value="timeline">
          <TabTimeline clientId={id} client={client} />
        </TabsContent>

        <TabsContent value="reporting">
          <div className="rounded-lg border p-12 text-center">
            <p className="text-muted-foreground">Reporting - À implémenter</p>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="rounded-lg border p-12 text-center">
            <p className="text-muted-foreground">Paramètres - À implémenter</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
