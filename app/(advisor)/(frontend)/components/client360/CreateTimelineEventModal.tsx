 
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_common/components/ui/Dialog'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Label } from '@/app/_common/components/ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import { useCreateTimelineEvent } from '@/app/(advisor)/(frontend)/hooks/use-timeline'
import { useToast } from '@/app/_common/hooks/use-toast'
import { Loader2 } from 'lucide-react'

const timelineEventSchema = z.object({
  type: z.enum([
    'CLIENT_CREATED',
    'MEETING_HELD',
    'DOCUMENT_SIGNED',
    'ASSET_ADDED',
    'GOAL_ACHIEVED',
    'CONTRACT_SIGNED',
    'KYC_UPDATED',
    'SIMULATION_SHARED',
    'EMAIL_SENT',
    'OPPORTUNITY_CONVERTED',
    'AUTRE',
  ] as const),
  title: z.string().min(1, 'Le titre est requis').max(200, 'Le titre est trop long'),
  description: z.string().max(1000, 'La description est trop longue').optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
})

type TimelineEventFormData = z.infer<typeof timelineEventSchema>

interface CreateTimelineEventModalProps {
  clientId: string
  isOpen: boolean
  onClose: () => void
}

const eventTypeOptions = [
  { value: 'MEETING_HELD', label: 'Rendez-vous' },
  { value: 'DOCUMENT_SIGNED', label: 'Document signé' },
  { value: 'ASSET_ADDED', label: 'Actif ajouté' },
  { value: 'GOAL_ACHIEVED', label: 'Objectif atteint' },
  { value: 'CONTRACT_SIGNED', label: 'Contrat signé' },
  { value: 'KYC_UPDATED', label: 'KYC mis à jour' },
  { value: 'SIMULATION_SHARED', label: 'Simulation partagée' },
  { value: 'EMAIL_SENT', label: 'Email envoyé' },
  { value: 'OPPORTUNITY_CONVERTED', label: 'Opportunité convertie' },
  { value: 'AUTRE', label: 'Autre' },
]

export function CreateTimelineEventModal({
  clientId,
  isOpen,
  onClose,
}: CreateTimelineEventModalProps) {
  const { toast } = useToast()
  const createEvent = useCreateTimelineEvent()
  const [selectedType, setSelectedType] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TimelineEventFormData>({
    resolver: zodResolver(timelineEventSchema),
    defaultValues: {
      type: 'AUTRE',
      title: '',
      description: '',
      relatedEntityType: '',
      relatedEntityId: '',
    },
  })

  const onSubmit = async (data: TimelineEventFormData) => {
    try {
      await createEvent.mutateAsync({ ...data, clientId })

      toast({
        title: 'Événement créé',
        description: 'L\'événement a été ajouté à la timeline avec succès.',
        variant: 'success',
      })

      reset()
      setSelectedType('')
      onClose()
    } catch (error: any) {
      console.error('Error creating timeline event:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'événement. Veuillez réessayer.',
        variant: 'destructive',
      })
    }
  }

  const handleClose = () => {
    reset()
    setSelectedType('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un événement</DialogTitle>
          <DialogDescription>
            Créez un nouvel événement dans la timeline du client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type d'événement *</Label>
            <Select
              value={selectedType}
              onValueChange={(value: any) => {
                setSelectedType(value)
                register('type').onChange({ target: { value } })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypeOptions.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              placeholder="Ex: Rendez-vous de suivi trimestriel"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Détails de l'événement..."
              rows={4}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Related Entity (Optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="relatedEntityType">Type d'entité liée</Label>
              <Input
                id="relatedEntityType"
                placeholder="Ex: Document, Contrat"
                {...register('relatedEntityType')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relatedEntityId">ID de l'entité</Label>
              <Input
                id="relatedEntityId"
                placeholder="ID de l'entité"
                {...register('relatedEntityId')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createEvent.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createEvent.isPending}>
              {createEvent.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Créer l'événement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
