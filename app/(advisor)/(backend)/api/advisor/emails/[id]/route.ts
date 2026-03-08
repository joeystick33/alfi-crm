import { NextRequest, NextResponse } from "next/server";
import { prisma, setRLSContext } from "@/app/_common/lib/prisma";
import { requireAuth } from "@/app/_common/lib/auth-helpers";
import { isRegularUser } from "@/app/_common/lib/auth-types";
import { logger } from '@/app/_common/lib/logger'
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        attachments: true,
      },
    });

    if (!email) {
      return NextResponse.json({ error: "Email non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ email });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    logger.error("[Email GET Error]:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const context = await requireAuth(req);
    const { user } = context;
    
    if (!isRegularUser(user) || !context.cabinetId) {
      return NextResponse.json({ error: "Invalid user or cabinet" }, { status: 400 });
    }
    
    await setRLSContext(context.cabinetId, context.isSuperAdmin);

    const body = await req.json();
    const { isRead, isStarred, labels } = body;

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
    let newLabels = [...currentLabels];
    
    if (isStarred !== undefined) {
      if (isStarred && !newLabels.includes("STARRED")) {
        newLabels.push("STARRED");
      } else if (!isStarred) {
        newLabels = newLabels.filter(l => l !== "STARRED");
      }
    }

    const updated = await prisma.syncedEmail.update({
      where: { id: params.id },
      data: {
        ...(isRead !== undefined && { isRead }),
        ...(labels !== undefined ? { labels } : { labels: newLabels }),
      },
    });

    return NextResponse.json({ success: true, email: updated });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    logger.error("[Email PATCH Error]:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    await prisma.syncedEmail.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    logger.error("[Email DELETE Error]:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
