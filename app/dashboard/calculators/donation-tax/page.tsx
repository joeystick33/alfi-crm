'use client'

import { Suspense } from 'react'
import { DonationTaxCalculator } from '@/lib/lazy-components'
import { Skeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'

function CalculatorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Card className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </Card>
    </div>
  )
}

export default function DonationTaxPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<CalculatorSkeleton />}>
        <DonationTaxCalculator />
      </Suspense>
    </div>
  )
}
