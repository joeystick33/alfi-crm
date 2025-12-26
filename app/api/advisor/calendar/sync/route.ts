import { NextRequest, NextResponse } from "next/server";
import { prisma, setRLSContext } from "@/app/_common/lib/prisma";
import { requireAuth } from "@/app/_common/lib/auth-helpers";

/**
 * GET /api/advisor/calendar/sync
 * Récupère le statut de synchronisation calendrier pour l'utilisateur connecté
 */
export async function GET(req: NextRequest) {
  try {
    const { user, cabinetId, isSuperAdmin } = await requireAuth(req);
    
    if (!cabinetId && !isSuperAdmin) {
      return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
    }
    
    // RLS context seulement si cabinetId est présent
    if (cabinetId) {
      await setRLSContext(cabinetId, isSuperAdmin);
    }

    // Récupérer la sync calendrier de l'utilisateur
    const calendarSync = await prisma.calendarSync.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        syncEnabled: true,
        lastSyncAt: true,
        lastSyncStatus: true,
        calendarId: true,
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
        id: "google",
        name: "Google Calendar",
        icon: "G",
        connected: calendarSync?.provider === "GOOGLE" && calendarSync?.syncEnabled,
        configured: hasGoogleCredentials,
        lastSync: calendarSync?.provider === "GOOGLE" ? calendarSync?.lastSyncAt : null,
        status: calendarSync?.provider === "GOOGLE" ? calendarSync?.lastSyncStatus : null,
      },
      {
        id: "outlook",
        name: "Microsoft Outlook",
        icon: "O",
        connected: calendarSync?.provider === "OUTLOOK" && calendarSync?.syncEnabled,
        configured: true, // Outlook utilise des credentials globaux ou BYOK
        lastSync: calendarSync?.provider === "OUTLOOK" ? calendarSync?.lastSyncAt : null,
        status: calendarSync?.provider === "OUTLOOK" ? calendarSync?.lastSyncStatus : null,
      },
    ];

    return NextResponse.json({
      providers,
      currentProvider: calendarSync?.provider || null,
      syncEnabled: calendarSync?.syncEnabled || false,
      lastSyncAt: calendarSync?.lastSyncAt || null,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Calendar Sync Status Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/advisor/calendar/sync
 * Déconnecte la synchronisation calendrier
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
    const existingSync = await prisma.calendarSync.findUnique({
      where: { userId: user.id },
    });

    if (existingSync) {
      await prisma.calendarSync.update({
        where: { userId: user.id },
        data: {
          syncEnabled: false,
          accessToken: "",
          refreshToken: null,
          lastSyncStatus: "DISCONNECTED",
        },
      });
    }

    return NextResponse.json({ success: true, message: "Calendrier déconnecté" });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("[Calendar Disconnect Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
