'use client'
import { useState } from 'react'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { AdresseInput } from '@/app/_common/components/AdresseInput'
import type { StepProps } from '../types'

export function Step3Coordonnees({ data, updateData, errors }: StepProps) {
  const [adresseManuelle, setAdresseManuelle] = useState(false)

  const updateAddress = (field: string, value: string) => {
    updateData({ address: { ...data.address, [field]: value } })
  }

  // Quand une adresse est sélectionnée via l'autocomplétion
  const handleAdresseSelect = (adresse: any) => {
    updateData({
      address: {
        street: adresse.housenumber
          ? `${adresse.housenumber} ${adresse.street || ''}`.trim()
          : adresse.street || adresse.label,
        city: adresse.city,
        postalCode: adresse.postcode,
        country: 'FR',
        // Données enrichies
        codeInsee: adresse.citycode,
        departement: adresse.departement,
        coordinates: adresse.coordinates,
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Email *</Label>
          <Input
            type="email"
            value={data.email}
            onChange={e => updateData({ email: e.target.value })}
            className={errors.email ? 'border-red-500' : ''}
            placeholder="exemple@email.com"
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <Label>Téléphone mobile</Label>
          <Input
            type="tel"
            value={data.mobile || ''}
            onChange={e => updateData({ mobile: e.target.value })}
            placeholder="06 12 34 56 78"
          />
        </div>
      </div>
      <div>
        <Label>Téléphone fixe</Label>
        <Input
          type="tel"
          value={data.phone || ''}
          onChange={e => updateData({ phone: e.target.value })}
          placeholder="01 23 45 67 89"
        />
      </div>

      {/* Adresse avec autocomplétion */}
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Adresse</h4>
          <button
            type="button"
            onClick={() => setAdresseManuelle(!adresseManuelle)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {adresseManuelle ? 'Utiliser la recherche' : 'Saisie manuelle'}
          </button>
        </div>

        {!adresseManuelle ? (
          /* Autocomplétion avec API BAN */
          <div className="space-y-4">
            <AdresseInput
              label="Rechercher une adresse"
              placeholder="Commencez à taper une adresse..."
              value={data.address.street ? `${data.address.street}, ${data.address.postalCode} ${data.address.city}` : ''}
              showZonePTZ={false}
              helpText="Saisissez au moins 3 caractères pour voir les suggestions"
              onSelect={handleAdresseSelect}
            />

            {/* Affichage de l'adresse sélectionnée */}
            {data.address.city && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-900">{data.address.street}</p>
                <p className="text-gray-600">{data.address.postalCode} {data.address.city}</p>
                {data.address.departement && (
                  <p className="text-gray-500 text-xs mt-1">
                    Département {data.address.departement}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Saisie manuelle */
          <div className="space-y-4">
            <div>
              <Label>Rue</Label>
              <Input
                value={data.address.street}
                onChange={e => updateAddress('street', e.target.value)}
                placeholder="123 rue de la Paix"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Code postal</Label>
                <Input
                  value={data.address.postalCode}
                  onChange={e => updateAddress('postalCode', e.target.value)}
                  placeholder="75001"
                />
              </div>
              <div>
                <Label>Ville</Label>
                <Input
                  value={data.address.city}
                  onChange={e => updateAddress('city', e.target.value)}
                  placeholder="Paris"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
