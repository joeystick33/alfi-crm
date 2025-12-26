"use client"

/**
 * MiFIDQuestionnaireWizard - Step-by-step MiFID II questionnaire
 * 
 * Features:
 * - Questions by section: knowledge, financial situation, objectives, risk tolerance
 * - Calculate and display investor profile
 * - Save results to client profile
 * 
 * @requirements 9.1-9.6
 */

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/_common/components/ui/Dialog'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Progress } from '@/app/_common/components/ui/Progress'
import { RadioGroup, RadioGroupItem } from '@/app/_common/components/ui/RadioGroup'
import Checkbox from '@/app/_common/components/ui/Checkbox'
import { Label } from '@/app/_common/components/ui/Label'
import { cn } from '@/app/_common/lib/utils'
import { useSaveMiFIDAnswers } from '@/app/_common/hooks/api/use-regulatory-documents-api'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Target,
  TrendingUp,
  Shield,
  Wallet,
  Brain,
  Clock,
} from 'lucide-react'
import {
  MIFID_RISK_PROFILE_LABELS,
  MIFID_INVESTMENT_HORIZON_LABELS,
  type MiFIDRiskProfile,
  type MiFIDInvestmentHorizon,
  type MiFIDAnswer,
} from '@/lib/documents/types'

// ============================================================================
// Types
// ============================================================================

interface QuestionOption {
  value: string
  label: string
  score: number
}

interface Question {
  id: string
  text: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'
  options: QuestionOption[]
  required: boolean
}

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  questions: Question[]
}

// ============================================================================
// Props
// ============================================================================

interface MiFIDQuestionnaireWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  onComplete?: (result: MiFIDResult) => void
}

interface MiFIDResult {
  riskProfile: MiFIDRiskProfile
  investmentHorizon: MiFIDInvestmentHorizon
  totalScore: number
  recommendations: string[]
}

// ============================================================================
// Questionnaire Configuration
// ============================================================================

