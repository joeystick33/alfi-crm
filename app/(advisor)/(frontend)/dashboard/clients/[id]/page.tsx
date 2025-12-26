'use client'

import { use, Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClient, useClientWealth } from '@/app/_common/hooks/use-api'
import { Button } from '@/app/_common/components/ui/Button'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { LoadingState } from '@/app/_common/components/ui/LoadingState'
import { ErrorState, getErrorVariant } from '@/app/_common/components/ui/ErrorState'
import { EmptyState } from '@/app/_common/components/ui/EmptyState'
// Utiliser la nouvelle version V2 du Client360 pour les particuliers
import Client360ContainerV2 from '@/app/(advisor)/(frontend)/components/client360-v2/Client360ContainerV2'
import { ClientHeader } from '@/app/(advisor)/(frontend)/components/client360-v2/ClientHeader'
// Client360 PRO V2 pour les professionnels (harmonisé avec particuliers)
import { Client360ProContainerV2 } from '@/app/(advisor)/(frontend)/components/client360-pro'
import { ClientEditModal } from '@/app/(advisor)/(frontend)/components/client360/ClientEditModal'
import { useToast } from '@/app/_common/hooks/use-toast'
import { useClientKPIs } from '@/app/(advisor)/(frontend)/hooks/useClientKPIs'
import {
  ArrowLeft,
  UserX,
} from 'lucide-react'

function Client360Skeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  )
}

interface ClientPageProps {
  params: Promise<{ id: string }>
}

export default function ClientPage({ params }: ClientPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: client, isLoading, isError, error, refetch } = useClient(id)
  const { data: wealth } = useClientWealth(id)
  const [showEditModal, setShowEditModal] = useState(false)

  const { toast } = useToast()
  const kpis = useClientKPIs(id)

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

  return (
    <div className="space-y-4">
      {/* Header client */}
      <ClientHeader
        client={client}
        wealth={wealth as any}
        kpis={{
          patrimoineNet: kpis.patrimoine.net,
          patrimoineEvolution: kpis.patrimoine.evolution,
          tmi: kpis.fiscalite.tmi,
        }}
        onBack={() => router.push('/dashboard/clients')}
        onEdit={() => setShowEditModal(true)}
        onAction={(action) => {
          toast({ title: `Action: ${action}`, description: 'Fonctionnalité en cours...' })
        }}
      />

      {/* Client360 - Sélection du conteneur selon le type de client */}
      <Suspense fallback={<Client360Skeleton />}>
        {client.clientType === 'PROFESSIONNEL' ? (
          <Client360ProContainerV2
            clientId={id}
            client={client}
            wealth={wealth as any}
          />
        ) : (
          <Client360ContainerV2
            clientId={id}
            client={client}
            wealth={wealth as any}
          />
        )}
      </Suspense>

      {/* Modal d'édition */}
      {showEditModal && (
        <ClientEditModal
          client={client}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
