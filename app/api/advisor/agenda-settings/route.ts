import { NextRequest, NextResponse } from "next/server";
import { prisma, setRLSContext } from "@/app/_common/lib/prisma";
import { requireAuth } from "@/app/_common/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const { user, cabinetId, isSuperAdmin } = await requireAuth(req);

    if (!cabinetId) {
      return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
    }

    await setRLSContext(cabinetId, isSuperAdmin);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        preferences: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const preferences = (dbUser.preferences as Record<string, any>) || {};
    const agendaConfig = preferences.agendaConfig || null;

    return NextResponse.json({ config: agendaConfig });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Agenda Settings GET Error]:", error);
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, cabinetId, isSuperAdmin } = await requireAuth(req);
    const { config } = await req.json();

    if (!cabinetId) {
      return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
    }

    if (!config) {
      return NextResponse.json({ error: "Configuration requise" }, { status: 400 });
    }

    await setRLSContext(cabinetId, isSuperAdmin);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preferences: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const currentPreferences = (dbUser.preferences as Record<string, any>) || {};

    await prisma.user.update({
      where: { id: user.id },
      data: {
        preferences: {
          ...currentPreferences,
          agendaConfig: config,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Agenda Settings POST Error]:", error);
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}
