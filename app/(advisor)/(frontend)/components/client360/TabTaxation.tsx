'use client'

/**
 * TabTaxation - Onglet Fiscalité du Client360
 * Affiche IR, IFI, PS, optimisations fiscales
 * Thème : Light solid (pas de glassmorphism)
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { formatCurrency } from '@/app/_common/lib/utils'
import {
  Calculator,
  DollarSign,
  Percent,
  Building2,
} from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'
import {
  useTaxationData,
  useTaxationCalculations,
  useTaxOptimizations,
  TaxIRSection,
  TaxIFISection,
  TaxOptimizationsSection,
} from './TabTaxation.parts'

// ============================================================================
// Types
// ============================================================================

interface TabTaxationProps {
  clientId: string
  client: ClientDetail
}

// ============================================================================
// Composant Principal
// ============================================================================

export function TabTaxation({ clientId, client: _client }: TabTaxationProps) {
  // États
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  
  // Hooks customs
  const {
    taxation,
    error: taxationError,
    loadTaxation,
  } = useTaxationData(clientId)

  const {
    calculateTax,
  } = useTaxationCalculations(clientId)

  const {
    optimizations,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filteredOptimizations,
    loadOptimizations,
    updateOptimizationStatus,
  } = useTaxOptimizations(clientId)

  // Chargement initial
  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([
        loadTaxation(),
        loadOptimizations(),
      ])
      setLoading(false)
    }
    init()
  }, [clientId])

  // Handler calcul
  const handleCalculate = async () => {
    setCalculating(true)
    await calculateTax()
    await loadTaxation()
    await loadOptimizations()
    setCalculating(false)
  }

  // Rendu chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la fiscalité...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-blue-600" />
            Fiscalité {taxation?.anneeFiscale || new Date().getFullYear()}
          </h2>
          <p className="text-gray-600 mt-1">
            Impôt sur le revenu, IFI, prélèvements sociaux et optimisations
          </p>
        </div>

        <Button
          onClick={handleCalculate}
          disabled={calculating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {calculating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Calcul...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4 mr-2" />
              Calculer
            </>
          )}
        </Button>
      </div>

      {/* KPI Cards */}
      {taxation && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* IR */}
          {taxation.incomeTax && (
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium">Impôt sur le revenu</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(taxation.incomeTax.annualAmount)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="text-xs bg-blue-100 text-blue-800">
                    TMI {taxation.incomeTax.taxBracket}%
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {taxation.incomeTax.taxShares} parts
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* IFI */}
          {taxation.ifi && taxation.ifi.ifiAmount > 0 && (
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Building2 className="w-5 h-5" />
                  <span className="text-sm font-medium">IFI</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(taxation.ifi.ifiAmount)}
                </div>
                <div className="text-xs text-gray-500 mt-2">{taxation.ifi.bracket}</div>
              </CardContent>
            </Card>
          )}

          {/* PS */}
          {taxation.socialContributions && (
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <Percent className="w-5 h-5" />
                  <span className="text-sm font-medium">Prélèvements sociaux</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(taxation.socialContributions.amount)}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {(taxation.socialContributions.rate * 100).toFixed(1)}% sur revenus patrimoine
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="ir" className="w-full">
        <TabsList className="bg-gray-100 border border-gray-200">
          <TabsTrigger value="ir" className="data-[state=active]:bg-white">
            Impôt sur le revenu
          </TabsTrigger>
          <TabsTrigger value="ifi" className="data-[state=active]:bg-white">
            IFI
          </TabsTrigger>
          <TabsTrigger value="optimisations" className="data-[state=active]:bg-white">
            Optimisations ({optimizations.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab IR */}
        <TabsContent value="ir" className="mt-6">
          <TaxIRSection taxation={taxation} />
        </TabsContent>

        {/* Tab IFI */}
        <TabsContent value="ifi" className="mt-6">
          <TaxIFISection taxation={taxation} />
        </TabsContent>

        {/* Tab Optimisations */}
        <TabsContent value="optimisations" className="mt-6">
          <TaxOptimizationsSection
            optimizations={filteredOptimizations}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            updateOptimizationStatus={updateOptimizationStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
