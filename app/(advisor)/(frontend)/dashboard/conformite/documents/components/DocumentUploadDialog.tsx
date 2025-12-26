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
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Textarea } from '@/app/_common/components/ui/Textarea'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/app/_common/components/ui/DropdownMenu'
import FileUpload from '@/app/_common/components/ui/FileUpload'
import { useCreateComplianceDocument } from '@/app/_common/hooks/api/use-compliance-api'
import { cn } from '@/app/_common/lib/utils'
import { Upload, ChevronDown, CheckCircle, FileText } from 'lucide-react'
import {
  KYC_DOCUMENT_TYPES,
  KYC_DOCUMENT_TYPE_LABELS,
  type KYCDocumentType,
} from '@/lib/compliance/types'

// ============================================================================
// Schema
// ============================================================================

const uploadSchema = z.object({
  clientId: z.string().min(1, 'Le client est requis'),
  type: z.enum(KYC_DOCUMENT_TYPES as unknown as [string, ...string[]], {
    message: 'Le type de document est requis',
  }),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  notes: z.string().optional(),
})

type UploadFormData = z.infer<typeof uploadSchema>

// ============================================================================
// Props
// ============================================================================

interface DocumentUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  preselectedClientId?: string
}

// ============================================================================
// Component
// ============================================================================

export default function DocumentUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedClientId,
}: DocumentUploadDialogProps) {
  const [selectedType, setSelectedType] = useState<KYCDocumentType | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const createMutation = useCreateComplianceDocument()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      clientId: preselectedClientId || '',
      notes: '',
    },
  })

  const handleTypeSelect = (type: KYCDocumentType) => {
    setSelectedType(type)
    setValue('type', type)
  }

  const handleFileUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0]
      setUploadedFile(file)
      setValue('fileName', file.name)
      // In a real app, you would upload to storage and get a URL
      setValue('fileUrl', URL.createObjectURL(file))
    }
  }

  const onSubmit = async (data: UploadFormData) => {
    try {
      await createMutation.mutateAsync({
        clientId: data.clientId,
        type: data.type as KYCDocumentType,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        notes: data.notes,
      })
      reset()
      setSelectedType(null)
      setUploadedFile(null)
      onSuccess()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleClose = () => {
    reset()
    setSelectedType(null)
    setUploadedFile(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#7373FF]" />
            Ajouter un document KYC
          </DialogTitle>
          <DialogDescription>
            Téléversez un document de conformité pour un client
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Client ID */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <Input
              id="clientId"
              placeholder="ID du client"
              {...register('clientId')}
              className={cn(errors.clientId && 'border-rose-500')}
            />
            {errors.clientId && (
              <p className="text-xs text-rose-500">{errors.clientId.message}</p>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label>Type de document *</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'w-full justify-between',
                    errors.type && 'border-rose-500'
                  )}
                >
                  {selectedType ? (
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {KYC_DOCUMENT_TYPE_LABELS[selectedType]}
                    </span>
                  ) : (
                    <span className="text-gray-500">Sélectionner un type</span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[300px]">
                {KYC_DOCUMENT_TYPES.map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => handleTypeSelect(type)}
                    className="flex items-center gap-2"
                  >
                    {selectedType === type && (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                    <span className={cn(selectedType !== type && 'ml-6')}>
                      {KYC_DOCUMENT_TYPE_LABELS[type]}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {errors.type && (
              <p className="text-xs text-rose-500">{errors.type.message}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Fichier</Label>
            <FileUpload
              accept=".pdf,.png,.jpg,.jpeg"
              maxSize={10 * 1024 * 1024} // 10MB
              onUpload={handleFileUpload}
              className="border-dashed"
            />
            {uploadedFile && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 truncate">
                  {uploadedFile.name}
                </span>
                <span className="text-xs text-gray-500">
                  ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ajoutez des notes ou commentaires..."
              rows={3}
              {...register('notes')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              loading={isSubmitting || createMutation.isPending}
            >
              Ajouter le document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
