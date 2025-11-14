import { google } from 'googleapis'

export interface GmailTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  scope?: string
}

export interface GmailMessage {
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

export class GmailService {
  private oauth2Client: any
  private gmail: any

  constructor(tokens?: GmailTokens) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/email/gmail/callback`
    )

    if (tokens) {
      this.oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiry_date: tokens.expiresAt?.getTime(),
      })
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
  }

  /**
   * Get authorization URL for OAuth flow
   */
  static getAuthUrl(state?: string): string {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/email/gmail/callback`
    )

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
    ]

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state,
    })
  }

  /**
   * Exchange authorization code for tokens
   */
  static async getTokens(code: string): Promise<GmailTokens> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/email/gmail/callback`
    )

    const { tokens } = await oauth2Client.getToken(code)

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      scope: tokens.scope,
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<GmailTokens> {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken })
    const { credentials } = await this.oauth2Client.refreshAccessToken()

    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token || refreshToken,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
    }
  }

  /**
   * Get user's email address
   */
  async getUserEmail(): Promise<string> {
    const response = await this.gmail.users.getProfile({ userId: 'me' })
    return response.data.emailAddress
  }

  /**
   * Fetch emails from Gmail
   */
  async fetchEmails(options: {
    maxResults?: number
    pageToken?: string
    query?: string
    labelIds?: string[]
  } = {}): Promise<{ messages: GmailMessage[]; nextPageToken?: string }> {
    const {
      maxResults = 50,
      pageToken,
      query = 'is:unread',
      labelIds = ['INBOX'],
    } = options

    const response = await this.gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken,
      q: query,
      labelIds,
    })

    const messages = response.data.messages || []
    const parsedMessages: GmailMessage[] = []

    // Fetch full message details
    for (const message of messages) {
      try {
        const fullMessage = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full',
        })

        const parsed = this.parseGmailMessage(fullMessage.data)
        parsedMessages.push(parsed)
      } catch (error) {
        console.error(`Error fetching message ${message.id}:`, error)
      }
    }

    return {
      messages: parsedMessages,
      nextPageToken: response.data.nextPageToken,
    }
  }

  /**
   * Parse Gmail message to standard format
   */
  private parseGmailMessage(message: any): GmailMessage {
    const headers = message.payload.headers
    const getHeader = (name: string) => {
      const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
      return header ? header.value : null
    }

    // Extract body
    let body = ''
    let bodyHtml = ''

    if (message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
    } else if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8')
        } else if (part.mimeType === 'text/html' && part.body.data) {
          bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
      }
    }

    // Parse email addresses
    const parseEmails = (str: string | null): string[] => {
      if (!str) return []
      return str
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
    }

    return {
      externalId: message.id,
      threadId: message.threadId,
      from: getHeader('From') || '',
      to: parseEmails(getHeader('To')),
      cc: parseEmails(getHeader('Cc')),
      subject: getHeader('Subject') || '(No Subject)',
      body,
      bodyHtml,
      snippet: message.snippet || body.substring(0, 100),
      sentAt: new Date(parseInt(message.internalDate)),
      receivedAt: new Date(parseInt(message.internalDate)),
      isRead: !message.labelIds?.includes('UNREAD'),
      hasAttachments: message.payload.parts?.some((p: any) => p.filename) || false,
      labels: message.labelIds || [],
    }
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      })
      return true
    } catch (error) {
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
  }): Promise<any> {
    const { to, subject, body, cc, bcc } = emailData

    const email = [
      `To: ${to.join(', ')}`,
      cc && cc.length > 0 ? `Cc: ${cc.join(', ')}` : '',
      bcc && bcc.length > 0 ? `Bcc: ${bcc.join(', ')}` : '',
      `Subject: ${subject}`,
      '',
      body,
    ]
      .filter(Boolean)
      .join('\n')

    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const response = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    })

    return response.data
  }
}