const QUESTIONNAIRE_SECTIONS: Section[] = [
  {
    id: 'knowledge',
    title: 'Connaissances et Expérience',
    icon: <Brain className="h-5 w-5" />,
    description: 'Évaluez vos connaissances des marchés financiers',
    questions: [
      {
        id: 'knowledge_1',
        text: 'Quel est votre niveau de connaissance des marchés financiers ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'none', label: 'Aucune connaissance', score: 0 },
          { value: 'basic', label: 'Connaissances de base', score: 5 },
          { value: 'intermediate', label: 'Connaissances intermédiaires', score: 10 },
          { value: 'advanced', label: 'Connaissances avancées', score: 15 },
          { value: 'expert', label: 'Expert', score: 20 },
        ],
        required: true,
      },
      {
        id: 'knowledge_2',
        text: 'Dans quels produits financiers avez-vous déjà investi ?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { value: 'savings', label: "Livrets d'épargne", score: 2 },
          { value: 'life_insurance', label: 'Assurance-vie fonds euros', score: 3 },
          { value: 'unit_linked', label: 'Assurance-vie unités de compte', score: 5 },
          { value: 'stocks', label: 'Actions', score: 7 },
          { value: 'bonds', label: 'Obligations', score: 5 },
          { value: 'funds', label: 'OPCVM / Fonds', score: 6 },
          { value: 'derivatives', label: 'Produits dérivés', score: 10 },
          { value: 'none', label: 'Aucun', score: 0 },
        ],
        required: true,
      },
      {
        id: 'knowledge_3',
        text: "Depuis combien de temps investissez-vous ?",
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'never', label: 'Jamais investi', score: 0 },
          { value: 'less_2', label: 'Moins de 2 ans', score: 3 },
          { value: '2_5', label: '2 à 5 ans', score: 6 },
          { value: '5_10', label: '5 à 10 ans', score: 9 },
          { value: 'more_10', label: 'Plus de 10 ans', score: 12 },
        ],
        required: true,
      },
    ],
  },
  {
    id: 'financial_situation',
    title: 'Situation Financière',
    icon: <Wallet className="h-5 w-5" />,
    description: 'Évaluez votre capacité financière',
    questions: [
      {
        id: 'financial_1',
        text: 'Quelle part de votre patrimoine total représente cet investissement ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'less_10', label: 'Moins de 10%', score: 15 },
          { value: '10_25', label: '10% à 25%', score: 12 },
          { value: '25_50', label: '25% à 50%', score: 8 },
          { value: '50_75', label: '50% à 75%', score: 4 },
          { value: 'more_75', label: 'Plus de 75%', score: 0 },
        ],
        required: true,
      },
      {
        id: 'financial_2',
        text: "Disposez-vous d'une épargne de précaution (3 à 6 mois de revenus) ?",
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'yes_more', label: 'Oui, plus de 6 mois', score: 15 },
          { value: 'yes_3_6', label: 'Oui, 3 à 6 mois', score: 10 },
          { value: 'yes_less', label: 'Oui, moins de 3 mois', score: 5 },
          { value: 'no', label: 'Non', score: 0 },
        ],
        required: true,
      },
      {
        id: 'financial_3',
        text: "Quelle est votre capacité d'épargne mensuelle ?",
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'none', label: 'Aucune', score: 0 },
          { value: 'less_500', label: 'Moins de 500€', score: 3 },
          { value: '500_1000', label: '500€ à 1000€', score: 6 },
          { value: '1000_2000', label: '1000€ à 2000€', score: 9 },
          { value: 'more_2000', label: 'Plus de 2000€', score: 12 },
        ],
        required: true,
      },
    ],
  },
  {
    id: 'objectives',
    title: "Objectifs d'Investissement",
    icon: <Target className="h-5 w-5" />,
    description: 'Définissez vos objectifs',
    questions: [
      {
        id: 'objectives_1',
        text: 'Quel est votre objectif principal pour cet investissement ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'capital_preservation', label: 'Préserver mon capital', score: 0 },
          { value: 'regular_income', label: 'Générer des revenus réguliers', score: 5 },
          { value: 'balanced_growth', label: 'Croissance équilibrée', score: 10 },
          { value: 'capital_growth', label: 'Faire croître mon capital', score: 15 },
          { value: 'aggressive_growth', label: 'Maximiser la performance', score: 20 },
        ],
        required: true,
      },
      {
        id: 'objectives_2',
        text: 'Sur quelle durée envisagez-vous cet investissement ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'less_1', label: "Moins d'1 an", score: 0 },
          { value: '1_3', label: '1 à 3 ans', score: 5 },
          { value: '3_5', label: '3 à 5 ans', score: 10 },
          { value: '5_8', label: '5 à 8 ans', score: 15 },
          { value: 'more_8', label: 'Plus de 8 ans', score: 20 },
        ],
        required: true,
      },
      {
        id: 'objectives_3',
        text: 'Avez-vous besoin de pouvoir récupérer votre investissement rapidement ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'yes_anytime', label: 'Oui, à tout moment', score: 0 },
          { value: 'yes_6months', label: 'Oui, sous 6 mois', score: 5 },
          { value: 'no_planned', label: 'Non, sauf imprévu', score: 10 },
          { value: 'no_long_term', label: 'Non, investissement long terme', score: 15 },
        ],
        required: true,
      },
    ],
  },
  {
    id: 'risk_tolerance',
    title: 'Tolérance au Risque',
    icon: <Shield className="h-5 w-5" />,
    description: 'Évaluez votre tolérance au risque',
    questions: [
      {
        id: 'risk_1',
        text: 'Comment réagiriez-vous si votre investissement perdait 10% de sa valeur en un mois ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'sell_all', label: 'Je vendrais tout immédiatement', score: 0 },
          { value: 'sell_part', label: 'Je vendrais une partie', score: 5 },
          { value: 'wait', label: "J'attendrais que ça remonte", score: 10 },
          { value: 'buy_more', label: "J'en profiterais pour investir plus", score: 15 },
        ],
        required: true,
      },
      {
        id: 'risk_2',
        text: 'Quelle perte maximale seriez-vous prêt à accepter sur une année ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'none', label: 'Aucune perte', score: 0 },
          { value: 'max_5', label: "Jusqu'à 5%", score: 5 },
          { value: 'max_10', label: "Jusqu'à 10%", score: 10 },
          { value: 'max_20', label: "Jusqu'à 20%", score: 15 },
          { value: 'max_30', label: "Jusqu'à 30% ou plus", score: 20 },
        ],
        required: true,
      },
      {
        id: 'risk_3',
        text: 'Quel couple rendement/risque préférez-vous ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'safe', label: 'Rendement faible, risque très faible', score: 0 },
          { value: 'prudent', label: 'Rendement modéré, risque faible', score: 5 },
          { value: 'balanced', label: 'Rendement moyen, risque modéré', score: 10 },
          { value: 'dynamic', label: 'Rendement élevé, risque élevé', score: 15 },
          { value: 'aggressive', label: 'Rendement maximum, risque maximum', score: 20 },
        ],
        required: true,
      },
    ],
  },
]

