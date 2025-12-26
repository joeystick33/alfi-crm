import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/_common/lib/auth-helpers";
import { KYCService } from "@/app/_common/lib/services/kyc-service";
import { KYCCheckStatus, KYCCheckType, KYCCheckPriority } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const { user, cabinetId, isSuperAdmin } = await requireAuth(req);

        if (!cabinetId) {
            return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const filters = {
            clientId: searchParams.get("clientId") || undefined,
            status: (searchParams.get("status") as KYCCheckStatus) || undefined,
            type: (searchParams.get("type") as KYCCheckType) || undefined,
            priority: (searchParams.get("priority") as KYCCheckPriority) || undefined,
            assignedToId: searchParams.get("assignedToId") || undefined,
            isACPRMandatory: searchParams.get("isACPRMandatory") === "true" || undefined,
        };

        const kycService = new KYCService(cabinetId, user.id, isSuperAdmin);
        const checks = await kycService.listKYCChecks(filters);

        return NextResponse.json({ data: checks });
    } catch (error: any) {
        if (error?.message === "Unauthorized") {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { user, cabinetId, isSuperAdmin } = await requireAuth(req);

        if (!cabinetId) {
            return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 400 });
        }

        const payload = await req.json();
        const kycService = new KYCService(cabinetId, user.id, isSuperAdmin);

        const check = await kycService.createKYCCheck({
            ...payload,
            cabinetId,
        });

        return NextResponse.json({ data: check });
    } catch (error: any) {
        if (error?.message === "Unauthorized") {
            return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
