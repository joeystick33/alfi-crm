import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_common/lib/prisma";

const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const GRAPH_API_URL = "https://graph.microsoft.com/v1.0";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const encodedState = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error("Outlook OAuth Error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(`/dashboard/agenda?error=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code || !encodedState) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    // Decode state
    let state: { userId: string; type: string };
    try {
      state = JSON.parse(Buffer.from(encodedState, "base64").toString("utf-8"));
    } catch {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }

    const { userId, type } = state;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { cabinet: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Get Microsoft credentials from cabinet
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: user.cabinetId },
      select: { microsoftClientId: true, microsoftClientSecret: true },
    });

    if (!cabinet || !cabinet.microsoftClientId || !cabinet.microsoftClientSecret) {
      return NextResponse.json({ error: "Microsoft credentials not configured" }, { status: 500 });
    }

    const clientId = cabinet.microsoftClientId;
    const clientSecret = cabinet.microsoftClientSecret;

    const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${origin}/api/auth/outlook/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch(MICROSOFT_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange error:", errorData);
      return NextResponse.json({ error: "Token exchange failed" }, { status: 500 });
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Get user info from Microsoft Graph
    const userInfoResponse = await fetch(`${GRAPH_API_URL}/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    let email = user.email;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      email = userInfo.mail || userInfo.userPrincipalName || email;
    }

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    if (type === "mail") {
      // Save to EmailIntegration
      const existingIntegration = await prisma.emailIntegration.findUnique({
        where: { userId: user.id },
      });

      if (existingIntegration) {
        await prisma.emailIntegration.update({
          where: { userId: user.id },
          data: {
            provider: "OUTLOOK",
            email,
            accessToken: access_token,
            refreshToken: refresh_token || existingIntegration.refreshToken,
            tokenExpiresAt: expiresAt,
            syncEnabled: true,
            lastSyncStatus: "CONNECTED",
            lastSyncAt: new Date(),
          },
        });
      } else {
        await prisma.emailIntegration.create({
          data: {
            userId: user.id,
            provider: "OUTLOOK",
            email,
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenExpiresAt: expiresAt,
            syncEnabled: true,
            lastSyncStatus: "CONNECTED",
            lastSyncAt: new Date(),
          },
        });
      }

      return NextResponse.redirect(new URL("/dashboard/emails?success=outlook_connected", req.url));
    } else {
      // Save to CalendarSync
      const existingSync = await prisma.calendarSync.findUnique({
        where: { userId: user.id },
      });

      if (existingSync) {
        await prisma.calendarSync.update({
          where: { userId: user.id },
          data: {
            provider: "OUTLOOK",
            accessToken: access_token,
            refreshToken: refresh_token || existingSync.refreshToken,
            expiresAt,
            syncEnabled: true,
            calendarId: "primary",
            lastSyncStatus: "CONNECTED",
          },
        });
      } else {
        await prisma.calendarSync.create({
          data: {
            userId: user.id,
            provider: "OUTLOOK",
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt,
            syncEnabled: true,
            calendarId: "primary",
            lastSyncStatus: "CONNECTED",
          },
        });
      }

      return NextResponse.redirect(new URL("/dashboard/agenda?success=outlook_connected", req.url));
    }
  } catch (error: any) {
    console.error("Outlook OAuth Callback Error:", error);
    return NextResponse.json({ error: error.message || "Erreur OAuth" }, { status: 500 });
  }
}
