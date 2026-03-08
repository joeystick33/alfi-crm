/**
 * API Route — AURA V2 : Gestion des profils d'assistant IA
 * 
 * GET  /api/advisor/ai/v2/profiles — Liste les profils du cabinet
 * POST /api/advisor/ai/v2/profiles — Crée un nouveau profil
 */

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/app/_common/lib/auth-helpers'

// Singleton Prisma direct (même pattern que connections/sessions)
const globalForPrisma = globalThis as unknown as { __profilesPrisma?: PrismaClient }
if (!globalForPrisma.__profilesPrisma) {
  globalForPrisma.__profilesPrisma = new PrismaClient()
}
const routePrisma = globalForPrisma.__profilesPrisma

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cabinetId } = auth

    const profiles = await routePrisma.assistantProfile.findMany({
      where: { cabinetId, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        tone: true,
        enabledDomains: true,
        enabledFeatures: true,
        customSystemPrompt: true,
        maxToolCallsPerRun: true,
        maxRunSteps: true,
        requireConfirmForWrites: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sessions: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('[AI V2 Profiles GET]', error)
    return NextResponse.json(
      { error: 'Failed to load profiles' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cabinetId } = auth
    const body = await request.json()

    const {
      name,
      description,
      tone = 'PROFESSIONNEL',
      enabledDomains = [],
      customSystemPrompt,
      enabledFeatures,
      maxToolCallsPerRun = 10,
      maxRunSteps = 20,
      requireConfirmForWrites = true,
      isDefault = false,
    } = body

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Le nom du profil est requis (min 2 caractères)' },
        { status: 400 },
      )
    }

    // Si isDefault, désactiver l'ancien défaut
    if (isDefault) {
      await routePrisma.assistantProfile.updateMany({
        where: { cabinetId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const profile = await routePrisma.assistantProfile.create({
      data: {
        cabinetId,
        name: name.trim(),
        description: description?.trim() || null,
        tone,
        enabledDomains,
        customSystemPrompt: customSystemPrompt?.trim() || null,
        enabledFeatures: enabledFeatures || null,
        maxToolCallsPerRun,
        maxRunSteps,
        requireConfirmForWrites,
        isDefault,
        isActive: true,
      },
    })

    return NextResponse.json({ profile }, { status: 201 })
  } catch (error) {
    console.error('[AI V2 Profiles POST]', error)
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 },
    )
  }
}
