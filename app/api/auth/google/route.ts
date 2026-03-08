import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma, setRLSContext } from "@/app/_common/lib/prisma";
import { requireAuth } from "@/app/_common/lib/auth-helpers";
import { createOAuthState } from "@/app/_common/lib/oauth-state";

export async function GET(req: NextRequest) {
    try {
        // 1. Authentifier l'utilisateur
        const { user: authUser, cabinetId, isSuperAdmin } = await requireAuth(req);
        if (cabinetId) {
            await setRLSContext(cabinetId, isSuperAdmin);
        }

        // 2. Récupérer les credentials Google du cabinet
        const cabinet = await prisma.cabinet.findUnique({
            where: { id: cabinetId },
            select: { googleClientId: true, googleClientSecret: true }
        });

        if (!cabinet || !cabinet.googleClientId || !cabinet.googleClientSecret) {
            // Rediriger vers la page de paramètres avec un message d'erreur
            return NextResponse.redirect(
                new URL('/dashboard/agenda?error=google_not_configured', req.url)
            );
        }

        // 3. Setup OAuth2 Client (redirect dynamique selon host)
        const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const oauth2Client = new google.auth.OAuth2(
            cabinet.googleClientId,
            cabinet.googleClientSecret,
            `${origin}/api/auth/google/callback`
        );

        // 4. Generate Auth URL
        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/userinfo.email'
        ];

        const state = createOAuthState({
            userId: authUser.id,
            provider: 'google',
            type: 'calendar',
        })

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
            state,
        });

        return NextResponse.redirect(url);

    } catch (error: unknown) {
        console.error("OAuth Init Error:", error);
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.redirect(new URL('/login', req.url));
        }
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Erreur OAuth" },
            { status: 500 }
        );
    }
}
