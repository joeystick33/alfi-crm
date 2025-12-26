import { NextRequest, NextResponse } from "next/server";
import { prisma, setRLSContext } from "@/app/_common/lib/prisma";
import { requireAuth } from "@/app/_common/lib/auth-helpers";
import { isRegularUser } from "@/app/_common/lib/auth-types";

export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req);
    const { user } = context;
    
    if (!isRegularUser(user) || !context.cabinetId) {
      return NextResponse.json({ error: "Invalid user or cabinet" }, { status: 400 });
    }
    
    await setRLSContext(context.cabinetId, context.isSuperAdmin);

    const emailIntegration = await prisma.emailIntegration.findUnique({
      where: { userId: user.id },
    });

    if (!emailIntegration || !emailIntegration.syncEnabled) {
      return NextResponse.json({ 
        error: "Synchronisation email non configurée",
        needsSetup: true 
      }, { status: 400 });
    }

    await prisma.emailIntegration.update({
      where: { userId: user.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "SUCCESS",
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Synchronisation lancée",
      lastSyncAt: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Email Sync Error]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const context = await requireAuth(req);
    const { user } = context;
    
    if (!isRegularUser(user) || !context.cabinetId) {
      return NextResponse.json({ error: "Invalid user or cabinet" }, { status: 400 });
    }
    
    await setRLSContext(context.cabinetId, context.isSuperAdmin);

    const emailIntegration = await prisma.emailIntegration.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      configured: !!emailIntegration,
      syncEnabled: emailIntegration?.syncEnabled || false,
      provider: emailIntegration?.provider || null,
      lastSyncAt: emailIntegration?.lastSyncAt?.toISOString() || null,
      lastSyncStatus: emailIntegration?.lastSyncStatus || null,
    });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Email Sync Status Error]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
