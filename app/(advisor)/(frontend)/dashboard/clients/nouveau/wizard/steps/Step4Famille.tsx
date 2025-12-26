'use client'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import type { StepProps } from '../types'

const MARITAL_STATUS = [
  { value: 'SINGLE', label: 'Célibataire' },
  { value: 'MARRIED', label: 'Marié(e)' },
  { value: 'PACS', label: 'Pacsé(e)' },
  { value: 'DIVORCED', label: 'Divorcé(e)' },
  { value: 'WIDOWED', label: 'Veuf/Veuve' },
  { value: 'COHABITING', label: 'Concubinage' },
]

const MATRIMONIAL_REGIMES = [
  { value: 'COMMUNAUTE_LEGALE', label: 'Communauté légale réduite aux acquêts' },
  { value: 'SEPARATION_BIENS', label: 'Séparation de biens' },
  { value: 'COMMUNAUTE_UNIVERSELLE', label: 'Communauté universelle' },
  { value: 'PARTICIPATION_ACQUETS', label: 'Participation aux acquêts' },
]

export function Step4Famille({ data, updateData, errors: errors }: StepProps) {
  const showRegime = ['MARRIED', 'PACS'].includes(data.maritalStatus)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Situation matrimoniale</Label>
          <Select value={data.maritalStatus} onValueChange={v => updateData({ maritalStatus: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>{MARITAL_STATUS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {showRegime && (
          <div>
            <Label>Régime matrimonial</Label>
            <Select value={data.matrimonialRegime || ''} onValueChange={v => updateData({ matrimonialRegime: v })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
              <SelectContent>{MATRIMONIAL_REGIMES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nombre d'enfants</Label>
          <Input type="number" min="0" value={data.numberOfChildren} onChange={e => updateData({ numberOfChildren: parseInt(e.target.value) || 0 })} />
        </div>
        <div>
          <Label>Personnes à charge</Label>
          <Input type="number" min="0" value={data.dependents} onChange={e => updateData({ dependents: parseInt(e.target.value) || 0 })} />
          <p className="text-xs text-gray-500 mt-1">Enfants + autres personnes à charge fiscalement</p>
        </div>
      </div>
    </div>
  )
}
