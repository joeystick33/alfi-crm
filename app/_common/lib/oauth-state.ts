import crypto from 'crypto'

type OAuthProvider = 'google' | 'outlook'
type OAuthFlowType = 'calendar' | 'mail'

export interface OAuthStatePayload {
  userId: string
  provider: OAuthProvider
  type: OAuthFlowType
  iat: number
  exp: number
}

function getOAuthStateSecret(): string {
  const secret =
    process.env.OAUTH_STATE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret) {
    throw new Error('OAuth state secret is not configured')
  }

  return secret
}

function sign(payload: string): string {
  return crypto
    .createHmac('sha256', getOAuthStateSecret())
    .update(payload)
    .digest('base64url')
}

export function createOAuthState(
  payload: Omit<OAuthStatePayload, 'iat' | 'exp'>,
  ttlSeconds: number = 10 * 60
): string {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: OAuthStatePayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  }

  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url')
  const signature = sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function verifyOAuthState(state: string): OAuthStatePayload | null {
  const parts = state.split('.')
  if (parts.length !== 2) return null

  const [encodedPayload, receivedSignature] = parts
  const expectedSignature = sign(encodedPayload)

  const received = Buffer.from(receivedSignature)
  const expected = Buffer.from(expectedSignature)
  if (received.length !== expected.length) return null
  if (!crypto.timingSafeEqual(received, expected)) return null

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8')) as OAuthStatePayload
    const now = Math.floor(Date.now() / 1000)
    if (!payload?.userId || !payload?.provider || !payload?.type) return null
    if (payload.exp <= now) return null
    return payload
  } catch {
    return null
  }
}
