'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calculator, TrendingUp, PiggyBank, Target, 
  Home, GraduationCap, Receipt, Coins, 
  DollarSign, FileText, Search
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

interface CalculatorItem {
  id: string
  name: string
  description: string
  category: 'fiscalite' | 'budget' | 'objectifs'
  icon: any
  path: string
  tags: string[]
}

const calculators: CalculatorItem[] = [
  // Fiscalité
  {
    id: 'income-tax',
    name: 'Impôt sur le revenu',
    description: 'Calculez votre impôt sur le revenu selon le barème progressif',
    category: 'fiscalite',
    icon: Receipt,
    path: '/dashboard/calculators/income-tax',
    tags: ['IR', 'impôt', 'revenu', 'barème']
  },
  {
    id: 'capital-gains-tax',
    name: 'Plus-values mobilières',
    description: 'Calculez l\'imposition de vos plus-values de cession de titres',
    category: 'fiscalite',
    icon: TrendingUp,
    path: '/dashboard/calculators/capital-gains-tax',
    tags: ['PV', 'plus-values', 'titres', 'actions']
  },
  {
    id: 'wealth-tax',
    name: 'IFI (Impôt Fortune Immobilière)',
    description: 'Calculez votre IFI sur votre patrimoine immobilier',
    category: 'fiscalite',
    icon: Home,
    path: '/dashboard/calculators/wealth-tax',
    tags: ['IFI', 'ISF', 'patrimoine', 'immobilier']
  },
  {
    id: 'donation-tax',
    name: 'Droits de donation',
    description: 'Calculez les droits de donation selon le lien de parenté',
    category: 'fiscalite',
    icon: Coins,
    path: '/dashboard/calculators/donation-tax',
    tags: ['donation', 'transmission', 'abattement']
  },
  {
    id: 'inheritance-tax',
    name: 'Droits de succession',
    description: 'Calculez les droits de succession et optimisez la transmission',
    category: 'fiscalite',
    icon: FileText,
    path: '/dashboard/calculators/inheritance-tax',
    tags: ['succession', 'héritage', 'transmission']
  },
  
  // Budget
  {
    id: 'budget-analyzer',
    name: 'Analyse de budget',
    description: 'Analysez vos revenus, charges et capacité d\'épargne',
    category: 'budget',
    icon: Calculator,
    path: '/dashboard/calculators/budget-analyzer',
    tags: ['budget', 'épargne', 'charges']
  },
  {
    id: 'debt-capacity',
    name: 'Capacité d\'endettement',
    description: 'Calculez votre capacité d\'emprunt et taux d\'endettement',
    category: 'budget',
    icon: DollarSign,
    path: '/dashboard/calculators/debt-capacity',
    tags: ['crédit', 'emprunt', 'endettement']
  },
  
  // Objectifs
  {
    id: 'objective-calculator',
    name: 'Calculateur d\'objectif',
    description: 'Calculez l\'épargne nécessaire pour atteindre un objectif',
    category: 'objectifs',
    icon: Target,
    path: '/dashboard/calculators/objective-calculator',
    tags: ['objectif', 'épargne', 'projet']
  },
  {
    id: 'multi-objective',
    name: 'Planificateur multi-objectifs',
    description: 'Gérez plusieurs objectifs simultanément avec priorisation',
    category: 'objectifs',
    icon: Target,
    path: '/dashboard/calculators/multi-objective',
    tags: ['objectifs', 'planification', 'priorités']
  },
  {
    id: 'education-funding',
    name: 'Financement études',
    description: 'Planifiez le financement des études de vos enfants',
    category: 'objectifs',
    icon: GraduationCap,
    path: '/dashboard/calculators/education-funding',
    tags: ['études', 'éducation', 'enfants']
  },
  {
    id: 'home-purchase',
    name: 'Achat immobilier',
    description: 'Calculez le coût total d\'un achat immobilier avec crédit',
    category: 'objectifs',
    icon: Home,
    path: '/dashboard/calculators/home-purchase',
    tags: ['immobilier', 'achat', 'crédit', 'notaire']
  },
]

const categories = [
  {
    id: 'fiscalite',
    name: 'Fiscalité',
    description: 'Calculateurs fiscaux et optimisation',
    icon: Receipt,
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'budget',
    name: 'Budget',
    description: 'Analyse budgétaire et capacité d\'emprunt',
    icon: PiggyBank,
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'objectifs',
    name: 'Objectifs',
    description: 'Planification et atteinte d\'objectifs',
    icon: Target,
    color: 'bg-purple-100 text-purple-800'
  },
]

export default function CalculatorsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredCalculators = calculators.filter(calc => {
    const matchesSearch = 
      calc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      calc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !selectedCategory || calc.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const calculatorsByCategory = categories.map(category => ({
    ...category,
    calculators: filteredCalculators.filter(calc => calc.category === category.id)
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calculateurs</h1>
        <p className="text-sm text-gray-600 mt-1">
          Outils de calcul pour la gestion patrimoniale
        </p>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un calculateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Calculators by Category */}
      {calculatorsByCategory.map(category => {
        if (category.calculators.length === 0) return null

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
              <Badge className="ml-auto">{category.calculators.length}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.calculators.map(calculator => {
                const CalcIcon = calculator.icon

                return (
                  <Card
                    key={calculator.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => router.push(calculator.path)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                        <CalcIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {calculator.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {calculator.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {calculator.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
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
      {filteredCalculators.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Calculator className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun calculateur trouvé
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
