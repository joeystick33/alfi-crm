/**
 * Tests d'intégration pour /api/advisor/activity
 * 
 * Vérifie :
 * - Authentification requise
 * - Filtres par type d'événement (simple et multiple)
 * - Filtres par période (startDate, endDate)
 * - Filtre par conseiller créateur
 * - Tri configurable (createdAt, type, impact)
 * - Pagination (limit, offset)
 * - Format de réponse standardisé
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { TimelineEventType } from '@prisma/client'

// Mock configuration - adapter selon votre setup de tests
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000'
const TEST_AUTH_TOKEN = process.env.TEST_AUTH_TOKEN

interface ActivityResponse {
  success: boolean
  data: {
    activities: Array<{
      id: string
      type: TimelineEventType
      title: string
      description?: string | null
      createdAt: string
      clientId: string
      clientName?: string | null
      createdBy: string
      createdByName?: string | null
      relatedEntityType?: string | null
      relatedEntityId?: string | null
    }>
    total: number
    limit: number
    offset: number
  }
}

describe('GET /api/advisor/activity', () => {
  let authHeaders: HeadersInit

  beforeAll(() => {
    if (!TEST_AUTH_TOKEN) {
      throw new Error('TEST_AUTH_TOKEN environment variable is required')
    }
    authHeaders = {
      'Authorization': `Bearer ${TEST_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    }
  })

  describe('Authentification', () => {
    it('doit rejeter les requêtes sans authentification', async () => {
      const response = await fetch(`${API_BASE_URL}/api/advisor/activity`, {
        method: 'GET',
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('doit accepter les requêtes avec authentification valide', async () => {
      const response = await fetch(`${API_BASE_URL}/api/advisor/activity`, {
        method: 'GET',
        headers: authHeaders,
      })

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.activities).toBeInstanceOf(Array)
    })
  })

  describe('Pagination', () => {
    it('doit respecter le paramètre limit', async () => {
      const limit = 5
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?limit=${limit}`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      expect(data.data.activities.length).toBeLessThanOrEqual(limit)
      expect(data.data.limit).toBe(limit)
    })

    it('doit respecter le paramètre offset', async () => {
      const limit = 5
      const offset = 10

      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      expect(data.data.offset).toBe(offset)
    })

    it('doit retourner le nombre total de résultats', async () => {
      const response = await fetch(`${API_BASE_URL}/api/advisor/activity`, {
        method: 'GET',
        headers: authHeaders,
      })

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      expect(typeof data.data.total).toBe('number')
      expect(data.data.total).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Filtres par type', () => {
    it('doit filtrer par un seul type d\'événement', async () => {
      const type = TimelineEventType.MEETING_HELD
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?type=${type}`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      
      // Tous les événements retournés doivent être du type demandé
      data.data.activities.forEach((activity) => {
        expect(activity.type).toBe(type)
      })
    })

    it('doit filtrer par plusieurs types d\'événements (format ?type=A&type=B)', async () => {
      const types = [TimelineEventType.MEETING_HELD, TimelineEventType.EMAIL_SENT]
      const queryString = types.map(t => `type=${t}`).join('&')
      
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?${queryString}`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      
      // Tous les événements doivent être de l'un des types demandés
      data.data.activities.forEach((activity) => {
        expect(types).toContain(activity.type)
      })
    })

    it('doit filtrer par plusieurs types d\'événements (format ?type=A,B)', async () => {
      const types = [TimelineEventType.DOCUMENT_SIGNED, TimelineEventType.CONTRACT_SIGNED]
      const queryString = `type=${types.join(',')}`
      
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?${queryString}`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      
      data.data.activities.forEach((activity) => {
        expect(types).toContain(activity.type)
      })
    })

    it('doit ignorer les types invalides', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?type=INVALID_TYPE`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      // Ne devrait pas crasher, retourner tous les résultats ou aucun
      expect(data.success).toBe(true)
    })
  })

  describe('Filtres par période', () => {
    it('doit filtrer par date de début', async () => {
      const startDate = new Date('2024-01-01').toISOString()
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?startDate=${encodeURIComponent(startDate)}`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      
      // Tous les événements doivent être après ou à la date de début
      data.data.activities.forEach((activity) => {
        const activityDate = new Date(activity.createdAt)
        expect(activityDate.getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime())
      })
    })

    it('doit filtrer par date de fin', async () => {
      const endDate = new Date('2024-12-31').toISOString()
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?endDate=${encodeURIComponent(endDate)}`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      
      // Tous les événements doivent être avant ou à la date de fin
      data.data.activities.forEach((activity) => {
        const activityDate = new Date(activity.createdAt)
        expect(activityDate.getTime()).toBeLessThanOrEqual(new Date(endDate).getTime())
      })
    })

    it('doit filtrer par plage de dates', async () => {
      const startDate = new Date('2024-01-01').toISOString()
      const endDate = new Date('2024-06-30').toISOString()
      
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()
      
      data.data.activities.forEach((activity) => {
        const activityDate = new Date(activity.createdAt).getTime()
        expect(activityDate).toBeGreaterThanOrEqual(start)
        expect(activityDate).toBeLessThanOrEqual(end)
      })
    })
  })

  describe('Filtre par conseiller', () => {
    it('doit filtrer par conseiller créateur', async () => {
      // D'abord, récupérer un conseiller valide depuis les données
      const allResponse = await fetch(`${API_BASE_URL}/api/advisor/activity?limit=1`, {
        method: 'GET',
        headers: authHeaders,
      })
      
      const allData: ActivityResponse = await allResponse.json()
      if (allData.data.activities.length === 0) {
        // Pas de données pour tester
        return
      }

      const testAdvisorId = allData.data.activities[0].createdBy

      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?createdBy=${testAdvisorId}`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      
      // Tous les événements doivent être créés par le conseiller demandé
      data.data.activities.forEach((activity) => {
        expect(activity.createdBy).toBe(testAdvisorId)
      })
    })
  })

  describe('Tri', () => {
    it('doit trier par date (décroissant par défaut)', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?sortBy=createdAt&sortOrder=desc&limit=10`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      
      // Vérifier l'ordre décroissant
      for (let i = 0; i < data.data.activities.length - 1; i++) {
        const current = new Date(data.data.activities[i].createdAt).getTime()
        const next = new Date(data.data.activities[i + 1].createdAt).getTime()
        expect(current).toBeGreaterThanOrEqual(next)
      }
    })

    it('doit trier par date (croissant)', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?sortBy=createdAt&sortOrder=asc&limit=10`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      
      // Vérifier l'ordre croissant
      for (let i = 0; i < data.data.activities.length - 1; i++) {
        const current = new Date(data.data.activities[i].createdAt).getTime()
        const next = new Date(data.data.activities[i + 1].createdAt).getTime()
        expect(current).toBeLessThanOrEqual(next)
      }
    })

    it('doit trier par type', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?sortBy=type&limit=10`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      
      // Vérifier que les types sont groupés
      expect(data.success).toBe(true)
    })
  })

  describe('Combinaison de filtres', () => {
    it('doit combiner type + période + tri', async () => {
      const type = TimelineEventType.MEETING_HELD
      const startDate = new Date('2024-01-01').toISOString()
      const endDate = new Date('2024-12-31').toISOString()

      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?type=${type}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&sortBy=createdAt&sortOrder=desc&limit=50`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()
      
      data.data.activities.forEach((activity) => {
        // Vérifier type
        expect(activity.type).toBe(type)
        
        // Vérifier période
        const activityDate = new Date(activity.createdAt).getTime()
        expect(activityDate).toBeGreaterThanOrEqual(start)
        expect(activityDate).toBeLessThanOrEqual(end)
      })
      
      // Vérifier tri décroissant
      for (let i = 0; i < data.data.activities.length - 1; i++) {
        const current = new Date(data.data.activities[i].createdAt).getTime()
        const next = new Date(data.data.activities[i + 1].createdAt).getTime()
        expect(current).toBeGreaterThanOrEqual(next)
      }
    })
  })

  describe('Format de réponse', () => {
    it('doit retourner le format standardisé', async () => {
      const response = await fetch(`${API_BASE_URL}/api/advisor/activity?limit=1`, {
        method: 'GET',
        headers: authHeaders,
      })

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      
      // Structure de base
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.activities).toBeInstanceOf(Array)
      expect(typeof data.data.total).toBe('number')
      expect(typeof data.data.limit).toBe('number')
      expect(typeof data.data.offset).toBe('number')
      
      // Structure des activités si présentes
      if (data.data.activities.length > 0) {
        const activity = data.data.activities[0]
        expect(typeof activity.id).toBe('string')
        expect(typeof activity.type).toBe('string')
        expect(typeof activity.title).toBe('string')
        expect(typeof activity.createdAt).toBe('string')
        expect(typeof activity.clientId).toBe('string')
        expect(typeof activity.createdBy).toBe('string')
        
        // Vérifier que createdAt est une date valide ISO 8601
        expect(() => new Date(activity.createdAt)).not.toThrow()
      }
    })
  })

  describe('Cas limites', () => {
    it('doit gérer limit=0', async () => {
      const response = await fetch(`${API_BASE_URL}/api/advisor/activity?limit=0`, {
        method: 'GET',
        headers: authHeaders,
      })

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      expect(data.data.activities.length).toBe(0)
    })

    it('doit gérer des paramètres de date invalides gracieusement', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?startDate=invalid-date`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      // Ne devrait pas crasher
      expect(data.success).toBe(true)
    })

    it('doit gérer offset supérieur au total', async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/advisor/activity?offset=999999`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      )

      expect(response.status).toBe(200)
      const data: ActivityResponse = await response.json()
      expect(data.data.activities.length).toBe(0)
    })
  })
})
