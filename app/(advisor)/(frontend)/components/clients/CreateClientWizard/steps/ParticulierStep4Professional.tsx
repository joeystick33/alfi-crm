 
'use client'

import { Input } from '@/app/_common/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import type { ParticulierStep4Professional as Step4Data } from '../types'
import { PROFESSION_CATEGORIES, EMPLOYMENT_TYPES } from '../types'
import { Briefcase, Building, Calendar } from 'lucide-react'

interface Props {
  data: Step4Data
  onChange: (data: Step4Data) => void
  errors: Record<string, string>
}

export function ParticulierStep4Professional({ data, onChange, errors }: Props) {
  const updateField = <K extends keyof Step4Data>(field: K, value: Step4Data[K]) => {
    onChange({ ...data, [field]: value })
  }

  const needsEmployer = ['CDI', 'CDD', 'FONCTIONNAIRE', 'INTERIM'].includes(data.employmentType)

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Situation professionnelle</h3>
        <p className="mt-1 text-sm text-gray-500">
          Activité et situation d'emploi
        </p>
      </div>

      {/* Catégorie socio-professionnelle */}
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          value={data.professionCategory}
          onValueChange={(value) => updateField('professionCategory', value as any)}
        >
          <SelectTrigger label="Catégorie socio-professionnelle" className={errors.professionCategory ? 'border-red-500' : ''}>
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent>
            {PROFESSION_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={data.employmentType}
          onValueChange={(value) => updateField('employmentType', value as any)}
        >
          <SelectTrigger label="Type de contrat" className={errors.employmentType ? 'border-red-500' : ''}>
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYMENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Profession */}
      <div className="relative">
        <Briefcase className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
        <Input
          label="Profession / Fonction"
          value={data.profession}
          onChange={(e) => updateField('profession', e.target.value)}
          error={errors.profession}
          placeholder="Ex: Directeur Commercial, Médecin, Ingénieur... (optionnel)"
          className="pl-10"
        />
      </div>

      {/* Employeur */}
      {needsEmployer && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative">
            <Building className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
            <Input
              label="Nom de l'employeur"
              value={data.employerName || ''}
              onChange={(e) => updateField('employerName', e.target.value)}
              error={errors.employerName}
              placeholder="Nom de l'entreprise"
              className="pl-10"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
            <Input
              label="Date d'embauche"
              type="date"
              value={data.employmentSince || ''}
              onChange={(e) => updateField('employmentSince', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Info TNS */}
      {['INDEPENDANT', 'FREELANCE'].includes(data.employmentType) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <strong>Travailleur indépendant :</strong> Pour une analyse complète, nous pourrons vous demander ultérieurement 
            vos 3 derniers bilans comptables et avis d'imposition.
          </p>
        </div>
      )}
    </div>
  )
}
