/**
 * Recurrence Helper
 * 
 * Utilitaires pour parser et expand les récurrences au format RFC 5545 (iCal RRULE).
 * Utilisé par RendezVousService pour gérer les rendez-vous récurrents.
 * 
 * Supporte:
 * - FREQ=DAILY, WEEKLY, MONTHLY, YEARLY
 * - BYDAY (jours de la semaine)
 * - BYMONTHDAY (jour du mois)
 * - COUNT (nombre d'occurrences)
 * - UNTIL (date de fin)
 * - INTERVAL (intervalle entre occurrences)
 */

export interface RecurrenceOptions {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval?: number
  count?: number
  until?: Date
  byDay?: string[] // ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  byMonthDay?: number[] // [1-31]
  byMonth?: number[] // [1-12]
}

export interface RecurrenceInstance {
  date: Date
  isException: boolean
}

/**
 * Parser une RRULE string vers un objet structuré
 */
export function parseRRule(rrule: string): RecurrenceOptions {
  const parts = rrule.split(';')
  const options: Record<string, unknown> = {}

  parts.forEach(part => {
    const [key, value] = part.split('=')
    
    switch (key) {
      case 'FREQ':
        options.freq = value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
        break
      
      case 'INTERVAL':
        options.interval = parseInt(value, 10)
        break
      
      case 'COUNT':
        options.count = parseInt(value, 10)
        break
      
      case 'UNTIL':
        // Format: 20241231T235959Z
        options.until = parseICalDate(value)
        break
      
      case 'BYDAY':
        options.byDay = value.split(',')
        break
      
      case 'BYMONTHDAY':
        options.byMonthDay = value.split(',').map(d => parseInt(d, 10))
        break
      
      case 'BYMONTH':
        options.byMonth = value.split(',').map(m => parseInt(m, 10))
        break
    }
  })

  return options as unknown as RecurrenceOptions
}

/**
 * Convertir un objet RecurrenceOptions en RRULE string
 */
export function serializeRRule(options: RecurrenceOptions): string {
  const parts: string[] = []

  parts.push(`FREQ=${options.freq}`)

  if (options.interval && options.interval > 1) {
    parts.push(`INTERVAL=${options.interval}`)
  }

  if (options.count) {
    parts.push(`COUNT=${options.count}`)
  }

  if (options.until) {
    parts.push(`UNTIL=${formatICalDate(options.until)}`)
  }

  if (options.byDay && options.byDay.length > 0) {
    parts.push(`BYDAY=${options.byDay.join(',')}`)
  }

  if (options.byMonthDay && options.byMonthDay.length > 0) {
    parts.push(`BYMONTHDAY=${options.byMonthDay.join(',')}`)
  }

  if (options.byMonth && options.byMonth.length > 0) {
    parts.push(`BYMONTH=${options.byMonth.join(',')}`)
  }

  return parts.join(';')
}

/**
 * Expand une récurrence pour générer toutes les occurrences dans une plage de dates
 */
export function expandRecurrence(
  rrule: string,
  startDate: Date,
  durationMinutes: number,
  maxDate: Date,
  exceptions: Date[] = []
): RecurrenceInstance[] {
  const options = parseRRule(rrule)
  const instances: RecurrenceInstance[] = []
  const exceptionsSet = new Set(exceptions.map(d => d.toISOString().split('T')[0]))

  let currentDate = new Date(startDate)
  let occurrenceCount = 0

  // Limite de sécurité pour éviter boucles infinies
  const MAX_OCCURRENCES = 1000
  const effectiveMaxDate = options.until && options.until < maxDate ? options.until : maxDate

  while (currentDate <= effectiveMaxDate && occurrenceCount < MAX_OCCURRENCES) {
    // Vérifier si cette occurrence doit être générée selon les règles
    if (shouldGenerateOccurrence(currentDate, options)) {
      const dateKey = currentDate.toISOString().split('T')[0]
      const isException = exceptionsSet.has(dateKey)

      instances.push({
        date: new Date(currentDate),
        isException,
      })

      occurrenceCount++

      // Si COUNT spécifié, arrêter après N occurrences
      if (options.count && occurrenceCount >= options.count) {
        break
      }
    }

    // Avancer à la prochaine date potentielle selon FREQ et INTERVAL
    currentDate = getNextDate(currentDate, options)
  }

  return instances
}

/**
 * Vérifier si une occurrence doit être générée à cette date selon les règles
 */
function shouldGenerateOccurrence(date: Date, options: RecurrenceOptions): boolean {
  // BYDAY: Vérifier jour de la semaine
  if (options.byDay && options.byDay.length > 0) {
    const dayOfWeek = getDayOfWeekCode(date)
    if (!options.byDay.includes(dayOfWeek)) {
      return false
    }
  }

  // BYMONTHDAY: Vérifier jour du mois
  if (options.byMonthDay && options.byMonthDay.length > 0) {
    const dayOfMonth = date.getDate()
    if (!options.byMonthDay.includes(dayOfMonth)) {
      return false
    }
  }

  // BYMONTH: Vérifier mois
  if (options.byMonth && options.byMonth.length > 0) {
    const month = date.getMonth() + 1 // JavaScript months are 0-indexed
    if (!options.byMonth.includes(month)) {
      return false
    }
  }

  return true
}

