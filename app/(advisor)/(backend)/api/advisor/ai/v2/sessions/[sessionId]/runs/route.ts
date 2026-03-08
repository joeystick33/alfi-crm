/**
 * API Route — AURA V2 : Exécution de runs dans une session
 * 
 * GET  : Liste les runs d'une session
 * POST : Crée et exécute un nouveau run (message utilisateur → réponse agent)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { AgentRuntime } from '@/app/_common/lib/services/aura-v2/agent-runtime'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { user, cabinetId } = await requireAuth(req)
    const { sessionId } = await params
    const prisma = getPrismaClient(cabinetId, false)

    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // Vérifier l'accès à la session
    const session = await prisma.aISession.findFirst({
      where: { id: sessionId, cabinetId, userId: user.id },
      select: { id: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    const runs = await prisma.aIRun.findMany({
      where: { sessionId },
      include: {
        steps: {
          select: {
            id: true,
            stepNumber: true,
            type: true,
            status: true,
            agentRole: true,
            durationMs: true,
            tokensUsed: true,
          },
          orderBy: { stepNumber: 'asc' },
        },
        toolCalls: {
          select: {
            id: true,
            toolName: true,
            toolCategory: true,
            status: true,
            resultSummary: true,
            durationMs: true,
            reasoning: true,
          },
        },
        _count: {
          select: { validations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const formatted = runs.map(r => ({
      id: r.id,
      status: r.status,
      type: r.type,
      userMessage: r.userMessage,
      intent: r.intent,
      intentConfidence: r.intentConfidence,
      response: r.response,
      plan: r.plan,
      criticScore: r.criticScore,
      criticPassed: r.criticPassed,
      tokensInput: r.tokensInput,
      tokensOutput: r.tokensOutput,
      totalTokens: r.totalTokens,
      durationMs: r.durationMs,
      modelUsed: r.modelUsed,
      providerUsed: r.providerUsed,
      error: r.error,
      steps: r.steps,
      toolCalls: r.toolCalls,
      validationsCount: r._count.validations,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
    }))

    return NextResponse.json({ runs: formatted })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI V2 Runs GET]', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { user, cabinetId } = await requireAuth(req)
    const { sessionId } = await params
    const prisma = getPrismaClient(cabinetId, false)

    // Vérifier l'accès et le statut de la session
    const session = await prisma.aISession.findFirst({
      where: { id: sessionId, cabinetId, userId: user.id },
      select: { id: true, status: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Session en statut ${session.status} — impossible de créer un run` },
        { status: 400 },
      )
    }

    const body = await req.json()
    const { message, type, clientId, pageContext } = body as {
      message: string
      type?: string
      clientId?: string
      pageContext?: { page: string; section?: string; entityId?: string; entityType?: string }
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    if (message.length > 10_000) {
      return NextResponse.json({ error: 'Message trop long (max 10 000 caractères)' }, { status: 400 })
    }

    // Exécuter le run via l'Agent Runtime
    const runtime = new AgentRuntime(cabinetId, user.id)
    const result = await runtime.executeRun({
      userMessage: message.trim(),
      sessionId,
      clientId: clientId || undefined,
      pageContext: pageContext || undefined,
      type: type as 'CHAT' | 'TOOL_CALL' | 'ANALYSIS' | 'SIMULATION' | 'WORKFLOW' | 'BACKGROUND' | 'VOICE' | 'DRAFT' | undefined,
    })

    return NextResponse.json({
      run: {
        id: result.runId,
        status: result.status,
        response: result.response,
        metadata: {
          intent: result.metadata.intent,
          intentConfidence: result.metadata.intentConfidence,
          confidence: result.metadata.confidence,
          durationMs: result.metadata.durationMs,
          modelUsed: result.metadata.modelUsed,
          providerUsed: result.metadata.providerUsed,
          connectionMode: result.metadata.connectionMode,
          warnings: result.metadata.warnings,
        },
        toolCalls: result.toolCalls.map(tc => ({
          toolName: tc.toolName,
          success: tc.success,
          message: tc.message,
          durationMs: tc.durationMs,
          navigationUrl: tc.navigationUrl,
        })),
        plan: result.plan ? {
          strategy: result.plan.strategy,
          stepsCount: result.plan.steps.length,
          requiresConfirmation: result.plan.requiresConfirmation,
        } : null,
        criticReport: result.criticReport ? {
          passed: result.criticReport.passed,
          score: result.criticReport.score,
          recommendation: result.criticReport.recommendation,
        } : null,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI V2 Runs POST]', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
