/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * GET /api/public/booking/[slug]
 * Page publique : retourne les types de RDV disponibles pour un conseiller
 * Le slug est le slug du cabinet ou un identifiant personnalisé
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params

    // Chercher le cabinet par slug
    const cabinet = await prisma.cabinet.findUnique({
      where: { slug },
      select: { id: true, name: true },
    })

    if (!cabinet) {
      return Response.json({ error: 'Page de réservation non trouvée' }, { status: 404 })
    }

    // Récupérer les types de RDV publics et actifs
    const appointmentTypes = await prisma.appointmentType.findMany({
      where: {
        cabinetId: cabinet.id,
        isActive: true,
        isPublic: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        color: true,
        location: true,
        price: true,
      },
      orderBy: { name: 'asc' },
    })

    // Récupérer le premier conseiller actif (ou tous si multi-conseiller)
    const conseillers = await prisma.user.findMany({
      where: { cabinetId: cabinet.id, isActive: true, role: 'ADVISOR' },
      select: { id: true, firstName: true, lastName: true, avatar: true },
      take: 1,
    })

    return Response.json({
      data: {
        cabinet: { name: cabinet.name },
        conseiller: conseillers[0] ? { ...conseillers[0], cabinet: { name: cabinet.name } } : null,
        appointmentTypes,
      },
    })
  } catch (error: any) {
    console.error('Erreur GET public/booking:', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
