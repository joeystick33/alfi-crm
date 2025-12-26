'use client'

import { Input } from '@/app/_common/components/ui/Input'
import { AdresseInput } from '@/app/_common/components/AdresseInput'
import type { ProfessionnelStep4Coordonnees as Step4Data } from '../types'
import { MapPin, Mail, Phone, Globe } from 'lucide-react'

interface Props {
  data: Step4Data
  onChange: (data: Step4Data) => void
  errors: Record<string, string>
}

export function ProfessionnelStep4Coordonnees({ data, onChange, errors }: Props) {
  const updateField = <K extends keyof Step4Data>(field: K, value: Step4Data[K]) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Coordonnées de l'entreprise
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Siège social et moyens de contact
        </p>
      </div>

      {/* Adresse du siège */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Adresse du siège social        </label>
        <AdresseInput
          placeholder="Commencez à taper l'adresse du siège..."
          onSelect={(adresse) => {
            updateField('siegeAddress', {
              street: adresse.housenumber 
                ? `${adresse.housenumber} ${adresse.street || ''}`.trim()
                : adresse.street || adresse.label,
              postalCode: adresse.postcode,
              city: adresse.city,
              country: 'FR',
              codeInsee: adresse.citycode,
            })
          }}
        />
        {errors.siegeAddress && <p className="text-sm text-red-500">{errors.siegeAddress}</p>}
        
        {/* Affichage de l'adresse sélectionnée */}
        {data.siegeAddress?.street && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">{data.siegeAddress.street}</p>
            <p className="text-sm text-gray-600">
              {data.siegeAddress.postalCode} {data.siegeAddress.city}
            </p>
          </div>
        )}

        {/* Complément d'adresse */}
        <Input
          label="Complément d'adresse (optionnel)"
          value={data.siegeAddress?.complement || ''}
          onChange={(e) => updateField('siegeAddress', { 
            ...data.siegeAddress, 
            complement: e.target.value,
            street: data.siegeAddress?.street || '',
            postalCode: data.siegeAddress?.postalCode || '',
            city: data.siegeAddress?.city || '',
            country: data.siegeAddress?.country || 'FR',
          })}
          placeholder="Bâtiment, étage, zone..."
        />
      </div>

      {/* Contact entreprise */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900">Contact entreprise</h4>

        <div className="relative">
          <Mail className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
          <Input
            label="Email de l'entreprise"
            type="email"
            value={data.email}
            onChange={(e) => updateField('email', e.target.value)}
            error={errors.email}
            placeholder="contact@entreprise.com (optionnel)"
            className="pl-10"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative">
            <Phone className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
            <Input
              label="Téléphone principal"
              type="tel"
              value={data.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              error={errors.phone}
              placeholder="01 23 45 67 89 (optionnel)"
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
            <Input
              label="Site web (optionnel)"
              type="url"
              value={data.website || ''}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://www.entreprise.com"
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