/**
 * Obtenir la prochaine date selon FREQ et INTERVAL
 */
function getNextDate(date: Date, options: RecurrenceOptions): Date {
  const next = new Date(date)
  const interval = options.interval || 1

  switch (options.freq) {
    case 'DAILY':
      next.setDate(next.getDate() + interval)
      break

    case 'WEEKLY':
      next.setDate(next.getDate() + (7 * interval))
      break

    case 'MONTHLY':
      next.setMonth(next.getMonth() + interval)
      break

    case 'YEARLY':
      next.setFullYear(next.getFullYear() + interval)
      break
  }

  return next
}

/**
 * Obtenir le code du jour de la semaine (MO, TU, etc.)
 */
function getDayOfWeekCode(date: Date): string {
  const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
  return days[date.getDay()]
}

/**
 * Parser une date au format iCal (20241231T235959Z)
 */
function parseICalDate(iCalDate: string): Date {
  // Format: YYYYMMDDTHHMMSSZ
  const year = parseInt(iCalDate.substring(0, 4), 10)
  const month = parseInt(iCalDate.substring(4, 6), 10) - 1 // JS months are 0-indexed
  const day = parseInt(iCalDate.substring(6, 8), 10)
  const hours = parseInt(iCalDate.substring(9, 11), 10)
  const minutes = parseInt(iCalDate.substring(11, 13), 10)
  const seconds = parseInt(iCalDate.substring(13, 15), 10)

  return new Date(Date.UTC(year, month, day, hours, minutes, seconds))
}

/**
 * Formater une date au format iCal (20241231T235959Z)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

/**
 * Vérifier si une RRULE est valide
 */
export function validateRRule(rrule: string): { valid: boolean; error?: string } {
  try {
    const options = parseRRule(rrule)

    if (!options.freq) {
      return { valid: false, error: 'FREQ est requis' }
    }

    if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(options.freq)) {
      return { valid: false, error: 'FREQ invalide' }
    }

    if (options.interval && (options.interval < 1 || options.interval > 1000)) {
      return { valid: false, error: 'INTERVAL doit être entre 1 et 1000' }
    }

    if (options.count && (options.count < 1 || options.count > 1000)) {
      return { valid: false, error: 'COUNT doit être entre 1 et 1000' }
    }

    if (options.byDay) {
      const validDays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
      for (const day of options.byDay) {
        if (!validDays.includes(day)) {
          return { valid: false, error: `BYDAY invalide: ${day}` }
        }
      }
    }

    if (options.byMonthDay) {
      for (const day of options.byMonthDay) {
        if (day < 1 || day > 31) {
          return { valid: false, error: `BYMONTHDAY invalide: ${day}` }
        }
      }
    }

    if (options.byMonth) {
      for (const month of options.byMonth) {
        if (month < 1 || month > 12) {
          return { valid: false, error: `BYMONTH invalide: ${month}` }
        }
      }
    }

    return { valid: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : ''
    return { valid: false, error: errorMessage || 'RRULE invalide' }
  }
}

/**
 * Obtenir une description humaine d'une RRULE
 */
export function getRRuleDescription(rrule: string, locale: string = 'fr'): string {
  try {
    const options = parseRRule(rrule)
    const parts: string[] = []

    // Fréquence de base
    switch (options.freq) {
      case 'DAILY':
        parts.push(options.interval && options.interval > 1 ? `Tous les ${options.interval} jours` : 'Tous les jours')
        break
      case 'WEEKLY':
        if (options.byDay && options.byDay.length > 0) {
          const dayNames: Record<string, string> = {
            MO: 'lundi', TU: 'mardi', WE: 'mercredi', TH: 'jeudi',
            FR: 'vendredi', SA: 'samedi', SU: 'dimanche'
          }
          const days = options.byDay.map(d => dayNames[d]).join(', ')
          parts.push(options.interval && options.interval > 1 ? `Toutes les ${options.interval} semaines le ${days}` : `Chaque ${days}`)
        } else {
          parts.push(options.interval && options.interval > 1 ? `Toutes les ${options.interval} semaines` : 'Chaque semaine')
        }
        break
      case 'MONTHLY':
        if (options.byMonthDay && options.byMonthDay.length > 0) {
          const days = options.byMonthDay.join(', ')
          parts.push(`Le ${days} de chaque mois`)
        } else {
          parts.push('Chaque mois')
        }
        break
      case 'YEARLY':
        parts.push('Chaque année')
        break
    }

    // Condition de fin
    if (options.count) {
      parts.push(`(${options.count} fois)`)
    } else if (options.until) {
      const untilStr = options.until.toLocaleDateString(locale)
      parts.push(`(jusqu'au ${untilStr})`)
    }

    return parts.join(' ')
  } catch {
    return rrule
  }
}
