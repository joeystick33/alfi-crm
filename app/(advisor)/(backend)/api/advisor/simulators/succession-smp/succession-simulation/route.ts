// ============================================================
// API Route: POST /api/advisor/simulators/succession-smp/succession-simulation
// Proxy vers la route principale — le frontend store appelle ce endpoint
// via calculateSuccession() qui envoie un buildSuccessionPayload()
// ============================================================

import { NextRequest } from 'next/server'
import { POST as mainPOST } from '../route'

export async function POST(req: NextRequest) {
  return mainPOST(req)
}
