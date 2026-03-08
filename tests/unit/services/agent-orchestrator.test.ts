/**
 * Tests unitaires pour les fonctions critiques de l'agent orchestrator
 * - parseToolCallsFromResponse
 * - cleanResponseFromToolCalls
 * - extractTopics (via export interne)
 */

import { describe, it, expect } from 'vitest'
import { parseToolCallsFromResponse, cleanResponseFromToolCalls } from '@/app/_common/lib/services/agent/agent-orchestrator'

// ============================================================================
// parseToolCallsFromResponse
// ============================================================================

describe('parseToolCallsFromResponse', () => {
  it('should parse a simple ACTION tag with string params', () => {
    const response = 'Voici le résultat [ACTION: search_clients(query="Dupont")]'
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(1)
    expect(calls[0].toolName).toBe('search_clients')
    expect(calls[0].params).toEqual({ query: 'Dupont' })
  })

  it('should parse multiple ACTION tags', () => {
    const response = `
      Je vais chercher. [ACTION: search_clients(query="Martin")]
      Et aussi vos tâches. [ACTION: get_upcoming_tasks()]
    `
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(2)
    expect(calls[0].toolName).toBe('search_clients')
    expect(calls[1].toolName).toBe('get_upcoming_tasks')
  })

  it('should parse ACTION with multiple params', () => {
    const response = '[ACTION: create_task(title="Appeler Dupont", type="APPEL", priority="HAUTE")]'
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(1)
    expect(calls[0].params).toEqual({
      title: 'Appeler Dupont',
      type: 'APPEL',
      priority: 'HAUTE',
    })
  })

  it('should parse numeric values without quotes', () => {
    const response = '[ACTION: search_clients(minPatrimoine=500000, limit=5)]'
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(1)
    expect(calls[0].params.minPatrimoine).toBe(500000)
    expect(calls[0].params.limit).toBe(5)
  })

  it('should parse boolean values', () => {
    const response = '[ACTION: search_clients(query="test", active=true)]'
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(1)
    expect(calls[0].params.active).toBe(true)
  })

  it('should parse float numeric values', () => {
    const response = '[ACTION: search_clients(minPatrimoine=123.45)]'
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(1)
    expect(calls[0].params.minPatrimoine).toBe(123.45)
  })

  it('should parse single-quoted values', () => {
    const response = "[ACTION: search_clients(query='Martin')]"
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(1)
    expect(calls[0].params.query).toBe('Martin')
  })

  it('should handle escaped quotes in values', () => {
    const response = '[ACTION: create_task(title="Appeler \\"M. Dupont\\"")]'
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(1)
    expect(calls[0].params.title).toBe('Appeler "M. Dupont"')
  })

  it('should return empty array for no ACTION tags', () => {
    const response = 'Bonjour, comment puis-je vous aider ?'
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(0)
  })

  it('should ignore ACTION tags with unknown tool names', () => {
    const response = '[ACTION: unknown_tool(param="value")]'
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(0)
  })

  it('should handle ACTION with empty params', () => {
    const response = '[ACTION: get_dashboard_stats()]'
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(1)
    expect(calls[0].toolName).toBe('get_dashboard_stats')
    expect(calls[0].params).toEqual({})
  })

  it('should handle ACTION with whitespace around colon', () => {
    const response = '[ACTION:  search_clients(query="test") ]'
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(1)
    expect(calls[0].toolName).toBe('search_clients')
  })

  it('should handle multiline ACTION tag', () => {
    const response = `[ACTION: create_task(
      title="Suivi Dupont",
      type="AUTRE"
    )]`
    const calls = parseToolCallsFromResponse(response)
    expect(calls).toHaveLength(1)
    expect(calls[0].params.title).toBe('Suivi Dupont')
    expect(calls[0].params.type).toBe('AUTRE')
  })
})

// ============================================================================
// cleanResponseFromToolCalls
// ============================================================================

describe('cleanResponseFromToolCalls', () => {
  it('should remove ACTION tags from response', () => {
    const response = 'Voici le résultat [ACTION: search_clients(query="Dupont")] de la recherche.'
    const cleaned = cleanResponseFromToolCalls(response)
    expect(cleaned).toBe('Voici le résultat  de la recherche.')
  })

  it('should remove multiple ACTION tags', () => {
    const response = '[ACTION: search_clients(query="test")] Résultat [ACTION: get_dashboard_stats()]'
    const cleaned = cleanResponseFromToolCalls(response)
    expect(cleaned).toBe('Résultat')
  })

  it('should return trimmed response when no ACTION tags', () => {
    const response = '  Bonjour !  '
    const cleaned = cleanResponseFromToolCalls(response)
    expect(cleaned).toBe('Bonjour !')
  })

  it('should handle multiline ACTION tags', () => {
    const response = `Texte avant [ACTION: create_task(
      title="Test",
      type="AUTRE"
    )] texte après`
    const cleaned = cleanResponseFromToolCalls(response)
    expect(cleaned).toBe('Texte avant  texte après')
  })
})
