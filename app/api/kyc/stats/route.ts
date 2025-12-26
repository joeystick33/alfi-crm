import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/_common/lib/auth-helpers";
import { KYCService } from "@/app/_common/lib/services/kyc-service";

export async function GET(req: NextRequest) {
    try {
        const { user, cabinetId, isSuperAdmin } = await requireAuth(req);

        if (!cabinetId) {
            return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
        }

        const kycService = new KYCService(cabinetId, user.id, isSuperAdmin);

        const [docStats, checkStats] = await Promise.all([
            kycService.getKYCStats(),
            kycService.getKYCCheckStats()
        ]);

        return NextResponse.json({
            documents: docStats,
            checks: checkStats
        });
    } catch (error: any) {
        if (error?.message === "Unauthorized") {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
