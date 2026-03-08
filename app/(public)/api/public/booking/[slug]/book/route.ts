/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/app/_common/lib/prisma'

const bookingSchema = z.object({
  appointmentTypeId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  clientNom: z.string().min(1, 'Nom requis'),
  clientPrenom: z.string().optional(),
  clientEmail: z.string().email('Email invalide'),
  clientTelephone: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * POST /api/public/booking/[slug]/book
 * Réserver un créneau (accès public, pas d'auth requise)
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const body = await request.json()
    const data = bookingSchema.parse(body)

    // Vérifier le cabinet
    const cabinet = await prisma.cabinet.findUnique({ where: { slug }, select: { id: true, name: true } })
    if (!cabinet) return Response.json({ error: 'Cabinet non trouvé' }, { status: 404 })

    // Vérifier le type de RDV
    const aptType = await prisma.appointmentType.findFirst({
      where: { id: data.appointmentTypeId, cabinetId: cabinet.id, isActive: true, isPublic: true },
    })
    if (!aptType) return Response.json({ error: 'Type de rendez-vous non trouvé' }, { status: 404 })

    // Vérifier que le créneau est toujours libre
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    const conflict = await prisma.event.findFirst({
      where: {
        userId: aptType.userId,
        status: { not: 'CANCELLED' },
        OR: [
          { startDate: { lt: endDate }, endDate: { gt: startDate } },
        ],
      },
    })

    if (conflict) {
      return Response.json({ error: 'Ce créneau n\'est plus disponible. Veuillez en choisir un autre.' }, { status: 409 })
    }

    // Chercher ou créer le client (prospect)
    let client = await prisma.client.findFirst({
      where: { cabinetId: cabinet.id, email: data.clientEmail },
      select: { id: true },
    })

    if (!client) {
      client = await prisma.client.create({
        data: {
          cabinetId: cabinet.id,
          firstName: data.clientPrenom || '',
          lastName: data.clientNom,
          email: data.clientEmail,
          phone: data.clientTelephone || null,
          status: 'PROSPECT',
          conseillerId: aptType.userId,
        },
        select: { id: true },
      })
    }

    // Créer l'événement
    const event = await prisma.event.create({
      data: {
        cabinetId: cabinet.id,
        userId: aptType.userId,
        title: `${aptType.name} — ${data.clientPrenom || ''} ${data.clientNom}`.trim(),
        description: data.notes || null,
        startDate,
        endDate,
        type: 'APPOINTMENT',
        status: aptType.requiresApproval ? 'TENTATIVE' : 'CONFIRMED',
        location: aptType.location || null,
        clientId: client.id,
        appointmentTypeId: aptType.id,
        isBookedByClient: true,
        bookingNotes: data.notes || null,
      },
    })

    // Créer une notification pour le conseiller
    try {
      await prisma.notification.create({
        data: {
          cabinetId: cabinet.id,
          userId: aptType.userId,
          type: 'RAPPEL_RDV',
          title: `Nouveau RDV : ${aptType.name}`,
          message: `${data.clientPrenom || ''} ${data.clientNom} a réservé un ${aptType.name} le ${startDate.toLocaleDateString('fr-FR')} à ${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
          priority: 'HAUTE',
          metadata: { eventId: event.id, clientId: client.id } as any,
        },
      })
    } catch {
      // Notification non critique, ne pas bloquer la réservation
    }

    return Response.json({
      data: {
        booking: {
          id: event.id,
          status: event.status,
          startDate: event.startDate,
          endDate: event.endDate,
          appointmentType: aptType.name,
        },
        message: aptType.requiresApproval
          ? 'Votre demande de rendez-vous a été envoyée. Vous recevrez une confirmation par email.'
          : 'Votre rendez-vous est confirmé ! Vous recevrez un email de confirmation.',
      },
    })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return Response.json({ error: `Données invalides : ${error.errors.map((e: any) => e.message).join(', ')}` }, { status: 400 })
    }
    console.error('Erreur POST public/booking/book:', error)
    return Response.json({ error: 'Erreur lors de la réservation' }, { status: 500 })
  }
}
