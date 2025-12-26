import { addMinutes, differenceInMinutes, isBefore, isAfter, parseISO, startOfDay } from 'date-fns'
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'

export const DEFAULT_TIME_ZONE = 'Europe/Paris'

export type DateInput = string | number | Date

const coerceDate = (value: DateInput): Date => {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  return parseISO(value)
}

export const toZonedDate = (value: DateInput, timeZone: string = DEFAULT_TIME_ZONE): Date => {
  const date = coerceDate(value)
  return toZonedTime(date, timeZone)
}

export const toUtcDate = (value: DateInput, timeZone: string = DEFAULT_TIME_ZONE): Date => {
  const date = value instanceof Date ? value : coerceDate(value)
  return fromZonedTime(date, timeZone)
}

export const toUtcISOString = (value: DateInput, timeZone: string = DEFAULT_TIME_ZONE): string => {
  const date = value instanceof Date ? value : coerceDate(value)
  const utcDate = fromZonedTime(date, timeZone)
  return utcDate.toISOString()
}

export const formatInTimezone = (
  value: DateInput,
  formatString: string,
  timeZone: string = DEFAULT_TIME_ZONE
): string => formatInTimeZone(coerceDate(value), timeZone, formatString)

export interface DayRangeOptions {
  timeZone?: string
  startHour?: number
  endHour?: number
}

const clampDate = (value: Date, min: Date, max: Date): Date => {
  if (isBefore(value, min)) return min
  if (isAfter(value, max)) return max
  return value
}

export const getDayRange = (
  reference: DateInput,
  { timeZone = DEFAULT_TIME_ZONE, startHour = 7, endHour = 21 }: DayRangeOptions = {}
) => {
  const zonedReference = toZonedDate(reference, timeZone)
  const dayStart = startOfDay(zonedReference)
  const rangeStart = addMinutes(dayStart, startHour * 60)
  const rangeEnd = addMinutes(dayStart, endHour * 60)
  return {
    rangeStart,
    rangeEnd,
    rangeMinutes: differenceInMinutes(rangeEnd, rangeStart),
  }
}

export const clampToRange = (value: Date, rangeStart: Date, rangeEnd: Date) =>
  clampDate(value, rangeStart, rangeEnd)

export const isWithinRange = (value: Date, rangeStart: Date, rangeEnd: Date) =>
  !isBefore(value, rangeStart) && !isAfter(value, rangeEnd)
