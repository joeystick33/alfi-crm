import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'

// ============================================================================
// API Route — OpenAI TTS (Text-to-Speech)
//
// Voices available (all natural-sounding):
//   • nova    — Warm, engaging female voice (recommended for AURA)
//   • shimmer — Soft, pleasant female voice
//   • alloy   — Neutral, balanced voice
//   • echo    — Deeper male voice
//   • fable   — Expressive, storytelling voice
//   • onyx    — Deep, authoritative male voice
//
// Returns audio/mpeg stream for direct playback
// ============================================================================

const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech'

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req)

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY non configurée' }, { status: 500 })
    }

    const body = await req.json()
    const { text, voice = 'nova', speed = 1.0 } = body as {
      text: string
      voice?: string
      speed?: number
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Texte requis' }, { status: 400 })
    }

    // Clean markdown from text for better speech
    const cleanText = text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`[^`]+`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-•–]\s/g, '')
      .replace(/\|[^|]*\|/g, '') // Remove table pipes
      .replace(/---+/g, '') // Remove separators
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .trim()

    if (!cleanText) {
      return NextResponse.json({ error: 'Texte vide après nettoyage' }, { status: 400 })
    }

    // Limit to ~4000 chars (OpenAI TTS limit is 4096)
    const truncated = cleanText.slice(0, 4000)

    const allowedVoices = ['nova', 'shimmer', 'alloy', 'echo', 'fable', 'onyx']
    const selectedVoice = allowedVoices.includes(voice) ? voice : 'nova'
    const selectedSpeed = Math.max(0.25, Math.min(4.0, speed))

    const response = await fetch(OPENAI_TTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: truncated,
        voice: selectedVoice,
        speed: selectedSpeed,
        response_format: 'mp3',
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => 'unknown')
      console.error('[TTS] OpenAI error:', response.status, err.slice(0, 300))
      return NextResponse.json({ error: 'Erreur TTS' }, { status: 502 })
    }

    // Stream the audio back to the client
    const audioStream = response.body
    if (!audioStream) {
      return NextResponse.json({ error: 'Pas de flux audio' }, { status: 502 })
    }

    return new Response(audioStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    console.error('[TTS] Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
