import { Client } from '@microsoft/microsoft-graph-client'

export interface OutlookTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scope?: string
}

export interface OutlookMessage {
  externalId: string
  threadId: string
  from: string
  to: string[]
  cc: string[]
  subject: string
  body: string
  bodyHtml: string
  snippet: string
  sentAt: Date
  receivedAt: Date
  isRead: boolean
  hasAttachments: boolean
  labels: string[]
}

export class OutlookService {
  private client: Client

  constructor(private accessToken: string) {
    this.client = Client.init({
      authProvider: (done: (error: Error | null, token: string) => void) => {
        done(null, this.accessToken)
      },
    })
  }

  /**
   * Get authorization URL for OAuth flow
   */
  static getAuthUrl(state?: string): string {
    const scopes = ['Mail.Read', 'Mail.Send', 'Mail.ReadWrite', 'User.Read']
    const clientId = process.env.OUTLOOK_CLIENT_ID
    const redirectUri =
      process.env.OUTLOOK_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/email/outlook/callback`

    const params = new URLSearchParams({
      client_id: clientId!,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      response_mode: 'query',
    })

    if (state) {
      params.append('state', state)
    }

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   */
  static async getTokens(code: string): Promise<OutlookTokens> {
    const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
    const redirectUri =
      process.env.OUTLOOK_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/email/outlook/callback`

    const params = new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    })

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })

    if (!response.ok) {
      throw new Error('Failed to get Outlook tokens')
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
      scope: data.scope,
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<OutlookTokens> {
    const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

    const params = new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID!,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    })

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })

    if (!response.ok) {
      throw new Error('Failed to refresh Outlook token')
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
    }
  }

  /**
   * Get user's email address
   */
  async getUserEmail(): Promise<string> {
    const response = await this.client.api('/me').select('mail').get()
    return response.mail || response.userPrincipalName
  }

  /**
   * Fetch emails from Outlook
   */
  async fetchEmails(options: {
    maxResults?: number
    filter?: string
    orderBy?: string
  } = {}): Promise<{ messages: OutlookMessage[]; nextLink?: string }> {
    const { maxResults = 50, filter = 'isRead eq false', orderBy = 'receivedDateTime DESC' } = options

    const response = await this.client
      .api('/me/messages')
      .top(maxResults)
      .filter(filter)
      .orderby(orderBy)
      .select(
        'id,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,isRead,hasAttachments,body,bodyPreview,conversationId'
      )
      .get()

    const messages = response.value.map((message: Record<string, unknown>) => this.parseOutlookMessage(message))

    return {
      messages,
      nextLink: response['@odata.nextLink'],
    }
  }

  /**
   * Parse Outlook message to standard format
   */
  private parseOutlookMessage(message: Record<string, unknown>): OutlookMessage {
    const from = message.from as { emailAddress?: { address?: string } } | undefined
    const body = message.body as { contentType?: string; content?: string } | undefined
    const toRecipients = message.toRecipients as Array<{ emailAddress: { address: string } }> | undefined
    const ccRecipients = message.ccRecipients as Array<{ emailAddress: { address: string } }> | undefined

    return {
      externalId: message.id as string,
      threadId: (message.conversationId || message.id) as string,
      from: from?.emailAddress?.address || '',
      to: toRecipients?.map((r) => r.emailAddress.address) || [],
      cc: ccRecipients?.map((r) => r.emailAddress.address) || [],
      subject: (message.subject as string) || '(No Subject)',
      body: body?.contentType === 'text' ? (body.content || '') : '',
      bodyHtml: body?.contentType === 'html' ? (body.content || '') : '',
      snippet: (message.bodyPreview as string) || '',
      sentAt: new Date(message.sentDateTime as string),
      receivedAt: new Date(message.receivedDateTime as string),
      isRead: message.isRead as boolean,
      hasAttachments: message.hasAttachments as boolean,
      labels: [],
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await this.client.api(`/me/messages/${messageId}`).update({
        isRead: true,
      })
      return true
    } catch (error: unknown) {
      console.error('Error marking email as read:', error)
      return false
    }
  }

  /**
   * Send email
   */
  async sendEmail(emailData: {
    to: string[]
    subject: string
    body: string
    cc?: string[]
    bcc?: string[]
  }): Promise<unknown> {
    const { to, subject, body, cc, bcc } = emailData

    const message = {
      subject,
      body: {
        contentType: 'Text',
        content: body,
      },
      toRecipients: to.map((email: string) => ({
        emailAddress: { address: email },
      })),
      ccRecipients:
        cc?.map((email: string) => ({
          emailAddress: { address: email },
        })) || [],
      bccRecipients:
        bcc?.map((email: string) => ({
          emailAddress: { address: email },
        })) || [],
    }

    const response = await this.client.api('/me/sendMail').post({
      message,
      saveToSentItems: true,
    })

    return response
  }
}
