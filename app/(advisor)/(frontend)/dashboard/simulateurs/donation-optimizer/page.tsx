'use client'

import { DonationOptimizer } from '@/app/(advisor)/(frontend)/components/simulateurs'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'

export default function DonationOptimizerPage() {
  return (
    <div className="p-6">
      <SimulatorGate simulator="DONATION" showTeaser>
        <DonationOptimizer />
      </SimulatorGate>
    </div>
  )
}
