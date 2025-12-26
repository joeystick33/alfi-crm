'use client'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { formatCurrency } from '@/app/_common/lib/utils'
import type { StepProps } from '../types'

export function Step6Patrimoine({ data, updateData, errors: errors }: StepProps) {
  const netWealth = (data.financialAssets || 0) + (data.realEstateAssets || 0) + (data.otherAssets || 0) - (data.totalLiabilities || 0)

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">Estimation du patrimoine pour personnaliser les conseils. Ces informations seront affinées ultérieurement.</p>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Actifs</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Actifs financiers (€)</Label>
            <Input type="number" min="0" value={data.financialAssets || ''} onChange={e => updateData({ financialAssets: parseInt(e.target.value) || 0 })} placeholder="Assurance-vie, PEA, comptes..." />
          </div>
          <div>
            <Label>Actifs immobiliers (€)</Label>
            <Input type="number" min="0" value={data.realEstateAssets || ''} onChange={e => updateData({ realEstateAssets: parseInt(e.target.value) || 0 })} placeholder="Résidence, investissement..." />
          </div>
          <div>
            <Label>Autres actifs (€)</Label>
            <Input type="number" min="0" value={data.otherAssets || ''} onChange={e => updateData({ otherAssets: parseInt(e.target.value) || 0 })} placeholder="Véhicules, art, SCPI..." />
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Passifs</h4>
        <div>
          <Label>Total des dettes (€)</Label>
          <Input type="number" min="0" value={data.totalLiabilities || ''} onChange={e => updateData({ totalLiabilities: parseInt(e.target.value) || 0 })} placeholder="Crédits immobiliers, conso..." />
        </div>
      </div>
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Patrimoine net estimé</span>
          <span className={`text-xl font-bold ${netWealth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netWealth)}</span>
        </div>
      </div>
    </div>
  )
}
