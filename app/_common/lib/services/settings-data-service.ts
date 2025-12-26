/**
 * Settings Data Service
 * 
 * Manages client settings data for the Client360 TabParametres.
 * Handles preferences, fiscal parameters, bank accounts, access rights,
 * notifications, and privacy settings.
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'
import type {
  SettingsPreferences,
  SettingsFiscalParams,
  SettingsPrivacy,
  BankAccount,
  AccessRight,
  NotificationSetting,
  CommunicationPreference,
  ReportingFrequency,
  AccessRole,
} from '@/app/_common/types/client360'

export interface SettingsDataServiceResult {
  preferences: SettingsPreferences
  fiscalParams: SettingsFiscalParams
  bankAccounts: BankAccount[]
  accessRights: AccessRight[]
  notifications: NotificationSetting[]
  privacy: SettingsPrivacy
}

// Default notification settings
const DEFAULT_NOTIFICATIONS: NotificationSetting[] = [
  { type: 'kyc_alerts', enabled: true, channels: ['email'] },
  { type: 'contract_alerts', enabled: true, channels: ['email'] },
  { type: 'periodic_reports', enabled: true, channels: ['email'] },
  { type: 'opportunity_alerts', enabled: false, channels: ['email'] },
  { type: 'budget_alerts', enabled: true, channels: ['email'] },
]

// Default fiscal regime options
const DEFAULT_REGIME_OPTIONS = [
  'Régime réel',
  'Micro-entreprise',
  'Micro-foncier',
  'Régime réel simplifié',
]

/**
 * Validates communication preference value
 */
export function isValidCommunicationPreference(value: string): value is CommunicationPreference {
  return ['EMAIL', 'PHONE', 'BOTH'].includes(value)
}

/**
 * Validates reporting frequency value
 */
export function isValidReportingFrequency(value: string): value is ReportingFrequency {
  return ['MONTHLY', 'QUARTERLY', 'ANNUAL'].includes(value)
}

/**
 * Validates access role value
 */
export function isValidAccessRole(value: string): value is AccessRole {
  return ['OWNER', 'EDITOR', 'VIEWER'].includes(value)
}

/**
 * Validates bank account data
 */
export function isValidBankAccount(account: unknown): account is BankAccount {
  if (!account || typeof account !== 'object') return false
  const a = account as Record<string, unknown>
  return (
    typeof a.id === 'string' &&
    typeof a.bankName === 'string' &&
    typeof a.accountType === 'string' &&
    typeof a.iban === 'string' &&
    typeof a.isMain === 'boolean'
  )
}


/**
 * Validates notification setting data
 */
export function isValidNotificationSetting(setting: unknown): setting is NotificationSetting {
  if (!setting || typeof setting !== 'object') return false
  const s = setting as Record<string, unknown>
  return (
    typeof s.type === 'string' &&
    typeof s.enabled === 'boolean' &&
    Array.isArray(s.channels) &&
    s.channels.every((c: unknown) => typeof c === 'string')
  )
}

/**
 * Validates access right data
 */
export function isValidAccessRight(right: unknown): right is AccessRight {
  if (!right || typeof right !== 'object') return false
  const r = right as Record<string, unknown>
  return (
    typeof r.advisorId === 'string' &&
    typeof r.advisorName === 'string' &&
    typeof r.role === 'string' &&
    isValidAccessRole(r.role) &&
    Array.isArray(r.permissions) &&
    r.permissions.every((p: unknown) => typeof p === 'string')
  )
}

/**
 * Settings Data Service
 * 
 * Provides data management for client settings including:
 * - Communication preferences
 * - Fiscal parameters
 * - Bank accounts
 * - Access rights (multi-advisor)
 * - Notification settings
 * - Privacy and consent
 */
