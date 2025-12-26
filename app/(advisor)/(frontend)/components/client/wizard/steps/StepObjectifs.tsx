 
'use client'

/**
 * Step Objectifs Patrimoniaux
 * Définition des objectifs et priorités du client
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Label } from '@/app/_common/components/ui/Label'
import { Button } from '@/app/_common/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import Textarea from '@/app/_common/components/ui/Textarea'
import { Alert, AlertDescription } from '@/app/_common/components/ui/Alert'
import { 
  Target, Shield, Home, Briefcase, Heart, 
  TrendingUp, Wallet, Clock, Plus, Trash2, Info, ChevronUp, ChevronDown
} from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'
import type { WizardClientDataSimplified } from '@/app/_common/types/client-professionnel.types'

interface StepObjectifsProps {
  data: Partial<WizardClientDataSimplified>
  updateField: <K extends keyof WizardClientDataSimplified>(field: K, value: WizardClientDataSimplified[K]) => void
  updateNestedField: (parent: string, field: string, value: any) => void
  errors: Record<string, string>
}

// Catégories d'objectifs
const CATEGORIES_OBJECTIFS = [
  {
    id: 'PROTECTION',
    label: 'Protection',
    icon: Shield,
    color: 'rose',
    objectifs: [
      { value: 'PREVOYANCE_DECES', label: 'Protéger mes proches en cas de décès' },
      { value: 'PREVOYANCE_INVALIDITE', label: 'Me protéger en cas d\'invalidité' },
      { value: 'PREVOYANCE_ARRET_TRAVAIL', label: 'Maintenir mes revenus en cas d\'arrêt de travail' },
      { value: 'ASSURANCE_DEPENDANCE', label: 'Anticiper la dépendance' },
      { value: 'PROTECTION_CONJOINT', label: 'Protéger mon conjoint' },
    ]
  },
  {
    id: 'IMMOBILIER',
    label: 'Projets immobiliers',
    icon: Home,
    color: 'blue',
    objectifs: [
      { value: 'ACHAT_RP', label: 'Acheter ma résidence principale' },
      { value: 'ACHAT_RS', label: 'Acquérir une résidence secondaire' },
      { value: 'INVESTISSEMENT_LOCATIF', label: 'Réaliser un investissement locatif' },
      { value: 'TRAVAUX', label: 'Financer des travaux' },
      { value: 'RENEGOCIATION_CREDIT', label: 'Renégocier mes crédits immobiliers' },
    ]
  },
  {
    id: 'EPARGNE',
    label: 'Épargne et placements',
    icon: Wallet,
    color: 'green',
    objectifs: [
      { value: 'CONSTITUTION_EPARGNE', label: 'Constituer une épargne de précaution' },
      { value: 'EPARGNE_PROJET', label: 'Épargner pour un projet' },
      { value: 'VALORISATION_CAPITAL', label: 'Faire fructifier mon capital' },
      { value: 'REVENUS_COMPLEMENTAIRES', label: 'Générer des revenus complémentaires' },
      { value: 'DIVERSIFICATION', label: 'Diversifier mes placements' },
    ]
  },
  {
    id: 'RETRAITE',
    label: 'Retraite',
    icon: Clock,
    color: 'amber',
    objectifs: [
      { value: 'PREPARATION_RETRAITE', label: 'Préparer ma retraite' },
      { value: 'ESTIMATION_PENSION', label: 'Estimer ma future pension' },
      { value: 'COMPLEMENT_RETRAITE', label: 'Constituer un complément de retraite' },
      { value: 'SORTIE_CAPITAL', label: 'Préparer une sortie en capital' },
      { value: 'RENTE_VIAGERE', label: 'Constituer une rente viagère' },
    ]
  },
  {
    id: 'FAMILLE',
    label: 'Famille',
    icon: Heart,
    color: 'purple',
    objectifs: [
      { value: 'ETUDES_ENFANTS', label: 'Financer les études des enfants' },
      { value: 'AIDE_ENFANTS', label: 'Aider mes enfants à s\'installer' },
      { value: 'DONATION', label: 'Transmettre de mon vivant' },
      { value: 'MARIAGE_PACS', label: 'Optimiser mon régime matrimonial' },
      { value: 'PROTECTION_FAMILLE', label: 'Protéger ma famille' },
    ]
  },
  {
    id: 'TRANSMISSION',
    label: 'Transmission',
    icon: TrendingUp,
    color: 'indigo',
    objectifs: [
      { value: 'OPTIMISATION_SUCCESSION', label: 'Optimiser ma succession' },
      { value: 'REDUCTION_DROITS', label: 'Réduire les droits de succession' },
      { value: 'ANTICIPATION_HERITAGE', label: 'Anticiper un héritage' },
      { value: 'CLAUSE_BENEFICIAIRE', label: 'Rédiger mes clauses bénéficiaires' },
      { value: 'TESTAMENT', label: 'Rédiger mon testament' },
    ]
  },
  {
    id: 'FISCAL',
    label: 'Optimisation fiscale',
    icon: Briefcase,
    color: 'teal',
    objectifs: [
      { value: 'REDUCTION_IR', label: 'Réduire mon impôt sur le revenu' },
      { value: 'OPTIMISATION_IFI', label: 'Optimiser mon IFI' },
      { value: 'DEFISCALISATION', label: 'Investir en défiscalisation' },
      { value: 'OPTIMISATION_REVENUS', label: 'Optimiser la fiscalité de mes revenus' },
      { value: 'PLUS_VALUES', label: 'Optimiser mes plus-values' },
    ]
  },
]

// Horizons temporels
const HORIZONS = [
  { value: 'COURT', label: 'Court terme (< 2 ans)' },
  { value: 'MOYEN', label: 'Moyen terme (2-5 ans)' },
  { value: 'LONG', label: 'Long terme (5-10 ans)' },
  { value: 'TRES_LONG', label: 'Très long terme (> 10 ans)' },
]

export function StepObjectifs({ data, updateField: _updateField, updateNestedField, errors: errors }: StepObjectifsProps) {
  const objectifs = (data as any).objectifs || { selected: [], priorites: [], horizon: 'MOYEN' }
  const [selectedObjectifs, setSelectedObjectifs] = useState<string[]>(objectifs.selected || [])
  const [priorites, setPriorites] = useState<string[]>(objectifs.priorites || [])

  // Toggle objectif
  const toggleObjectif = (value: string) => {
    const newSelected = selectedObjectifs.includes(value)
      ? selectedObjectifs.filter(o => o !== value)
      : [...selectedObjectifs, value]
    setSelectedObjectifs(newSelected)
    updateNestedField('objectifs', 'selected', newSelected)
    
    // Retirer des priorités si décoché
    if (!newSelected.includes(value)) {
      const newPriorites = priorites.filter(p => p !== value)
      setPriorites(newPriorites)
      updateNestedField('objectifs', 'priorites', newPriorites)
    }
  }

  // Ajouter aux priorités
  const addToPriorites = (value: string) => {
    if (!priorites.includes(value) && priorites.length < 5) {
      const newPriorites = [...priorites, value]
      setPriorites(newPriorites)
      updateNestedField('objectifs', 'priorites', newPriorites)
    }
  }

  // Retirer des priorités
  const removeFromPriorites = (value: string) => {
    const newPriorites = priorites.filter(p => p !== value)
    setPriorites(newPriorites)
    updateNestedField('objectifs', 'priorites', newPriorites)
  }

  // Monter/descendre priorité
  const movePriorite = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === priorites.length - 1)) return
    const newPriorites = [...priorites]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newPriorites[index], newPriorites[newIndex]] = [newPriorites[newIndex], newPriorites[index]]
    setPriorites(newPriorites)
    updateNestedField('objectifs', 'priorites', newPriorites)
  }

  // Trouver le label d'un objectif
  const getObjectifLabel = (value: string) => {
    for (const cat of CATEGORIES_OBJECTIFS) {
      const obj = cat.objectifs.find(o => o.value === value)
      if (obj) return obj.label
    }
    return value
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          Sélectionnez vos objectifs patrimoniaux puis classez-les par priorité (maximum 5).
          Cette information est essentielle pour vous proposer des solutions adaptées.
        </AlertDescription>
      </Alert>

      {/* Sélection des objectifs par catégorie */}
      <div className="grid gap-4 lg:grid-cols-2">
        {CATEGORIES_OBJECTIFS.map((category) => {
          const Icon = category.icon
          const hasSelected = category.objectifs.some(o => selectedObjectifs.includes(o.value))
          
          return (
            <Card key={category.id} className={cn(hasSelected && `border-${category.color}-300`)}>
              <CardHeader className="pb-2">
                <CardTitle className={cn('text-sm flex items-center gap-2', `text-${category.color}-700`)}>
                  <Icon className="h-4 w-4" />
                  {category.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {category.objectifs.map((obj) => {
                  const isSelected = selectedObjectifs.includes(obj.value)
                  const isPriority = priorites.includes(obj.value)
                  
                  return (
                    <div 
                      key={obj.value} 
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg border transition-colors',
                        isSelected ? `bg-${category.color}-50 border-${category.color}-200` : 'bg-gray-50 border-gray-200'
                      )}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleObjectif(obj.value)}
                        />
                        <span className="text-sm">{obj.label}</span>
                      </label>
                      {isSelected && !isPriority && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addToPriorites(obj.value)}
                          className="h-7 text-xs"
                          disabled={priorites.length >= 5}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Priorité
                        </Button>
                      )}
                      {isPriority && (
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded', `bg-${category.color}-100 text-${category.color}-700`)}>
                          #{priorites.indexOf(obj.value) + 1}
                        </span>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Priorités */}
      {priorites.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Target className="h-5 w-5" />
              Vos priorités ({priorites.length}/5)
            </CardTitle>
            <CardDescription>
              Classez vos objectifs par ordre d'importance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {priorites.map((value, index) => (
                <div 
                  key={value}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-medium">{getObjectifLabel(value)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => movePriorite(index, 'up')}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => movePriorite(index, 'down')}
                      disabled={index === priorites.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromPriorites(value)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Horizon et commentaires */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Horizon et précisions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Horizon d'investissement global</Label>
            <Select
              value={objectifs.horizon || 'MOYEN'}
              onValueChange={(value) => updateNestedField('objectifs', 'horizon', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HORIZONS.map((h) => (
                  <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commentaires">Commentaires et précisions</Label>
            <Textarea
              id="commentaires"
              value={objectifs.commentaires || ''}
              onChange={(e) => updateNestedField('objectifs', 'commentaires', e.target.value)}
              placeholder="Précisez vos projets, contraintes particulières, échéances..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StepObjectifs
