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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Label } from '@/app/_common/components/ui/Label'
import { useCreateConseiller } from '@/app/_common/hooks/use-api'
import { Loader2, User, Mail, Phone, Shield } from 'lucide-react'

interface CreateConseillerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface FormData {
  email: string
  firstName: string
  lastName: string
  phone: string
  role: 'ADVISOR' | 'ASSISTANT' | 'ADMIN'
}

interface FormErrors {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
}

export function CreateConseillerModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateConseillerModalProps) {
  const createMutation = useCreateConseiller({
    onSuccess: (data) => {
      // Display temporary password to user
      if (data.tempPassword) {
        alert(
          `Conseiller créé avec succès!\n\n` +
          `Mot de passe temporaire : ${data.tempPassword}\n\n` +
          `⚠️ Veuillez le communiquer au conseiller de manière sécurisée.\n` +
          `Le mot de passe devra être changé à la première connexion.`
        )
      }
      onSuccess?.()
      onOpenChange(false)
      resetForm()
    },
  })

  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'ADVISOR',
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'ADVISOR',
    })
    setErrors({})
  }

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

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Le rôle est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const payload = {
      email: formData.email.trim().toLowerCase(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      phone: formData.phone.trim() || null,
      role: formData.role,
    }

    createMutation.mutate(payload)
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleClose = () => {
    if (!createMutation.isPending) {
      onOpenChange(false)
      resetForm()
    }
  }

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <ModalContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <ModalTitle>Créer un nouveau conseiller</ModalTitle>
          </ModalHeader>

          <div className="space-y-4 py-4">
            {/* FirstName */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Prénom *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Jean"
                disabled={createMutation.isPending}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            {/* LastName */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nom *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Dupont"
                disabled={createMutation.isPending}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="jean.dupont@example.com"
                disabled={createMutation.isPending}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Téléphone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+33 6 12 34 56 78"
                disabled={createMutation.isPending}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Rôle *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange('role', value as FormData['role'])}
                disabled={createMutation.isPending}
              >
                <SelectTrigger id="role" className={errors.role ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADVISOR">Conseiller</SelectItem>
                  <SelectItem value="ASSISTANT">Assistant</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* Info message */}
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm text-blue-800">
                <strong>Note :</strong> Un mot de passe temporaire sera généré automatiquement et affiché après la création. Le conseiller devra le changer lors de sa première connexion.
              </p>
            </div>
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Créer le conseiller
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
