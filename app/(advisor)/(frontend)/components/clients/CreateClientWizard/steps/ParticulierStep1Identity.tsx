'use client'

import { Input } from '@/app/_common/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import type { ParticulierStep1Identity as Step1Data } from '../types'
import { CIVILITES, NATIONALITIES } from '../types'

interface Props {
  data: Step1Data
  onChange: (data: Step1Data) => void
  errors: Record<string, string>
}

export function ParticulierStep1Identity({ data, onChange, errors }: Props) {
  const updateField = <K extends keyof Step1Data>(field: K, value: Step1Data[K]) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Identité</h3>
        <p className="mt-1 text-sm text-gray-500">
          Informations d'état civil du client
        </p>
      </div>

      {/* Civilité */}
      <div className="grid gap-4 md:grid-cols-4">
        <Select
          value={data.civilite}
          onValueChange={(value) => updateField('civilite', value as 'M' | 'MME')}
        >
          <SelectTrigger label="Civilité" className={errors.civilite ? 'border-red-500' : ''}>
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent>
            {CIVILITES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="md:col-span-3">
          <Input
            label="Prénom"
            value={data.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            error={errors.firstName}
            placeholder="Jean (optionnel)"
          />
        </div>
      </div>

      {/* Nom */}
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Nom de naissance"
          value={data.lastName}
          onChange={(e) => updateField('lastName', e.target.value)}
          error={errors.lastName}
          placeholder="DUPONT (optionnel)"
        />
        <Input
          label="Nom d'usage (optionnel)"
          value={data.nomUsage || ''}
          onChange={(e) => updateField('nomUsage', e.target.value)}
          placeholder="Nom marital ou autre"
          helperText="Si différent du nom de naissance"
        />
      </div>

      {/* Naissance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Date de naissance"
          type="date"
          value={data.birthDate}
          onChange={(e) => updateField('birthDate', e.target.value)}
          error={errors.birthDate}
          max={new Date().toISOString().split('T')[0]}
        />
        <Input
          label="Lieu de naissance"
          value={data.birthPlace}
          onChange={(e) => updateField('birthPlace', e.target.value)}
          error={errors.birthPlace}
          placeholder="Paris (75) (optionnel)"
        />
      </div>

      {/* Nationalité */}
      <Select
        value={data.nationality}
        onValueChange={(value) => updateField('nationality', value)}
      >
        <SelectTrigger label="Nationalité" className={errors.nationality ? 'border-red-500' : ''}>
          <SelectValue placeholder="Sélectionner la nationalité" />
        </SelectTrigger>
        <SelectContent>
          {NATIONALITIES.map((n) => (
            <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors.nationality && <p className="text-sm text-red-500">{errors.nationality}</p>}
    </div>
  )
}
