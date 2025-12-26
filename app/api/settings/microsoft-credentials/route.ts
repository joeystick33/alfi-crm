import { NextRequest, NextResponse } from "next/server";
import { prisma, setRLSContext } from "@/app/_common/lib/prisma";
import { requireAuth } from "@/app/_common/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const { clientId, clientSecret, cabinetId: bodyCabinetId } = await req.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Client ID et Client Secret requis" }, { status: 400 });
    }

    const { cabinetId, isSuperAdmin } = await requireAuth(req);
    
    const targetCabinetId = (isSuperAdmin && bodyCabinetId ? bodyCabinetId : cabinetId)?.trim();

    if (!targetCabinetId) {
      return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
    }
    
    await setRLSContext(targetCabinetId, isSuperAdmin);

    try {
      await prisma.cabinet.update({
        where: { id: targetCabinetId },
        data: {
          microsoftClientId: clientId,
          microsoftClientSecret: clientSecret,
        },
      });
    } catch (dbError: any) {
      if (dbError?.code === "P2025") {
        return NextResponse.json({ error: "Cabinet introuvable pour mise à jour" }, { status: 404 });
      }
      console.error("[Microsoft Credentials DB Error]:", dbError);
      throw dbError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (error?.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    console.error("[Microsoft Credentials POST Error]:", error);
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { cabinetId, isSuperAdmin } = await requireAuth(req);

    const url = new URL(req.url);
    const queryCabinetId = url.searchParams.get("cabinetId");
    const targetCabinetId = (isSuperAdmin && queryCabinetId ? queryCabinetId : cabinetId)?.trim();
    
    if (!targetCabinetId) {
      return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
    }
    
    await setRLSContext(targetCabinetId, isSuperAdmin);

    const cabinet = await prisma.cabinet.findUnique({
      where: { id: targetCabinetId },
      select: { microsoftClientId: true, microsoftClientSecret: true },
    });

    if (!cabinet) {
      return NextResponse.json({ error: "Cabinet not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasClientId: !!cabinet.microsoftClientId,
      hasClientSecret: !!cabinet.microsoftClientSecret,
    });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (error?.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
    console.error("[Microsoft Credentials GET Error]:", error);
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}
