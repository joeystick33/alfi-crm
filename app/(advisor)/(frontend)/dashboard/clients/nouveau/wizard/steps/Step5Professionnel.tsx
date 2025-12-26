'use client'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import type { StepProps } from '../types'

const PROFESSION_CATEGORIES = [
  { value: 'SALARIE', label: 'Salarié' },
  { value: 'TNS', label: 'Travailleur non salarié' },
  { value: 'LIBERAL', label: 'Profession libérale' },
  { value: 'CHEF_ENTREPRISE', label: 'Chef d\'entreprise' },
  { value: 'FONCTIONNAIRE', label: 'Fonctionnaire' },
  { value: 'RETRAITE', label: 'Retraité' },
  { value: 'SANS_ACTIVITE', label: 'Sans activité professionnelle' },
]

const EMPLOYMENT_TYPES = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'INTERIM', label: 'Intérim' },
  { value: 'INDEPENDANT', label: 'Indépendant' },
  { value: 'GERANT', label: 'Gérant' },
]

export function Step5Professionnel({ data, updateData, errors: errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Catégorie socio-professionnelle</Label>
          <Select value={data.professionCategory || ''} onValueChange={v => updateData({ professionCategory: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>{PROFESSION_CATEGORIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type de contrat</Label>
          <Select value={data.employmentType || ''} onValueChange={v => updateData({ employmentType: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>{EMPLOYMENT_TYPES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Profession / Fonction</Label>
          <Input value={data.profession || ''} onChange={e => updateData({ profession: e.target.value })} placeholder="Ex: Directeur commercial" />
        </div>
        <div>
          <Label>Employeur</Label>
          <Input value={data.employer || ''} onChange={e => updateData({ employer: e.target.value })} placeholder="Nom de l'entreprise" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>En poste depuis</Label>
          <Input type="date" value={data.employmentSince || ''} onChange={e => updateData({ employmentSince: e.target.value })} />
        </div>
        <div>
          <Label>Revenus annuels bruts (€)</Label>
          <Input type="number" min="0" value={data.annualIncome || ''} onChange={e => updateData({ annualIncome: parseInt(e.target.value) || 0 })} placeholder="50000" />
        </div>
      </div>
    </div>
  )
}
