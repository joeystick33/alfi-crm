'use client'

/**
 * TabParametres Component
 * 
 * Displays and manages client settings including preferences, fiscal parameters,
 * bank accounts, access rights, notifications, and privacy settings.
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**
 */

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import Switch from '@/app/_common/components/ui/Switch'
import { Label } from '@/app/_common/components/ui/Label'
import { Input } from '@/app/_common/components/ui/Input'
import { Separator } from '@/app/_common/components/ui/Separator'
import { LoadingState } from '@/app/_common/components/ui/LoadingState'
import { ErrorState } from '@/app/_common/components/ui/ErrorState'
import {
  useClientSettings,
  useUpdatePreferences,
  useUpdateFiscalParams,
  useUpdateNotifications,
  useUpdatePrivacy,
  useUpdateSettings,
} from '@/app/(advisor)/(frontend)/hooks/use-settings'
import type { 
  TabParametresProps, 
  CommunicationPreference, 
  ReportingFrequency,
  BankAccount,
  NotificationSetting,
} from '@/app/_common/types/client360'
import {
  Bell,
  Globe,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
  CreditCard,
  Users,
  FileText,
  Calendar,
  Save,
  Plus,
  Trash2,
  Edit2,
  X,
  RefreshCw,
} from 'lucide-react'

// Communication preference options
const COMMUNICATION_OPTIONS: { value: CommunicationPreference; label: string; icon: typeof Mail }[] = [
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'PHONE', label: 'Téléphone', icon: Phone },
  { value: 'BOTH', label: 'Les deux', icon: Mail },
]

// Reporting frequency options
const REPORTING_OPTIONS: { value: ReportingFrequency; label: string }[] = [
  { value: 'MONTHLY', label: 'Mensuel' },
  { value: 'QUARTERLY', label: 'Trimestriel' },
  { value: 'ANNUAL', label: 'Annuel' },
]

// Language options
const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]


// Bank account modal component
interface BankAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (account: Omit<BankAccount, 'id'>) => void
  initialData?: BankAccount
}

