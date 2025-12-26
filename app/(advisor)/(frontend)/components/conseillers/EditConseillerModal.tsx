 
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Label } from '@/app/_common/components/ui/Label'
import Switch from '@/app/_common/components/ui/Switch'
import { useUpdateConseiller } from '@/app/_common/hooks/use-api'
import { Loader2, User, Mail, Phone, Shield, Power } from 'lucide-react'
import type { ConseillerData } from './ConseillerCard'

interface EditConseillerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conseiller: ConseillerData | null
  onSuccess?: () => void
}

interface FormData {
  email: string
  firstName: string
  lastName: string
  phone: string
  role: 'ADVISOR' | 'ASSISTANT' | 'ADMIN'
  isActive: boolean
}

interface FormErrors {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
}

export function EditConseillerModal({
  open,
  onOpenChange,
  conseiller,
  onSuccess,
}: EditConseillerModalProps) {
  const updateMutation = useUpdateConseiller({
    onSuccess: () => {
      onSuccess?.()
      onOpenChange(false)
    },
  })

  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'ADVISOR',
    isActive: true,
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // Load conseiller data when modal opens
  useEffect(() => {
    if (conseiller && open) {
      setFormData({
        email: conseiller.email,
        firstName: conseiller.firstName,
        lastName: conseiller.lastName,
        phone: conseiller.phone || '',
        role: conseiller.role,
        isActive: conseiller.isActive,
      })
      setErrors({})
    }
  }, [conseiller, open])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    // FirstName validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis'
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères'
    }

    // LastName validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis'
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères'
    }

    // Phone validation (optional but must be valid if provided)
    if (formData.phone.trim() && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Numéro de téléphone invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!conseiller || !validateForm()) {
      return
    }

    // Only send changed fields
    const updates: any = {}
    
    if (formData.email !== conseiller.email) {
      updates.email = formData.email.trim().toLowerCase()
    }
    if (formData.firstName !== conseiller.firstName) {
      updates.firstName = formData.firstName.trim()
    }
    if (formData.lastName !== conseiller.lastName) {
      updates.lastName = formData.lastName.trim()
    }
    if (formData.phone !== (conseiller.phone || '')) {
      updates.phone = formData.phone.trim() || null
    }
    if (formData.role !== conseiller.role) {
      updates.role = formData.role
    }
    if (formData.isActive !== conseiller.isActive) {
      updates.isActive = formData.isActive
    }

    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      onOpenChange(false)
      return
    }

    updateMutation.mutate({
      id: conseiller.id,
      data: updates,
    })
  }

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user types
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleClose = () => {
    if (!updateMutation.isPending) {
      onOpenChange(false)
    }
  }

  if (!conseiller) return null

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>
              Modifier {conseiller.firstName} {conseiller.lastName}
            </ModalTitle>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* FirstName */}
            <div className="space-y-2">
              <Label htmlFor="edit-firstName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Prénom *
              </Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={updateMutation.isPending}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            {/* LastName */}
            <div className="space-y-2">
              <Label htmlFor="edit-lastName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nom *
              </Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={updateMutation.isPending}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={updateMutation.isPending}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Téléphone
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                disabled={updateMutation.isPending}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Rôle *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange('role', value as FormData['role'])}
                disabled={updateMutation.isPending}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADVISOR">Conseiller</SelectItem>
                  <SelectItem value="ASSISTANT">Assistant</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* IsActive */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Power className="h-4 w-4 text-slate-600" />
                <div>
                  <Label htmlFor="edit-isActive" className="font-medium">
                    Compte actif
                  </Label>
                  <p className="text-xs text-slate-600">
                    Désactiver empêche la connexion
                  </p>
                </div>
              </div>
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleChange('isActive', checked)}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Enregistrer
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
