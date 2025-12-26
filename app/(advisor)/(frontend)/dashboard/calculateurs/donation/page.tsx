'use client'

import Link from 'next/link'
import { Button } from '@/app/_common/components/ui/Button'
import { DonationTaxCalculator } from '@/app/(advisor)/(frontend)/components/calculateurs'
import { ArrowLeft, Gift } from 'lucide-react'

export default function DonationPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard/calculateurs" className="hover:text-primary">
              Calculateurs
            </Link>
            <span>/</span>
            <span>Droits de Donation</span>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-7 w-7 text-primary" />
            Calculateur de Droits de Donation
          </h1>
          <p className="text-muted-foreground mt-1">
            Calcul des droits selon le lien de parenté avec abattements et rappel fiscal 15 ans
          </p>
        </div>
        <Link href="/dashboard/calculateurs">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
      </div>

      {/* Calculator Component */}
      <DonationTaxCalculator />
    </div>
  )
}
