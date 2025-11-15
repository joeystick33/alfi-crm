import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createActionSchema = z.object({
  title: z.string().min(1),
  objective: z.string().optional(),
  segmentKey: z.string().optional(),
  segmentLabel: z.string().optional(),
  channels: z.array(z.string()).optional(),
  scheduledAt: z.string().nullable().optional(),
  notes: z.string().optional(),
})

// GET /api/clients/actions - Get commercial actions and segments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = session.user.id
    const cabinetId = session.user.cabinetId

    if (!cabinetId) {
      return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 400 })
    }

    // Get all clients for segmentation
    const clients = await prisma.client.findMany({
      where: { cabinetId },
      include: {
        actifs: true,
        passifs: true,
        objectifs: true,
        opportunites: true,
      },
    })

    // Generate segments based on client data
    const segments = generateSegments(clients)

    // Get existing commercial actions
    const actions = await prisma.commercialAction.findMany({
      where: { cabinetId },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate summary stats
    const summary = {
      totalActions: actions.length,
      estimatedPotential: actions.reduce((sum, action) => sum + (action.estimatedPotential || 0), 0),
      byStatus: actions.reduce((acc, action) => {
        acc[action.status] = (acc[action.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    return NextResponse.json({
      segments,
      actions,
      summary,
    })
  } catch (error) {
    console.error('Error fetching commercial actions:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des actions commerciales' },
      { status: 500 }
    )
  }
}

// POST /api/clients/actions - Create a new commercial action
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = session.user.id
    const cabinetId = session.user.cabinetId

    if (!cabinetId) {
      return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = createActionSchema.parse(body)

    // Create the commercial action
    const action = await prisma.commercialAction.create({
      data: {
        title: validatedData.title,
        objective: validatedData.objective,
        segmentKey: validatedData.segmentKey,
        segmentLabel: validatedData.segmentLabel,
        channels: validatedData.channels || [],
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        notes: validatedData.notes,
        status: validatedData.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        cabinetId,
        createdBy: userId,
      },
    })

    return NextResponse.json(action, { status: 201 })
  } catch (error) {
    console.error('Error creating commercial action:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'action commerciale' },
      { status: 500 }
    )
  }
}

// Helper function to generate segments from client data
function generateSegments(clients: any[]) {
  const segments = []

  // Segment: Clients with retirement approaching (age 55-65)
  const retirementClients = clients.filter((c) => {
    const age = c.dateNaissance ? calculateAge(c.dateNaissance) : 0
    return age >= 55 && age <= 65
  })
  if (retirementClients.length > 0) {
    segments.push({
      key: 'RETIREMENT_PREPARATION',
      label: 'Préparation Retraite',
      description: 'Clients approchant de la retraite (55-65 ans)',
      statistics: {
        audienceCount: retirementClients.length,
        estimatedPotential: retirementClients.reduce((sum, c) => sum + calculateNetWealth(c), 0) * 0.15,
      },
      recommendedChannels: ['MEETING', 'EMAIL'],
      callToAction: 'Proposer un bilan retraite et optimisation fiscale',
      audience: retirementClients.slice(0, 5).map((c) => ({
        name: `${c.prenom} ${c.nom}`,
        email: c.email,
      })),
    })
  }

  // Segment: High net worth clients without recent contact
  const highNetWorthClients = clients.filter((c) => {
    const netWealth = calculateNetWealth(c)
    return netWealth > 500000
  })
  if (highNetWorthClients.length > 0) {
    segments.push({
      key: 'HIGH_NET_WORTH',
      label: 'Patrimoine Élevé',
      description: 'Clients avec patrimoine > 500K€',
      statistics: {
        audienceCount: highNetWorthClients.length,
        estimatedPotential: highNetWorthClients.reduce((sum, c) => sum + calculateNetWealth(c), 0) * 0.02,
      },
      recommendedChannels: ['MEETING', 'PHONE'],
      callToAction: 'Proposer une revue patrimoniale complète',
      audience: highNetWorthClients.slice(0, 5).map((c) => ({
        name: `${c.prenom} ${c.nom}`,
        email: c.email,
      })),
    })
  }

  // Segment: Clients with active opportunities
  const clientsWithOpportunities = clients.filter((c) => c.opportunites && c.opportunites.length > 0)
  if (clientsWithOpportunities.length > 0) {
    segments.push({
      key: 'ACTIVE_OPPORTUNITIES',
      label: 'Opportunités Actives',
      description: 'Clients avec opportunités détectées',
      statistics: {
        audienceCount: clientsWithOpportunities.length,
        estimatedPotential: clientsWithOpportunities.reduce(
          (sum, c) => sum + c.opportunites.reduce((s: number, o: any) => s + (o.estimatedValue || 0), 0),
          0
        ),
      },
      recommendedChannels: ['EMAIL', 'PHONE', 'MEETING'],
      callToAction: 'Convertir les opportunités en projets concrets',
      audience: clientsWithOpportunities.slice(0, 5).map((c) => ({
        name: `${c.prenom} ${c.nom}`,
        email: c.email,
      })),
    })
  }

  // Segment: Prospects (stage = PROSPECT)
  const prospects = clients.filter((c) => c.stage === 'PROSPECT')
  if (prospects.length > 0) {
    segments.push({
      key: 'PROSPECTS',
      label: 'Prospects à Convertir',
      description: 'Prospects à transformer en clients',
      statistics: {
        audienceCount: prospects.length,
        estimatedPotential: prospects.length * 50000, // Estimated average
      },
      recommendedChannels: ['EMAIL', 'PHONE'],
      callToAction: 'Proposer un premier rendez-vous découverte',
      audience: prospects.slice(0, 5).map((c) => ({
        name: `${c.prenom} ${c.nom}`,
        email: c.email,
      })),
    })
  }

  return segments
}

function calculateAge(dateNaissance: Date): number {
  const today = new Date()
  const birthDate = new Date(dateNaissance)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

function calculateNetWealth(client: any): number {
  const actifs = client.actifs?.reduce((sum: number, a: any) => sum + (a.valeurActuelle || 0), 0) || 0
  const passifs = client.passifs?.reduce((sum: number, p: any) => sum + (p.montantRestant || 0), 0) || 0
  return actifs - passifs
}
