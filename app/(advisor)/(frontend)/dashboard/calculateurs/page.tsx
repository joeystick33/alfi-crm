'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/_common/components/ui/Tabs'
import { BackendStatus } from '@/app/(advisor)/(frontend)/components/calculateurs'
import { 
  Calculator, 
  Receipt, 
  TrendingUp, 
  Building2, 
  Gift, 
  Users, 
  Wallet,
  CreditCard,
  Server,
  ChevronRight
} from 'lucide-react'

interface CalculatorCard {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  category: 'fiscal' | 'budget'
  tags: string[]
  complexity: 'simple' | 'medium' | 'advanced'
}

const CALCULATORS: CalculatorCard[] = [
  // Calculateurs fiscaux
  {
    id: 'impot-revenu',
    title: 'Impôt sur le Revenu',
    description: 'Calculez l\'impôt sur le revenu selon les barèmes 2024 avec quotient familial et prélèvements sociaux.',
    icon: Receipt,
    href: '/dashboard/calculateurs/impot-revenu',
    category: 'fiscal',
    tags: ['IR', 'Barème progressif', 'Quotient familial'],
    complexity: 'simple',
  },
  {
    id: 'plus-values',
    title: 'Plus-Values',
    description: 'Calculez l\'imposition sur les plus-values mobilières et immobilières avec abattements pour durée de détention.',
    icon: TrendingUp,
    href: '/dashboard/calculateurs/plus-values',
    category: 'fiscal',
    tags: ['PV mobilières', 'PV immobilières', 'Abattements'],
    complexity: 'medium',
  },
  {
    id: 'ifi',
    title: 'IFI (Impôt Fortune Immobilière)',
    description: 'Calculez l\'IFI selon le barème en vigueur avec seuil d\'imposition et tranches.',
    icon: Building2,
    href: '/dashboard/calculateurs/ifi',
    category: 'fiscal',
    tags: ['IFI', 'Patrimoine immobilier', 'Seuil 1,3M€'],
    complexity: 'simple',
  },
  {
    id: 'donation',
    title: 'Droits de Donation',
    description: 'Calculez les droits de donation selon le lien de parenté avec abattements et rappel fiscal.',
    icon: Gift,
    href: '/dashboard/calculateurs/donation',
    category: 'fiscal',
    tags: ['Donation', 'Abattements', 'Rappel 15 ans'],
    complexity: 'medium',
  },
  {
    id: 'succession',
    title: 'Droits de Succession',
    description: 'Calculez les droits de succession selon le lien de parenté et le montant transmis.',
    icon: Users,
    href: '/dashboard/calculateurs/succession',
    category: 'fiscal',
    tags: ['Succession', 'Héritage', 'Abattements'],
    complexity: 'medium',
  },
  // Calculateurs budget
  {
    id: 'budget',
    title: 'Analyseur de Budget',
    description: 'Analysez votre budget mensuel avec répartition des revenus, dépenses et recommandations d\'épargne.',
    icon: Wallet,
    href: '/dashboard/calculateurs/budget',
    category: 'budget',
    tags: ['Budget', 'Épargne', 'Charges'],
    complexity: 'simple',
  },
  {
    id: 'capacite-emprunt',
    title: 'Capacité d\'Emprunt',
    description: 'Calculez votre capacité d\'emprunt maximale selon vos revenus, charges et le taux d\'endettement.',
    icon: CreditCard,
    href: '/dashboard/calculateurs/capacite-emprunt',
    category: 'budget',
    tags: ['Crédit', 'Endettement 35%', 'Mensualités'],
    complexity: 'simple',
  },
]

const getComplexityBadge = (complexity: string) => {
  switch (complexity) {
    case 'simple':
      return <Badge variant="success">Simple</Badge>
    case 'medium':
      return <Badge variant="warning">Intermédiaire</Badge>
    case 'advanced':
      return <Badge variant="destructive">Avancé</Badge>
    default:
      return null
  }
}

export default function CalculateursPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'fiscal' | 'budget'>('all')

  const filteredCalculators = activeTab === 'all' 
    ? CALCULATORS 
    : CALCULATORS.filter(c => c.category === activeTab)

  const fiscalCount = CALCULATORS.filter(c => c.category === 'fiscal').length
  const budgetCount = CALCULATORS.filter(c => c.category === 'budget').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            Calculateurs Patrimoniaux
          </h1>
          <p className="text-muted-foreground mt-1">
            Outils de calcul fiscal et budgétaire pour vos clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {CALCULATORS.length} calculateurs
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Calculateurs Fiscaux</p>
                <p className="text-3xl font-bold text-blue-700">{fiscalCount}</p>
              </div>
              <div className="p-3 bg-blue-200/50 rounded-full">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Calculateurs Budget</p>
                <p className="text-3xl font-bold text-green-700">{budgetCount}</p>
              </div>
              <div className="p-3 bg-green-200/50 rounded-full">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Disponible</p>
                <p className="text-3xl font-bold text-purple-700">{CALCULATORS.length}</p>
              </div>
              <div className="p-3 bg-purple-200/50 rounded-full">
                <Calculator className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Calculator Grid */}
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'all' | 'fiscal' | 'budget')} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">Tous ({CALCULATORS.length})</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscaux ({fiscalCount})</TabsTrigger>
          <TabsTrigger value="budget">Budget ({budgetCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCalculators.map((calc) => {
              const IconComponent = calc.icon
              return (
                <Link key={calc.id} href={calc.href}>
                  <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 rounded-lg ${
                          calc.category === 'fiscal' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          <IconComponent className={`h-5 w-5 ${
                            calc.category === 'fiscal' ? 'text-blue-600' : 'text-green-600'
                          }`} />
                        </div>
                        {getComplexityBadge(calc.complexity)}
                      </div>
                      <CardTitle className="text-lg mt-2 group-hover:text-primary transition-colors">
                        {calc.title}
                      </CardTitle>
                      <CardDescription className="text-sm line-clamp-2">
                        {calc.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {calc.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center text-sm text-primary font-medium group-hover:gap-2 transition-all">
                        Ouvrir le calculateur
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Backend Status */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Statut des Services</h2>
        </div>
        <BackendStatus />
      </div>
    </div>
  )
}
