/**
 * API Route — AURA V2 : Test d'une clé API avant création de connexion
 * 
 * POST : Teste une clé API pour vérifier qu'elle fonctionne
 *        Ne crée pas de connexion, ne stocke rien.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
import type { AIProviderType } from '@/app/_common/lib/services/aura-v2'
import { PROVIDER_REGISTRY } from '@/app/_common/lib/services/aura-v2'

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req)

    const body = await req.json()
    const { provider, apiKey } = body as {
      provider: AIProviderType
      apiKey: string
    }

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider et clé API requis' },
        { status: 400 },
      )
    }

    const config = PROVIDER_REGISTRY[provider]
    if (!config) {
      return NextResponse.json(
        { error: `Provider invalide: ${provider}` },
        { status: 400 },
      )
    }

    // Test the API key by making a minimal request to the provider
    const result = await testProviderKey(provider, apiKey, config)

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI V2 Test Connection]', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

async function testProviderKey(
  provider: AIProviderType,
  apiKey: string,
  config: typeof PROVIDER_REGISTRY[AIProviderType],
): Promise<{ success: boolean; message: string; models?: string[]; account?: string }> {
  try {
    switch (provider) {
      case 'OPENAI': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        })
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          const errMsg = (errBody as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`
          return { success: false, message: `Clé OpenAI invalide: ${errMsg}` }
        }
        const data = await res.json() as { data: Array<{ id: string }> }
        const models = data.data?.map(m => m.id).filter(id =>
          id.startsWith('gpt-4') || id.startsWith('gpt-3') || id.startsWith('o1') || id.startsWith('o3')
        ).sort()
        return { success: true, message: 'Clé OpenAI valide', models }
      }

      case 'ANTHROPIC': {
        // Anthropic: test with a minimal messages request
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }],
          }),
        })
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          const errType = (errBody as { error?: { type?: string } })?.error?.type || ''
          if (errType === 'authentication_error') {
            return { success: false, message: 'Clé Anthropic invalide' }
          }
          // If it's a rate limit or other error, the key is still valid
          if (res.status === 429 || res.status === 529) {
            return { success: true, message: 'Clé Anthropic valide (rate limit atteint)' }
          }
          const errMsg = (errBody as { error?: { message?: string } })?.error?.message || `HTTP ${res.status}`
          return { success: false, message: `Erreur Anthropic: ${errMsg}` }
        }
        return { success: true, message: 'Clé Anthropic valide' }
      }

      case 'MISTRAL': {
        const res = await fetch('https://api.mistral.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        })
        if (!res.ok) {
          return { success: false, message: `Clé Mistral invalide (HTTP ${res.status})` }
        }
        return { success: true, message: 'Clé Mistral valide' }
      }

      case 'GROQ': {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        })
        if (!res.ok) {
          return { success: false, message: `Clé Groq invalide (HTTP ${res.status})` }
        }
        return { success: true, message: 'Clé Groq valide' }
      }

      case 'GOOGLE_VERTEX': {
        // Google uses service account keys, harder to test simply
        // Just validate it's a valid JSON key
        try {
          const parsed = JSON.parse(apiKey)
          if (parsed.type === 'service_account' && parsed.project_id) {
            return { success: true, message: `Clé Google Vertex valide (projet: ${parsed.project_id})` }
          }
          return { success: false, message: 'Clé JSON Google invalide : type "service_account" requis' }
        } catch {
          return { success: false, message: 'Clé Google Vertex doit être un fichier JSON de service account' }
        }
      }

      case 'COHERE': {
        const res = await fetch('https://api.cohere.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        })
        if (!res.ok) {
          return { success: false, message: `Clé Cohere invalide (HTTP ${res.status})` }
        }
        return { success: true, message: 'Clé Cohere valide' }
      }

      default:
        return { success: false, message: `Provider ${provider} non supporté pour le test` }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, message: `Erreur de connexion: ${msg}` }
  }
}
