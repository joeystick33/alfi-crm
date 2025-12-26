import { NextRequest, NextResponse } from "next/server";
import { prisma, setRLSContext } from "@/app/_common/lib/prisma";
import { requireAuth } from "@/app/_common/lib/auth-helpers";

/**
 * GET /api/advisor/mail/sync
 * Récupère le statut de synchronisation email pour l'utilisateur connecté
 */
export async function GET(req: NextRequest) {
  try {
    const { user, cabinetId, isSuperAdmin } = await requireAuth(req);
    
    if (!cabinetId && !isSuperAdmin) {
      return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
    }
    
    if (cabinetId) {
      await setRLSContext(cabinetId, isSuperAdmin);
    }

    // Récupérer l'intégration email de l'utilisateur
    const emailIntegration = await prisma.emailIntegration.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        email: true,
        syncEnabled: true,
        lastSyncAt: true,
        lastSyncStatus: true,
        syncFrequency: true,
        autoClassify: true,
        autoMatchClient: true,
        createdAt: true,
      },
    });

    // Récupérer les credentials du cabinet pour savoir si Google est configuré
    let hasGoogleCredentials = false;
    if (cabinetId) {
      const cabinet = await prisma.cabinet.findUnique({
        where: { id: cabinetId },
        select: {
          googleClientId: true,
          googleClientSecret: true,
        },
      });
      hasGoogleCredentials = !!(cabinet?.googleClientId && cabinet?.googleClientSecret);
    }

    // Construire la liste des providers avec leur statut
    const providers = [
      {
        id: "gmail",
        name: "Gmail",
        icon: "G",
        connected: emailIntegration?.provider === "GMAIL" && emailIntegration?.syncEnabled,
        configured: hasGoogleCredentials,
        lastSync: emailIntegration?.provider === "GMAIL" ? emailIntegration?.lastSyncAt : null,
        status: emailIntegration?.provider === "GMAIL" ? emailIntegration?.lastSyncStatus : null,
        email: emailIntegration?.provider === "GMAIL" ? emailIntegration?.email : null,
      },
      {
        id: "outlook",
        name: "Microsoft Outlook",
        icon: "O",
        connected: emailIntegration?.provider === "OUTLOOK" && emailIntegration?.syncEnabled,
        configured: true, // Outlook utilise des credentials globaux
        lastSync: emailIntegration?.provider === "OUTLOOK" ? emailIntegration?.lastSyncAt : null,
        status: emailIntegration?.provider === "OUTLOOK" ? emailIntegration?.lastSyncStatus : null,
        email: emailIntegration?.provider === "OUTLOOK" ? emailIntegration?.email : null,
      },
    ];

    return NextResponse.json({
      providers,
      currentProvider: emailIntegration?.provider || null,
      syncEnabled: emailIntegration?.syncEnabled || false,
      lastSyncAt: emailIntegration?.lastSyncAt || null,
      connectedEmail: emailIntegration?.email || null,
      settings: emailIntegration ? {
        syncFrequency: emailIntegration.syncFrequency,
        autoClassify: emailIntegration.autoClassify,
        autoMatchClient: emailIntegration.autoMatchClient,
      } : null,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Mail Sync Status Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/advisor/mail/sync
 * Déconnecte la synchronisation email
 */
export async function DELETE(req: NextRequest) {
  try {
    const { user, cabinetId, isSuperAdmin } = await requireAuth(req);
    
    if (!cabinetId && !isSuperAdmin) {
      return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
    }
    
    if (cabinetId) {
      await setRLSContext(cabinetId, isSuperAdmin);
    }

    // Désactiver la sync et supprimer les tokens
    const existingIntegration = await prisma.emailIntegration.findUnique({
      where: { userId: user.id },
    });

    if (existingIntegration) {
      await prisma.emailIntegration.update({
        where: { userId: user.id },
        data: {
          syncEnabled: false,
          accessToken: "",
          refreshToken: null,
          lastSyncStatus: "DISCONNECTED",
        },
      });
    }

    return NextResponse.json({ success: true, message: "Email déconnecté" });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Mail Disconnect Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/advisor/mail/sync
 * Met à jour les paramètres de synchronisation email
 */
export async function PATCH(req: NextRequest) {
  try {
    const { user, cabinetId, isSuperAdmin } = await requireAuth(req);
    
    if (!cabinetId && !isSuperAdmin) {
      return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
    }
    
    if (cabinetId) {
      await setRLSContext(cabinetId, isSuperAdmin);
    }

    const body = await req.json();
    const { syncFrequency, autoClassify, autoMatchClient } = body;

    const existingIntegration = await prisma.emailIntegration.findUnique({
      where: { userId: user.id },
    });

    if (!existingIntegration) {
      return NextResponse.json({ error: "Aucune intégration email configurée" }, { status: 404 });
    }

    const updated = await prisma.emailIntegration.update({
      where: { userId: user.id },
      data: {
        ...(syncFrequency !== undefined && { syncFrequency }),
        ...(autoClassify !== undefined && { autoClassify }),
        ...(autoMatchClient !== undefined && { autoMatchClient }),
      },
      select: {
        syncFrequency: true,
        autoClassify: true,
        autoMatchClient: true,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Mail Settings Update Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
