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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import { useCreateClient } from '@/app/_common/hooks/use-api'
import { User, Building2 } from 'lucide-react'
import { AdresseInput } from '@/app/_common/components/AdresseInput'
import { EntrepriseInput } from '@/app/_common/components/EntrepriseInput'
import type { CreateClientRequest } from '@/app/_common/lib/api-types'

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

    // Validation souple - seul format email si fourni
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email invalide'
    }

    // Validation SIRET si fourni (14 chiffres)
    if (formData.siret && !/^\d{14}$/.test(formData.siret.replace(/\s/g, ''))) {
      newErrors.siret = 'Le SIRET doit contenir 14 chiffres'
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

  const updateFormData = (field: string, value: string | Record<string, unknown>) => {
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
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Sélectionnez le type de client à créer
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                className="group flex flex-col items-center gap-4 rounded-xl border-2 border-gray-200 p-6 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md"
                onClick={() => handleTypeSelect('PARTICULIER')}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                  <User className="h-7 w-7 text-indigo-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">Particulier</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Client personne physique
                  </p>
                </div>
              </button>

              <button
                className="group flex flex-col items-center gap-4 rounded-xl border-2 border-gray-200 p-6 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md"
                onClick={() => handleTypeSelect('PROFESSIONNEL')}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                  <Building2 className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">Professionnel</h3>
                  <p className="text-sm text-gray-500 mt-1">
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('firstName', e.target.value)}
                error={errors.firstName}
                placeholder="Optionnel"
              />
              <Input
                label="Nom"
                value={formData.lastName || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('lastName', e.target.value)}
                error={errors.lastName}
                placeholder="Optionnel"
              />
            </div>

            {clientType === 'PROFESSIONNEL' && (
              <div className="space-y-4">
                {/* Recherche entreprise par SIREN/SIRET/Nom */}
                <EntrepriseInput
                  label="Rechercher l'entreprise"
                  placeholder="SIREN, SIRET ou nom de l'entreprise..."
                  showDetails={true}
                  showDirigeants={true}
                  helpText="Saisissez le SIREN, SIRET ou le nom pour remplir automatiquement les informations"
                  onSelect={(entreprise) => {
                    // Remplir automatiquement les champs depuis l'API SIRENE
                    updateFormData('companyName', entreprise.nom_raison_sociale || entreprise.nom_complet)
                    updateFormData('siret', entreprise.siege?.siret || entreprise.siren + '00000') // SIRET = SIREN + NIC
                    updateFormData('legalForm', entreprise.nature_juridique || '')
                    updateFormData('activitySector', entreprise.activite_principale || '')
                    
                    // Remplir l'adresse depuis le siège
                    if (entreprise.siege) {
                      updateFormData('address', {
                        street: entreprise.siege.adresse,
                        city: entreprise.siege.libelle_commune || '',
                        postalCode: entreprise.siege.code_postal || '',
                        country: 'FR',
                      })
                    }
                    
                    // Remplir le dirigeant principal si disponible
                    if (entreprise.dirigeants && entreprise.dirigeants.length > 0) {
                      const dirigeant = entreprise.dirigeants[0]
                      if (dirigeant.type_dirigeant === 'personne physique') {
                        updateFormData('firstName', dirigeant.prenoms?.split(' ')[0] || '')
                        updateFormData('lastName', dirigeant.nom || '')
                      }
                    }
                  }}
                  onClear={() => {
                    updateFormData('companyName', '')
                    updateFormData('siret', '')
                    updateFormData('legalForm', '')
                    updateFormData('activitySector', '')
                  }}
                />
                
                {/* Champs manuels pour ajustement si besoin */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Raison sociale"
                    value={formData.companyName || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('companyName', e.target.value)}
                    error={errors.companyName}
                    placeholder="Optionnel"
                  />
                  <Input
                    label="SIRET"
                    value={formData.siret || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('siret', e.target.value)}
                    error={errors.siret}
                    placeholder="14 chiffres (optionnel)"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={formData.email || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('email', e.target.value)}
                error={errors.email}
              />
              <Input
                label="Téléphone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('phone', e.target.value)}
              />
            </div>

            {/* Adresse avec autocomplétion API BAN */}
            <div className="pt-2">
              <AdresseInput
                label="Adresse"
                placeholder="Commencez à taper une adresse..."
                showZonePTZ={false}
                helpText="Recherche automatique dans la base nationale des adresses"
                onSelect={(adresse) => {
                  updateFormData('address', {
                    street: adresse.housenumber 
                      ? `${adresse.housenumber} ${adresse.street || ''}`.trim()
                      : adresse.street || adresse.label,
                    city: adresse.city,
                    postalCode: adresse.postcode,
                    country: 'FR',
                    codeInsee: adresse.citycode,
                  })
                }}
              />
            </div>

            {clientType === 'PARTICULIER' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Date de naissance"
                    type="date"
                    value={formData.birthDate || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('birthDate', e.target.value)}
                  />
                  <Input
                    label="Lieu de naissance"
                    value={formData.birthPlace || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('birthPlace', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    value={formData.maritalStatus || ''}
                    onValueChange={(value: string) => updateFormData('maritalStatus', value)}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('profession', e.target.value)}
                  />
                </div>
              </>
            )}

            {clientType === 'PROFESSIONNEL' && (
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Forme juridique"
                  value={formData.legalForm || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('legalForm', e.target.value)}
                  placeholder="SARL, SAS, SA..."
                />
                <Input
                  label="Secteur d'activité"
                  value={formData.activitySector || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('activitySector', e.target.value)}
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
