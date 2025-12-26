 
'use client'

import { Input } from '@/app/_common/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_common/components/ui/Select'
import type { ParticulierStep5Financial as Step5Data } from '../types'
import { TAX_BRACKETS, COUNTRIES } from '../types'
import { Euro, Percent, AlertTriangle } from 'lucide-react'

interface Props {
  data: Step5Data
  onChange: (data: Step5Data) => void
  errors: Record<string, string>
  hasConjoint?: boolean
}

export function ParticulierStep5Financial({ data, onChange, errors, hasConjoint }: Props) {
  const updateField = <K extends keyof Step5Data>(field: K, value: Step5Data[K]) => {
    onChange({ ...data, [field]: value })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Situation financière</h3>
        <p className="mt-1 text-sm text-gray-500">
          Revenus et situation fiscale
        </p>
      </div>

      {/* Revenus */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Euro className="h-4 w-4" />
          Revenus annuels nets
        </h4>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Vos revenus annuels nets"
            type="number"
            value={data.annualIncome?.toString() || ''}
            onChange={(e) => updateField('annualIncome', parseFloat(e.target.value) || 0)}
            error={errors.annualIncome}
            placeholder="45000 (optionnel)"
            min={0}
          />

          {hasConjoint && (
            <Input
              label="Revenus du conjoint"
              type="number"
              value={data.annualIncomeConjoint?.toString() || ''}
              onChange={(e) => updateField('annualIncomeConjoint', parseFloat(e.target.value) || 0)}
              placeholder="40000"
              min={0}
            />
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Autres revenus (optionnel)"
            type="number"
            value={data.otherIncome?.toString() || ''}
            onChange={(e) => updateField('otherIncome', parseFloat(e.target.value) || 0)}
            placeholder="Revenus locatifs, dividendes..."
            min={0}
          />
          {data.otherIncome && data.otherIncome > 0 && (
            <Input
              label="Précisez la nature"
              value={data.otherIncomeDetails || ''}
              onChange={(e) => updateField('otherIncomeDetails', e.target.value)}
              placeholder="Ex: revenus locatifs, dividendes..."
            />
          )}
        </div>

        {/* Total revenus */}
        {(data.annualIncome > 0 || (data.annualIncomeConjoint && data.annualIncomeConjoint > 0)) && (
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-sm text-indigo-800">
              <strong>Total revenus du foyer :</strong>{' '}
              {formatCurrency(
                (data.annualIncome || 0) + 
                (data.annualIncomeConjoint || 0) + 
                (data.otherIncome || 0)
              )}
            </p>
          </div>
        )}
      </div>

      {/* Fiscalité */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Percent className="h-4 w-4" />
          Situation fiscale
        </h4>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            value={data.taxBracket}
            onValueChange={(value) => updateField('taxBracket', value as any)}
          >
            <SelectTrigger label="Tranche marginale d'imposition (TMI)" className={errors.taxBracket ? 'border-red-500' : ''}>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {TAX_BRACKETS.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={data.taxResidenceCountry}
            onValueChange={(value) => updateField('taxResidenceCountry', value)}
          >
            <SelectTrigger label="Résidence fiscale" className={errors.taxResidenceCountry ? 'border-red-500' : ''}>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* IFI */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ifiSubject"
              checked={data.ifiSubject}
              onChange={(e) => updateField('ifiSubject', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="ifiSubject" className="text-sm font-medium text-gray-700">
              Assujetti à l'Impôt sur la Fortune Immobilière (IFI)
            </label>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Si votre patrimoine immobilier net dépasse 1 300 000 €
          </p>
        </div>

        {/* Alerte résidence hors France */}
        {data.taxResidenceCountry && data.taxResidenceCountry !== 'FR' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Résidence fiscale hors France</p>
              <p className="text-sm text-amber-700 mt-1">
                Des particularités fiscales peuvent s'appliquer. Nous en tiendrons compte dans nos recommandations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
