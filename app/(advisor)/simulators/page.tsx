'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, Users, Receipt, Building2, 
  PiggyBank, Home, Briefcase, Search, 
  Calculator, ArrowRight
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

interface SimulatorItem {
  id: string
  name: string
  description: string
  category: 'retraite' | 'succession' | 'fiscalite'
  icon: any
  path: string
  tags: string[]
  complexity: 'simple' | 'intermediate' | 'advanced'
}

const simulators: SimulatorItem[] = [
  // Retraite
  {
    id: 'retirement-simulator',
    name: 'Simulateur de retraite',
    description: 'Estimez vos revenus à la retraite et optimisez votre épargne',
    category: 'retraite',
    icon: PiggyBank,
    path: '/dashboard/simulators/retirement',
    tags: ['retraite', 'pension', 'épargne'],
    complexity: 'intermediate'
  },
  {
    id: 'pension-estimator',
    name: 'Estimateur de pension',
    description: 'Calculez vos droits à la retraite selon vos trimestres',
    category: 'retraite',
    icon: Calculator,
    path: '/dashboard/simulators/pension',
    tags: ['pension', 'trimestres', 'régimes'],
    complexity: 'simple'
  },
  {
    id: 'retirement-comparison',
    name: 'Comparateur retraite',
    description: 'Comparez différentes stratégies d\'épargne retraite',
    category: 'retraite',
    icon: TrendingUp,
    path: '/dashboard/simulators/retirement-comparison',
    tags: ['PER', 'PERP', 'Madelin', 'comparaison'],
    complexity: 'advanced'
  },
  
  // Succession
  {
    id: 'succession-simulator',
    name: 'Simulateur de succession',
    description: 'Simulez la transmission de votre patrimoine',
    category: 'succession',
    icon: Users,
    path: '/dashboard/simulators/succession',
    tags: ['succession', 'héritage', 'transmission'],
    complexity: 'intermediate'
  },
  {
    id: 'succession-comparison',
    name: 'Comparateur succession',
    description: 'Comparez différents scénarios de transmission',
    category: 'succession',
    icon: Building2,
    path: '/dashboard/simulators/succession-comparison',
    tags: ['donation', 'testament', 'démembrement'],
    complexity: 'advanced'
  },
  {
    id: 'donation-optimizer',
    name: 'Optimiseur de donation',
    description: 'Optimisez vos donations avec les abattements fiscaux',
    category: 'succession',
    icon: Briefcase,
    path: '/dashboard/simulators/donation-optimizer',
    tags: ['donation', 'abattement', 'optimisation'],
    complexity: 'intermediate'
  },
  
  // Fiscalité
  {
    id: 'tax-projector',
    name: 'Projecteur fiscal',
    description: 'Projetez votre situation fiscale sur plusieurs années',
    category: 'fiscalite',
    icon: Receipt,
    path: '/dashboard/simulators/tax-projector',
    tags: ['IR', 'IFI', 'projection'],
    complexity: 'advanced'
  },
  {
    id: 'tax-strategy-comparison',
    name: 'Comparateur stratégies fiscales',
    description: 'Comparez différentes stratégies d\'optimisation fiscale',
    category: 'fiscalite',
    icon: TrendingUp,
    path: '/dashboard/simulators/tax-strategy-comparison',
    tags: ['défiscalisation', 'Pinel', 'Malraux'],
    complexity: 'advanced'
  },
  {
    id: 'investment-vehicle-comparison',
    name: 'Comparateur enveloppes',
    description: 'Comparez les enveloppes d\'investissement (AV, PEA, CTO)',
    category: 'fiscalite',
    icon: Home,
    path: '/dashboard/simulators/investment-vehicle-comparison',
    tags: ['AV', 'PEA', 'CTO', 'fiscalité'],
    complexity: 'intermediate'
  },
]

const categories = [
  {
    id: 'retraite',
    name: 'Retraite',
    description: 'Simulateurs de préparation à la retraite',
    icon: PiggyBank,
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'succession',
    name: 'Succession',
    description: 'Simulateurs de transmission patrimoniale',
    icon: Users,
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'fiscalite',
    name: 'Fiscalité',
    description: 'Simulateurs d\'optimisation fiscale',
    icon: Receipt,
    color: 'bg-green-100 text-green-800'
  },
]

const complexityLabels = {
  simple: { label: 'Simple', color: 'bg-green-100 text-green-800' },
  intermediate: { label: 'Intermédiaire', color: 'bg-yellow-100 text-yellow-800' },
  advanced: { label: 'Avancé', color: 'bg-red-100 text-red-800' },
}

export default function SimulatorsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredSimulators = simulators.filter(sim => {
    const matchesSearch = 
      sim.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sim.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sim.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !selectedCategory || sim.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const simulatorsByCategory = categories.map(category => ({
    ...category,
    simulators: filteredSimulators.filter(sim => sim.category === category.id)
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Simulateurs</h1>
        <p className="text-sm text-gray-600 mt-1">
          Outils de simulation avancés pour la planification patrimoniale
        </p>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un simulateur..."
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Categories Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Simulators by Category */}
      {simulatorsByCategory.map(category => {
        if (category.simulators.length === 0) return null

        const CategoryIcon = category.icon

        return (
          <div key={category.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${category.color}`}>
                <CategoryIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
              <Badge className="ml-auto">{category.simulators.length}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.simulators.map(simulator => {
                const SimIcon = simulator.icon
                const complexityConfig = complexityLabels[simulator.complexity]

                return (
                  <Card
                    key={simulator.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => router.push(simulator.path)}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                          <SimIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <Badge className={complexityConfig.color}>
                          {complexityConfig.label}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {simulator.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {simulator.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {simulator.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-blue-600 font-medium group-hover:gap-2 transition-all">
                        <span>Lancer la simulation</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Empty State */}
      {filteredSimulators.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun simulateur trouvé
            </h3>
            <p className="text-gray-600">
              Essayez de modifier votre recherche ou vos filtres
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
