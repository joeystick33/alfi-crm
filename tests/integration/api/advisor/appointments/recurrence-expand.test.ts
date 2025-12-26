/**
 * Tests d'intégration - Expansion occurrences récurrentes
 * 
 * Couvre :
 * - GET /api/advisor/appointments/recurring/[id]/expand
 * - Génération occurrences dans plage de dates
 * - Merge instances modifiées
 * - Gestion exceptions
 * - Edge cases plages vides
 */

import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = process.env.TEST_API_URL || 'http://localhost:3000'
const TOKEN = process.env.TEST_AUTH_TOKEN

describe('GET /api/advisor/appointments/recurring/[id]/expand', () => {
  let headers: HeadersInit
  let weeklySeriesId: string
  let dailySeriesId: string

  beforeAll(async () => {
    if (!TOKEN) throw new Error('TEST_AUTH_TOKEN requis')
    headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    }

    // Créer série hebdomadaire pour tests
    const weeklyRes = await fetch(`${API_BASE}/api/advisor/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Série hebdo test',
        startDate: '2025-08-04T10:00:00Z', // Lundi 04/08
        endDate: '2025-08-04T11:00:00Z',
        type: 'FOLLOW_UP',
        isRecurring: true,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO,WE;COUNT=10', // 5 semaines × 2 jours
      }),
    })
    const weeklyData = await weeklyRes.json()
    weeklySeriesId = weeklyData.data.appointment.id

    // Créer série quotidienne
    const dailyRes = await fetch(`${API_BASE}/api/advisor/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Série daily test',
        startDate: '2025-09-01T14:00:00Z',
        endDate: '2025-09-01T15:00:00Z',
        type: 'OTHER',
        isRecurring: true,
        recurrenceRule: 'FREQ=DAILY;COUNT=20',
      }),
    })
    const dailyData = await dailyRes.json()
    dailySeriesId = dailyData.data.appointment.id
  })

  describe('Expansion basique', () => {
    it('devrait expand occurrences dans plage complète', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${weeklySeriesId}/expand?` +
        `viewStart=${encodeURIComponent('2025-08-01T00:00:00Z')}&` +
        `viewEnd=${encodeURIComponent('2025-08-31T23:59:59Z')}`,
        { method: 'GET', headers }
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.data.parentId).toBe(weeklySeriesId)
      expect(data.data.instances).toBeInstanceOf(Array)
      expect(data.data.instances.length).toBe(10) // 5 lundis + 5 mercredis
      expect(data.data.count).toBe(10)
    })

    it('devrait avoir structure correcte par instance', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${weeklySeriesId}/expand?` +
        `viewStart=2025-08-01T00:00:00Z&viewEnd=2025-08-31T23:59:59Z`,
        { method: 'GET', headers }
      )

      const data = await res.json()
      const instance = data.data.instances[0]

      expect(instance).toHaveProperty('id')
      expect(instance).toHaveProperty('parentId', weeklySeriesId)
      expect(instance).toHaveProperty('title', 'Série hebdo test')
      expect(instance).toHaveProperty('startTime')
      expect(instance).toHaveProperty('endTime')
      expect(instance).toHaveProperty('type', 'FOLLOW_UP')
      expect(instance).toHaveProperty('status', 'SCHEDULED')
      expect(instance).toHaveProperty('isRecurringInstance', true)
      expect(instance).toHaveProperty('recurrenceOccurrenceDate')
    })

    it('devrait générer ID unique par occurrence', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${weeklySeriesId}/expand?` +
        `viewStart=2025-08-01T00:00:00Z&viewEnd=2025-08-31T23:59:59Z`,
        { method: 'GET', headers }
      )

      const data = await res.json()
      const ids = data.data.instances.map((inst: any) => inst.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length) // Tous uniques
    })

    it('devrait respecter durée originale', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${weeklySeriesId}/expand?` +
        `viewStart=2025-08-01T00:00:00Z&viewEnd=2025-08-31T23:59:59Z`,
        { method: 'GET', headers }
      )

      const data = await res.json()
      const instance = data.data.instances[0]
      const start = new Date(instance.startTime)
      const end = new Date(instance.endTime)
      const durationMs = end.getTime() - start.getTime()
      expect(durationMs).toBe(60 * 60 * 1000) // 1 heure
    })
  })

  describe('Plages partielles', () => {
    it('devrait retourner occurrences partielles si plage réduite', async () => {
      // Première semaine seulement
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${weeklySeriesId}/expand?` +
        `viewStart=2025-08-04T00:00:00Z&viewEnd=2025-08-10T23:59:59Z`,
        { method: 'GET', headers }
      )

      const data = await res.json()
      expect(data.data.instances.length).toBe(2) // Lundi 04 + Mercredi 06
    })

    it('devrait retourner tableau vide si plage hors série', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${weeklySeriesId}/expand?` +
        `viewStart=2026-01-01T00:00:00Z&viewEnd=2026-01-31T23:59:59Z`,
        { method: 'GET', headers }
      )

      const data = await res.json()
      expect(data.data.instances.length).toBe(0)
      expect(data.data.count).toBe(0)
    })

    it('devrait retourner tableau vide si plage avant début série', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${weeklySeriesId}/expand?` +
        `viewStart=2025-07-01T00:00:00Z&viewEnd=2025-07-31T23:59:59Z`,
        { method: 'GET', headers }
      )

      const data = await res.json()
      expect(data.data.instances.length).toBe(0)
    })

    it('devrait gérer plage englobant toute la série', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${dailySeriesId}/expand?` +
        `viewStart=2025-08-01T00:00:00Z&viewEnd=2025-12-31T23:59:59Z`,
        { method: 'GET', headers }
      )

      const data = await res.json()
      expect(data.data.instances.length).toBe(20) // COUNT=20
    })
  })

  describe('Validation paramètres', () => {
    it('devrait rejeter si viewStart manquant', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${weeklySeriesId}/expand?` +
        `viewEnd=2025-08-31T23:59:59Z`,
        { method: 'GET', headers }
      )

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/Paramètres invalides|viewStart/i)
    })

    it('devrait rejeter si viewEnd manquant', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${weeklySeriesId}/expand?` +
        `viewStart=2025-08-01T00:00:00Z`,
        { method: 'GET', headers }
      )

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/Paramètres invalides|viewEnd/i)
    })

    it('devrait rejeter si dates invalides', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${weeklySeriesId}/expand?` +
        `viewStart=invalid&viewEnd=2025-08-31T23:59:59Z`,
        { method: 'GET', headers }
      )

      expect(res.status).toBe(400)
    })

    it('devrait rejeter si ID non trouvé', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/nonexistent/expand?` +
        `viewStart=2025-08-01T00:00:00Z&viewEnd=2025-08-31T23:59:59Z`,
        { method: 'GET', headers }
      )

      expect(res.status).toBe(404)
    })

    it('devrait rejeter si ID n\'est pas récurrent', async () => {
      // Créer RDV simple
      const simpleRes = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'RDV simple',
          startDate: '2025-08-15T10:00:00Z',
          endDate: '2025-08-15T11:00:00Z',
          type: 'OTHER',
        }),
      })
      const simpleData = await simpleRes.json()
      const simpleId = simpleData.data.appointment.id

      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${simpleId}/expand?` +
        `viewStart=2025-08-01T00:00:00Z&viewEnd=2025-08-31T23:59:59Z`,
        { method: 'GET', headers }
      )

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/pas récurrent/i)
    })
  })

  describe('Gestion exceptions', () => {
    let seriesWithExceptionsId: string

    beforeAll(async () => {
      // Créer série
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Série avec exceptions',
          startDate: '2025-10-06T10:00:00Z', // Lundi
          endDate: '2025-10-06T11:00:00Z',
          type: 'FOLLOW_UP',
          isRecurring: true,
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=5',
        }),
      })
      const data = await res.json()
      seriesWithExceptionsId = data.data.appointment.id

      // Ajouter exception 2e lundi
      await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${seriesWithExceptionsId}/exception`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            occurrenceDate: '2025-10-13T10:00:00Z',
          }),
        }
      )
    })

    it('ne devrait pas inclure occurrence exception', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${seriesWithExceptionsId}/expand?` +
        `viewStart=2025-10-01T00:00:00Z&viewEnd=2025-10-31T23:59:59Z`,
        { method: 'GET', headers }
      )

      const data = await res.json()
      expect(data.data.instances.length).toBe(4) // 5 - 1 exception

      const dates = data.data.instances.map((inst: any) =>
        new Date(inst.recurrenceOccurrenceDate).toISOString().split('T')[0]
      )
      expect(dates).not.toContain('2025-10-13')
    })
  })

  describe('Instances modifiées', () => {
    let seriesWithModifiedId: string

    beforeAll(async () => {
      // Créer série
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Série avec modifications',
          startDate: '2025-11-03T09:00:00Z', // Lundi
          endDate: '2025-11-03T10:00:00Z',
          type: 'FOLLOW_UP',
          isRecurring: true,
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=4',
        }),
      })
      const data = await res.json()
      seriesWithModifiedId = data.data.appointment.id

      // Modifier 2e occurrence
      await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${seriesWithModifiedId}/instance`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            occurrenceDate: '2025-11-10T09:00:00Z',
            updates: {
              title: 'Réunion modifiée',
              startDate: '2025-11-10T14:00:00Z', // Changé à 14h
              endDate: '2025-11-10T15:00:00Z',
            },
            applyToAllFuture: false,
          }),
        }
      )
    })

    it('devrait inclure instance modifiée avec nouvelles données', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${seriesWithModifiedId}/expand?` +
        `viewStart=2025-11-01T00:00:00Z&viewEnd=2025-11-30T23:59:59Z`,
        { method: 'GET', headers }
      )

      const data = await res.json()
      expect(data.data.instances.length).toBe(4)

      const modifiedInstance = data.data.instances.find((inst: any) =>
        new Date(inst.recurrenceOccurrenceDate).toISOString().startsWith('2025-11-10')
      )

      expect(modifiedInstance).toBeDefined()
      expect(modifiedInstance.title).toBe('Réunion modifiée')
      expect(modifiedInstance.startTime).toContain('14:00') // 14h au lieu de 09h
    })

    it('devrait garder données originales pour occurrences non modifiées', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${seriesWithModifiedId}/expand?` +
        `viewStart=2025-11-01T00:00:00Z&viewEnd=2025-11-30T23:59:59Z`,
        { method: 'GET', headers }
      )

      const data = await res.json()
      
      const firstInstance = data.data.instances.find((inst: any) =>
        new Date(inst.recurrenceOccurrenceDate).toISOString().startsWith('2025-11-03')
      )

      expect(firstInstance.title).toBe('Série avec modifications') // Titre original
      expect(firstInstance.startTime).toContain('09:00') // Heure originale
    })
  })

  describe('Performance et limites', () => {
    it('devrait gérer série avec 100+ occurrences', async () => {
      // Créer série quotidienne longue
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Longue série',
          startDate: '2025-12-01T10:00:00Z',
          endDate: '2025-12-01T11:00:00Z',
          type: 'OTHER',
          isRecurring: true,
          recurrenceRule: 'FREQ=DAILY;COUNT=200',
        }),
      })
      const createData = await res.json()
      const longSeriesId = createData.data.appointment.id

      // Expand 3 mois (devrait retourner ~90 occurrences)
      const expandRes = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${longSeriesId}/expand?` +
        `viewStart=2025-12-01T00:00:00Z&viewEnd=2026-02-28T23:59:59Z`,
        { method: 'GET', headers }
      )

      expect(expandRes.status).toBe(200)
      const expandData = await expandRes.json()
      expect(expandData.data.instances.length).toBeGreaterThan(80)
      expect(expandData.data.instances.length).toBeLessThan(100)
    }, 10000) // Timeout 10s
  })
})