// ============================================================================
// Profile Calculation
// ============================================================================

function calculateRiskProfile(score: number): MiFIDRiskProfile {
  if (score < 40) return 'CONSERVATEUR'
  if (score < 80) return 'PRUDENT'
  if (score < 120) return 'EQUILIBRE'
  if (score < 160) return 'DYNAMIQUE'
  return 'OFFENSIF'
}

function calculateInvestmentHorizon(horizonScore: number): MiFIDInvestmentHorizon {
  if (horizonScore <= 5) return 'COURT'
  if (horizonScore <= 10) return 'MOYEN'
  return 'LONG'
}

function generateRecommendations(
  riskProfile: MiFIDRiskProfile,
  investmentHorizon: MiFIDInvestmentHorizon
): string[] {
  const recommendations: string[] = []

  switch (riskProfile) {
    case 'CONSERVATEUR':
      recommendations.push('Privilégier les fonds euros et les placements garantis')
      recommendations.push("Limiter l'exposition aux marchés actions à moins de 10%")
      break
    case 'PRUDENT':
      recommendations.push('Allocation recommandée: 70-80% fonds euros, 20-30% unités de compte')
      recommendations.push('Privilégier les fonds obligataires et diversifiés prudents')
      break
    case 'EQUILIBRE':
      recommendations.push('Allocation recommandée: 50% fonds euros, 50% unités de compte')
      recommendations.push('Diversifier entre actions, obligations et immobilier')
      break
    case 'DYNAMIQUE':
      recommendations.push('Allocation recommandée: 30% fonds euros, 70% unités de compte')
      recommendations.push('Exposition significative aux marchés actions possible')
      break
    case 'OFFENSIF':
      recommendations.push('Allocation recommandée: 0-20% fonds euros, 80-100% unités de compte')
      recommendations.push('Exposition maximale aux marchés actions')
      break
  }

  switch (investmentHorizon) {
    case 'COURT':
      recommendations.push('Privilégier la liquidité et les placements court terme')
      break
    case 'MOYEN':
      recommendations.push("Horizon adapté à l'assurance-vie et au PER")
      break
    case 'LONG':
      recommendations.push("Profiter de l'effet de capitalisation sur le long terme")
      break
  }

  return recommendations
}

// ============================================================================
// Profile Colors
// ============================================================================

const profileColors: Record<MiFIDRiskProfile, { bg: string; text: string; border: string }> = {
  CONSERVATEUR: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PRUDENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  EQUILIBRE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  DYNAMIQUE: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  OFFENSIF: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
}

// ============================================================================
// Component
// ============================================================================

