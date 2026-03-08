/**
 * API Route: /api/advisor/transcribe
 *
 * Pipeline de transcription avancé :
 *   GET  — Vérifier la disponibilité (Whisper + LLM)
 *   POST — Transcrire un chunk audio via le pipeline complet :
 *          Whisper STT → Filtrage qualité → Diarisation → LLM post-processing
 *
 * Variables d'environnement :
 *   GROQ_API_KEY   — Groq Cloud (gratuit, whisper-large-v3)
 *   OPENAI_API_KEY — OpenAI (payant, whisper-1)
 *   OLLAMA_BASE_URL — Ollama local pour post-traitement LLM (optionnel)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import {
  runTranscriptionPipeline,
  type PipelineOptions,
} from '@/app/_common/lib/services/transcription-pipeline'

// ── GET — Vérifier la disponibilité du service ──
export async function GET() {
  const hasGroq = !!process.env.GROQ_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

  let ollamaAvailable = false
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(1500) })
    ollamaAvailable = res.ok
  } catch { /* pas dispo */ }

  return NextResponse.json({
    available: hasGroq || hasOpenAI,
    provider: hasGroq ? 'groq' : hasOpenAI ? 'openai' : null,
    llmPostProcessing: ollamaAvailable,
    features: {
      whisperPromptEngineering: true,
      qualityFiltering: true,
      wordTimestamps: hasGroq, // Groq supporte word-level timestamps
      diarization: true,
      llmCorrection: ollamaAvailable,
    },
  })
}

// ── POST — Pipeline de transcription complet ──
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null
    const language = (formData.get('language') as string) || 'fr'
    const speakerHint = (formData.get('speakerHint') as string) || 'conseiller'
    const previousContext = (formData.get('previousContext') as string) || ''
    const chunkIndex = parseInt((formData.get('chunkIndex') as string) || '0', 10)
    const enableLLM = (formData.get('enableLLM') as string) !== 'false'
    const enableDiarization = (formData.get('enableDiarization') as string) !== 'false'

    if (!audioFile) {
      return NextResponse.json({ error: 'Fichier audio manquant (champ "audio")' }, { status: 400 })
    }

    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier audio trop volumineux (max 25 Mo)' }, { status: 400 })
    }

    if (audioFile.size < 5000) {
      return NextResponse.json({ error: 'Fichier audio trop court' }, { status: 400 })
    }

    const groqKey = process.env.GROQ_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    if (!groqKey && !openaiKey) {
      return NextResponse.json({
        error: 'Aucune clé API configurée. Ajoutez GROQ_API_KEY (gratuit sur console.groq.com) ou OPENAI_API_KEY dans .env',
      }, { status: 503 })
    }

    const pipelineOptions: PipelineOptions = {
      language,
      speakerHint,
      previousContext,
      chunkIndex,
      enableLLMCorrection: enableLLM,
      enableDiarization,
    }

    const result = await runTranscriptionPipeline(audioFile, pipelineOptions)

    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('[Transcribe] Erreur pipeline:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur de transcription' },
      { status: 500 }
    )
  }
}
