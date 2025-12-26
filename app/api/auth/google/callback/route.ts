import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/app/_common/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const code = searchParams.get("code");
        const userId = searchParams.get("state"); // We passed user ID in state

        if (!code || !userId) {
            return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
        }

        // 1. Get Cabinet Credentials again
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { cabinet: true }
        });

        if (!user || !user.cabinet || !user.cabinet.googleClientId || !user.cabinet.googleClientSecret) {
            return NextResponse.json({ error: "Cabinet configuration missing" }, { status: 400 });
        }

        // 2. Exchange Code for Tokens
        const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const oauth2Client = new google.auth.OAuth2(
            user.cabinet.googleClientId,
            user.cabinet.googleClientSecret,
            `${origin}/api/auth/google/callback`
        );

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // 3. Verify User (Optional but good) and Get Email
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();

        // 4. Save Tokens to CalendarSync
        // Check if sync already exists
        const existingSync = await prisma.calendarSync.findUnique({
            where: { userId: user.id }
        });

        const data = {
            provider: 'GOOGLE' as const,
            accessToken: tokens.access_token!,
            refreshToken: tokens.refresh_token || undefined, // Only update if new one provided
            expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
            syncEnabled: true,
            calendarId: 'primary', // Default to primary calendar
            lastSyncStatus: 'CONNECTED'
        };

        // If refresh token is missing in update (because flow wasn't 'consent'), keep old one if exists.
        // Prisma update logic handles this if we selectively construct the object, 
        // but upsert is cleaner if we just provide what we have.
        // NOTE: 'provider' enum in schema might be upper case. Schema said: OUTLOOK, GOOGLE, APPLE.

        // Schema check: provider is enum CalendarProvider { OUTLOOK, GOOGLE, APPLE }

        if (existingSync) {
            await prisma.calendarSync.update({
                where: { userId: user.id },
                data: {
                    ...data,
                    refreshToken: tokens.refresh_token ?? existingSync.refreshToken ?? undefined // keep old if not provided
                }
            });
        } else {
            await prisma.calendarSync.create({
                data: {
                    ...data,
                    userId: user.id,
                    provider: 'GOOGLE'
                }
            });
        }

        // 5. Redirect back to Agenda
        return NextResponse.redirect(new URL('/dashboard/agenda?success=true', req.url));

    } catch (error: any) {
        console.error("OAuth Callback Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
