'use client'

import { Check } from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'

interface Step {
  id: number
  title: string
  description?: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.id}
            className={cn(
              stepIdx !== steps.length - 1 ? 'flex-1' : '',
              'relative'
            )}
          >
            {step.id < currentStep ? (
              // Completed step
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                className="group flex w-full flex-col items-center border-t-4 border-indigo-600 pt-4 transition-colors hover:border-indigo-800"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800 transition-colors">
                  <Check className="h-5 w-5 text-white" aria-hidden="true" />
                </span>
                <span className="mt-2 text-sm font-medium text-indigo-600 group-hover:text-indigo-800">
                  {step.title}
                </span>
              </button>
            ) : step.id === currentStep ? (
              // Current step
              <div
                className="flex w-full flex-col items-center border-t-4 border-indigo-600 pt-4"
                aria-current="step"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-indigo-600 bg-white">
                  <span className="text-sm font-semibold text-indigo-600">{step.id}</span>
                </span>
                <span className="mt-2 text-sm font-semibold text-indigo-600">
                  {step.title}
                </span>
              </div>
            ) : (
              // Upcoming step
              <div className="group flex w-full flex-col items-center border-t-4 border-gray-200 pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                  <span className="text-sm font-medium text-gray-500">{step.id}</span>
                </span>
                <span className="mt-2 text-sm font-medium text-gray-500">
                  {step.title}
                </span>
              </div>
            )}
            
            {/* Connector line */}
            {stepIdx !== steps.length - 1 && (
              <div
                className={cn(
                  'absolute left-0 top-4 -ml-px mt-0.5 h-0.5 w-full',
                  step.id < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                )}
                style={{ left: '50%', width: '100%' }}
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
