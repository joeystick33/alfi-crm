import { NextRequest, NextResponse } from 'next/server'
import { aiCapability, aiStatus } from '@/app/_common/lib/services/ai-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { narrativeRequestSchema, validateRequest } from '@/app/_common/lib/validations/ai-schemas'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// API Route — Génération de narratifs enrichis par IA
// Utilise le service IA centralisé (ai-service.ts) avec cache, rate-limit, queue
// ============================================================================

interface NarrativeRequest {
  type: 'synthese' | 'budget' | 'fiscalite' | 'retraite' | 'succession' | 'preconisation' | 'immobilier' | 'financier'
  context: Record<string, unknown>
  clientName?: string
}

function buildPrompt(req: NarrativeRequest): string {
  const ctx = req.context
  const name = req.clientName || 'le client'

  switch (req.type) {
    case 'synthese':
      return `Rédige la synthèse globale de l'audit patrimonial de ${name}.

Données clés :
- Score global : ${ctx.scoreGlobal}/100
- Points forts : ${JSON.stringify(ctx.pointsForts)}
- Points de vigilance : ${JSON.stringify(ctx.pointsVigilance)}
- Actions prioritaires : ${JSON.stringify(ctx.actionsPrioritaires)}
- Patrimoine net : ${ctx.patrimoineNet}€
- Revenus mensuels : ${ctx.revenusMensuels}€
- Âge : ${ctx.age} ans
- Situation : ${ctx.situationFamiliale}, ${ctx.nbEnfants} enfant(s)

Rédige une synthèse de 3 paragraphes : (1) vue d'ensemble et score, (2) forces et atouts, (3) axes d'amélioration et prochaines étapes.`

    case 'budget':
      return `Rédige l'analyse budgétaire de ${name}.

Données :
- Revenus mensuels : ${ctx.revenusMensuels}€
- Charges mensuelles : ${ctx.chargesMensuelles}€
- Taux d'effort : ${ctx.tauxEffort}%
- Taux d'épargne : ${ctx.tauxEpargne}%
- Reste à vivre : ${ctx.resteAVivre}€/mois
- Capacité d'épargne : ${ctx.capaciteEpargne}€/mois
- Détail revenus : ${JSON.stringify(ctx.detailRevenus)}
- Détail charges : ${JSON.stringify(ctx.detailCharges)}

Analyse la santé budgétaire, compare aux normes (taux d'effort < 33%, taux d'épargne > 15%), et formule des recommandations concrètes.`

    case 'fiscalite':
      return `Rédige l'analyse fiscale de ${name}.

Données :
- IR total : ${ctx.irTotal}€
- TMI : ${ctx.tmi}%
- Taux effectif : ${ctx.tauxEffectif}%
- Revenu imposable : ${ctx.revenuImposable}€
- Nombre de parts : ${ctx.nombreParts}
- IFI : assujetti = ${ctx.ifiAssujetti}, montant = ${ctx.ifiMontant}€
- Économies fiscales potentielles : ${ctx.economiesPotentielles}€
- Stratégies identifiées : ${JSON.stringify(ctx.strategies)}

Analyse la pression fiscale globale (IR + PS + IFI), compare au profil du client, et détaille les leviers d'optimisation par ordre d'impact. Cite les articles CGI pertinents.`

    case 'retraite':
      return `Rédige l'analyse retraite de ${name}.

Données :
- Âge actuel : ${ctx.age} ans
- Âge de départ souhaité : ${ctx.ageDepartChoisi} ans
- Pension estimée : ${ctx.pensionEstimee}€/mois
- Revenu souhaité : ${ctx.revenuSouhaite}€/mois
- Gap mensuel : ${ctx.gapMensuel}€/mois
- Taux de remplacement : ${ctx.tauxRemplacement}%
- Épargne retraite actuelle : ${ctx.epargneRetraite}€
- Capital nécessaire (règle 4%) : ${ctx.capitalNecessaire}€

Analyse la viabilité du projet retraite, le taux de remplacement vs les normes, et propose un plan d'action chiffré pour combler le déficit éventuel.`

    case 'succession':
      return `Rédige l'analyse successorale de ${name}.

Données :
- Patrimoine net taxable : ${ctx.patrimoineNetTaxable}€
- Nombre d'enfants : ${ctx.nbEnfants}
- Droits estimés : ${ctx.droitsEstimes}€
- Taux effectif : ${ctx.tauxEffectif}%
- Abattement total : ${ctx.abattementTotal}€
- Assurance-vie totale : ${ctx.totalAV}€
- Régime matrimonial : ${ctx.regimeMatrimonial}

Analyse l'exposition aux droits DMTG, l'impact du régime matrimonial, et détaille les stratégies d'optimisation (donation-partage art. 1076 CC, démembrement art. 669 CGI, assurance-vie art. 990 I CGI). Chiffre les économies potentielles.`

    case 'preconisation':
      return `Rédige la description détaillée de cette préconisation patrimoniale pour ${name}.

Préconisation : ${ctx.titre}
Catégorie : ${ctx.categorie}
Produit : ${ctx.produit}
Montant estimé : ${ctx.montantEstime}€
Objectif : ${ctx.objectif}

Contexte client :
- Âge : ${ctx.age} ans, TMI : ${ctx.tmi}%
- Capacité d'épargne : ${ctx.capaciteEpargne}€/mois
- Patrimoine : ${ctx.patrimoineNet}€

Rédige une description détaillée en 2-3 paragraphes : (1) pourquoi cette préconisation est adaptée au profil, (2) mécanisme fiscal et avantages concrets chiffrés, (3) mise en œuvre et calendrier suggéré.`

    case 'immobilier':
      return `Rédige l'analyse du patrimoine immobilier de ${name}.

Données :
- Total immobilier : ${ctx.totalImmobilier}€
- Poids dans le patrimoine : ${ctx.poidsPatrimoine}%
- Nombre de biens : ${ctx.nbBiens}
- Détail biens : ${JSON.stringify(ctx.biens)}
- Concentration risque : ${ctx.concentrationRisque}

Analyse la structure du patrimoine immobilier, les rendements locatifs, la diversification géographique, et les risques de concentration.`

    case 'financier':
      return `Rédige l'analyse du patrimoine financier de ${name}.

Données :
- Total financier : ${ctx.totalFinancier}€
- Score diversification : ${ctx.scoreDiversification}/100
- Score risque : ${ctx.scoreRisque}/100
- Détail actifs : ${JSON.stringify(ctx.actifs)}

Analyse l'allocation, la diversification, le profil risque/rendement, et propose des ajustements si nécessaire.`

    default:
      return `Rédige une analyse patrimoniale professionnelle basée sur ces données : ${JSON.stringify(ctx)}`
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req)

    const rawBody = await req.json()
    const validation = validateRequest(narrativeRequestSchema, rawBody)
    if (!validation.success) return validation.error
    const body = validation.data

    const userPrompt = buildPrompt(body)

    try {
      const result = await aiCapability('narrative', userPrompt, {
        cacheKey: `narrative-${body.type}-${JSON.stringify(body.context).slice(0, 100)}`,
        cacheTtlSeconds: 300,
        maxTokens: 800,
      })

      return NextResponse.json({
        narrative: result.content,
        source: result.provider,
        model: result.model,
        cached: result.cached,
        latencyMs: result.latencyMs,
      })
    } catch {
      // Aucun backend IA disponible → fallback statique
      return NextResponse.json({
        narrative: null,
        source: 'fallback',
        message: 'Aucun backend IA disponible. Installez Ollama (gratuit, sans clé) : brew install ollama && ollama pull mistral && ollama serve',
      })
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    logger.error('[AI Narrative] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    const message = error instanceof Error ? error.message : 'Erreur interne'
    return NextResponse.json({
      narrative: null,
      source: 'error',
      message,
    })
  }
}

/** GET — Vérifie quel backend IA est disponible */
export async function GET() {
  try {
    const status = await aiStatus()
    return NextResponse.json(status)
  } catch {
    return NextResponse.json({ available: false, provider: 'fallback' })
  }
}
