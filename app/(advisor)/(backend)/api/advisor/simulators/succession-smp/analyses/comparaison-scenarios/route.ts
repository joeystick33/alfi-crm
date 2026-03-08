// Proxy: /analyses/comparaison-scenarios → /comparaison-scenarios
import { NextRequest } from 'next/server'
import { POST as targetPOST } from '../../comparaison-scenarios/route'

export async function POST(req: NextRequest) {
  return targetPOST(req)
}
