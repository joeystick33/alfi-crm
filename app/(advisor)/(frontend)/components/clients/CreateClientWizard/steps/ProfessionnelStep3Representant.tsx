'use client'

import { Input } from '@/app/_common/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import type { ProfessionnelStep3Representant as Step3Data } from '../types'
import { CIVILITES, NATIONALITIES } from '../types'
import { UserCircle, Briefcase } from 'lucide-react'

interface Props {
  data: Step3Data
  onChange: (data: Step3Data) => void
  errors: Record<string, string>
}

const ROLES = [
  { value: 'GERANT', label: 'Gérant' },
  { value: 'PRESIDENT', label: 'Président' },
  { value: 'DIRECTEUR_GENERAL', label: 'Directeur Général' },
  { value: 'ASSOCIE', label: 'Associé' },
  { value: 'DAF', label: 'Directeur Administratif et Financier' },
  { value: 'DRH', label: 'Directeur des Ressources Humaines' },
  { value: 'AUTRE', label: 'Autre' },
]

export function ProfessionnelStep3Representant({ data, onChange, errors }: Props) {
  const updateField = <K extends keyof Step3Data>(field: K, value: Step3Data[K]) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Représentant légal / Contact principal
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Personne en charge de la relation avec le cabinet
        </p>
      </div>

      {/* Identité */}
      <div className="grid gap-4 md:grid-cols-4">
        <Select
          value={data.civilite}
          onValueChange={(value) => updateField('civilite', value as 'M' | 'MME')}
        >
          <SelectTrigger label="Civilité" className={errors.civilite ? 'border-red-500' : ''}>
            <SelectValue placeholder="Civ." />
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

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Nom"
          value={data.lastName}
          onChange={(e) => updateField('lastName', e.target.value)}
          error={errors.lastName}
          placeholder="DUPONT (optionnel)"
        />
        <div className="relative">
          <Briefcase className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
          <Select
            value={data.role}
            onValueChange={(value) => updateField('role', value)}
          >
            <SelectTrigger label="Fonction" className={`pl-10 ${errors.role ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Naissance et nationalité */}
      <div className="grid gap-4 md:grid-cols-3">
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
          value={data.birthPlace || ''}
          onChange={(e) => updateField('birthPlace', e.target.value)}
          placeholder="Paris (75)"
        />
        <Select
          value={data.nationality}
          onValueChange={(value) => updateField('nationality', value)}
        >
          <SelectTrigger label="Nationalité" className={errors.nationality ? 'border-red-500' : ''}>
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent>
            {NATIONALITIES.map((n) => (
              <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Coordonnées */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900">Coordonnées du représentant</h4>
        
        <Input
          label="Email professionnel"
          type="email"
          value={data.email}
          onChange={(e) => updateField('email', e.target.value)}
          error={errors.email}
          placeholder="j.dupont@entreprise.com (optionnel)"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Téléphone fixe"
            type="tel"
            value={data.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            error={errors.phone}
            placeholder="01 23 45 67 89 (optionnel)"
          />
          <Input
            label="Téléphone mobile"
            type="tel"
            value={data.mobile || ''}
            onChange={(e) => updateField('mobile', e.target.value)}
            placeholder="06 12 34 56 78"
          />
        </div>
      </div>
    </div>
  )
}
