/**
 * Service d'Email
 * Gère la synchronisation et l'envoi d'emails via Gmail et Outlook
 */

import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Configuration Gmail
const GMAIL_CONFIG = {
  clientId: process.env.GMAIL_CLIENT_ID,
  clientSecret: process.env.GMAIL_CLIENT_SECRET,
  redirectUri: process.env.NEXTAUTH_URL + '/api/auth/gmail/callback',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
  ]
};

// Configuration Outlook
const OUTLOOK_CONFIG = {
  clientId: process.env.OUTLOOK_CLIENT_ID,
  clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
  redirectUri: process.env.NEXTAUTH_URL + '/api/auth/outlook/callback',
  scopes: ['Mail.Read', 'Mail.Send', 'Mail.ReadWrite']
};

// Règles de classification
const CLASSIFICATION_RULES = {
  CLIENT: [
    'client', 'particulier', 'rdv', 'rendez-vous', 'meeting',
    'bilan', 'patrimoine', 'investissement', 'contrat', 'signature'
  ],
  PROSPECT: [
    'prospect', 'nouveau', 'demande', 'information', 'renseignement',
    'intéressé', 'découverte', 'premier contact'
  ],
  INTERNAL: [
    'équipe', 'team', 'réunion interne', 'staff', 'collègue',
    'cabinet', 'organisation', 'planning'
  ],
  IMPORTANT: [
    'urgent', 'important', 'prioritaire', 'asap', 'rapidement',
    'immédiat', 'critique'
  ]
};

/**
 * Types
 */
export interface EmailTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate?: number;
  scope?: string;
}

export interface EmailData {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  html?: string;
}

export interface ParsedEmail {
  externalId: string;
  threadId?: string;
  provider: 'gmail' | 'outlook';
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  snippet: string;
  sentAt: Date;
  receivedAt: Date;
  isRead: boolean;
  hasAttachments: boolean;
  labels: string[];
  direction: 'INBOUND' | 'OUTBOUND';
}

/**
 * Service Gmail
 */
export class GmailService {
  private oauth2Client: any;
  private gmail: any;

  constructor(tokens?: EmailTokens) {
    this.oauth2Client = new google.auth.OAuth2(
      GMAIL_CONFIG.clientId,
      GMAIL_CONFIG.clientSecret,
      GMAIL_CONFIG.redirectUri
    );

    if (tokens) {
      this.oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiry_date: tokens.expiryDate
      });
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Obtenir l'URL d'autorisation
   */
  static getAuthUrl(userId: string): string {
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CONFIG.clientId,
      GMAIL_CONFIG.clientSecret,
      GMAIL_CONFIG.redirectUri
    );

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMAIL_CONFIG.scopes,
      state: userId,
      prompt: 'consent'
    });
  }

  /**
   * Échanger le code d'autorisation contre des tokens
   */
  static async exchangeCode(code: string): Promise<EmailTokens> {
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CONFIG.clientId,
      GMAIL_CONFIG.clientSecret,
      GMAIL_CONFIG.redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope
    };
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshToken(): Promise<EmailTokens> {
    const { credentials } = await this.oauth2Client.refreshAccessToken();

    return {
      accessToken: credentials.access_token!,
      refreshToken: credentials.refresh_token!,
      expiryDate: credentials.expiry_date
    };
  }

  /**
   * Récupérer les emails
   */
  async fetchEmails(options: {
    maxResults?: number;
    pageToken?: string;
    query?: string;
  } = {}): Promise<{ emails: ParsedEmail[]; nextPageToken?: string }> {
    const {
      maxResults = 50,
      pageToken,
      query = 'is:unread'
    } = options;

    const response = await this.gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken,
      q: query,
      labelIds: ['INBOX']
    });

    const messages = response.data.messages || [];
    const emails: ParsedEmail[] = [];

    for (const message of messages) {
      try {
        const fullMessage = await this.gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'full'
        });

        emails.push(this.parseMessage(fullMessage.data));
      } catch (error) {
        console.error(`Error fetching message ${message.id}:`, error);
      }
    }

    return {
      emails,
      nextPageToken: response.data.nextPageToken
    };
  }

  /**
   * Parser un message Gmail
   */
  private parseMessage(message: any): ParsedEmail {
    const headers = message.payload.headers;
    const getHeader = (name: string) => {
      const header = headers.find((h: any) => 
        h.name.toLowerCase() === name.toLowerCase()
      );
      return header ? header.value : null;
    };

    // Extraire le corps
    let body = '';
    let bodyHtml = '';

    if (message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body.data) {
          bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return {
      externalId: message.id,
      threadId: message.threadId,
      provider: 'gmail',
      from: getHeader('From') || '',
      to: getHeader('To')?.split(',').map((e: string) => e.trim()) || [],
      cc: getHeader('Cc')?.split(',').map((e: string) => e.trim()).filter(Boolean) || [],
      subject: getHeader('Subject') || '(No Subject)',
      body,
      bodyHtml,
      snippet: message.snippet || body.substring(0, 100),
      sentAt: new Date(parseInt(message.internalDate)),
      receivedAt: new Date(parseInt(message.internalDate)),
      isRead: !message.labelIds?.includes('UNREAD'),
      hasAttachments: message.payload.parts?.some((p: any) => p.filename) || false,
      labels: message.labelIds || [],
      direction: 'INBOUND'
    };
  }

  /**
   * Marquer comme lu
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
      return true;
    } catch (error) {
      console.error('Error marking email as read:', error);
      return false;
    }
  }

  /**
   * Envoyer un email
   */
  async sendEmail(emailData: EmailData): Promise<any> {
    const { to, subject, body, cc, bcc, html } = emailData;

    const email = [
      `To: ${to.join(', ')}`,
      cc && cc.length > 0 ? `Cc: ${cc.join(', ')}` : '',
      bcc && bcc.length > 0 ? `Bcc: ${bcc.join(', ')}` : '',
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      html || body
    ].filter(Boolean).join('\n');

    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await this.gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    return response.data;
  }
}

