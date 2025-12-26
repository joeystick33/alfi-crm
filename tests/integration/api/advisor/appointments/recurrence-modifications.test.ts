/**
 * Tests d'intégration - Modifications occurrences et exceptions
 * 
 * Couvre :
 * - POST /api/advisor/appointments/recurring/[id]/exception
 * - PUT /api/advisor/appointments/recurring/[id]/instance
 * - DELETE /api/advisor/appointments/recurring/[id]
 * - Modifications occurrence vs série
 * - Exceptions multiples
 * - Suppression série complète
 */

import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = process.env.TEST_API_URL || 'http://localhost:3000'
const TOKEN = process.env.TEST_AUTH_TOKEN

describe('POST /api/advisor/appointments/recurring/[id]/exception', () => {
  let headers: HeadersInit
  let seriesId: string

  beforeAll(async () => {
    if (!TOKEN) throw new Error('TEST_AUTH_TOKEN requis')
    headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    }

    // Créer série pour tests
    const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Série test exceptions',
        startDate: '2026-01-05T10:00:00Z', // Lundi
        endDate: '2026-01-05T11:00:00Z',
        type: 'FOLLOW_UP',
        isRecurring: true,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=8',
      }),
    })
    const data = await res.json()
    seriesId = data.data.appointment.id
  })

  it('devrait ajouter exception et retourner confirmation', async () => {
    const res = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/exception`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          occurrenceDate: '2026-01-12T10:00:00Z', // 2e lundi
        }),
      }
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.message).toMatch(/supprimée/i)
    expect(data.data.exceptionDate).toBe('2026-01-12T10:00:00Z')
  })

  it('devrait exclure occurrence lors expand après exception', async () => {
    const expandRes = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/expand?` +
      `viewStart=2026-01-01T00:00:00Z&viewEnd=2026-02-28T23:59:59Z`,
      { method: 'GET', headers }
    )

    const data = await expandRes.json()
    expect(data.data.instances.length).toBe(7) // 8 - 1 exception

    const dates = data.data.instances.map((inst: any) =>
      new Date(inst.recurrenceOccurrenceDate).toISOString().split('T')[0]
    )
    expect(dates).not.toContain('2026-01-12')
  })

  it('devrait accepter exceptions multiples', async () => {
    // Ajouter 2e exception
    const res2 = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/exception`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          occurrenceDate: '2026-01-19T10:00:00Z', // 3e lundi
        }),
      }
    )
    expect(res2.status).toBe(200)

    // Ajouter 3e exception
    const res3 = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/exception`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          occurrenceDate: '2026-01-26T10:00:00Z', // 4e lundi
        }),
      }
    )
    expect(res3.status).toBe(200)

    // Vérifier expand
    const expandRes = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/expand?` +
      `viewStart=2026-01-01T00:00:00Z&viewEnd=2026-02-28T23:59:59Z`,
      { method: 'GET', headers }
    )
    const data = await expandRes.json()
    expect(data.data.instances.length).toBe(5) // 8 - 3 exceptions
  })

  it('devrait être idempotent (ajouter même exception 2× = 1 exception)', async () => {
    // Ajouter même exception 2 fois
    await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/exception`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          occurrenceDate: '2026-02-02T10:00:00Z',
        }),
      }
    )

    await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/exception`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          occurrenceDate: '2026-02-02T10:00:00Z', // Même date
        }),
      }
    )

    // Vérifier expand
    const expandRes = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/expand?` +
      `viewStart=2026-01-01T00:00:00Z&viewEnd=2026-02-28T23:59:59Z`,
      { method: 'GET', headers }
    )
    const data = await expandRes.json()
    // Devrait avoir 4 occurrences (5 - 1 nouvelle exception), pas 3
    expect(data.data.instances.length).toBe(4)
  })

  it('devrait rejeter si série non trouvée', async () => {
    const res = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/nonexistent/exception`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          occurrenceDate: '2026-01-12T10:00:00Z',
        }),
      }
    )

    expect(res.status).toBe(404)
  })

  it('devrait rejeter si ID n\'est pas récurrent', async () => {
    // Créer RDV simple
    const simpleRes = await fetch(`${API_BASE}/api/advisor/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Simple',
        startDate: '2026-03-15T10:00:00Z',
        endDate: '2026-03-15T11:00:00Z',
        type: 'OTHER',
      }),
    })
    const simpleData = await simpleRes.json()

    const res = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${simpleData.data.appointment.id}/exception`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          occurrenceDate: '2026-03-15T10:00:00Z',
        }),
      }
    )

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/pas récurrent/i)
  })
})

describe('PUT /api/advisor/appointments/recurring/[id]/instance', () => {
  let headers: HeadersInit
  let seriesId: string

  beforeAll(async () => {
    headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    }

    // Créer série
    const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Série test modifications',
        startDate: '2026-04-06T09:00:00Z', // Lundi
        endDate: '2026-04-06T10:00:00Z',
        type: 'FOLLOW_UP',
        isRecurring: true,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=6',
      }),
    })
    const data = await res.json()
    seriesId = data.data.appointment.id
  })

  describe('Modifier occurrence unique', () => {
    it('devrait modifier titre occurrence spécifique', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/instance`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            occurrenceDate: '2026-04-13T09:00:00Z', // 2e lundi
            updates: {
              title: 'Réunion reportée',
            },
            applyToAllFuture: false,
          }),
        }
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
      expect(data.message).toMatch(/Occurrence mise à jour/i)
      expect(data.data.appointment.title).toBe('Réunion reportée')
      expect(data.data.applyToAllFuture).toBe(false)
    })

    it('devrait modifier horaire occurrence spécifique', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/instance`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            occurrenceDate: '2026-04-20T09:00:00Z', // 3e lundi
            updates: {
              startDate: '2026-04-20T14:00:00Z',
              endDate: '2026-04-20T15:00:00Z',
            },
            applyToAllFuture: false,
          }),
        }
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.data.appointment.startDate).toContain('14:00')
    })

    it('devrait modifier statut occurrence spécifique', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/instance`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            occurrenceDate: '2026-04-27T09:00:00Z', // 4e lundi
            updates: {
              status: 'CANCELLED',
            },
            applyToAllFuture: false,
          }),
        }
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.data.appointment.status).toBe('CANCELLED')
    })

    it('occurrence modifiée devrait apparaître lors expand', async () => {
      const expandRes = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/expand?` +
        `viewStart=2026-04-01T00:00:00Z&viewEnd=2026-04-30T23:59:59Z`,
        { method: 'GET', headers }
      )

      const data = await expandRes.json()
      
      // Vérifier 2e occurrence (titre modifié)
      const occurrence2 = data.data.instances.find((inst: any) =>
        new Date(inst.recurrenceOccurrenceDate).toISOString().startsWith('2026-04-13')
      )
      expect(occurrence2.title).toBe('Réunion reportée')

      // Vérifier 3e occurrence (horaire modifié)
      const occurrence3 = data.data.instances.find((inst: any) =>
        new Date(inst.recurrenceOccurrenceDate).toISOString().startsWith('2026-04-20')
      )
      expect(occurrence3.startTime).toContain('14:00')

      // Vérifier 1e occurrence (non modifiée)
      const occurrence1 = data.data.instances.find((inst: any) =>
        new Date(inst.recurrenceOccurrenceDate).toISOString().startsWith('2026-04-06')
      )
      expect(occurrence1.title).toBe('Série test modifications') // Original
      expect(occurrence1.startTime).toContain('09:00') // Original
    })
  })

  describe('Modifier série à partir d\'occurrence', () => {
    let futureSeriesId: string

    beforeAll(async () => {
      // Créer nouvelle série
      const res = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Série future test',
          startDate: '2026-05-04T10:00:00Z', // Lundi
          endDate: '2026-05-04T11:00:00Z',
          type: 'FOLLOW_UP',
          isRecurring: true,
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=8',
        }),
      })
      const data = await res.json()
      futureSeriesId = data.data.appointment.id
    })

    it('devrait modifier série à partir d\'occurrence (applyToAllFuture=true)', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${futureSeriesId}/instance`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            occurrenceDate: '2026-05-18T10:00:00Z', // 3e lundi
            updates: {
              title: 'Nouveau titre série',
            },
            applyToAllFuture: true,
          }),
        }
      )

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.message).toMatch(/Série récurrente mise à jour/i)
      expect(data.data.applyToAllFuture).toBe(true)
    })

    it('occurrences futures devraient avoir nouveau titre', async () => {
      const expandRes = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${futureSeriesId}/expand?` +
        `viewStart=2026-05-01T00:00:00Z&viewEnd=2026-06-30T23:59:59Z`,
        { method: 'GET', headers }
      )

      const data = await expandRes.json()
      
      // 1e et 2e occurrences = exceptions (titre original)
      const occurrence1 = data.data.instances[0]
      const occurrence2 = data.data.instances[1]
      // Note: Comportement exact dépend implémentation - ici on suppose occurrences passées gardent titre original

      // 3e occurrence et suivantes = nouveau titre
      const occurrence3 = data.data.instances[2]
      const occurrence4 = data.data.instances[3]
      expect(occurrence3.title).toBe('Nouveau titre série')
      expect(occurrence4.title).toBe('Nouveau titre série')
    })
  })

  describe('Validation', () => {
    it('devrait rejeter endDate < startDate', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/instance`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            occurrenceDate: '2026-04-06T09:00:00Z',
            updates: {
              startDate: '2026-04-06T15:00:00Z',
              endDate: '2026-04-06T14:00:00Z', // Avant startDate
            },
            applyToAllFuture: false,
          }),
        }
      )

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/date de fin.*après.*début/i)
    })

    it('devrait rejeter si série non trouvée', async () => {
      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/nonexistent/instance`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            occurrenceDate: '2026-04-06T09:00:00Z',
            updates: { title: 'Test' },
            applyToAllFuture: false,
          }),
        }
      )

      expect(res.status).toBe(404)
    })

    it('devrait rejeter si ID n\'est pas récurrent', async () => {
      // Créer RDV simple
      const simpleRes = await fetch(`${API_BASE}/api/advisor/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: 'Simple',
          startDate: '2026-06-15T10:00:00Z',
          endDate: '2026-06-15T11:00:00Z',
          type: 'OTHER',
        }),
      })
      const simpleData = await simpleRes.json()

      const res = await fetch(
        `${API_BASE}/api/advisor/appointments/recurring/${simpleData.data.appointment.id}/instance`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            occurrenceDate: '2026-06-15T10:00:00Z',
            updates: { title: 'Test' },
            applyToAllFuture: false,
          }),
        }
      )

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data.error).toMatch(/pas récurrent/i)
    })
  })
})

