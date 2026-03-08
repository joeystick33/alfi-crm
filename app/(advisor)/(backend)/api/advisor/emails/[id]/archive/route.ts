import { NextRequest, NextResponse } from "next/server";
import { prisma, setRLSContext } from "@/app/_common/lib/prisma";
import { requireAuth } from "@/app/_common/lib/auth-helpers";
import { isRegularUser } from "@/app/_common/lib/auth-types";
import { logger } from '@/app/_common/lib/logger'
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = await requireAuth(req);
    const { user } = context;
    
    if (!isRegularUser(user) || !context.cabinetId) {
      return NextResponse.json({ error: "Invalid user or cabinet" }, { status: 400 });
    }
    
    await setRLSContext(context.cabinetId, context.isSuperAdmin);

    const email = await prisma.syncedEmail.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!email) {
      return NextResponse.json({ error: "Email non trouvé" }, { status: 404 });
    }

    const currentLabels = (email.labels as string[]) || [];
    const newLabels = currentLabels.includes("ARCHIVED") 
      ? currentLabels 
      : [...currentLabels, "ARCHIVED"];

    await prisma.syncedEmail.update({
      where: { id: params.id },
      data: { labels: newLabels },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    logger.error("[Email Archive Error]:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
