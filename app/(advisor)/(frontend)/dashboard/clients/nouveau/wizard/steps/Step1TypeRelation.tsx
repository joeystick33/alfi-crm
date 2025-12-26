 
'use client'
import { Label } from '@/app/_common/components/ui/Label'
import { cn } from '@/app/_common/lib/utils'
import { UserPlus, User, Building2 } from 'lucide-react'
import type { StepProps } from '../types'

export function Step1TypeRelation({ data, updateData, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-medium text-gray-700">Type de relation *</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {[
            { value: 'PROSPECT', label: 'Prospect', desc: 'Contact potentiel', icon: UserPlus },
            { value: 'CLIENT', label: 'Client', desc: 'Client actif', icon: User },
          ].map(opt => (
            <button key={opt.value} type="button" onClick={() => updateData({ relationType: opt.value as any })}
              className={cn('p-4 rounded-lg border-2 text-left transition-all', 
                data.relationType === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300')}>
              <opt.icon className={cn('w-6 h-6 mb-2', data.relationType === opt.value ? 'text-blue-600' : 'text-gray-400')} />
              <p className="font-medium text-gray-900">{opt.label}</p>
              <p className="text-sm text-gray-500">{opt.desc}</p>
            </button>
          ))}
        </div>
        {errors.relationType && <p className="text-sm text-red-600 mt-1">{errors.relationType}</p>}
      </div>
      <div>
        <Label className="text-sm font-medium text-gray-700">Type de client *</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {[
            { value: 'PERSONNE_PHYSIQUE', label: 'Particulier', desc: 'Personne physique', icon: User },
            { value: 'PROFESSIONAL', label: 'Professionnel', desc: 'Entreprise / Société', icon: Building2 },
          ].map(opt => (
            <button key={opt.value} type="button" onClick={() => updateData({ clientType: opt.value as any })}
              className={cn('p-4 rounded-lg border-2 text-left transition-all',
                data.clientType === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300')}>
              <opt.icon className={cn('w-6 h-6 mb-2', data.clientType === opt.value ? 'text-blue-600' : 'text-gray-400')} />
              <p className="font-medium text-gray-900">{opt.label}</p>
              <p className="text-sm text-gray-500">{opt.desc}</p>
            </button>
          ))}
        </div>
        {errors.clientType && <p className="text-sm text-red-600 mt-1">{errors.clientType}</p>}
      </div>
    </div>
  )
}
