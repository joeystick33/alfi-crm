 
"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { 
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  ModalDescription,
} from '@/app/_common/components/ui/Modal'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  User,
  UserPlus,
  Trash2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  ArrowLeft,
  Shield,
  Info,
} from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'

// Types
interface AssistantData {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  isActive: boolean
  createdAt: string
  lastLogin: string | null
}

interface AssistantResponse {
  assistant: AssistantData | null
  hasAssistant: boolean
  permissions?: Record<string, boolean>
}

// Hooks
function useMyAssistant() {
  return useQuery<AssistantResponse>({
    queryKey: ['my-assistant'],
    queryFn: async () => {
      const response = await fetch('/api/advisor/assistant')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur')
      }
      return response.json()
    },
  })
}

function useCreateAssistant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      email: string
      password: string
      firstName: string
      lastName: string
      phone?: string
    }) => {
      const response = await fetch('/api/advisor/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assistant'] })
    },
  })
}

function useDeleteAssistant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/advisor/assistant', {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-assistant'] })
    },
  })
}

// Main Component
export default function MyAssistantPage() {
  const { toast } = useToast()
  const { user: authUser } = useAuth()
  
  const { data, isLoading, error } = useMyAssistant()
  const createAssistant = useCreateAssistant()
  const deleteAssistant = useDeleteAssistant()

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  })

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
    })
    setShowPassword(false)
  }

  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      toast({ title: 'Erreur', description: 'Veuillez remplir tous les champs obligatoires', variant: 'destructive' })
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas', variant: 'destructive' })
      return
    }
    if (formData.password.length < 8) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 8 caractères', variant: 'destructive' })
      return
    }

    try {
      await createAssistant.mutateAsync({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || undefined,
      })

      toast({ title: 'Assistant créé !', description: `${formData.firstName} peut maintenant se connecter` })
      setShowCreateModal(false)
      resetForm()
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAssistant.mutateAsync()
      toast({ title: 'Assistant supprimé' })
      setShowDeleteModal(false)
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' })
    }
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mt-1">{(error as Error).message}</p>
      </div>
    )
  }

  // Check if user is advisor
  if (authUser?.role !== 'ADVISOR') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Shield className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Accès restreint</h2>
        <p className="text-sm text-gray-500 mt-1">Cette page est réservée aux conseillers</p>
        <Link href="/dashboard/settings">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux paramètres
          </Button>
        </Link>
      </div>
    )
  }

  const assistant = data?.assistant

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="sm" className="gap-1.5 text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" />
              Paramètres
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mon assistant</h1>
            <p className="text-sm text-gray-500">Gérez l'accès de votre assistant à vos données</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Qu'est-ce qu'un assistant ?</p>
            <p className="text-blue-700">
              Un assistant peut consulter vos clients et documents en lecture seule. 
              Il ne peut pas modifier vos données ni accéder aux autres conseillers du cabinet.
            </p>
          </div>
        </div>
      </div>

      {/* Assistant Card or Empty State */}
      {assistant ? (
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className={cn(
                  "h-16 w-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg",
                  assistant.isActive 
                    ? "bg-gradient-to-br from-slate-500 to-slate-600" 
                    : "bg-gray-400"
                )}>
                  {assistant.firstName?.[0]}{assistant.lastName?.[0]}
                </div>
                {assistant.isActive && (
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {assistant.firstName} {assistant.lastName}
                  </h2>
                  <Badge variant="default" size="sm" className="bg-slate-100 text-slate-700">
                    <User className="h-3 w-3 mr-1" />
                    Assistant
                  </Badge>
                </div>

                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{assistant.email}</span>
                  </div>
                  {assistant.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{assistant.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-1">
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="h-3.5 w-3.5" />
                      Créé le {new Date(assistant.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      {assistant.lastLogin 
                        ? `Dernière connexion ${new Date(assistant.lastLogin).toLocaleDateString('fr-FR')}`
                        : 'Jamais connecté'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Supprimer
                </Button>
              </div>
            </div>

            {/* Permissions Summary */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Permissions</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success" size="xs">✓ Voir les clients</Badge>
                <Badge variant="success" size="xs">✓ Voir les documents</Badge>
                <Badge variant="success" size="xs">✓ Voir le calendrier</Badge>
                <Badge variant="default" size="xs" className="bg-gray-100 text-gray-500">✗ Modifier</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Aucun assistant
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Vous pouvez créer un compte assistant qui pourra consulter vos clients et documents en lecture seule.
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Créer mon assistant
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <Modal open={showCreateModal} onOpenChange={setShowCreateModal}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <span>Créer mon assistant</span>
            </ModalTitle>
            <ModalDescription>
              Créez un compte pour votre assistant
            </ModalDescription>
          </ModalHeader>

          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prénom *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Marie"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nom *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Martin"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="marie.martin@email.fr"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Téléphone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="06 12 34 56 78"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Mot de passe *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 caractères"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Confirmer le mot de passe *</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Répétez le mot de passe"
              />
              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Les mots de passe ne correspondent pas
                </p>
              )}
              {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 8 && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Les mots de passe correspondent
                </p>
              )}
            </div>
          </div>

          <ModalFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createAssistant.isPending ||
                !formData.email ||
                !formData.password ||
                formData.password !== formData.confirmPassword ||
                formData.password.length < 8
              }
              className="gap-2"
            >
              {createAssistant.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer l'assistant
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Modal */}
      <Modal open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <ModalContent className="max-w-sm">
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Supprimer l'assistant
            </ModalTitle>
          </ModalHeader>

          <div className="px-6 py-4">
            <p className="text-sm text-gray-600">
              Supprimer <strong>{assistant?.firstName} {assistant?.lastName}</strong> ?
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Cette action est irréversible. L'assistant perdra immédiatement l'accès à vos données.
            </p>
          </div>

          <ModalFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteAssistant.isPending}
              className="gap-2"
            >
              {deleteAssistant.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
