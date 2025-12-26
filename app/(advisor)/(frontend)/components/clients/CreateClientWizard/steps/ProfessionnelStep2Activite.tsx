'use client'

import { Input } from '@/app/_common/components/ui/Input'
import type { ProfessionnelStep2Activite as Step2Data } from '../types'
import { Factory, Calendar, Users, Euro, FileText } from 'lucide-react'

interface Props {
  data: Step2Data
  onChange: (data: Step2Data) => void
  errors: Record<string, string>
}

export function ProfessionnelStep2Activite({ data, onChange, errors }: Props) {
  const updateField = <K extends keyof Step2Data>(field: K, value: Step2Data[K]) => {
    onChange({ ...data, [field]: value })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Factory className="h-5 w-5" />
          Activité de l'entreprise
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Informations sur l'activité et les données économiques
        </p>
      </div>

      {/* Secteur d'activité */}
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Secteur d'activité"
          value={data.activitySector}
          onChange={(e) => updateField('activitySector', e.target.value)}
          error={errors.activitySector}
          placeholder="Conseil en informatique, BTP, Commerce... (optionnel)"
        />
        <Input
          label="Code NAF/APE"
          value={data.codeNAF || ''}
          onChange={(e) => updateField('codeNAF', e.target.value.toUpperCase())}
          placeholder="62.02A"
          helperText="Format: 00.00X"
        />
      </div>

      {/* Dates et effectifs */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative">
          <Calendar className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
          <Input
            label="Date de création"
            type="date"
            value={data.companyCreationDate}
            onChange={(e) => updateField('companyCreationDate', e.target.value)}
            error={errors.companyCreationDate}
            className="pl-10"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="relative">
          <Users className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
          <Input
            label="Nombre de salariés"
            type="number"
            value={data.numberOfEmployees?.toString() || ''}
            onChange={(e) => updateField('numberOfEmployees', parseInt(e.target.value) || 0)}
            error={errors.numberOfEmployees}
            placeholder="15 (optionnel)"
            min={0}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chiffre d'affaires */}
      <div className="relative">
        <Euro className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
        <Input
          label="Chiffre d'affaires annuel (€)"
          type="number"
          value={data.annualRevenue?.toString() || ''}
          onChange={(e) => updateField('annualRevenue', parseFloat(e.target.value) || 0)}
          error={errors.annualRevenue}
          placeholder="500000 (optionnel)"
          min={0}
          className="pl-10"
        />
      </div>

      {/* Affichage CA formaté */}
      {data.annualRevenue > 0 && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm text-indigo-800">
            <strong>CA :</strong> {formatCurrency(data.annualRevenue)}
            {data.numberOfEmployees > 0 && (
              <span className="ml-4">
                <strong>CA/salarié :</strong> {formatCurrency(data.annualRevenue / data.numberOfEmployees)}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Convention collective */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative">
          <FileText className="absolute left-3 top-9 h-4 w-4 text-gray-400" />
          <Input
            label="Convention collective"
            value={data.conventionCollective || ''}
            onChange={(e) => updateField('conventionCollective', e.target.value)}
            placeholder="SYNTEC, BTP, HCR..."
            className="pl-10"
          />
        </div>
        <Input
          label="Code IDCC"
          value={data.idcc || ''}
          onChange={(e) => updateField('idcc', e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="1486"
          helperText="Identifiant de la convention collective"
        />
      </div>

      {/* Alertes selon effectifs */}
      {data.numberOfEmployees >= 50 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            <strong>Entreprise ≥ 50 salariés :</strong> Obligations renforcées (participation, CSE, index égalité...)
          </p>
        </div>
      )}
    </div>
  )
}
