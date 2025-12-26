'use client'

import { useState, useEffect } from 'react'
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
import { useToast } from '@/app/_common/hooks/use-toast'
import { Loader2 } from 'lucide-react'
import { apiCall } from '@/app/_common/lib/api-client'

interface TacheData {
    id: string
    title: string
    description?: string
    type?: string
    priority?: string
    status?: string
    dueDate?: string | Date
    client?: {
        id: string
        firstName: string
        lastName: string
    }
}

interface UpdateTacheModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tache: TacheData
    onSuccess: () => void
}

const TACHE_TYPES = [
    { value: 'TASK', label: 'Tâche' },
    { value: 'CALL', label: 'Appel' },
    { value: 'EMAIL', label: 'Email' },
    { value: 'MEETING', label: 'Rendez-vous' },
    { value: 'REMINDER', label: 'Rappel' },
]

const TACHE_PRIORITIES = [
    { value: 'BASSE', label: 'Basse' },
    { value: 'MOYENNE', label: 'Moyenne' },
    { value: 'HAUTE', label: 'Haute' },
    { value: 'URGENTE', label: 'Urgente' },
]

const TACHE_STATUSES = [
    { value: 'A_FAIRE', label: 'À faire' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'TERMINE', label: 'Terminée' },
    { value: 'ANNULEE', label: 'Annulée' },
]

export function UpdateTacheModal({ open, onOpenChange, tache, onSuccess }: UpdateTacheModalProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'TASK',
        priority: 'MOYENNE',
        status: 'A_FAIRE',
        dueDate: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (tache && open) {
            setFormData({
                title: tache.title || '',
                description: tache.description || '',
                type: tache.type || 'TASK',
                priority: tache.priority || 'MOYENNE',
                status: tache.status || 'A_FAIRE',
                dueDate: tache.dueDate ? new Date(tache.dueDate).toISOString().split('T')[0] : '',
            })
        }
    }, [tache, open])

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.title?.trim()) {
            newErrors.title = 'Le titre est requis'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        setLoading(true)
        try {
            await apiCall(`/api/advisor/taches/${tache.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description || undefined,
                    type: formData.type,
                    priority: formData.priority,
                    status: formData.status,
                    dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
                }),
            })

            toast({
                title: 'Tâche mise à jour',
                description: 'La tâche a été mise à jour avec succès',
                variant: 'success',
            })

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Erreur mise à jour tâche:', error)
            toast({
                title: 'Erreur',
                description: 'Impossible de mettre à jour la tâche',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const updateFormData = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value })
        if (errors[field]) {
            setErrors({ ...errors, [field]: '' })
        }
    }

    return (
        <Modal open={open} onOpenChange={onOpenChange}>
            <ModalContent className="max-w-2xl">
                <ModalHeader>
                    <ModalTitle>Modifier la tâche</ModalTitle>
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
                                    {TACHE_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
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
                                    {TACHE_PRIORITIES.map((priority) => (
                                        <SelectItem key={priority.value} value={priority.value}>
                                            {priority.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Statut</label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => updateFormData('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TACHE_STATUSES.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date d'échéance</label>
                            <Input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('dueDate', e.target.value)}
                            />
                        </div>
                    </div>

                    <Input
                        label="Titre"
                        value={formData.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('title', e.target.value)}
                        error={errors.title}
                        required
                        placeholder="Ex: Relancer client pour dossier KYC"
                    />

                    <Textarea
                        label="Description"
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('description', e.target.value)}
                        placeholder="Détails supplémentaires..."
                        rows={3}
                    />

                    {tache.client && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-sm text-slate-600">
                                Client associé: <span className="font-medium text-slate-900">
                                    {tache.client.firstName} {tache.client.lastName}
                                </span>
                            </p>
                        </div>
                    )}
                </div>

                <ModalFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Enregistrer
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}
