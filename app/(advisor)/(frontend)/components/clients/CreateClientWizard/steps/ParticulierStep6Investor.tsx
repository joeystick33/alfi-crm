'use client'
 



import type { ParticulierStep6Investor as Step6Data } from '../types'
import { 
  RISK_PROFILES, 
  INVESTMENT_HORIZONS, 
  INVESTMENT_GOALS,
  INVESTMENT_KNOWLEDGE,
  INVESTMENT_EXPERIENCE 
} from '../types'
import { TrendingUp, Target, Clock, GraduationCap, Activity } from 'lucide-react'
import { cn } from '@/app/_common/lib/utils'

interface Props {
  data: Step6Data
  onChange: (data: Step6Data) => void
  errors: Record<string, string>
}

export function ParticulierStep6Investor({ data, onChange, errors }: Props) {
  const updateField = <K extends keyof Step6Data>(field: K, value: Step6Data[K]) => {
    onChange({ ...data, [field]: value })
  }

  const toggleGoal = (goal: string) => {
    const current = data.investmentGoals || []
    if (current.includes(goal)) {
      updateField('investmentGoals', current.filter(g => g !== goal))
    } else {
      updateField('investmentGoals', [...current, goal])
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Profil investisseur</h3>
        <p className="mt-1 text-sm text-gray-500">
          Ces informations nous permettent de vous proposer des solutions adaptées (MIF II)
        </p>
      </div>

      {/* Profil de risque */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Profil de risque
        </label>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {RISK_PROFILES.map((profile) => (
            <button
              key={profile.value}
              type="button"
              onClick={() => updateField('riskProfile', profile.value as any)}
              className={cn(
                'flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all',
                data.riskProfile === profile.value
                  ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <span className="font-medium text-gray-900">{profile.label}</span>
              <span className="mt-1 text-xs text-gray-500">{profile.description}</span>
            </button>
          ))}
        </div>
        {errors.riskProfile && <p className="text-sm text-red-500">{errors.riskProfile}</p>}
      </div>

      {/* Horizon d'investissement */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Horizon d'investissement
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          {INVESTMENT_HORIZONS.map((horizon) => (
            <button
              key={horizon.value}
              type="button"
              onClick={() => updateField('investmentHorizon', horizon.value as any)}
              className={cn(
                'flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all',
                data.investmentHorizon === horizon.value
                  ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <span className="font-medium text-gray-900">{horizon.label}</span>
              <span className="mt-1 text-xs text-gray-500">{horizon.description}</span>
            </button>
          ))}
        </div>
        {errors.investmentHorizon && <p className="text-sm text-red-500">{errors.investmentHorizon}</p>}
      </div>

      {/* Objectifs d'investissement */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Objectifs d'investissement (plusieurs choix possibles)
        </label>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {INVESTMENT_GOALS.map((goal) => (
            <button
              key={goal.value}
              type="button"
              onClick={() => toggleGoal(goal.value)}
              className={cn(
                'rounded-lg border-2 px-4 py-2.5 text-sm text-left transition-all',
                data.investmentGoals?.includes(goal.value)
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-medium'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              {goal.label}
            </button>
          ))}
        </div>
      </div>

      {/* Connaissances et expérience */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Niveau de connaissances financières
          </label>
          <div className="space-y-2">
            {INVESTMENT_KNOWLEDGE.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => updateField('investmentKnowledge', level.value as any)}
                className={cn(
                  'w-full flex flex-col items-start rounded-lg border-2 p-3 text-left transition-all',
                  data.investmentKnowledge === level.value
                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <span className="font-medium text-gray-900">{level.label}</span>
                <span className="text-xs text-gray-500">{level.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Expérience en investissement
          </label>
          <div className="space-y-2">
            {INVESTMENT_EXPERIENCE.map((exp) => (
              <button
                key={exp.value}
                type="button"
                onClick={() => updateField('investmentExperience', exp.value as any)}
                className={cn(
                  'w-full flex flex-col items-start rounded-lg border-2 p-3 text-left transition-all',
                  data.investmentExperience === exp.value
                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <span className="font-medium text-gray-900">{exp.label}</span>
                <span className="text-xs text-gray-500">{exp.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
