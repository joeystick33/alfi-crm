import { NextRequest, NextResponse } from "next/server";
import { prisma, setRLSContext } from "@/app/_common/lib/prisma";
import { requireAuth } from "@/app/_common/lib/auth-helpers";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const { user, cabinetId, isSuperAdmin } = await requireAuth(req);
    
    if (!cabinetId && !isSuperAdmin) {
      return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
    }
    
    if (cabinetId) {
      await setRLSContext(cabinetId, isSuperAdmin);
    }

    const events = await prisma.event.findMany({
      where: { userId: user.id },
      orderBy: { startDate: "asc" },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({ data: events });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const createEventSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire"),
  description: z.string().optional(),
  startDate: z.union([z.string(), z.date()]),
  endDate: z.union([z.string(), z.date()]),
  allDay: z.boolean().optional(),
  type: z.string().optional(),
  clientId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const { user, cabinetId, isSuperAdmin } = await requireAuth(req);
    
    if (!cabinetId) {
      return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
    }
    
    await setRLSContext(cabinetId, isSuperAdmin);

    const payload = await req.json();
    const body = createEventSchema.parse(payload);

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Dates invalides" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        startDate,
        endDate,
        allDay: body.allDay ?? false,
        type: body.type || "MEETING",
        status: "CONFIRMED",
        userId: user.id,
        cabinetId,
        clientId: body.clientId || null,
      },
    });

    return NextResponse.json({ data: event });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.flatten() },
        { status: 400 }
      );
    }
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
