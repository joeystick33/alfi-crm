/**
 * Tests d'intégration - Création de séries récurrentes
 * 
 * Couvre :
 * - Création DAILY, WEEKLY, MONTHLY, YEARLY
 * - Validation RRULE stricte
 * - Détection conflits sur occurrences multiples
 * - Gestion COUNT et UNTIL
 * - INTERVAL et BYDAY
 */

import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = process.env.TEST_API_URL || 'http://localhost:3000'
const TOKEN = process.env.TEST_AUTH_TOKEN

describe('POST /api/advisor/appointments - Séries Récurrentes', () => {
  let headers: HeadersInit

  beforeAll(() => {
    if (!TOKEN) throw new Error('TEST_AUTH_TOKEN requis')
    headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    }
  })

  describe('Création DAILY', () => {
    it('devrait créer série quotidienne avec COUNT', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Daily standup',
          startDate: '2025-06-02T09:00:00Z',
          endDate: '2025-06-02T09:15:00Z',
          type: 'FOLLOW_UP',
          isRecurring: true,
          recurrenceRule: 'FREQ=DAILY;COUNT=10',
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.appointment.isRecurring).toBe(true)
      expect(data.data.appointment.recurrenceRule).toBe('FREQ=DAILY;COUNT=10')
      expect(data.message).toContain('récurrent créé')
    })

    it('devrait créer série quotidienne avec INTERVAL', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Tous les 2 jours',
          startDate: '2025-06-02T14:00:00Z',
          endDate: '2025-06-02T15:00:00Z',
          type: 'OTHER',
          isRecurring: true,
          recurrenceRule: 'FREQ=DAILY;INTERVAL=2;COUNT=5',
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.data.appointment.recurrenceRule).toContain('INTERVAL=2')
    })

    it('devrait créer série quotidienne avec UNTIL', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Daily jusqu\'à fin juin',
          startDate: '2025-06-02T08:00:00Z',
          endDate: '2025-06-02T09:00:00Z',
          type: 'OTHER',
          isRecurring: true,
          recurrenceRule: 'FREQ=DAILY;UNTIL=20250630T235959Z',
          recurrenceEndDate: '2025-06-30T23:59:59Z',
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.data.appointment.recurrenceEndDate).toBeDefined()
    })
  })

  describe('Création WEEKLY', () => {
    it('devrait créer série hebdomadaire avec BYDAY unique', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Réunion hebdo lundi',
          startDate: '2025-06-02T10:00:00Z', // Lundi
          endDate: '2025-06-02T11:00:00Z',
          type: 'FOLLOW_UP',
          isRecurring: true,
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=8',
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.data.appointment.recurrenceRule).toContain('BYDAY=MO')
    })

    it('devrait créer série hebdomadaire avec BYDAY multiples', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Réunion Lun-Mer-Ven',
          startDate: '2025-06-02T14:00:00Z',
          endDate: '2025-06-02T15:00:00Z',
          type: 'FOLLOW_UP',
          isRecurring: true,
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=12', // 4 semaines × 3 jours
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.data.appointment.recurrenceRule).toContain('BYDAY=MO,WE,FR')
    })

    it('devrait créer série hebdomadaire avec INTERVAL', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Toutes les 2 semaines',
          startDate: '2025-06-02T09:00:00Z',
          endDate: '2025-06-02T10:00:00Z',
          type: 'ANNUAL_REVIEW',
          isRecurring: true,
          recurrenceRule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO;COUNT=6',
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.data.appointment.recurrenceRule).toMatch(/INTERVAL=2/)
      expect(data.data.appointment.recurrenceRule).toMatch(/BYDAY=MO/)
    })
  })

  describe('Création MONTHLY', () => {
    it('devrait créer série mensuelle basique', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Réunion mensuelle',
          startDate: '2025-06-15T10:00:00Z', // 15 du mois
          endDate: '2025-06-15T11:00:00Z',
          type: 'ANNUAL_REVIEW',
          isRecurring: true,
          recurrenceRule: 'FREQ=MONTHLY;COUNT=12', // 1 an
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.data.appointment.recurrenceRule).toBe('FREQ=MONTHLY;COUNT=12')
    })

    it('devrait créer série mensuelle avec UNTIL', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Mensuel jusqu\'à fin année',
          startDate: '2025-06-01T14:00:00Z',
          endDate: '2025-06-01T15:00:00Z',
          type: 'OTHER',
          isRecurring: true,
          recurrenceRule: 'FREQ=MONTHLY;UNTIL=20251231T235959Z',
          recurrenceEndDate: '2025-12-31T23:59:59Z',
        }),
      })

      expect(res.status).toBe(201)
    })

    it('devrait créer série tous les 3 mois', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Trimestriel',
          startDate: '2025-06-01T09:00:00Z',
          endDate: '2025-06-01T10:00:00Z',
          type: 'ANNUAL_REVIEW',
          isRecurring: true,
          recurrenceRule: 'FREQ=MONTHLY;INTERVAL=3;COUNT=4', // 1 an
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.data.appointment.recurrenceRule).toContain('INTERVAL=3')
    })
  })

  describe('Création YEARLY', () => {
    it('devrait créer série annuelle', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Revue annuelle',
          startDate: '2025-06-21T10:00:00Z',
          endDate: '2025-06-21T12:00:00Z',
          type: 'ANNUAL_REVIEW',
          isRecurring: true,
          recurrenceRule: 'FREQ=YEARLY;COUNT=5',
        }),
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.data.appointment.recurrenceRule).toBe('FREQ=YEARLY;COUNT=5')
    })
  })

  describe('Validation RRULE', () => {
    it('devrait rejeter si FREQ manquant', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Invalid',
          startDate: '2025-06-02T10:00:00Z',
          endDate: '2025-06-02T11:00:00Z',
          type: 'OTHER',
          isRecurring: true,
          recurrenceRule: 'COUNT=5', // Manque FREQ
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/RRULE invalide.*FREQ est requis/i)
    })

    it('devrait rejeter FREQ invalide', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Invalid',
          startDate: '2025-06-02T10:00:00Z',
          endDate: '2025-06-02T11:00:00Z',
          type: 'OTHER',
          isRecurring: true,
          recurrenceRule: 'FREQ=HOURLY;COUNT=5', // HOURLY non supporté
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/RRULE invalide|FREQ invalide/i)
    })

    it('devrait rejeter BYDAY invalide', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Invalid',
          startDate: '2025-06-02T10:00:00Z',
          endDate: '2025-06-02T11:00:00Z',
          type: 'OTHER',
          isRecurring: true,
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=XX,YY;COUNT=5',
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/BYDAY invalide|XX/i)
    })

    it('devrait rejeter COUNT > 1000', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Invalid',
          startDate: '2025-06-02T10:00:00Z',
          endDate: '2025-06-02T11:00:00Z',
          type: 'OTHER',
          isRecurring: true,
          recurrenceRule: 'FREQ=DAILY;COUNT=2000',
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/COUNT doit être entre 1 et 1000/i)
    })

    it('devrait rejeter INTERVAL > 1000', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Invalid',
          startDate: '2025-06-02T10:00:00Z',
          endDate: '2025-06-02T11:00:00Z',
          type: 'OTHER',
          isRecurring: true,
          recurrenceRule: 'FREQ=DAILY;INTERVAL=5000;COUNT=2',
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/INTERVAL doit être entre 1 et 1000/i)
    })

    it('devrait rejeter BYMONTHDAY invalide', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Invalid',
          startDate: '2025-06-02T10:00:00Z',
          endDate: '2025-06-02T11:00:00Z',
          type: 'OTHER',
          isRecurring: true,
          recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=35;COUNT=5', // 35 > 31
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/BYMONTHDAY invalide/i)
    })

    it('devrait rejeter BYMONTH invalide', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Invalid',
          startDate: '2025-06-02T10:00:00Z',
          endDate: '2025-06-02T11:00:00Z',
          type: 'OTHER',
          isRecurring: true,
          recurrenceRule: 'FREQ=YEARLY;BYMONTH=13;COUNT=5', // 13 > 12
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/BYMONTH invalide/i)
    })

    it('devrait rejeter si isRecurring=true sans recurrenceRule', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Invalid',
          startDate: '2025-06-02T10:00:00Z',
          endDate: '2025-06-02T11:00:00Z',
          type: 'OTHER',
          isRecurring: true,
          // recurrenceRule manquant
        }),
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/recurrenceRule est requis/i)
    })
  })

  describe('Détection Conflits', () => {
    let existingId: string

    beforeAll(async () => {
      // Créer RDV qui causera conflit
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'RDV bloquant',
          startDate: '2025-07-09T10:00:00Z', // Mercredi 09/07
          endDate: '2025-07-09T11:00:00Z',
          type: 'OTHER',
        }),
      })
      const data = await res.json()
      existingId = data.data.appointment.id
    })

    it('devrait détecter conflit sur une occurrence', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Série avec conflit',
          startDate: '2025-07-07T10:00:00Z', // Lundi 07/07
          endDate: '2025-07-07T11:00:00Z',
          type: 'FOLLOW_UP',
          isRecurring: true,
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=6', // Mercredi 09/07 conflit
        }),
      })

      expect(res.status).toBe(409)
      const data = await res.json()
      expect(data.error).toMatch(/Conflits détectés aux dates/i)
      expect(data.error).toMatch(/09\/07\/2025/i)
    })

    it('devrait lister jusqu\'à 5 conflits', async () => {
      // Créer 4 autres RDV quotidiens
      const promises = []
      for (let i = 10; i <= 13; i++) {
        promises.push(
          fetch(`${API_BASE}/api/advisor/appointments`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              title: `Blocker ${i}`,
              startDate: `2025-07-${i}T10:00:00Z`,
              endDate: `2025-07-${i}T11:00:00Z`,
              type: 'OTHER',
            }),
          })
        )
      }
      await Promise.all(promises)

      // Tenter créer série quotidienne qui entre en conflit
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Série multi-conflits',
          startDate: '2025-07-07T10:00:00Z',
          endDate: '2025-07-07T11:00:00Z',
          type: 'FOLLOW_UP',
          isRecurring: true,
          recurrenceRule: 'FREQ=DAILY;COUNT=10',
        }),
      })

      expect(res.status).toBe(409)
      const data = await res.json()
      expect(data.error).toMatch(/Conflits détectés aux dates/)
      // Vérifier format limité à 5 + compteur
      const matches = data.error.match(/\d{2}\/\d{2}\/\d{4}/g)
      expect(matches?.length).toBeLessThanOrEqual(5)
      expect(data.error).toMatch(/et \d+ autre\(s\)/)
    })

    it('ne devrait pas détecter faux positifs (horaires différents)', async () => {
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Série sans conflit',
          startDate: '2025-07-07T14:00:00Z', // 14h au lieu de 10h
          endDate: '2025-07-07T15:00:00Z',
          type: 'FOLLOW_UP',
          isRecurring: true,
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=6',
        }),
      })

      expect(res.status).toBe(201) // Devrait réussir
    })
  })
})
