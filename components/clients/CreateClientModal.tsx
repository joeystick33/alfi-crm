'use client'

import { useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
} from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useCreateClient } from '@/hooks/use-api'
import { User, Building2 } from 'lucide-react'
import type { CreateClientRequest } from '@/lib/api-types'

interface CreateClientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateClientModal({ open, onOpenChange }: CreateClientModalProps) {
  const [step, setStep] = useState<'type' | 'form'>('type')
  const [clientType, setClientType] = useState<'PARTICULIER' | 'PROFESSIONNEL'>('PARTICULIER')
  const [formData, setFormData] = useState<Partial<CreateClientRequest>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createClient = useCreateClient({
    onSuccess: () => {
      onOpenChange(false)
      resetForm()
    },
  })

  const resetForm = () => {
    setStep('type')
    setClientType('PARTICULIER')
    setFormData({})
    setErrors({})
  }

  const handleTypeSelect = (type: 'PARTICULIER' | 'PROFESSIONNEL') => {
    setClientType(type)
    setStep('form')
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'Le prénom est requis'
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Le nom est requis'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    // Professional specific validation
    if (clientType === 'PROFESSIONNEL') {
      if (!formData.companyName?.trim()) {
        newErrors.companyName = 'La raison sociale est requise'
      }
      if (!formData.siret?.trim()) {
        newErrors.siret = 'Le SIRET est requis'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    createClient.mutate({
      ...formData,
      clientType,
    } as CreateClientRequest)
  }

  const updateFormData = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>
            {step === 'type' ? 'Nouveau client' : `Nouveau client ${clientType === 'PARTICULIER' ? 'particulier' : 'professionnel'}`}
          </ModalTitle>
        </ModalHeader>

        {step === 'type' ? (
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Sélectionnez le type de client à créer
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary hover:bg-accent"
                onClick={() => handleTypeSelect('PARTICULIER')}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold">Particulier</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Client personne physique
                  </p>
                </div>
              </button>

              <button
                className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary hover:bg-accent"
                onClick={() => handleTypeSelect('PROFESSIONNEL')}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold">Professionnel</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Client personne morale
                  </p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Prénom"
                value={formData.firstName || ''}
                onChange={(e) => updateFormData('firstName', e.target.value)}
                error={errors.firstName}
                required
              />
              <Input
                label="Nom"
                value={formData.lastName || ''}
                onChange={(e) => updateFormData('lastName', e.target.value)}
                error={errors.lastName}
                required
              />
            </div>

            {clientType === 'PROFESSIONNEL' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Raison sociale"
                  value={formData.companyName || ''}
                  onChange={(e) => updateFormData('companyName', e.target.value)}
                  error={errors.companyName}
                  required
                />
                <Input
                  label="SIRET"
                  value={formData.siret || ''}
                  onChange={(e) => updateFormData('siret', e.target.value)}
                  error={errors.siret}
                  required
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateFormData('email', e.target.value)}
                error={errors.email}
              />
              <Input
                label="Téléphone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => updateFormData('phone', e.target.value)}
              />
            </div>

            {clientType === 'PARTICULIER' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Date de naissance"
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e) => updateFormData('birthDate', e.target.value)}
                  />
                  <Input
                    label="Lieu de naissance"
                    value={formData.birthPlace || ''}
                    onChange={(e) => updateFormData('birthPlace', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    value={formData.maritalStatus || ''}
                    onValueChange={(value) => updateFormData('maritalStatus', value)}
                  >
                    <SelectTrigger label="Situation familiale">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Célibataire</SelectItem>
                      <SelectItem value="MARRIED">Marié(e)</SelectItem>
                      <SelectItem value="DIVORCED">Divorcé(e)</SelectItem>
                      <SelectItem value="WIDOWED">Veuf(ve)</SelectItem>
                      <SelectItem value="PACS">Pacsé(e)</SelectItem>
                      <SelectItem value="COHABITATION">Concubinage</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    label="Profession"
                    value={formData.profession || ''}
                    onChange={(e) => updateFormData('profession', e.target.value)}
                  />
                </div>
              </>
            )}

            {clientType === 'PROFESSIONNEL' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Forme juridique"
                  value={formData.legalForm || ''}
                  onChange={(e) => updateFormData('legalForm', e.target.value)}
                  placeholder="SARL, SAS, SA..."
                />
                <Input
                  label="Secteur d'activité"
                  value={formData.activitySector || ''}
                  onChange={(e) => updateFormData('activitySector', e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <ModalFooter>
          {step === 'form' && (
            <Button
              variant="outline"
              onClick={() => setStep('type')}
              disabled={createClient.isPending}
            >
              Retour
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              resetForm()
            }}
            disabled={createClient.isPending}
          >
            Annuler
          </Button>
          {step === 'form' && (
            <Button
              onClick={handleSubmit}
              loading={createClient.isPending}
            >
              Créer le client
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
