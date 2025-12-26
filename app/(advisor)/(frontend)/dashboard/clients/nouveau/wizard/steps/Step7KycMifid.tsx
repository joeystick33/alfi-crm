'use client'
import { Label } from '@/app/_common/components/ui/Label'
import { Input } from '@/app/_common/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { cn } from '@/app/_common/lib/utils'
import type { StepProps } from '../types'

const RISK_PROFILES = [
  { value: 'PRUDENT', label: 'Prudent', desc: 'Sécurité du capital prioritaire', color: 'border-green-500 bg-green-50' },
  { value: 'EQUILIBRE', label: 'Équilibré', desc: 'Équilibre rendement/risque', color: 'border-blue-500 bg-blue-50' },
  { value: 'DYNAMIQUE', label: 'Dynamique', desc: 'Rendement privilégié', color: 'border-orange-500 bg-orange-50' },
  { value: 'OFFENSIF', label: 'Offensif', desc: 'Maximisation du rendement', color: 'border-red-500 bg-red-50' },
]

const HORIZONS = [
  { value: 'COURT_TERME', label: 'Court terme (< 2 ans)' },
  { value: 'MOYEN_TERME', label: 'Moyen terme (2-5 ans)' },
  { value: 'LONG_TERME', label: 'Long terme (> 5 ans)' },
]

const OBJECTIVES = [
  { value: 'CAPITAL_GROWTH', label: 'Croissance du capital' },
  { value: 'REVENUS_COMPLEMENTAIRES', label: 'Génération de revenus' },
  { value: 'CAPITAL_PRESERVATION', label: 'Préservation du capital' },
  { value: 'OPTIMISATION_FISCALE', label: 'Optimisation fiscale' },
  { value: 'RETRAITE', label: 'Préparation retraite' },
]

export function Step7KycMifid({ data, updateData, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-gray-700">Profil de risque *</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          {RISK_PROFILES.map(p => (
            <button key={p.value} type="button" onClick={() => updateData({ riskProfile: p.value })}
              className={cn('p-3 rounded-lg border-2 text-left transition-all', data.riskProfile === p.value ? p.color : 'border-gray-200 hover:border-gray-300')}>
              <p className="font-medium text-gray-900">{p.label}</p>
              <p className="text-xs text-gray-500">{p.desc}</p>
            </button>
          ))}
        </div>
        {errors.riskProfile && <p className="text-sm text-red-600 mt-1">{errors.riskProfile}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Horizon d'investissement</Label>
          <Select value={data.investmentHorizon || ''} onValueChange={v => updateData({ investmentHorizon: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>{HORIZONS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Objectif principal</Label>
          <Select value={data.investmentObjective || ''} onValueChange={v => updateData({ investmentObjective: v })}>
            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
            <SelectContent>{OBJECTIVES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Connaissance des marchés financiers (0-100)</Label>
        <Input type="number" min="0" max="100" value={data.investmentKnowledge || ''} onChange={e => updateData({ investmentKnowledge: parseInt(e.target.value) || 0 })} />
        <p className="text-xs text-gray-500 mt-1">0 = Aucune connaissance, 100 = Expert</p>
      </div>
      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-900 mb-3">LCB-FT (Anti-blanchiment)</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={data.isPEP} onChange={e => updateData({ isPEP: e.target.checked })} className="w-4 h-4 rounded border-gray-300" />
            <span className="text-gray-700">Personne Politiquement Exposée (PEP)</span>
          </label>
          <div>
            <Label>Origine des fonds</Label>
            <Input value={data.originOfFunds || ''} onChange={e => updateData({ originOfFunds: e.target.value })} placeholder="Ex: Revenus d'activité, épargne..." />
          </div>
        </div>
      </div>
    </div>
  )
}
