'use client'

import { useState } from 'react'
import { Input } from '@/app/_common/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import { EntrepriseInput } from '@/app/_common/components/EntrepriseInput'
import type { ProfessionnelStep1Entreprise as Step1Data } from '../types'
import { LEGAL_FORMS } from '../types'
import { Building2, Search, CheckCircle } from 'lucide-react'
import type { Entreprise } from '@/lib/services/entreprise/api-sirene'

interface Props {
  data: Step1Data
  onChange: (data: Step1Data) => void
  onEntrepriseSelected?: (entreprise: Entreprise) => void
  errors: Record<string, string>
}

export function ProfessionnelStep1Entreprise({ data, onChange, onEntrepriseSelected, errors }: Props) {
  const [searchMode, setSearchMode] = useState<'auto' | 'manual'>(data.siren ? 'manual' : 'auto')
  const [entrepriseLoaded, setEntrepriseLoaded] = useState(false)

  const updateField = <K extends keyof Step1Data>(field: K, value: Step1Data[K]) => {
    onChange({ ...data, [field]: value })
  }

  const handleEntrepriseSelect = (entreprise: Entreprise) => {
    // Remplir automatiquement tous les champs
    onChange({
      companyName: entreprise.nom_raison_sociale || entreprise.nom_complet,
      siren: entreprise.siren,
      siret: entreprise.siege?.siret || '',
      legalForm: entreprise.nature_juridique || '',
      legalFormCode: entreprise.nature_juridique,
    })
    setSearchMode('manual')
    setEntrepriseLoaded(true)
    
    // Propager l'entreprise au parent pour remplir les autres étapes
    onEntrepriseSelected?.(entreprise)
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Identification de l'entreprise
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Recherchez l'entreprise par SIREN, SIRET ou nom pour auto-compléter les informations
        </p>
      </div>

      {/* Mode de recherche */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSearchMode('auto')}
          className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
            searchMode === 'auto'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Search className="inline-block h-4 w-4 mr-2" />
          Recherche automatique
        </button>
        <button
          type="button"
          onClick={() => setSearchMode('manual')}
          className={`flex-1 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
            searchMode === 'manual'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Saisie manuelle
        </button>
      </div>

      {searchMode === 'auto' && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <EntrepriseInput
            label="Rechercher l'entreprise"
            placeholder="SIREN, SIRET ou nom de l'entreprise..."
            showDetails={true}
            showDirigeants={true}
            showFinances={true}
            onSelect={handleEntrepriseSelect}
            onClear={() => {
              onChange({
                companyName: '',
                siren: '',
                siret: '',
                legalForm: '',
              })
              setEntrepriseLoaded(false)
            }}
          />
        </div>
      )}

      {/* Confirmation de chargement */}
      {entrepriseLoaded && searchMode === 'manual' && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Entreprise chargée depuis la base SIRENE
            </p>
            <p className="text-xs text-emerald-600">
              Les informations ont été pré-remplies automatiquement
            </p>
          </div>
        </div>
      )}

      {/* Champs manuels */}
      {(searchMode === 'manual' || entrepriseLoaded) && (
        <div className="space-y-4">
          <Input
            label="Raison sociale"
            value={data.companyName}
            onChange={(e) => updateField('companyName', e.target.value)}
            error={errors.companyName}
            placeholder="ACME SAS (optionnel)"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="SIREN"
              value={data.siren}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 9)
                updateField('siren', cleaned)
              }}
              error={errors.siren}
              placeholder="123 456 789 (optionnel)"
              maxLength={11}
            />
            <Input
              label="SIRET (siège)"
              value={data.siret}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 14)
                updateField('siret', cleaned)
              }}
              error={errors.siret}
              placeholder="123 456 789 00012 (optionnel)"
              maxLength={17}
            />
          </div>

          <Select
            value={data.legalForm}
            onValueChange={(value) => updateField('legalForm', value)}
          >
            <SelectTrigger label="Forme juridique" className={errors.legalForm ? 'border-red-500' : ''}>
              <SelectValue placeholder="Sélectionner la forme juridique" />
            </SelectTrigger>
            <SelectContent>
              {LEGAL_FORMS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
