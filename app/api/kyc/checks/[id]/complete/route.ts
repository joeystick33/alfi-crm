import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/_common/lib/auth-helpers";
import { KYCService } from "@/app/_common/lib/services/kyc-service";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { user, cabinetId, isSuperAdmin } = await requireAuth(req);

        if (!cabinetId) {
            return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
        }

        const payload = await req.json();
        const kycService = new KYCService(cabinetId, user.id, isSuperAdmin);

        const check = await kycService.completeKYCCheck({
            kycCheckId: params.id,
            completedById: user.id,
            ...payload,
        });

        return NextResponse.json({ data: check });
    } catch (error: any) {
        if (error?.message === "Unauthorized") {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
