/**
 * Seed — Profils d'assistant IA AURA V2
 * 
 * Crée les profils d'assistant par défaut pour chaque cabinet.
 * Chaque cabinet reçoit 4 profils pré-configurés :
 *   1. AURA Patrimonial (défaut) — Généraliste, ton professionnel
 *   2. AURA Fiscal — Spécialiste fiscal, ton direct
 *   3. AURA Conformité — Spécialiste compliance, ton professionnel
 *   4. AURA Pédagogue — Vulgarisation, ton pédagogique
 * 
 * Usage :
 *   npx tsx prisma/seeds/assistant-profiles-seed.ts
 *   npx tsx prisma/seeds/assistant-profiles-seed.ts --cleanup
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PROFILE_DEFINITIONS = [
  {
    name: 'AURA Patrimonial',
    description:
      'Assistant généraliste couvrant l\'ensemble du conseil patrimonial : fiscalité, épargne, immobilier, prévoyance, succession. Profil par défaut pour les interactions quotidiennes.',
    tone: 'PROFESSIONNEL' as const,
    enabledDomains: [
      'fiscal',
      'patrimoine',
      'retraite',
      'prevoyance',
      'immobilier',
      'succession',
      'assurance_vie',
      'epargne',
    ],
    customSystemPrompt: null,
    enabledFeatures: {
      backgroundMonitoring: true,
      voiceMode: false,
      postMeetingPipeline: true,
      opportunityDetection: true,
      documentGeneration: true,
    },
    maxToolCallsPerRun: 15,
    maxRunSteps: 25,
    requireConfirmForWrites: true,
    isDefault: true,
  },
  {
    name: 'AURA Fiscal',
    description:
      'Spécialiste en optimisation fiscale : IR, IFI, plus-values, PER, Madelin, démembrement, donations et successions. Répond de manière directe et chiffrée.',
    tone: 'DIRECT' as const,
    enabledDomains: [
      'fiscal',
      'retraite',
      'succession',
      'epargne',
    ],
    customSystemPrompt:
      'Tu es spécialisé en optimisation fiscale pour les CGP. Priorise toujours les stratégies fiscales quantifiées. ' +
      'Cite les articles du CGI pertinents. Propose systématiquement des simulations chiffrées via les outils backend. ' +
      'Compare les scénarios avant/après optimisation.',
    enabledFeatures: {
      backgroundMonitoring: false,
      voiceMode: false,
      postMeetingPipeline: false,
      opportunityDetection: true,
      documentGeneration: true,
    },
    maxToolCallsPerRun: 20,
    maxRunSteps: 30,
    requireConfirmForWrites: true,
    isDefault: false,
  },
  {
    name: 'AURA Conformité',
    description:
      'Spécialiste conformité et réglementation : KYC/LCB-FT, MiFID II, DDA, RGPD, ACPR/AMF. Surveille les échéances réglementaires et détecte les manquements.',
    tone: 'PROFESSIONNEL' as const,
    enabledDomains: [
      'compliance',
      'kyc',
      'rgpd',
    ],
    customSystemPrompt:
      'Tu es spécialisé en conformité réglementaire pour les CGP. Vérifie systématiquement les obligations KYC, LCB-FT, ' +
      'DDA et MiFID II. Signale les échéances proches et les manquements détectés. ' +
      'Réfère-toi aux textes réglementaires (CMF, RGAMF, Code des assurances). ' +
      'Propose des plans d\'action correctifs structurés avec priorités.',
    enabledFeatures: {
      backgroundMonitoring: true,
      voiceMode: false,
      postMeetingPipeline: false,
      opportunityDetection: false,
      documentGeneration: true,
    },
    maxToolCallsPerRun: 10,
    maxRunSteps: 15,
    requireConfirmForWrites: true,
    isDefault: false,
  },
  {
    name: 'AURA Pédagogue',
    description:
      'Mode pédagogique pour expliquer des concepts complexes de manière accessible. Idéal pour la formation des assistants ou la vulgarisation client.',
    tone: 'PEDAGOGIQUE' as const,
    enabledDomains: [
      'fiscal',
      'patrimoine',
      'retraite',
      'prevoyance',
      'immobilier',
      'succession',
      'assurance_vie',
      'epargne',
    ],
    customSystemPrompt:
      'Tu es en mode pédagogique. Explique chaque concept avec des analogies simples. ' +
      'Utilise des exemples concrets et chiffrés. Structure tes réponses avec des titres clairs. ' +
      'Propose des "Pour aller plus loin" à la fin de chaque explication. ' +
      'Évite le jargon sauf si tu l\'expliques immédiatement.',
    enabledFeatures: {
      backgroundMonitoring: false,
      voiceMode: true,
      postMeetingPipeline: false,
      opportunityDetection: false,
      documentGeneration: false,
    },
    maxToolCallsPerRun: 8,
    maxRunSteps: 15,
    requireConfirmForWrites: true,
    isDefault: false,
  },
]

async function seedAssistantProfiles() {
  console.log('🤖 Seeding Assistant Profiles...\n')

  const cabinets = await prisma.cabinet.findMany({
    select: { id: true, name: true },
  })

  if (cabinets.length === 0) {
    console.log('⚠️  Aucun cabinet trouvé. Lancez d\'abord le seed principal.')
    return
  }

  let totalCreated = 0

  for (const cabinet of cabinets) {
    console.log(`📦 Cabinet: ${cabinet.name}`)

    for (const def of PROFILE_DEFINITIONS) {
      // Upsert : ne pas recréer si existe déjà
      const existing = await prisma.assistantProfile.findFirst({
        where: { cabinetId: cabinet.id, name: def.name },
      })

      if (existing) {
        console.log(`   ⏭  ${def.name} (existe déjà)`)
        continue
      }

      await prisma.assistantProfile.create({
        data: {
          cabinetId: cabinet.id,
          name: def.name,
          description: def.description,
          tone: def.tone,
          enabledDomains: def.enabledDomains,
          customSystemPrompt: def.customSystemPrompt,
          enabledFeatures: def.enabledFeatures,
          maxToolCallsPerRun: def.maxToolCallsPerRun,
          maxRunSteps: def.maxRunSteps,
          requireConfirmForWrites: def.requireConfirmForWrites,
          isDefault: def.isDefault,
          isActive: true,
        },
      })

      totalCreated++
      console.log(`   ✅ ${def.name} (${def.tone})${def.isDefault ? ' [DÉFAUT]' : ''}`)
    }
  }

  console.log(`\n🎉 ${totalCreated} profil(s) créé(s) pour ${cabinets.length} cabinet(s)`)
}

async function cleanupAssistantProfiles() {
  console.log('🧹 Suppression de tous les profils d\'assistant...')
  const { count } = await prisma.assistantProfile.deleteMany({})
  console.log(`   ✅ ${count} profil(s) supprimé(s)`)
}

const isCleanup = process.argv.includes('--cleanup')

;(async () => {
  try {
    if (isCleanup) {
      await cleanupAssistantProfiles()
    } else {
      await seedAssistantProfiles()
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
})()