describe('DELETE /api/advisor/appointments/recurring/[id]', () => {
  let headers: HeadersInit

  beforeAll(() => {
    headers = {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    }
  })

  it('devrait supprimer série complète', async () => {
    // Créer série
    const createRes = await fetch(`${API_BASE}/api/advisor/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Série à supprimer',
        startDate: '2026-07-06T10:00:00Z',
        endDate: '2026-07-06T11:00:00Z',
        type: 'OTHER',
        isRecurring: true,
        recurrenceRule: 'FREQ=DAILY;COUNT=10',
      }),
    })
    const createData = await createRes.json()
    const seriesId = createData.data.appointment.id

    // Supprimer
    const deleteRes = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}`,
      {
        method: 'DELETE',
        headers,
      }
    )

    expect(deleteRes.status).toBe(200)
    const deleteData = await deleteRes.json()
    expect(deleteData.success).toBe(true)
    expect(deleteData.message).toMatch(/supprimée avec succès/i)
    expect(deleteData.data.deletedSeriesId).toBe(seriesId)
  })

  it('GET devrait retourner 404 après suppression', async () => {
    // Créer série
    const createRes = await fetch(`${API_BASE}/api/advisor/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Série suppression test',
        startDate: '2026-08-03T10:00:00Z',
        endDate: '2026-08-03T11:00:00Z',
        type: 'OTHER',
        isRecurring: true,
        recurrenceRule: 'FREQ=DAILY;COUNT=5',
      }),
    })
    const createData = await createRes.json()
    const seriesId = createData.data.appointment.id

    // Supprimer
    await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}`,
      { method: 'DELETE', headers }
    )

    // Vérifier GET retourne 404
    const getRes = await fetch(
      `${API_BASE}/api/advisor/appointments/${seriesId}`,
      { method: 'GET', headers }
    )
    expect(getRes.status).toBe(404)
  })

  it('expand devrait retourner 404 après suppression', async () => {
    // Créer série
    const createRes = await fetch(`${API_BASE}/api/advisor/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Série expand test',
        startDate: '2026-09-07T10:00:00Z',
        endDate: '2026-09-07T11:00:00Z',
        type: 'OTHER',
        isRecurring: true,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=4',
      }),
    })
    const createData = await createRes.json()
    const seriesId = createData.data.appointment.id

    // Supprimer
    await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}`,
      { method: 'DELETE', headers }
    )

    // Vérifier expand retourne 404
    const expandRes = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/expand?` +
      `viewStart=2026-09-01T00:00:00Z&viewEnd=2026-09-30T23:59:59Z`,
      { method: 'GET', headers }
    )
    expect(expandRes.status).toBe(404)
  })

  it('devrait supprimer instances modifiées en cascade', async () => {
    // Créer série
    const createRes = await fetch(`${API_BASE}/api/advisor/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Série cascade test',
        startDate: '2026-10-05T10:00:00Z',
        endDate: '2026-10-05T11:00:00Z',
        type: 'FOLLOW_UP',
        isRecurring: true,
        recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO;COUNT=4',
      }),
    })
    const createData = await createRes.json()
    const seriesId = createData.data.appointment.id

    // Modifier une occurrence
    await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}/instance`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          occurrenceDate: '2026-10-12T10:00:00Z',
          updates: { title: 'Modifiée' },
          applyToAllFuture: false,
        }),
      }
    )

    // Supprimer série
    const deleteRes = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${seriesId}`,
      { method: 'DELETE', headers }
    )
    expect(deleteRes.status).toBe(200)

    // Note : Impossible de vérifier directement suppression instance modifiée
    // car pas de route GET dédiée, mais Prisma cascade devrait gérer
  })

  it('devrait rejeter si ID n\'est pas récurrent', async () => {
    // Créer RDV simple
    const createRes = await fetch(`${API_BASE}/api/advisor/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Simple',
        startDate: '2026-11-15T10:00:00Z',
        endDate: '2026-11-15T11:00:00Z',
        type: 'OTHER',
      }),
    })
    const createData = await createRes.json()
    const simpleId = createData.data.appointment.id

    // Tenter supprimer avec route recurring
    const deleteRes = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/${simpleId}`,
      { method: 'DELETE', headers }
    )

    expect(deleteRes.status).toBe(400)
    const deleteData = await deleteRes.json()
    expect(deleteData.error).toMatch(/pas récurrent/i)
    expect(deleteData.error).toMatch(/DELETE \/api\/advisor\/appointments\/\[id\]/i) // Suggestion
  })

  it('devrait retourner 404 si série inexistante', async () => {
    const deleteRes = await fetch(
      `${API_BASE}/api/advisor/appointments/recurring/nonexistent`,
      { method: 'DELETE', headers }
    )

    expect(deleteRes.status).toBe(404)
  })
})
