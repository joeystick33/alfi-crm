export type AppointmentType =
  | 'FIRST_MEETING'
  | 'SUIVI'
  | 'ANNUAL_REVIEW'
  | 'SIGNING'
  | 'PHONE_CALL'
  | 'VIDEO_CALL'
  | 'AUTRE'

export type AppointmentStatus =
  | 'PLANIFIE'
  | 'CONFIRME'
  | 'TERMINE'
  | 'ANNULE'
  | 'ABSENT'

export interface ClientSummary {
  id: string
  name: string
  email?: string
  phone?: string
}

export interface Collaborator {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string
  role: string
}

export interface Appointment {
  id: string
  title: string
  description?: string
  start: string
  end: string
  type: AppointmentType
  status: AppointmentStatus
  location?: string
  isVirtual: boolean
  meetingUrl?: string
  clientId?: string
  client?: ClientSummary
  collaboratorIds: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}
