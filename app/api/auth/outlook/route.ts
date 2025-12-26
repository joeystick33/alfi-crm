import { NextRequest, NextResponse } from "next/server";
import { prisma, setRLSContext } from "@/app/_common/lib/prisma";
import { requireAuth } from "@/app/_common/lib/auth-helpers";

const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, cabinetId, isSuperAdmin } = await requireAuth(req);
    
    if (cabinetId) {
      await setRLSContext(cabinetId, isSuperAdmin);
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "calendar"; // calendar or mail

    // Get Microsoft credentials from cabinet
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { microsoftClientId: true, microsoftClientSecret: true },
    });

    if (!cabinet || !cabinet.microsoftClientId || !cabinet.microsoftClientSecret) {
      const redirectPath = type === "mail" ? "/dashboard/emails" : "/dashboard/agenda";
      return NextResponse.redirect(
        new URL(`${redirectPath}?error=outlook_not_configured`, req.url)
      );
    }

    const clientId = cabinet.microsoftClientId;

    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${origin}/api/auth/outlook/callback`;

    // Scopes depend on what we're syncing
    const scopes = type === "mail" 
      ? [
          "openid",
          "profile", 
          "email",
          "offline_access",
          "https://graph.microsoft.com/Mail.Read",
          "https://graph.microsoft.com/Mail.Send",
          "https://graph.microsoft.com/User.Read"
        ]
      : [
          "openid",
          "profile",
          "email", 
          "offline_access",
          "https://graph.microsoft.com/Calendars.ReadWrite",
          "https://graph.microsoft.com/User.Read"
        ];

    // State contains userId and type
    const state = JSON.stringify({ userId: authUser.id, type });
    const encodedState = Buffer.from(state).toString("base64");

    const authParams = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      response_mode: "query",
      scope: scopes.join(" "),
      state: encodedState,
      prompt: "consent",
    });

    const authUrl = `${MICROSOFT_AUTH_URL}?${authParams.toString()}`;
    
    return NextResponse.redirect(authUrl);
  } catch (error: unknown) {
    console.error("Outlook OAuth Init Error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur OAuth Outlook" },
      { status: 500 }
    );
  }
}
