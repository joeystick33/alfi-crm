"use client"

import { useState } from 'react'
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
import { useValidateComplianceDocument } from '@/app/_common/hooks/api/use-compliance-api'
import { CheckCircle, FileText, Calendar, User } from 'lucide-react'
import {
  KYC_DOCUMENT_TYPE_LABELS,
  DOCUMENT_EXPIRATION_RULES,
  type KYCDocument,
} from '@/lib/compliance/types'

// ============================================================================
// Props
// ============================================================================

interface DocumentValidationDialogProps {
  open: boolean
  document: KYCDocument | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

// ============================================================================
// Component
// ============================================================================

export default function DocumentValidationDialog({
  open,
  document,
  onOpenChange,
  onSuccess,
}: DocumentValidationDialogProps) {
  const [notes, setNotes] = useState('')
  
  const validateMutation = useValidateComplianceDocument()

  const handleValidate = async () => {
    if (!document) return

    try {
      await validateMutation.mutateAsync({
        id: document.id,
        data: { notes: notes || undefined },
      })
      setNotes('')
      onSuccess()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleClose = () => {
    setNotes('')
    onOpenChange(false)
  }

  if (!document) return null

  // Calculate expiration date
  const expirationDays = DOCUMENT_EXPIRATION_RULES[document.type]
  const expirationDate = expirationDays > 0
    ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
    : null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            Valider le document
          </DialogTitle>
          <DialogDescription>
            Confirmez la validation de ce document KYC
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Client #{document.clientId.slice(0, 8)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {new Date(document.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Expiration Info */}
          {expirationDate && (
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-sm text-amber-800">
                Date d'expiration prévue
              </span>
              <Badge variant="warning">
                {expirationDate.toLocaleDateString('fr-FR')}
              </Badge>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="validation-notes">Notes de validation (optionnel)</Label>
            <Textarea
              id="validation-notes"
              placeholder="Ajoutez des notes sur la validation..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleValidate}
            loading={validateMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Valider le document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
