'use client'

import { useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from '@/app/_common/components/ui/Modal'
import { Button } from '@/app/_common/components/ui/Button'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { useUpdateClient } from '@/app/_common/hooks/use-api'
import type { ProspectData } from './ProspectCard'

interface ConvertProspectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prospect: ProspectData | null
  onSuccess?: () => void
  mode?: 'CONVERT' | 'REACTIVATE'
}

export function ConvertProspectModal({
  open,
  onOpenChange,
  prospect,
  onSuccess,
  mode = 'CONVERT',
}: ConvertProspectModalProps) {
  const [converting, setConverting] = useState(false)
  const updateClient = useUpdateClient()

  const handleConvert = async () => {
    if (!prospect) return

    const targetStatus = mode === 'REACTIVATE' ? 'PROSPECT' : 'ACTIF'

    setConverting(true)

    try {
      await updateClient.mutateAsync({
        id: prospect.id,
        data: {
          status: targetStatus,
        },
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error converting prospect:', error)
    } finally {
      setConverting(false)
    }
  }

  if (!prospect) return null

  const fullName = `${prospect.firstName} ${prospect.lastName}`

  const title = mode === 'REACTIVATE' ? 'Réactiver le prospect' : 'Convertir en client actif'
  const badgeTitle = mode === 'REACTIVATE' ? 'Réactivation prospect' : 'Conversion prospect → client'
  const fromStatus = mode === 'REACTIVATE' ? 'PERDU' : 'PROSPECT'
  const toStatus = mode === 'REACTIVATE' ? 'PROSPECT' : 'ACTIF'
  const primaryLabel = mode === 'REACTIVATE' ? 'Réactiver' : 'Convertir en client'
  const infoText = mode === 'REACTIVATE'
    ? 'Cette action va réactiver le prospect. Les opportunités, tâches et rendez-vous associés seront conservés.'
    : 'Cette action va convertir le prospect en client actif. Toutes les opportunités, tâches et rendez-vous associés seront conservés.'

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-green-900">{badgeTitle}</h4>
              <p className="text-sm text-green-700">
                Le statut sera changé de <strong>{fromStatus}</strong> à <strong>{toStatus}</strong>
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <strong>Prospect :</strong> {fullName}
            </p>
            
            {prospect.email && (
              <p>
                <strong>Email :</strong> {prospect.email}
              </p>
            )}
            
            {prospect.companyName && (
              <p>
                <strong>Entreprise :</strong> {prospect.companyName}
              </p>
            )}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> {infoText}
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={converting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConvert}
            disabled={converting}
            className="bg-green-600 hover:bg-green-700"
          >
            {converting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {primaryLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
