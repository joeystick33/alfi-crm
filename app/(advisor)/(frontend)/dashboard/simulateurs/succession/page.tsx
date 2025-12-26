'use client'

import { SuccessionSimulator } from '@/app/(advisor)/(frontend)/components/simulateurs'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'

export default function SuccessionSimulatorPage() {
  return (
    <div className="p-6">
      <SimulatorGate simulator="SUCCESSION" showTeaser>
        <SuccessionSimulator />
      </SimulatorGate>
    </div>
  )
}