/**
 * Service Outlook
 */
export class OutlookService {
  private client: any;

  constructor(private accessToken: string) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, this.accessToken);
      }
    });
  }

  /**
   * Obtenir l'URL d'autorisation
   */
  static getAuthUrl(userId: string): string {
    const scopes = OUTLOOK_CONFIG.scopes.join(' ');
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${OUTLOOK_CONFIG.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(OUTLOOK_CONFIG.redirectUri!)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `state=${userId}`;
  }

  /**
   * Échanger le code contre des tokens
   */
  static async exchangeCode(code: string): Promise<EmailTokens> {
    const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';

    const params = new URLSearchParams({
      client_id: OUTLOOK_CONFIG.clientId!,
      client_secret: OUTLOOK_CONFIG.clientSecret!,
      code,
      redirect_uri: OUTLOOK_CONFIG.redirectUri!,
      grant_type: 'authorization_code'
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      throw new Error('Failed to get Outlook tokens');
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiryDate: Date.now() + data.expires_in * 1000
    };
  }

  /**
   * Récupérer les emails
   */
  async fetchEmails(options: {
    maxResults?: number;
    filter?: string;
  } = {}): Promise<{ emails: ParsedEmail[] }> {
    const {
      maxResults = 50,
      filter = 'isRead eq false'
    } = options;

    const response = await this.client
      .api('/me/messages')
      .top(maxResults)
      .filter(filter)
      .orderby('receivedDateTime DESC')
      .select('id,subject,from,toRecipients,ccRecipients,receivedDateTime,sentDateTime,isRead,hasAttachments,body,bodyPreview')
      .get();

    const emails = response.value.map((message: any) => this.parseMessage(message));

    return { emails };
  }

  /**
   * Parser un message Outlook
   */
  private parseMessage(message: any): ParsedEmail {
    return {
      externalId: message.id,
      provider: 'outlook',
      from: message.from?.emailAddress?.address || '',
      to: message.toRecipients?.map((r: any) => r.emailAddress.address) || [],
      cc: message.ccRecipients?.map((r: any) => r.emailAddress.address) || [],
      subject: message.subject || '(No Subject)',
      body: message.body?.contentType === 'text' ? message.body.content : '',
      bodyHtml: message.body?.contentType === 'html' ? message.body.content : '',
      snippet: message.bodyPreview || '',
      sentAt: new Date(message.sentDateTime),
      receivedAt: new Date(message.receivedDateTime),
      isRead: message.isRead,
      hasAttachments: message.hasAttachments,
      labels: [],
      direction: 'INBOUND'
    };
  }

  /**
   * Envoyer un email
   */
  async sendEmail(emailData: EmailData): Promise<any> {
    const { to, subject, body, cc, bcc, html } = emailData;

    const message = {
      subject,
      body: {
        contentType: html ? 'HTML' : 'Text',
        content: html || body
      },
      toRecipients: to.map(email => ({
        emailAddress: { address: email }
      })),
      ccRecipients: cc?.map(email => ({
        emailAddress: { address: email }
      })) || [],
      bccRecipients: bcc?.map(email => ({
        emailAddress: { address: email }
      })) || []
    };

    return await this.client
      .api('/me/sendMail')
      .post({
        message,
        saveToSentItems: true
      });
  }
}

/**
 * Classifier un email
 */
export function classifyEmail(email: ParsedEmail): string[] {
  const text = `${email.subject} ${email.body} ${email.snippet}`.toLowerCase();
  const labels: string[] = [];

  for (const [label, keywords] of Object.entries(CLASSIFICATION_RULES)) {
    if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
      labels.push(label);
    }
  }

  return labels;
}

