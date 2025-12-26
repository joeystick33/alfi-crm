import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/app/_common/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const userId = searchParams.get("state");

    if (!code || !userId) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { cabinet: true },
    });

    if (!user || !user.cabinet || !user.cabinet.googleClientId || !user.cabinet.googleClientSecret) {
      return NextResponse.json({ error: "Cabinet configuration missing" }, { status: 400 });
    }

    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const oauth2Client = new google.auth.OAuth2(
      user.cabinet.googleClientId,
      user.cabinet.googleClientSecret,
      `${origin}/api/auth/google/mail/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user email
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email || user.email;

    // Save to EmailIntegration
    const existingIntegration = await prisma.emailIntegration.findUnique({
      where: { userId: user.id },
    });

    const data = {
      provider: "GMAIL" as const,
      email: email || "",
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || undefined,
      tokenExpiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
      syncEnabled: true,
      lastSyncStatus: "CONNECTED",
      lastSyncAt: new Date(),
    };

    if (existingIntegration) {
      await prisma.emailIntegration.update({
        where: { userId: user.id },
        data: {
          ...data,
          refreshToken: tokens.refresh_token ?? existingIntegration.refreshToken ?? undefined,
        },
      });
    } else {
      await prisma.emailIntegration.create({
        data: {
          ...data,
          userId: user.id,
        },
      });
    }

    return NextResponse.redirect(new URL("/dashboard/emails?success=gmail_connected", req.url));
  } catch (error: any) {
    console.error("Google Mail OAuth Callback Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
