'use client'

import { RetirementSimulator } from '@/app/(advisor)/(frontend)/components/simulateurs';
import { SimulatorGate } from '@/app/_common/components/FeatureGate';

export default function RetirementSimulatorPage() {
  return (
    <div className="p-6">
      <SimulatorGate simulator="RETIREMENT" showTeaser>
        <RetirementSimulator />
      </SimulatorGate>
    </div>
  );
}