/**
 * Matcher un email avec un client
 */
export async function matchEmailToClient(
  email: ParsedEmail,
  cabinetId: string
): Promise<string | null> {
  const emailAddresses = [
    email.from,
    ...email.to,
    ...email.cc
  ].filter(Boolean);

  for (const emailAddr of emailAddresses) {
    const client = await prisma.client.findFirst({
      where: {
        cabinetId,
        email: {
          contains: emailAddr,
          mode: 'insensitive'
        }
      },
      select: { id: true }
    });

    if (client) {
      return client.id;
    }
  }

  return null;
}

/**
 * Sauvegarder un email en base
 */
export async function saveEmail(
  email: ParsedEmail,
  userId: string,
  cabinetId: string,
  clientId?: string | null
): Promise<void> {
  // Vérifier si l'email existe déjà
  const existing = await prisma.email.findFirst({
    where: {
      externalId: email.externalId,
      provider: email.provider
    }
  });

  if (existing) {
    return; // Skip duplicates
  }

  // Classifier l'email
  const labels = classifyEmail(email);

  // Sauvegarder
  await prisma.email.create({
    data: {
      externalId: email.externalId,
      threadId: email.threadId,
      provider: email.provider,
      from: email.from,
      to: email.to,
      cc: email.cc,
      subject: email.subject,
      body: email.body,
      bodyHtml: email.bodyHtml,
      snippet: email.snippet,
      sentAt: email.sentAt,
      receivedAt: email.receivedAt,
      isRead: email.isRead,
      hasAttachments: email.hasAttachments,
      labels,
      direction: email.direction,
      userId,
      clientId,
      cabinetId
    }
  });
}

/**
 * Synchroniser les emails pour un utilisateur
 */
export async function syncEmails(
  userId: string,
  provider: 'gmail' | 'outlook',
  tokens: EmailTokens
): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  try {
    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { cabinetId: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Créer le service
    let emails: ParsedEmail[] = [];

    if (provider === 'gmail') {
      const service = new GmailService(tokens);
      const result = await service.fetchEmails({ maxResults: 50 });
      emails = result.emails;
    } else {
      const service = new OutlookService(tokens.accessToken);
      const result = await service.fetchEmails({ maxResults: 50 });
      emails = result.emails;
    }

    // Sauvegarder chaque email
    for (const email of emails) {
      try {
        // Matcher avec un client
        const clientId = await matchEmailToClient(email, user.cabinetId);

        // Sauvegarder
        await saveEmail(email, userId, user.cabinetId, clientId);
        synced++;
      } catch (error) {
        console.error('Error saving email:', error);
        errors++;
      }
    }

    return { synced, errors };
  } catch (error) {
    console.error('Error syncing emails:', error);
    throw error;
  }
}

export default {
  GmailService,
  OutlookService,
  classifyEmail,
  matchEmailToClient,
  saveEmail,
  syncEmails
};