function BankAccountModal({ isOpen, onClose, onSubmit, initialData }: BankAccountModalProps) {
  const [bankName, setBankName] = useState(initialData?.bankName || '')
  const [accountType, setAccountType] = useState(initialData?.accountType || 'Compte courant')
  const [iban, setIban] = useState(initialData?.iban || '')
  const [isMain, setIsMain] = useState(initialData?.isMain || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bankName.trim() || !iban.trim()) return
    onSubmit({ bankName, accountType, iban, isMain })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {initialData ? 'Modifier le compte' : 'Ajouter un compte bancaire'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nom de la banque *</Label>
            <Input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Ex: BNP Paribas"
              required
            />
          </div>

          <div>
            <Label>Type de compte</Label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Compte courant">Compte courant</option>
              <option value="Compte épargne">Compte épargne</option>
              <option value="Compte titre">Compte titre</option>
              <option value="PEA">PEA</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <Label>IBAN *</Label>
            <Input
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={isMain}
              onCheckedChange={setIsMain}
            />
            <Label>Compte principal</Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!bankName.trim() || !iban.trim()}>
              {initialData ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


export function TabParametres({ clientId }: TabParametresProps) {
  // Fetch settings data
  const { data, isLoading, isError, error, refetch } = useClientSettings(clientId)
  
  // Mutations
  const updatePreferencesMutation = useUpdatePreferences()
  const updateFiscalMutation = useUpdateFiscalParams()
  const updateNotificationsMutation = useUpdateNotifications()
  const updatePrivacyMutation = useUpdatePrivacy()
  const updateSettingsMutation = useUpdateSettings()

  // Local state for editing
  const [editingPreferences, setEditingPreferences] = useState(false)
  const [editingFiscal, setEditingFiscal] = useState(false)
  const [showBankModal, setShowBankModal] = useState(false)
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | undefined>()

  // Local form state
  const [localCommunication, setLocalCommunication] = useState<CommunicationPreference>('EMAIL')
  const [localReportingFrequency, setLocalReportingFrequency] = useState<ReportingFrequency>('QUARTERLY')
  const [localLanguage, setLocalLanguage] = useState('fr')
  const [localTaxYear, setLocalTaxYear] = useState(new Date().getFullYear())
  const [localRegime, setLocalRegime] = useState('Régime réel')

  // Initialize local state when data loads
  const settings = data?.data

  // Handle preference save
  const handleSavePreferences = useCallback(async () => {
    try {
      await updatePreferencesMutation.mutateAsync({
        clientId,
        communication: localCommunication,
        reportingFrequency: localReportingFrequency,
        language: localLanguage,
      })
      setEditingPreferences(false)
    } catch (err) {
      console.error('Failed to update preferences:', err)
    }
  }, [clientId, localCommunication, localReportingFrequency, localLanguage, updatePreferencesMutation])

  // Handle fiscal params save
  const handleSaveFiscal = useCallback(async () => {
    try {
      await updateFiscalMutation.mutateAsync({
        clientId,
        taxYear: localTaxYear,
        selectedRegime: localRegime,
      })
      setEditingFiscal(false)
    } catch (err) {
      console.error('Failed to update fiscal params:', err)
    }
  }, [clientId, localTaxYear, localRegime, updateFiscalMutation])

  // Handle notification toggle
  const handleNotificationToggle = useCallback(async (type: string, enabled: boolean) => {
    if (!settings?.notifications) return
    
    const updatedNotifications = settings.notifications.map((n: NotificationSetting) =>
      n.type === type ? { ...n, enabled } : n
    )
    
    try {
      await updateNotificationsMutation.mutateAsync({
        clientId,
        notifications: updatedNotifications,
      })
    } catch (err) {
      console.error('Failed to update notifications:', err)
    }
  }, [clientId, settings?.notifications, updateNotificationsMutation])

  // Handle privacy toggle
  const handlePrivacyToggle = useCallback(async (field: 'dataConsent' | 'marketingConsent', value: boolean) => {
    try {
      await updatePrivacyMutation.mutateAsync({
        clientId,
        [field]: value,
      })
    } catch (err) {
      console.error('Failed to update privacy:', err)
    }
  }, [clientId, updatePrivacyMutation])

  // Handle bank account add
  const handleAddBankAccount = useCallback(async (account: Omit<BankAccount, 'id'>) => {
    if (!settings?.bankAccounts) return
    
    const newAccount: BankAccount = {
      id: `bank_${Date.now()}`,
      ...account,
    }
    
    // If this is the main account, unset others
    const updatedAccounts = account.isMain
      ? settings.bankAccounts.map((a: BankAccount) => ({ ...a, isMain: false }))
      : [...settings.bankAccounts]
    
    updatedAccounts.push(newAccount)
    
    try {
      await updateSettingsMutation.mutateAsync({
        clientId,
        bankAccounts: updatedAccounts,
      })
    } catch (err) {
      console.error('Failed to add bank account:', err)
    }
  }, [clientId, settings?.bankAccounts, updateSettingsMutation])

  // Handle bank account remove
  const handleRemoveBankAccount = useCallback(async (accountId: string) => {
    if (!settings?.bankAccounts) return
    
    const updatedAccounts = settings.bankAccounts.filter((a: BankAccount) => a.id !== accountId)
    
    try {
      await updateSettingsMutation.mutateAsync({
        clientId,
        bankAccounts: updatedAccounts,
      })
    } catch (err) {
      console.error('Failed to remove bank account:', err)
    }
  }, [clientId, settings?.bankAccounts, updateSettingsMutation])

  // Start editing preferences
  const startEditingPreferences = useCallback(() => {
    if (settings) {
      setLocalCommunication(settings.preferences.communication)
      setLocalReportingFrequency(settings.preferences.reportingFrequency)
      setLocalLanguage(settings.preferences.language)
    }
    setEditingPreferences(true)
  }, [settings])

  // Start editing fiscal
  const startEditingFiscal = useCallback(() => {
    if (settings) {
      setLocalTaxYear(settings.fiscalParams.taxYear)
      setLocalRegime(settings.fiscalParams.selectedRegime)
    }
    setEditingFiscal(true)
  }, [settings])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingState variant="spinner" message="Chargement des paramètres..." />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <ErrorState
          error={error as Error}
          variant="default"
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <ErrorState
          error={new Error('Paramètres non trouvés')}
          variant="default"
          onRetry={() => refetch()}
        />
      </div>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Paramètres du client</h2>
          <p className="text-sm text-muted-foreground">
            Configuration des préférences et accès
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Communication Preferences - Requirement 14.1 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Préférences de communication
              </CardTitle>
              <CardDescription>
                Configurez les préférences de contact du client
              </CardDescription>
            </div>
            {!editingPreferences ? (
              <Button variant="outline" size="sm" onClick={startEditingPreferences}>
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditingPreferences(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSavePreferences}
                  disabled={updatePreferencesMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updatePreferencesMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Canal préféré</Label>
              {editingPreferences ? (
                <div className="flex flex-wrap gap-2">
                  {COMMUNICATION_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={localCommunication === option.value ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setLocalCommunication(option.value)}
                    >
                      <option.icon className="h-4 w-4 mr-2" />
                      {option.label}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {COMMUNICATION_OPTIONS.map((option) => (
                    settings.preferences.communication === option.value && (
                      <Badge key={option.value} variant="outline" className="flex items-center gap-1">
                        <option.icon className="h-3 w-3" />
                        {option.label}
                      </Badge>
                    )
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Fréquence des rapports</Label>
              {editingPreferences ? (
                <select
                  value={localReportingFrequency}
                  onChange={(e) => setLocalReportingFrequency(e.target.value as ReportingFrequency)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {REPORTING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Badge variant="outline">
                  {REPORTING_OPTIONS.find(o => o.value === settings.preferences.reportingFrequency)?.label}
                </Badge>
              )}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Langue</Label>
            {editingPreferences ? (
              <select
                value={localLanguage}
                onChange={(e) => setLocalLanguage(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{LANGUAGE_OPTIONS.find(o => o.value === settings.preferences.language)?.label}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Fiscal Parameters - Requirement 14.2 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Paramètres fiscaux
              </CardTitle>
              <CardDescription>
                Configuration fiscale du client
              </CardDescription>
            </div>
            {!editingFiscal ? (
              <Button variant="outline" size="sm" onClick={startEditingFiscal}>
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditingFiscal(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveFiscal}
                  disabled={updateFiscalMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateFiscalMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Année fiscale</Label>
              {editingFiscal ? (
                <Input
                  type="number"
                  value={localTaxYear}
                  onChange={(e) => setLocalTaxYear(parseInt(e.target.value))}
                  min={2020}
                  max={2030}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{settings.fiscalParams.taxYear}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Régime fiscal</Label>
              {editingFiscal ? (
                <select
                  value={localRegime}
                  onChange={(e) => setLocalRegime(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {settings.fiscalParams.regimeOptions.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <Badge variant="outline">{settings.fiscalParams.selectedRegime}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Accounts - Requirement 14.3 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Comptes bancaires liés
              </CardTitle>
              <CardDescription>
                Comptes bancaires associés au client
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowBankModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {settings.bankAccounts.length > 0 ? (
            <div className="space-y-3">
              {settings.bankAccounts.map((account: BankAccount) => (
                <div 
                  key={account.id} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{account.bankName}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.accountType} • {account.iban.slice(0, 4)}...{account.iban.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.isMain && (
                      <Badge variant="secondary">Principal</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveBankAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun compte bancaire lié</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowBankModal(true)}
              >
                Ajouter un compte
              </Button>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Access Rights - Requirement 14.4 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Droits d'accès
          </CardTitle>
          <CardDescription>
            Configuration multi-conseiller
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settings.accessRights.length > 0 ? (
              settings.accessRights.map((right: { advisorId: string; advisorName: string; role: string; permissions: string[] }) => (
                <div 
                  key={right.advisorId} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{right.advisorName}</p>
                      <p className="text-sm text-muted-foreground">
                        {right.permissions.length} permission(s)
                      </p>
                    </div>
                  </div>
                  <Badge variant={right.role === 'OWNER' ? 'default' : 'secondary'}>
                    {right.role === 'OWNER' ? 'Propriétaire' : 
                     right.role === 'EDITOR' ? 'Éditeur' : 'Lecteur'}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Conseiller principal</p>
                    <p className="text-sm text-muted-foreground">Accès complet</p>
                  </div>
                </div>
                <Badge>Propriétaire</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications - Requirement 14.5 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Préférences d'alertes du client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.notifications.map((notification: NotificationSetting, index: number) => (
            <div key={notification.type}>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{getNotificationLabel(notification.type)}</Label>
                  <p className="text-sm text-muted-foreground">
                    {getNotificationDescription(notification.type)}
                  </p>
                </div>
                <Switch 
                  checked={notification.enabled}
                  onCheckedChange={(checked) => handleNotificationToggle(notification.type, checked)}
                  disabled={updateNotificationsMutation.isPending}
                />
              </div>
              {index < settings.notifications.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy - Requirement 14.6 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Confidentialité & Consentements
          </CardTitle>
          <CardDescription>
            Statut des consentements RGPD
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Traitement des données</Label>
              <p className="text-sm text-muted-foreground">
                Consentement au traitement des données personnelles
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={settings.privacy.dataConsent ? 'default' : 'outline'}>
                {settings.privacy.dataConsent ? 'Accepté' : 'Non accepté'}
              </Badge>
              <Switch 
                checked={settings.privacy.dataConsent}
                onCheckedChange={(checked) => handlePrivacyToggle('dataConsent', checked)}
                disabled={updatePrivacyMutation.isPending}
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Communications marketing</Label>
              <p className="text-sm text-muted-foreground">
                Réception des communications commerciales
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={settings.privacy.marketingConsent ? 'default' : 'outline'}>
                {settings.privacy.marketingConsent ? 'Accepté' : 'Non accepté'}
              </Badge>
              <Switch 
                checked={settings.privacy.marketingConsent}
                onCheckedChange={(checked) => handlePrivacyToggle('marketingConsent', checked)}
                disabled={updatePrivacyMutation.isPending}
              />
            </div>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground">
            <Lock className="h-4 w-4 inline mr-1" />
            Dernière mise à jour des consentements : {
              settings.privacy.consentDate 
                ? new Date(settings.privacy.consentDate).toLocaleDateString('fr-FR')
                : '-'
            }
          </div>
        </CardContent>
      </Card>

      {/* Bank Account Modal */}
      <BankAccountModal
        isOpen={showBankModal}
        onClose={() => {
          setShowBankModal(false)
          setEditingBankAccount(undefined)
        }}
        onSubmit={handleAddBankAccount}
        initialData={editingBankAccount}
      />
    </div>
  )
}


// Helper functions for notification labels
function getNotificationLabel(type: string): string {
  const labels: Record<string, string> = {
    'kyc_alerts': 'Alertes KYC',
    'contract_alerts': 'Alertes contrats',
    'periodic_reports': 'Rapports périodiques',
    'opportunity_alerts': 'Alertes opportunités',
    'budget_alerts': 'Alertes budget',
  }
  return labels[type] || type
}

function getNotificationDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'kyc_alerts': "Notifications d'expiration des documents",
    'contract_alerts': 'Notifications de renouvellement',
    'periodic_reports': 'Envoi automatique des rapports',
    'opportunity_alerts': 'Nouvelles opportunités détectées',
    'budget_alerts': 'Alertes de dépassement de budget',
  }
  return descriptions[type] || ''
}

export default TabParametres
