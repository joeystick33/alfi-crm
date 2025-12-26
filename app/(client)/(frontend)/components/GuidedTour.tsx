'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export interface TourStep {
  id: string
  title: string
  description: string
  position?: 'center'
}

export interface GuidedTourProps {
  tourId: string
  steps: TourStep[]
  onComplete?: () => void
  onSkip?: () => void
  forceShow?: boolean
}

export const DEFAULT_CLIENT_PORTAL_TOUR: TourStep[] = [
  { id: 'welcome', title: 'Bienvenue ! 👋', description: 'Découvrez votre espace client personnel.' },
  { id: 'dashboard', title: 'Tableau de bord', description: 'Vue d\'ensemble de votre patrimoine et activité.' },
  { id: 'patrimoine', title: 'Mon Patrimoine', description: 'Vos actifs et passifs en un coup d\'œil.' },
  { id: 'objectifs', title: 'Mes Objectifs', description: 'Suivez vos projets de vie.' },
  { id: 'documents', title: 'Mes Documents', description: 'Tous vos documents accessibles.' },
  { id: 'messages', title: 'Messages', description: 'Contactez votre conseiller.' },
  { id: 'complete', title: 'C\'est parti ! 🚀', description: 'Explorez librement votre espace.' },
]

export function GuidedTour({ tourId, steps, onComplete, onSkip, forceShow = false }: GuidedTourProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const storageKey = `tour-${tourId}`

  useEffect(() => {
    if (forceShow) { setIsVisible(true); return }
    if (!localStorage.getItem(storageKey)) setIsVisible(true)
  }, [forceShow, storageKey])

  const markComplete = () => {
    localStorage.setItem(storageKey, 'done')
    setIsVisible(false)
    onComplete?.()
  }

  const handleSkip = () => {
    localStorage.setItem(storageKey, 'skipped')
    setIsVisible(false)
    onSkip?.()
  }

  const next = () => currentStep < steps.length - 1 ? setCurrentStep(currentStep + 1) : markComplete()
  const prev = () => currentStep > 0 && setCurrentStep(currentStep - 1)

  if (!isVisible) return null

  const step = steps[currentStep]
  const isLast = currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <span key={i} className={`h-2 w-2 rounded-full ${i <= currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
              ))}
            </div>
            <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
          <p className="text-gray-600 mb-6">{step.description}</p>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={prev} disabled={currentStep === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
            </Button>
            <Button onClick={next}>
              {isLast ? 'Commencer' : 'Suivant'} {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default GuidedTour
