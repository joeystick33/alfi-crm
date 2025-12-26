 
'use client'

import { Input } from '@/app/_common/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import type { ParticulierStep3Family as Step3Data } from '../types'
import { MARITAL_STATUS, MATRIMONIAL_REGIMES, CIVILITES } from '../types'
import { Users, Baby, UserPlus } from 'lucide-react'

interface Props {
  data: Step3Data
  onChange: (data: Step3Data) => void
  errors: Record<string, string>
}

export function ParticulierStep3Family({ data, onChange, errors }: Props) {
  const updateField = <K extends keyof Step3Data>(field: K, value: Step3Data[K]) => {
    onChange({ ...data, [field]: value })
  }

  const needsMatrimonialRegime = ['MARRIED', 'PACS'].includes(data.maritalStatus)
  const canHaveConjoint = ['MARRIED', 'PACS', 'COHABITATION'].includes(data.maritalStatus)

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Situation familiale</h3>
        <p className="mt-1 text-sm text-gray-500">
          État civil, régime matrimonial et personnes à charge
        </p>
      </div>

      {/* Statut marital */}
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          value={data.maritalStatus}
          onValueChange={(value) => {
            updateField('maritalStatus', value as any)
            // Reset matrimonial regime if not applicable
            if (!['MARRIED', 'PACS'].includes(value)) {
              updateField('matrimonialRegime', '')
              updateField('hasConjoint', false)
            }
          }}
        >
          <SelectTrigger label="Situation matrimoniale" className={errors.maritalStatus ? 'border-red-500' : ''}>
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent>
            {MARITAL_STATUS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {needsMatrimonialRegime && (
          <Select
            value={data.matrimonialRegime || ''}
            onValueChange={(value) => updateField('matrimonialRegime', value as any)}
          >
            <SelectTrigger label="Régime matrimonial" className={errors.matrimonialRegime ? 'border-red-500' : ''}>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {MATRIMONIAL_REGIMES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Date de mariage/PACS */}
      {needsMatrimonialRegime && (
        <Input
          label={data.maritalStatus === 'MARRIED' ? 'Date du mariage' : 'Date du PACS'}
          type="date"
          value={data.marriageDate || ''}
          onChange={(e) => updateField('marriageDate', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
      )}

      {/* Enfants et personnes à charge */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <Baby className="h-4 w-4" />
              Nombre d'enfants
            </div>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50"
              onClick={() => updateField('numberOfChildren', Math.max(0, data.numberOfChildren - 1))}
            >
              -
            </button>
            <span className="w-10 text-center text-lg font-semibold">{data.numberOfChildren}</span>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50"
              onClick={() => updateField('numberOfChildren', data.numberOfChildren + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Autres personnes à charge
            </div>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50"
              onClick={() => updateField('dependents', Math.max(0, data.dependents - 1))}
            >
              -
            </button>
            <span className="w-10 text-center text-lg font-semibold">{data.dependents}</span>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50"
              onClick={() => updateField('dependents', data.dependents + 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Conjoint / Partenaire */}
      {canHaveConjoint && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="hasConjoint"
              checked={data.hasConjoint}
              onChange={(e) => updateField('hasConjoint', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="hasConjoint" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Renseigner les informations du conjoint/partenaire
            </label>
          </div>

          {data.hasConjoint && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="grid gap-4 md:grid-cols-3">
                <Select
                  value={data.conjoint?.civilite || ''}
                  onValueChange={(value) => updateField('conjoint', { 
                    ...data.conjoint, 
                    civilite: value as 'M' | 'MME',
                    firstName: data.conjoint?.firstName || '',
                    lastName: data.conjoint?.lastName || '',
                    birthDate: data.conjoint?.birthDate || '',
                  })}
                >
                  <SelectTrigger label="Civilité">
                    <SelectValue placeholder="Civ." />
                  </SelectTrigger>
                  <SelectContent>
                    {CIVILITES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  label="Prénom"
                  value={data.conjoint?.firstName || ''}
                  onChange={(e) => updateField('conjoint', { 
                    ...data.conjoint, 
                    firstName: e.target.value,
                    civilite: data.conjoint?.civilite || '',
                    lastName: data.conjoint?.lastName || '',
                    birthDate: data.conjoint?.birthDate || '',
                  })}
                  error={errors['conjoint.firstName']}
                />

                <Input
                  label="Nom"
                  value={data.conjoint?.lastName || ''}
                  onChange={(e) => updateField('conjoint', { 
                    ...data.conjoint, 
                    lastName: e.target.value,
                    civilite: data.conjoint?.civilite || '',
                    firstName: data.conjoint?.firstName || '',
                    birthDate: data.conjoint?.birthDate || '',
                  })}
                  error={errors['conjoint.lastName']}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Date de naissance"
                  type="date"
                  value={data.conjoint?.birthDate || ''}
                  onChange={(e) => updateField('conjoint', { 
                    ...data.conjoint, 
                    birthDate: e.target.value,
                    civilite: data.conjoint?.civilite || '',
                    firstName: data.conjoint?.firstName || '',
                    lastName: data.conjoint?.lastName || '',
                  })}
                  max={new Date().toISOString().split('T')[0]}
                />

                <Input
                  label="Profession"
                  value={data.conjoint?.profession || ''}
                  onChange={(e) => updateField('conjoint', { 
                    ...data.conjoint, 
                    profession: e.target.value,
                    civilite: data.conjoint?.civilite || '',
                    firstName: data.conjoint?.firstName || '',
                    lastName: data.conjoint?.lastName || '',
                    birthDate: data.conjoint?.birthDate || '',
                  })}
                  placeholder="Profession du conjoint"
                />
              </div>

              <Input
                label="Revenus annuels nets (optionnel)"
                type="number"
                value={data.conjoint?.annualIncome?.toString() || ''}
                onChange={(e) => updateField('conjoint', { 
                  ...data.conjoint, 
                  annualIncome: e.target.value ? parseFloat(e.target.value) : undefined,
                  civilite: data.conjoint?.civilite || '',
                  firstName: data.conjoint?.firstName || '',
                  lastName: data.conjoint?.lastName || '',
                  birthDate: data.conjoint?.birthDate || '',
                })}
                placeholder="40000"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
