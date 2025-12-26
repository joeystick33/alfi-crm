'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/app/_common/components/ui/Input'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { Calendar, Info } from 'lucide-react'
import { getRRuleDescription } from '@/app/_common/lib/services/recurrence-helper'

export interface RecurrenceConfig {
  isRecurring: boolean
  recurrenceRule: string
  recurrenceEndDate?: Date
}

interface RecurrenceSelectorProps {
  value: RecurrenceConfig
  onChange: (config: RecurrenceConfig) => void
  startDate?: Date
}

type FrequencyType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM'

const WEEKDAYS = [
  { value: 'MO', label: 'Lun', fullLabel: 'Lundi' },
  { value: 'TU', label: 'Mar', fullLabel: 'Mardi' },
  { value: 'WE', label: 'Mer', fullLabel: 'Mercredi' },
  { value: 'TH', label: 'Jeu', fullLabel: 'Jeudi' },
  { value: 'FR', label: 'Ven', fullLabel: 'Vendredi' },
  { value: 'SA', label: 'Sam', fullLabel: 'Samedi' },
  { value: 'SU', label: 'Dim', fullLabel: 'Dimanche' },
]

export function RecurrenceSelector({ value, onChange, startDate }: RecurrenceSelectorProps) {
  const [frequency, setFrequency] = useState<FrequencyType>('NONE')
  const [interval, setInterval] = useState<number>(1)
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [endType, setEndType] = useState<'never' | 'count' | 'until'>('never')
  const [count, setCount] = useState<number>(10)
  const [until, setUntil] = useState<string>('')
  const [customRRule, setCustomRRule] = useState<string>('')

  // Initialiser depuis la config existante
  useEffect(() => {
    if (value.isRecurring && value.recurrenceRule) {
      // Parser la RRULE pour pré-remplir les champs
      // Pour simplifier, on détecte juste les cas communs
      const rule = value.recurrenceRule

      if (rule.includes('FREQ=DAILY')) {
        setFrequency('DAILY')
      } else if (rule.includes('FREQ=WEEKLY')) {
        setFrequency('WEEKLY')
        // Extraire BYDAY si présent
        const byDayMatch = rule.match(/BYDAY=([A-Z,]+)/)
        if (byDayMatch) {
          setSelectedDays(byDayMatch[1].split(','))
        }
      } else if (rule.includes('FREQ=MONTHLY')) {
        setFrequency('MONTHLY')
      } else if (rule.includes('FREQ=YEARLY')) {
        setFrequency('YEARLY')
      } else {
        setFrequency('CUSTOM')
        setCustomRRule(rule)
      }

      // Extraire COUNT ou UNTIL
      const countMatch = rule.match(/COUNT=(\d+)/)
      if (countMatch) {
        setEndType('count')
        setCount(parseInt(countMatch[1], 10))
      } else if (rule.includes('UNTIL=')) {
        setEndType('until')
        // Parser UNTIL si nécessaire
      } else {
        setEndType('never')
      }
    } else {
      setFrequency('NONE')
    }
  }, [value])

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const buildRRule = (): string => {
    if (frequency === 'NONE') return ''
    if (frequency === 'CUSTOM') return customRRule

    const parts: string[] = []
    parts.push(`FREQ=${frequency}`)

    if (interval > 1) {
      parts.push(`INTERVAL=${interval}`)
    }

    if (frequency === 'WEEKLY' && selectedDays.length > 0) {
      parts.push(`BYDAY=${selectedDays.join(',')}`)
    }

    if (endType === 'count') {
      parts.push(`COUNT=${count}`)
    } else if (endType === 'until' && until) {
      // Convertir date ISO en format iCal
      const untilDate = new Date(until)
      const year = untilDate.getUTCFullYear()
      const month = String(untilDate.getUTCMonth() + 1).padStart(2, '0')
      const day = String(untilDate.getUTCDate()).padStart(2, '0')
      parts.push(`UNTIL=${year}${month}${day}T235959Z`)
    }

    return parts.join(';')
  }

  const handleApply = () => {
    const rrule = buildRRule()

    const config: RecurrenceConfig = {
      isRecurring: frequency !== 'NONE',
      recurrenceRule: rrule,
      recurrenceEndDate: endType === 'until' && until ? new Date(until) : undefined,
    }

    onChange(config)
  }

  // Auto-apply on changes
  useEffect(() => {
    if (frequency !== 'NONE') {
      handleApply()
    } else {
      onChange({ isRecurring: false, recurrenceRule: '' })
    }
     
  }, [frequency, interval, selectedDays, endType, count, until, customRRule])

  const description = value.isRecurring && value.recurrenceRule
    ? getRRuleDescription(value.recurrenceRule, 'fr')
    : null

  return (
    <div className="space-y-4">
      {/* Sélecteur fréquence principal */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Répétition
        </label>
        <Select value={frequency} onValueChange={(val) => setFrequency(val as FrequencyType)}>
          <SelectTrigger>
            <SelectValue placeholder="Ne pas répéter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">Ne pas répéter</SelectItem>
            <SelectItem value="DAILY">Quotidien</SelectItem>
            <SelectItem value="WEEKLY">Hebdomadaire</SelectItem>
            <SelectItem value="MONTHLY">Mensuel</SelectItem>
            <SelectItem value="YEARLY">Annuel</SelectItem>
            <SelectItem value="CUSTOM">Personnalisé (RRULE)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Options selon fréquence */}
      {frequency !== 'NONE' && frequency !== 'CUSTOM' && (
        <div className="space-y-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
          {/* Intervalle */}
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600 whitespace-nowrap">Tous les</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value, 10) || 1)}
              className="w-20"
            />
            <span className="text-sm text-slate-600">
              {frequency === 'DAILY' && 'jour(s)'}
              {frequency === 'WEEKLY' && 'semaine(s)'}
              {frequency === 'MONTHLY' && 'mois'}
              {frequency === 'YEARLY' && 'an(s)'}
            </span>
          </div>

          {/* Jours de la semaine (pour WEEKLY) */}
          {frequency === 'WEEKLY' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Jours de la semaine
              </label>
              <div className="flex gap-2 flex-wrap">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedDays.includes(day.value)
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'
                    }`}
                    title={day.fullLabel}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {selectedDays.length === 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  Sélectionnez au moins un jour
                </p>
              )}
            </div>
          )}

          {/* Type de fin */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Se termine
            </label>
            <div className="space-y-3">
              {/* Jamais */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  value="never"
                  checked={endType === 'never'}
                  onChange={() => setEndType('never')}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-slate-700">Jamais</span>
              </label>

              {/* Après N occurrences */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  value="count"
                  checked={endType === 'count'}
                  onChange={() => setEndType('count')}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-slate-700">Après</span>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={count}
                  onChange={(e) => {
                    setCount(parseInt(e.target.value, 10) || 1)
                    setEndType('count')
                  }}
                  className="w-20"
                  disabled={endType !== 'count'}
                />
                <span className="text-sm text-slate-700">occurrence(s)</span>
              </label>

              {/* Jusqu'à une date */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="endType"
                  value="until"
                  checked={endType === 'until'}
                  onChange={() => setEndType('until')}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="text-sm text-slate-700">Le</span>
                <Input
                  type="date"
                  value={until}
                  onChange={(e) => {
                    setUntil(e.target.value)
                    setEndType('until')
                  }}
                  className="flex-1"
                  disabled={endType !== 'until'}
                  min={startDate ? startDate.toISOString().split('T')[0] : undefined}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* RRULE personnalisée */}
      {frequency === 'CUSTOM' && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">RRULE (RFC 5545)</label>
          <Input
            value={customRRule}
            onChange={(e) => setCustomRRule(e.target.value)}
            placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=10"
            className="font-mono text-xs"
          />
          <p className="text-xs text-slate-500">
            Format iCal RRULE. Exemple : FREQ=DAILY;INTERVAL=2;COUNT=5
          </p>
        </div>
      )}

      {/* Description humaine */}
      {description && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Récurrence configurée</p>
            <p>{description}</p>
          </div>
        </div>
      )}

      {/* Badge résumé si configuré */}
      {value.isRecurring && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Récurrent
          </Badge>
          {value.recurrenceEndDate && (
            <Badge variant="secondary" className="text-xs">
              Jusqu'au {value.recurrenceEndDate.toLocaleDateString('fr-FR')}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
