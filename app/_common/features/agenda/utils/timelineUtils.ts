import { differenceInMinutes, isBefore, isAfter } from 'date-fns'
import type { Appointment } from '@/app/_common/types/agenda'

export interface TimelineBounds {
  rangeStart: Date
  rangeEnd: Date
  rangeMinutes: number
}

export interface PositionedAppointment {
  appointment: Appointment
  top: number
  height: number
  collisionGroup: number
}

export interface TimelineComputationOptions {
  bounds: TimelineBounds
  minimumHeight?: number
}

const defaultOptions: Required<Pick<TimelineComputationOptions, 'minimumHeight'>> = {
  minimumHeight: 36,
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const minutesFromStart = (date: Date, bounds: TimelineBounds) =>
  differenceInMinutes(date, bounds.rangeStart)

const normalizePosition = (minutes: number, bounds: TimelineBounds) =>
  clamp(minutes, 0, bounds.rangeMinutes) / bounds.rangeMinutes

const sortByStart = (appointments: Appointment[]) =>
  [...appointments].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

const appointmentsOverlap = (a: Appointment, b: Appointment) => {
  const startA = new Date(a.start)
  const endA = new Date(a.end)
  const startB = new Date(b.start)
  const endB = new Date(b.end)
  return isBefore(startA, endB) && isAfter(endA, startB)
}

export const groupOverlaps = (appointments: Appointment[]) => {
  const sorted = sortByStart(appointments)
  const groups: Appointment[][] = []

  sorted.forEach((appointment) => {
    let added = false
    for (const group of groups) {
      if (!group.some((existing) => appointmentsOverlap(existing, appointment))) {
        group.push(appointment)
        added = true
        break
      }
    }
    if (!added) {
      groups.push([appointment])
    }
  })

  return groups
}

export const positionAppointments = (
  appointments: Appointment[],
  bounds: TimelineBounds,
  options: TimelineComputationOptions = { bounds }
): PositionedAppointment[] => {
  const { minimumHeight } = { ...defaultOptions, ...options }
  const groups = groupOverlaps(appointments)
  const positioned: PositionedAppointment[] = []

  groups.forEach((group, index) => {
    group.forEach((appointment) => {
      const start = new Date(appointment.start)
      const end = new Date(appointment.end)
      const startMinutes = minutesFromStart(start, bounds)
      const endMinutes = minutesFromStart(end, bounds)

      const topRatio = normalizePosition(startMinutes, bounds)
      const bottomRatio = normalizePosition(endMinutes, bounds)
      const heightRatio = Math.max(bottomRatio - topRatio, minimumHeight / bounds.rangeMinutes)

      positioned.push({
        appointment,
        top: topRatio * 100,
        height: heightRatio * 100,
        collisionGroup: index,
      })
    })
  })

  return positioned
}
