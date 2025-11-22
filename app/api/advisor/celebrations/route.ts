import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/supabase/auth-helpers'
import { isRegularUser } from '@/lib/auth-types'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!isRegularUser(user) || !user.cabinetId) {
      return NextResponse.json({ error: 'Invalid user or cabinet' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const rangeDays = parseInt(searchParams.get('rangeDays') || '30', 10)

    const now = new Date()
    const end = new Date(now.getTime() + rangeDays * 24 * 60 * 60 * 1000)

    // Fetch clients with birthDate
    const clients = await prisma.client.findMany({
      where: {
        cabinetId: user.cabinetId,
        birthDate: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
      },
    })

    // Compute upcoming birthdays in range
    const birthdayEvents = clients
      .map((c) => {
        if (!c.birthDate) return null
        const birth = new Date(c.birthDate)
        const thisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
        let next = thisYear
        if (thisYear < now) {
          next = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate())
        }
        if (next > end) return null
        const age = next.getFullYear() - birth.getFullYear()
        return {
          id: `birthday-${c.id}-${next.toISOString()}`,
          type: 'birthday' as const,
          clientId: c.id,
          clientName: `${c.firstName} ${c.lastName}`,
          detail: `${age} ans`,
          date: next.toISOString(),
        }
      })
      .filter(Boolean) as any[]

    // Fetch life insurance / retirement contracts for 8-year anniversaries
    const contrats = await prisma.contrat.findMany({
      where: {
        cabinetId: user.cabinetId,
        startDate: { not: null },
      },
      select: {
        id: true,
        name: true,
        type: true,
        startDate: true,
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    const contractEvents = contrats
      .map((ctr) => {
        if (!ctr.startDate) return null
        const start = new Date(ctr.startDate)
        const anniversary = new Date(start)
        anniversary.setFullYear(now.getFullYear())
        if (anniversary < now) {
          anniversary.setFullYear(now.getFullYear() + 1)
        }
        if (anniversary > end) return null

        const years = anniversary.getFullYear() - start.getFullYear()
        const clientName = ctr.client
          ? `${ctr.client.firstName} ${ctr.client.lastName}`
          : 'Client inconnu'

        return {
          id: `contract-${ctr.id}-${anniversary.toISOString()}`,
          type: 'contract' as const,
          clientId: ctr.client?.id || null,
          clientName,
          contractName: ctr.name,
          detail: `${years} ans de contrat`,
          date: anniversary.toISOString(),
        }
      })
      .filter(Boolean) as any[]

    const events = [...birthdayEvents, ...contractEvents]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10)

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching celebrations:', error)
    // En cas d'erreur inattendue côté serveur, on renvoie simplement une liste vide
    // pour ne pas casser le dashboard ; aucune donnée mockée n'est injectée.
    return NextResponse.json({ events: [], error: 'Internal server error' }, { status: 200 })
  }
}