export class SettingsDataService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Retrieves all settings data for a client
   */
  async getSettingsData(clientId: string): Promise<SettingsDataServiceResult> {
    // Fetch client settings from database
    const clientSettings = await this.prisma.clientSettings.findUnique({
      where: { clientId },
    })

    // Fetch client for additional context
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    })

    // Fetch advisors with access to this client
    const advisorAccess = await this.getAdvisorAccess(clientId)

    // Build preferences
    const preferences: SettingsPreferences = {
      communication: this.parseCommPreference(clientSettings?.communication),
      reportingFrequency: this.parseReportingFrequency(clientSettings?.reportingFrequency),
      language: clientSettings?.language || 'fr',
    }

    // Build fiscal params
    const fiscalParams: SettingsFiscalParams = {
      taxYear: clientSettings?.taxYear || new Date().getFullYear(),
      regimeOptions: DEFAULT_REGIME_OPTIONS,
      selectedRegime: clientSettings?.selectedRegime || 'Régime réel',
    }

    // Parse bank accounts
    const bankAccounts = this.parseBankAccounts(clientSettings?.bankAccounts)

    // Build access rights
    const accessRights = this.buildAccessRights(advisorAccess, clientSettings?.accessRights)

    // Parse notifications
    const notifications = this.parseNotifications(clientSettings?.notifications)

    // Build privacy settings
    const privacy: SettingsPrivacy = {
      dataConsent: clientSettings?.dataConsent ?? false,
      marketingConsent: clientSettings?.marketingConsent ?? false,
      consentDate: clientSettings?.consentDate?.toISOString() || '',
    }

    return {
      preferences,
      fiscalParams,
      bankAccounts,
      accessRights,
      notifications,
      privacy,
    }
  }

  /**
   * Updates client settings
   */
  async updateSettings(
    clientId: string,
    updates: Partial<{
      communication: CommunicationPreference
      reportingFrequency: ReportingFrequency
      language: string
      taxYear: number
      selectedRegime: string
      bankAccounts: BankAccount[]
      notifications: NotificationSetting[]
      dataConsent: boolean
      marketingConsent: boolean
    }>
  ): Promise<SettingsDataServiceResult> {
    // Build update data
    const updateData: Record<string, unknown> = {}

    if (updates.communication && isValidCommunicationPreference(updates.communication)) {
      updateData.communication = updates.communication
    }
    if (updates.reportingFrequency && isValidReportingFrequency(updates.reportingFrequency)) {
      updateData.reportingFrequency = updates.reportingFrequency
    }
    if (updates.language) {
      updateData.language = updates.language
    }
    if (updates.taxYear) {
      updateData.taxYear = updates.taxYear
    }
    if (updates.selectedRegime) {
      updateData.selectedRegime = updates.selectedRegime
    }
    if (updates.bankAccounts) {
      updateData.bankAccounts = updates.bankAccounts
    }
    if (updates.notifications) {
      updateData.notifications = updates.notifications
    }
    if (typeof updates.dataConsent === 'boolean') {
      updateData.dataConsent = updates.dataConsent
      updateData.consentDate = new Date()
    }
    if (typeof updates.marketingConsent === 'boolean') {
      updateData.marketingConsent = updates.marketingConsent
      updateData.consentDate = new Date()
    }

    // Upsert settings
    await this.prisma.clientSettings.upsert({
      where: { clientId },
      create: {
        clientId,
        ...updateData,
      },
      update: updateData,
    })

    // Return updated settings
    return this.getSettingsData(clientId)
  }


  /**
   * Adds a bank account
   */
  async addBankAccount(
    clientId: string,
    account: Omit<BankAccount, 'id'>
  ): Promise<BankAccount> {
    const settings = await this.prisma.clientSettings.findUnique({
      where: { clientId },
    })

    const existingAccounts = this.parseBankAccounts(settings?.bankAccounts)
    
    const newAccount: BankAccount = {
      id: `bank_${Date.now()}`,
      ...account,
    }

    // If this is the main account, unset others
    const updatedAccounts = account.isMain
      ? existingAccounts.map(a => ({ ...a, isMain: false }))
      : existingAccounts

    updatedAccounts.push(newAccount)

    await this.prisma.clientSettings.upsert({
      where: { clientId },
      create: {
        clientId,
        bankAccounts: updatedAccounts,
      },
      update: {
        bankAccounts: updatedAccounts,
      },
    })

    return newAccount
  }

  /**
   * Removes a bank account
   */
  async removeBankAccount(clientId: string, accountId: string): Promise<void> {
    const settings = await this.prisma.clientSettings.findUnique({
      where: { clientId },
    })

    const existingAccounts = this.parseBankAccounts(settings?.bankAccounts)
    const updatedAccounts = existingAccounts.filter(a => a.id !== accountId)

    await this.prisma.clientSettings.update({
      where: { clientId },
      data: {
        bankAccounts: updatedAccounts,
      },
    })
  }

  /**
   * Updates notification settings
   */
  async updateNotifications(
    clientId: string,
    notifications: NotificationSetting[]
  ): Promise<NotificationSetting[]> {
    const validNotifications = notifications.filter(isValidNotificationSetting)

    await this.prisma.clientSettings.upsert({
      where: { clientId },
      create: {
        clientId,
        notifications: validNotifications,
      },
      update: {
        notifications: validNotifications,
      },
    })

    return validNotifications
  }

  /**
   * Gets advisors with access to the client
   */
  private async getAdvisorAccess(clientId: string): Promise<Array<{
    id: string
    firstName: string
    lastName: string
    role: string
  }>> {
    // Get the client's assigned advisor
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        assignedAdvisorId: true,
        assignedAdvisor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    })

    const advisors: Array<{
      id: string
      firstName: string
      lastName: string
      role: string
    }> = []

    if (client?.assignedAdvisor) {
      advisors.push({
        id: client.assignedAdvisor.id,
        firstName: client.assignedAdvisor.firstName,
        lastName: client.assignedAdvisor.lastName,
        role: 'OWNER',
      })
    }

    return advisors
  }

  /**
   * Parses communication preference from database value
   */
  private parseCommPreference(value: string | null | undefined): CommunicationPreference {
    if (value && isValidCommunicationPreference(value)) {
      return value
    }
    return 'EMAIL'
  }

  /**
   * Parses reporting frequency from database value
   */
  private parseReportingFrequency(value: string | null | undefined): ReportingFrequency {
    if (value && isValidReportingFrequency(value)) {
      return value
    }
    return 'QUARTERLY'
  }

  /**
   * Parses bank accounts from JSON field
   */
  private parseBankAccounts(data: unknown): BankAccount[] {
    if (!Array.isArray(data)) return []
    return data.filter(isValidBankAccount)
  }

  /**
   * Parses notifications from JSON field
   */
  private parseNotifications(data: unknown): NotificationSetting[] {
    if (!Array.isArray(data)) return DEFAULT_NOTIFICATIONS
    const parsed = data.filter(isValidNotificationSetting)
    return parsed.length > 0 ? parsed : DEFAULT_NOTIFICATIONS
  }

  /**
   * Builds access rights from advisor data and stored settings
   */
  private buildAccessRights(
    advisors: Array<{ id: string; firstName: string; lastName: string; role: string }>,
    storedRights: unknown
  ): AccessRight[] {
    // Start with advisors from database
    const rights: AccessRight[] = advisors.map(advisor => ({
      advisorId: advisor.id,
      advisorName: `${advisor.firstName} ${advisor.lastName}`,
      role: advisor.role === 'OWNER' ? 'OWNER' : 'EDITOR' as AccessRole,
      permissions: this.getPermissionsForRole(advisor.role === 'OWNER' ? 'OWNER' : 'EDITOR'),
    }))

    // Merge with stored rights if any
    if (Array.isArray(storedRights)) {
      const storedValid = storedRights.filter(isValidAccessRight)
      for (const stored of storedValid) {
        const existing = rights.find(r => r.advisorId === stored.advisorId)
        if (!existing) {
          rights.push(stored)
        }
      }
    }

    return rights
  }

  /**
   * Gets default permissions for a role
   */
  private getPermissionsForRole(role: AccessRole): string[] {
    switch (role) {
      case 'OWNER':
        return ['read', 'write', 'delete', 'share', 'manage_access']
      case 'EDITOR':
        return ['read', 'write']
      case 'VIEWER':
        return ['read']
      default:
        return ['read']
    }
  }
}
