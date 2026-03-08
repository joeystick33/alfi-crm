// Proxy: /analyses/double-deces → /double-deces
import { NextRequest } from 'next/server'
import { POST as targetPOST } from '../../double-deces/route'

export async function POST(req: NextRequest) {
  return targetPOST(req)
}
