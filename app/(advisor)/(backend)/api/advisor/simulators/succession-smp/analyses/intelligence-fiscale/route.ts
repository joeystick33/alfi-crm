// Proxy: /analyses/intelligence-fiscale → /intelligence-fiscale
import { NextRequest } from 'next/server'
import { POST as targetPOST } from '../../intelligence-fiscale/route'

export async function POST(req: NextRequest) {
  return targetPOST(req)
}
