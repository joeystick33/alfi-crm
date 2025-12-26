import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/_common/lib/auth-helpers";
import { KYCService } from "@/app/_common/lib/services/kyc-service";

export async function POST(req: NextRequest) {
    try {
        const { user, cabinetId, isSuperAdmin } = await requireAuth(req);

        if (!cabinetId) {
            return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
        }

        const { clientId } = await req.json();

        if (!clientId) {
            return NextResponse.json({ error: "Client non spécifié" }, { status: 400 });
        }

        const kycService = new KYCService(cabinetId, user.id, isSuperAdmin);
        await kycService.sendKYCReminder(clientId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error?.message === "Unauthorized") {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
