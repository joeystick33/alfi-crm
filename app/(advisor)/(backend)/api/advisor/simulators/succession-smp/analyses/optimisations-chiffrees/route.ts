// Proxy: /analyses/optimisations-chiffrees → /optimisations-chiffrees
import { NextRequest } from 'next/server'
import { POST as targetPOST } from '../../optimisations-chiffrees/route'

export async function POST(req: NextRequest) {
  return targetPOST(req)
}
