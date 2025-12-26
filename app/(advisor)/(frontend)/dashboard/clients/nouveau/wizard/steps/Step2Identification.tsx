'use client'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import type { StepProps } from '../types'

const CIVILITIES = [
  { value: 'M', label: 'Monsieur' },
  { value: 'MME', label: 'Madame' },
  { value: 'MLLE', label: 'Mademoiselle' },
]

const COUNTRIES = [
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgique' },
  { value: 'CH', label: 'Suisse' },
  { value: 'LU', label: 'Luxembourg' },
  { value: 'MC', label: 'Monaco' },
]

export function Step2Identification({ data, updateData, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Civilité *</Label>
          <Select value={data.civility} onValueChange={v => updateData({ civility: v })}>
            <SelectTrigger className={errors.civility ? 'border-red-500' : ''}><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>{CIVILITIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
          {errors.civility && <p className="text-sm text-red-600">{errors.civility}</p>}
        </div>
        <div>
          <Label>Prénom *</Label>
          <Input value={data.firstName} onChange={e => updateData({ firstName: e.target.value })} className={errors.firstName ? 'border-red-500' : ''} />
          {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
        </div>
        <div>
          <Label>Nom *</Label>
          <Input value={data.lastName} onChange={e => updateData({ lastName: e.target.value })} className={errors.lastName ? 'border-red-500' : ''} />
          {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nom de naissance</Label>
          <Input value={data.maidenName || ''} onChange={e => updateData({ maidenName: e.target.value })} />
        </div>
        <div>
          <Label>Date de naissance *</Label>
          <Input type="date" value={data.birthDate} onChange={e => updateData({ birthDate: e.target.value })} className={errors.birthDate ? 'border-red-500' : ''} />
          {errors.birthDate && <p className="text-sm text-red-600">{errors.birthDate}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Lieu de naissance</Label>
          <Input value={data.birthPlace || ''} onChange={e => updateData({ birthPlace: e.target.value })} />
        </div>
        <div>
          <Label>Nationalité</Label>
          <Select value={data.nationality} onValueChange={v => updateData({ nationality: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Résidence fiscale</Label>
          <Select value={data.taxResidence} onValueChange={v => updateData({ taxResidence: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
