'use client'

import { Input } from '@/app/_common/components/ui/Input'
import { AdresseInput } from '@/app/_common/components/AdresseInput'
import type { ParticulierStep2Contact as Step2Data } from '../types'

interface Props {
  data: Step2Data
  onChange: (data: Step2Data) => void
  errors: Record<string, string>
}

export function ParticulierStep2Contact({ data, onChange, errors }: Props) {
  const updateField = <K extends keyof Step2Data>(field: K, value: Step2Data[K]) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Coordonnées</h3>
        <p className="mt-1 text-sm text-gray-500">
          Moyens de contact et adresse de résidence
        </p>
      </div>

      {/* Email */}
      <Input
        label="Email"
        type="email"
        value={data.email}
        onChange={(e) => updateField('email', e.target.value)}
        error={errors.email}
        placeholder="jean.dupont@email.com (optionnel)"
      />

      {/* Téléphones */}
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Téléphone fixe"
          type="tel"
          value={data.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="01 23 45 67 89"
        />
        <Input
          label="Téléphone mobile"
          type="tel"
          value={data.mobile || ''}
          onChange={(e) => updateField('mobile', e.target.value)}
          error={errors.mobile}
          placeholder="06 12 34 56 78 (optionnel)"
        />
      </div>

      {/* Adresse avec autocomplétion */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Adresse de résidence        </label>
        <AdresseInput
          placeholder="Commencez à taper une adresse..."
          onSelect={(adresse) => {
            updateField('address', {
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
        {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
        
        {/* Affichage de l'adresse sélectionnée */}
        {data.address?.street && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">{data.address.street}</p>
            <p className="text-sm text-gray-600">
              {data.address.postalCode} {data.address.city}
            </p>
          </div>
        )}

        {/* Complément d'adresse */}
        <Input
          label="Complément d'adresse (optionnel)"
          value={data.address?.complement || ''}
          onChange={(e) => updateField('address', { ...data.address, complement: e.target.value })}
          placeholder="Bâtiment, étage, escalier..."
        />
      </div>
    </div>
  )
}
