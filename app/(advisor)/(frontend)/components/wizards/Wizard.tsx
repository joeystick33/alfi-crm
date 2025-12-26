'use client'

/**
 * Wizard - Composant de workflow guidé générique
 * 
 * Permet de créer des parcours pas à pas:
 * - Onboarding client
 * - Bilan patrimonial
 * - Préparation RDV
 * - Revue annuelle
 */

import { useState, useCallback, useMemo, createContext, useContext } from 'react'
import { cn } from '@/app/_common/lib/utils'
import { Button } from '@/app/_common/components/ui/Button'
import { Progress } from '@/app/_common/components/ui/Progress'
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Loader2,
} from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

export interface WizardStep {
  id: string
  title: string
  description?: string
  icon?: React.ElementType
  component: React.ComponentType<WizardStepProps>
  optional?: boolean
  validate?: (data: Record<string, unknown>) => boolean | string
}

export interface WizardStepProps {
  data: Record<string, unknown>
  updateData: (updates: Record<string, unknown>) => void
  errors?: Record<string, string>
  isActive: boolean
}

interface WizardContextValue {
  currentStep: number
  totalSteps: number
  data: Record<string, unknown>
  errors: Record<string, string>
  updateData: (updates: Record<string, unknown>) => void
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  isFirstStep: boolean
  isLastStep: boolean
  canProceed: boolean
}

const WizardContext = createContext<WizardContextValue | null>(null)

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider')
  }
  return context
}

// =============================================================================
// Props
// =============================================================================

interface WizardProps {
  steps: WizardStep[]
  initialData?: Record<string, unknown>
  onComplete: (data: Record<string, unknown>) => Promise<void>
  onCancel?: () => void
  title: string
  description?: string
  className?: string
  showStepNumbers?: boolean
  allowSkip?: boolean
  saveOnEachStep?: boolean
}

// =============================================================================
// Composants internes
// =============================================================================

function StepIndicator({
  step,
  index,
  currentIndex,
  totalSteps,
  onClick,
  showNumbers,
}: {
  step: WizardStep
  index: number
  currentIndex: number
  totalSteps: number
  onClick?: () => void
  showNumbers?: boolean
}) {
  const isCompleted = index < currentIndex
  const isCurrent = index === currentIndex
  const Icon = step.icon
  
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 w-full text-left',
        isCurrent && 'bg-indigo-50 border-2 border-indigo-500',
        isCompleted && 'bg-emerald-50 border border-emerald-200',
        !isCurrent && !isCompleted && 'bg-gray-50 border border-gray-200',
        onClick && 'cursor-pointer hover:shadow-sm',
        !onClick && 'cursor-default'
      )}
    >
      <div className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
        isCurrent && 'bg-indigo-600 text-white',
        isCompleted && 'bg-emerald-500 text-white',
        !isCurrent && !isCompleted && 'bg-gray-200 text-gray-500'
      )}>
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : Icon ? (
          <Icon className="h-5 w-5" />
        ) : showNumbers ? (
          <span className="text-sm font-semibold">{index + 1}</span>
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          isCurrent && 'text-indigo-700',
          isCompleted && 'text-emerald-700',
          !isCurrent && !isCompleted && 'text-gray-500'
        )}>
          {step.title}
        </p>
        {step.description && (
          <p className="text-xs text-gray-500 truncate">{step.description}</p>
        )}
      </div>
      {step.optional && (
        <span className="text-xs text-gray-400 shrink-0">Optionnel</span>
      )}
    </button>
  )
}

// =============================================================================
// Composant Principal
// =============================================================================

export function Wizard({
  steps,
  initialData = {},
  onComplete,
  onCancel,
  title,
  description,
  className,
  showStepNumbers = true,
  allowSkip = false,
  saveOnEachStep = false,
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<Record<string, unknown>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const totalSteps = steps.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  const progress = ((currentStep + 1) / totalSteps) * 100
  
  const currentStepConfig = steps[currentStep]
  const StepComponent = currentStepConfig.component
  
  // Validate current step
  const canProceed = useMemo(() => {
    if (!currentStepConfig.validate) return true
    const result = currentStepConfig.validate(data)
    return result === true
  }, [currentStepConfig, data])
  
  // Update data
  const updateData = useCallback((updates: Record<string, unknown>) => {
    setData(prev => ({ ...prev, ...updates }))
    // Clear errors for updated fields
    const clearedErrors = { ...errors }
    Object.keys(updates).forEach(key => {
      delete clearedErrors[key]
    })
    setErrors(clearedErrors)
  }, [errors])
  
  // Navigation
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      // Only allow going back or to completed steps
      if (step <= currentStep) {
        setCurrentStep(step)
      }
    }
  }, [totalSteps, currentStep])
  
  const nextStep = useCallback(async () => {
    // Validate current step
    if (currentStepConfig.validate) {
      const result = currentStepConfig.validate(data)
      if (result !== true) {
        setErrors({ [currentStepConfig.id]: typeof result === 'string' ? result : 'Validation failed' })
        return
      }
    }
    
    if (isLastStep) {
      // Complete wizard
      setIsSubmitting(true)
      try {
        await onComplete(data)
      } catch (error) {
        console.error('Wizard completion error:', error)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStepConfig, data, isLastStep, onComplete])
  
  const prevStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1)
    }
  }, [isFirstStep])
  
  const contextValue: WizardContextValue = {
    currentStep,
    totalSteps,
    data,
    errors,
    updateData,
    goToStep,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    canProceed,
  }

  return (
    <WizardContext.Provider value={contextValue}>
      <div className={cn('bg-white rounded-2xl shadow-xl overflow-hidden', className)}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {description && (
                <p className="text-sm text-gray-500 mt-0.5">{description}</p>
              )}
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Étape {currentStep + 1} sur {totalSteps}</span>
              <span>{progress.toFixed(0)}% complété</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex min-h-[400px]">
          {/* Steps sidebar */}
          <div className="w-72 bg-gray-50 border-r border-gray-200 p-4 hidden lg:block">
            <div className="space-y-2">
              {steps.map((step, index) => (
                <StepIndicator
                  key={step.id}
                  step={step}
                  index={index}
                  currentIndex={currentStep}
                  totalSteps={totalSteps}
                  onClick={index <= currentStep ? () => goToStep(index) : undefined}
                  showNumbers={showStepNumbers}
                />
              ))}
            </div>
          </div>
          
          {/* Step content */}
          <div className="flex-1 p-6">
            <div className="mb-6 lg:hidden">
              <h3 className="text-lg font-semibold text-gray-900">{currentStepConfig.title}</h3>
              {currentStepConfig.description && (
                <p className="text-sm text-gray-500 mt-1">{currentStepConfig.description}</p>
              )}
            </div>
            
            <StepComponent
              data={data}
              updateData={updateData}
              errors={errors}
              isActive={true}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={isFirstStep}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          
          <div className="flex items-center gap-2">
            {allowSkip && !isLastStep && currentStepConfig.optional && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                Passer
              </Button>
            )}
            
            <Button
              onClick={nextStep}
              disabled={!canProceed && !currentStepConfig.optional || isSubmitting}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : isLastStep ? (
                <>
                  <Save className="h-4 w-4" />
                  Terminer
                </>
              ) : (
                <>
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </WizardContext.Provider>
  )
}

export default Wizard
