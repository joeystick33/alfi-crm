"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/_common/components/ui/Dialog'
import { Button } from '@/app/_common/components/ui/Button'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import { Label } from '@/app/_common/components/ui/Label'
import { Badge } from '@/app/_common/components/ui/Badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/app/_common/components/ui/DropdownMenu'
import { useRejectComplianceDocument } from '@/app/_common/hooks/api/use-compliance-api'
import { cn } from '@/app/_common/lib/utils'
import { XCircle, FileText, Calendar, ChevronDown, AlertTriangle } from 'lucide-react'
import { ClientLink } from '@/app/_common/components/ClientLink'
import {
  KYC_DOCUMENT_TYPE_LABELS,
  type KYCDocument,
} from '@/lib/compliance/types'

// ============================================================================
// Schema
// ============================================================================

const rejectionSchema = z.object({
  rejectionReason: z.string().min(10, 'La raison du rejet doit contenir au moins 10 caractères'),
})

type RejectionFormData = z.infer<typeof rejectionSchema>

// ============================================================================
// Common Rejection Reasons
// ============================================================================

const COMMON_REJECTION_REASONS = [
  'Document illisible ou de mauvaise qualité',
  'Document expiré',
  'Document incomplet',
  'Informations non concordantes',
  'Type de document incorrect',
  'Document non conforme aux exigences',
  'Signature manquante',
  'Date non visible ou illisible',
]

// ============================================================================
// Props
// ============================================================================

interface DocumentRejectionDialogProps {
  open: boolean
  document: KYCDocument | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// ============================================================================
// Component
// ============================================================================

export default function DocumentRejectionDialog({
  open,
  document,
  onOpenChange,
  onSuccess,
}: DocumentRejectionDialogProps) {
  const rejectMutation = useRejectComplianceDocument()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RejectionFormData>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      rejectionReason: '',
    },
  })

  const currentReason = watch('rejectionReason')

  const handleSelectReason = (reason: string) => {
    setValue('rejectionReason', reason, { shouldValidate: true })
  }

  const onSubmit = async (data: RejectionFormData) => {
    if (!document) return

    try {
      await rejectMutation.mutateAsync({
        id: document.id,
        data: { rejectionReason: data.rejectionReason },
      })
      reset()
      onSuccess()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-rose-500" />
            Rejeter le document
          </DialogTitle>
          <DialogDescription>
            Indiquez la raison du rejet de ce document
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Document Info */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {KYC_DOCUMENT_TYPE_LABELS[document.type]}
                </p>
                {document.fileName && (
                  <p className="text-sm text-gray-500">{document.fileName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
              <ClientLink
                clientId={document.clientId}
                showAvatar={true}
                avatarSize="sm"
              />
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {new Date(document.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg border border-rose-100">
            <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-rose-800">
              <p className="font-medium">Attention</p>
              <p className="mt-1">
                Le client sera notifié du rejet et devra soumettre un nouveau document.
              </p>
            </div>
          </div>

          {/* Quick Reasons */}
          <div className="space-y-2">
            <Label>Raisons courantes</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span className="text-gray-500">Sélectionner une raison...</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[350px]">
                {COMMON_REJECTION_REASONS.map((reason) => (
                  <DropdownMenuItem
                    key={reason}
                    onClick={() => handleSelectReason(reason)}
                  >
                    {reason}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Rejection Reason */}
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">
              Raison du rejet *
              <span className="text-gray-400 font-normal ml-1">(minimum 10 caractères)</span>
            </Label>
            <Textarea
              id="rejectionReason"
              placeholder="Décrivez la raison du rejet..."
              rows={4}
              {...register('rejectionReason')}
              className={cn(errors.rejectionReason && 'border-rose-500')}
            />
            <div className="flex items-center justify-between">
              {errors.rejectionReason ? (
                <p className="text-xs text-rose-500">{errors.rejectionReason.message}</p>
              ) : (
                <span />
              )}
              <span className={cn(
                'text-xs',
                currentReason.length < 10 ? 'text-gray-400' : 'text-emerald-600'
              )}>
                {currentReason.length}/10 caractères min.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              type="submit"
              loading={isSubmitting || rejectMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rejeter le document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
