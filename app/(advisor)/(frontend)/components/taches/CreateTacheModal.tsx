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
import { Input } from '@/app/_common/components/ui/Input'
import Textarea from '@/app/_common/components/ui/Textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/app/_common/components/ui/Select'
import { useCreateTask, useClients, useCollaborators } from '@/app/_common/hooks/use-api'
import { Loader2 } from 'lucide-react'

interface CreateTaskModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateTacheModal({ open, onOpenChange }: CreateTaskModalProps) {
    const [formData, setFormData] = useState<Record<string, string | undefined>>({
        type: 'AUTRE',
        priority: 'MOYENNE',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const { data: clientsData } = useClients({ pageSize: 100 }) // Simple list for now
    const { data: collaboratorsData } = useCollaborators()

    const createTask = useCreateTask({
        onSuccess: () => {
            onOpenChange(false)
            resetForm()
        },
    })

    const resetForm = () => {
        setFormData({
            type: 'AUTRE',
            priority: 'MOYENNE',
        })
        setErrors({})
    }

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.title?.trim()) {
            newErrors.title = 'Le titre est requis'
        }
        if (!formData.assignedToId) {
            newErrors.assignedToId = 'L\'assignation est requise'
        }
        if (!formData.dueDate) {
            newErrors.dueDate = 'La date d\'échéance est requise'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = () => {
        if (!validateForm()) return

        createTask.mutate({
            title: formData.title as string,
            type: formData.type as any, // Cast to any to avoid Enum import issues, assuming values are correct
            priority: formData.priority as any,
            assignedToId: formData.assignedToId as string,
            description: formData.description,
            clientId: formData.clientId,
            dueDate: new Date(formData.dueDate as string).toISOString(),
        })
    }

    const updateFormData = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value })
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' })
        }
    }

    const clients = clientsData?.data || []
    const collaborators = collaboratorsData?.collaborators || []

    return (
        <Modal open={open} onOpenChange={onOpenChange}>
            <ModalContent className="max-w-2xl">
                <ModalHeader>
                    <ModalTitle>Nouvelle tâche</ModalTitle>
                </ModalHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => updateFormData('type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AUTRE">Tâche</SelectItem>
                                    <SelectItem value="APPEL">Appel</SelectItem>
                                    <SelectItem value="EMAIL">Email</SelectItem>
                                    <SelectItem value="REUNION">Rendez-vous</SelectItem>
                                    <SelectItem value="SUIVI">Rappel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Priorité</label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) => updateFormData('priority', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BASSE">Basse</SelectItem>
                                    <SelectItem value="MOYENNE">Moyenne</SelectItem>
                                    <SelectItem value="HAUTE">Haute</SelectItem>
                                    <SelectItem value="URGENTE">Urgente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Input
                        label="Titre"
                        value={formData.title || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('title', e.target.value)}
                        error={errors.title}
                        required
                        placeholder="Ex: Relancer client pour dossier KYC"
                    />

                    <Textarea
                        label="Description"
                        value={formData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('description', e.target.value)}
                        placeholder="Détails supplémentaires..."
                        rows={3}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <Input
                            label="Date d'échéance"
                            type="date"
                            value={formData.dueDate || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('dueDate', e.target.value)}
                            error={errors.dueDate}
                            required
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Assigné à <span className="text-red-500">*</span></label>
                            <Select
                                value={formData.assignedToId}
                                onValueChange={(value) => updateFormData('assignedToId', value)}
                            >
                                <SelectTrigger className={errors.assignedToId ? "border-red-500" : ""}>
                                    <SelectValue placeholder="Sélectionner un collaborateur" />
                                </SelectTrigger>
                                <SelectContent>
                                    {collaborators.map((collab: any) => (
                                        <SelectItem key={collab.id} value={collab.id}>
                                            {collab.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.assignedToId && (
                                <p className="text-xs text-red-500">{errors.assignedToId}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Client lié (Optionnel)</label>
                        <Select
                            value={formData.clientId}
                            onValueChange={(value) => updateFormData('clientId', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Rechercher un client..." />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((client: any) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.firstName} {client.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <ModalFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false)
                            resetForm()
                        }}
                        disabled={createTask.isPending}
                    >
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={createTask.isPending}
                    >
                        {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Créer la tâche
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
