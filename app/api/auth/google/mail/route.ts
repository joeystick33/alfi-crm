import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma, setRLSContext } from "@/app/_common/lib/prisma";
import { requireAuth } from "@/app/_common/lib/auth-helpers";
import { createOAuthState } from "@/app/_common/lib/oauth-state";

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, cabinetId, isSuperAdmin } = await requireAuth(req);
    
    if (cabinetId) {
      await setRLSContext(cabinetId, isSuperAdmin);
    }

    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { googleClientId: true, googleClientSecret: true },
    });

    if (!cabinet || !cabinet.googleClientId || !cabinet.googleClientSecret) {
      return NextResponse.redirect(
        new URL("/dashboard/emails?error=google_not_configured", req.url)
      );
    }

    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const oauth2Client = new google.auth.OAuth2(
      cabinet.googleClientId,
      cabinet.googleClientSecret,
      `${origin}/api/auth/google/mail/callback`
    );

    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ];

    const state = createOAuthState({
      userId: authUser.id,
      provider: 'google',
      type: 'mail',
    })

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state,
    });

    return NextResponse.redirect(url);
  } catch (error: unknown) {
    console.error("Google Mail OAuth Init Error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur OAuth" },
      { status: 500 }
    );
  }
}