export default function MiFIDQuestionnaireWizard({
  open,
  onOpenChange,
  clientId,
  clientName,
  onComplete,
}: MiFIDQuestionnaireWizardProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [showResults, setShowResults] = useState(false)
  const [result, setResult] = useState<MiFIDResult | null>(null)

  const saveMutation = useSaveMiFIDAnswers()

  const currentSection = QUESTIONNAIRE_SECTIONS[currentSectionIndex]
  const totalQuestions = QUESTIONNAIRE_SECTIONS.reduce((sum, s) => sum + s.questions.length, 0)
  const answeredQuestions = Object.keys(answers).length

  // Calculate progress
  const progress = (answeredQuestions / totalQuestions) * 100

  // Check if current section is complete
  const isSectionComplete = useMemo(() => {
    return currentSection.questions.every((q) => {
      const answer = answers[q.id]
      if (!q.required) return true
      if (q.type === 'MULTIPLE_CHOICE') {
        return Array.isArray(answer) && answer.length > 0
      }
      return !!answer
    })
  }, [currentSection, answers])

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentSectionIndex(0)
      setAnswers({})
      setShowResults(false)
      setResult(null)
    }
  }, [open])

  // Handle single choice answer
  const handleSingleChoice = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  // Handle multiple choice answer
  const handleMultipleChoice = (questionId: string, value: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || []
      if (checked) {
        // If selecting "none", clear other selections
        if (value === 'none') {
          return { ...prev, [questionId]: ['none'] }
        }
        // If selecting something else, remove "none"
        const filtered = current.filter((v) => v !== 'none')
        return { ...prev, [questionId]: [...filtered, value] }
      } else {
        return { ...prev, [questionId]: current.filter((v) => v !== value) }
      }
    })
  }

  // Navigate to next section
  const handleNext = () => {
    if (currentSectionIndex < QUESTIONNAIRE_SECTIONS.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1)
    } else {
      // Calculate results
      calculateResults()
    }
  }

  // Navigate to previous section
  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1)
    }
  }

  // Calculate final results
  const calculateResults = () => {
    let totalScore = 0
    let horizonScore = 0

    // Calculate scores from answers
    for (const section of QUESTIONNAIRE_SECTIONS) {
      for (const question of section.questions) {
        const answer = answers[question.id]
        if (!answer) continue

        if (Array.isArray(answer)) {
          // Multiple choice - sum all selected options
          for (const val of answer) {
            const option = question.options.find((o) => o.value === val)
            if (option) totalScore += option.score
          }
        } else {
          // Single choice
          const option = question.options.find((o) => o.value === answer)
          if (option) {
            totalScore += option.score
            if (question.id === 'objectives_2') {
              horizonScore = option.score
            }
          }
        }
      }
    }

    const riskProfile = calculateRiskProfile(totalScore)
    const investmentHorizon = calculateInvestmentHorizon(horizonScore)
    const recommendations = generateRecommendations(riskProfile, investmentHorizon)

    setResult({
      riskProfile,
      investmentHorizon,
      totalScore,
      recommendations,
    })
    setShowResults(true)
  }

  // Save results
  const handleSave = async () => {
    if (!result) return

    const mifidAnswers: MiFIDAnswer[] = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }))

    try {
      await saveMutation.mutateAsync({
        clientId,
        answers: mifidAnswers,
      })
      onComplete?.(result)
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#7373FF]" />
            Questionnaire MiFID II
          </DialogTitle>
          <DialogDescription>
            Évaluation du profil investisseur pour {clientName}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {showResults ? 'Résultats' : `Section ${currentSectionIndex + 1}/${QUESTIONNAIRE_SECTIONS.length}`}
            </span>
            <span className="font-medium">{Math.round(progress)}% complété</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {/* Section Indicators */}
          {!showResults && (
            <div className="flex justify-between mt-2">
              {QUESTIONNAIRE_SECTIONS.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => index < currentSectionIndex && setCurrentSectionIndex(index)}
                  disabled={index > currentSectionIndex}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
                    index === currentSectionIndex
                      ? 'bg-[#7373FF]/10 text-[#7373FF] font-medium'
                      : index < currentSectionIndex
                      ? 'text-emerald-600 hover:bg-emerald-50 cursor-pointer'
                      : 'text-gray-400'
                  )}
                >
                  {index < currentSectionIndex ? (
                    <CheckCircle className="h-3.5 w-3.5" />
                  ) : (
                    section.icon
                  )}
                  <span className="hidden sm:inline">{section.title.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto py-4">
          {showResults && result ? (
            /* Results View */
            <div className="space-y-6">
              {/* Profile Card */}
              <div className={cn(
                'p-6 rounded-xl border-2',
                profileColors[result.riskProfile].bg,
                profileColors[result.riskProfile].border
              )}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Profil de risque</p>
                    <p className={cn(
                      'text-2xl font-bold',
                      profileColors[result.riskProfile].text
                    )}>
                      {MIFID_RISK_PROFILE_LABELS[result.riskProfile]}
                    </p>
                  </div>
                  <div className={cn(
                    'p-3 rounded-full',
                    profileColors[result.riskProfile].bg
                  )}>
                    <Shield className={cn(
                      'h-8 w-8',
                      profileColors[result.riskProfile].text
                    )} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Score total</p>
                    <p className="text-xl font-semibold text-gray-900">{result.totalScore}/200</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Horizon</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {MIFID_INVESTMENT_HORIZON_LABELS[result.investmentHorizon]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#7373FF]" />
                  Recommandations
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Important</p>
                  <p className="mt-1">
                    Ce profil est indicatif et doit être revu régulièrement. 
                    Les recommandations ne constituent pas un conseil en investissement personnalisé.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Questions View */
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-[#7373FF]/10 rounded-lg text-[#7373FF]">
                  {currentSection.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{currentSection.title}</h3>
                  <p className="text-sm text-gray-500">{currentSection.description}</p>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-6">
                {currentSection.questions.map((question, qIndex) => (
                  <div key={question.id} className="space-y-3">
                    <Label className="text-sm font-medium text-gray-900">
                      {qIndex + 1}. {question.text}
                      {question.required && <span className="text-rose-500 ml-1">*</span>}
                    </Label>

                    {question.type === 'SINGLE_CHOICE' ? (
                      <RadioGroup
                        value={(answers[question.id] as string) || ''}
                        onValueChange={(value) => handleSingleChoice(question.id, value)}
                        className="space-y-2"
                      >
                        {question.options.map((option) => (
                          <div
                            key={option.value}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                              answers[question.id] === option.value
                                ? 'border-[#7373FF] bg-[#7373FF]/5'
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                            onClick={() => handleSingleChoice(question.id, option.value)}
                          >
                            <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                            <Label
                              htmlFor={`${question.id}-${option.value}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="space-y-2">
                        {question.options.map((option) => {
                          const isChecked = ((answers[question.id] as string[]) || []).includes(option.value)
                          return (
                            <div
                              key={option.value}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                                isChecked
                                  ? 'border-[#7373FF] bg-[#7373FF]/5'
                                  : 'border-gray-200 hover:border-gray-300'
                              )}
                              onClick={() => handleMultipleChoice(question.id, option.value, !isChecked)}
                            >
                              <Checkbox
                                checked={isChecked}
                                onChange={(checked) =>
                                  handleMultipleChoice(question.id, option.value, checked)
                                }
                              />
                              <Label className="flex-1 cursor-pointer text-sm">
                                {option.label}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          {showResults ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowResults(false)}
              >
                Modifier les réponses
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Enregistrer le profil
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={currentSectionIndex === 0 ? handleClose : handlePrevious}
              >
                {currentSectionIndex === 0 ? (
                  'Annuler'
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </>
                )}
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isSectionComplete}
                className="gap-1"
              >
                {currentSectionIndex === QUESTIONNAIRE_SECTIONS.length - 1 ? (
                  'Voir les résultats'
                ) : (
                  <>
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
