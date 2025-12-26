 
'use client'

/**
 * TabParametresComplet - Paramètres du client
 * Préférences client, conseiller, notifications, accès
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import Switch from '@/app/_common/components/ui/Switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { formatDate } from '@/app/_common/lib/utils'
import { useToast } from '@/app/_common/hooks/use-toast'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/app/_common/components/ui/Dialog'
import { Settings, Bell, Shield, Users, Lock, Save, Mail, Phone, MessageSquare, Calendar, FileText, AlertTriangle, User, Trash2 } from 'lucide-react'
import type { ClientDetail } from '@/app/_common/lib/api-types'

interface TabParametresCompletProps {
  clientId: string
  client: ClientDetail
}

interface ClientPreferences {
  contactMethod: 'EMAIL' | 'PHONE' | 'SMS' | 'MAIL'
  contactTime: string
  language: string
  timezone: string
  newsletter: boolean
  marketing: boolean
  reportFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'NONE'
}

interface AdvisorPreferences {
  autoReminders: boolean
  reminderDays: number
  alertsEmail: boolean
  alertsApp: boolean
  dashboardLayout: string
}

interface NotificationSettings {
  documentExpiry: boolean
  kycReminder: boolean
  appointmentReminder: boolean
  opportunityAlert: boolean
  reportReady: boolean
}

interface AccessSettings {
  portalAccess: boolean
  twoFactorAuth: boolean
  lastLogin: string | null
  loginHistory: { date: string; ip: string }[]
}

interface AdvisorAccess {
  id: string
  name: string
  email: string
  role: 'PRINCIPAL' | 'SECONDARY' | 'READONLY'
}

export function TabParametresComplet({ clientId, client: _client }: TabParametresCompletProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [showAddAdvisorModal, setShowAddAdvisorModal] = useState(false)
  const [advisorAccess, setAdvisorAccess] = useState<AdvisorAccess[]>([
    { id: 'current', name: 'Vous (Conseiller principal)', email: '', role: 'PRINCIPAL' }
  ])
  
  // State for each settings section
  const [clientPrefs, setClientPrefs] = useState<ClientPreferences>({
    contactMethod: 'EMAIL',
    contactTime: '9h-18h',
    language: 'fr',
    timezone: 'Europe/Paris',
    newsletter: true,
    marketing: false,
    reportFrequency: 'QUARTERLY',
  })

  const [advisorPrefs, setAdvisorPrefs] = useState<AdvisorPreferences>({
    autoReminders: true,
    reminderDays: 7,
    alertsEmail: true,
    alertsApp: true,
    dashboardLayout: 'default',
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    documentExpiry: true,
    kycReminder: true,
    appointmentReminder: true,
    opportunityAlert: true,
    reportReady: true,
  })

  const [accessSettings, setAccessSettings] = useState<AccessSettings>({
    portalAccess: false,
    twoFactorAuth: false,
    lastLogin: null,
    loginHistory: [],
  })

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch(`/api/advisor/clients/${clientId}/settings`)
        if (res.ok) {
          const data = await res.json()
          if (data.clientPreferences) setClientPrefs(prev => ({ ...prev, ...data.clientPreferences }))
          if (data.advisorPreferences) setAdvisorPrefs(prev => ({ ...prev, ...data.advisorPreferences }))
          if (data.notifications) setNotifications(prev => ({ ...prev, ...data.notifications }))
          if (data.access) setAccessSettings(prev => ({ ...prev, ...data.access }))
        }
      } catch { /* use defaults */ }
    }
    loadSettings()
  }, [clientId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/advisor/clients/${clientId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientPreferences: clientPrefs,
          advisorPreferences: advisorPrefs,
          notifications,
          access: accessSettings,
        }),
      })
      toast({ title: 'Paramètres enregistrés', description: 'Les modifications ont été sauvegardées.' })
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddAdvisor = async (data: { email: string; role: AdvisorAccess['role'] }) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/advisors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const newAdvisor = await res.json()
        setAdvisorAccess([...advisorAccess, { 
          id: newAdvisor.data?.id || Date.now().toString(), 
          name: data.email, 
          email: data.email, 
          role: data.role 
        }])
        setShowAddAdvisorModal(false)
        toast({ title: 'Conseiller ajouté' })
      }
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAdvisor = async (advisorId: string) => {
    if (!confirm('Retirer l\'accès de ce conseiller ?')) return
    try {
      await fetch(`/api/advisor/clients/${clientId}/advisors/${advisorId}`, { method: 'DELETE' })
      setAdvisorAccess(advisorAccess.filter(a => a.id !== advisorId))
      toast({ title: 'Accès retiré' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const handleArchive = async () => {
    if (!confirm('Êtes-vous sûr de vouloir archiver ce dossier ? Cette action peut être annulée par un administrateur.')) return
    setSaving(true)
    try {
      await fetch(`/api/advisor/clients/${clientId}/archive`, { method: 'POST' })
      toast({ title: 'Dossier archivé', description: 'Le dossier a été archivé avec succès.' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Settings className="h-6 w-6 text-primary-600" />
            </div>
            Paramètres
          </h2>
          <p className="text-sm text-gray-500 mt-1 ml-14">Configuration du dossier client</p>
        </div>
        <Button onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
      </div>

      {/* Client Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <CardTitle>Préférences du client</CardTitle>
          </div>
          <CardDescription>Comment le client souhaite être contacté</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Mode de contact préféré</Label>
              <Select value={clientPrefs.contactMethod} onValueChange={(v: ClientPreferences['contactMethod']) => setClientPrefs({...clientPrefs, contactMethod: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL"><Mail className="h-4 w-4 inline mr-2" />Email</SelectItem>
                  <SelectItem value="PHONE"><Phone className="h-4 w-4 inline mr-2" />Téléphone</SelectItem>
                  <SelectItem value="SMS"><MessageSquare className="h-4 w-4 inline mr-2" />SMS</SelectItem>
                  <SelectItem value="MAIL"><FileText className="h-4 w-4 inline mr-2" />Courrier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Horaires de contact</Label>
              <Input value={clientPrefs.contactTime} onChange={(e) => setClientPrefs({...clientPrefs, contactTime: e.target.value})} placeholder="Ex: 9h-18h" />
            </div>
            <div className="space-y-2">
              <Label>Fréquence des rapports</Label>
              <Select value={clientPrefs.reportFrequency} onValueChange={(v: ClientPreferences['reportFrequency']) => setClientPrefs({...clientPrefs, reportFrequency: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Mensuel</SelectItem>
                  <SelectItem value="QUARTERLY">Trimestriel</SelectItem>
                  <SelectItem value="ANNUAL">Annuel</SelectItem>
                  <SelectItem value="NONE">Aucun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Langue</Label>
              <Select value={clientPrefs.language} onValueChange={(v) => setClientPrefs({...clientPrefs, language: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Newsletter</p>
                <p className="text-sm text-gray-500">Recevoir notre newsletter mensuelle</p>
              </div>
              <Switch checked={clientPrefs.newsletter} onCheckedChange={(v) => setClientPrefs({...clientPrefs, newsletter: v})} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Communications marketing</p>
                <p className="text-sm text-gray-500">Recevoir des informations sur nos offres</p>
              </div>
              <Switch checked={clientPrefs.marketing} onCheckedChange={(v) => setClientPrefs({...clientPrefs, marketing: v})} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advisor Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <CardTitle>Préférences du conseiller</CardTitle>
          </div>
          <CardDescription>Configuration pour le suivi de ce client</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Rappels automatiques</p>
                <p className="text-sm text-gray-500">Recevoir des rappels pour ce client</p>
              </div>
              <Switch checked={advisorPrefs.autoReminders} onCheckedChange={(v) => setAdvisorPrefs({...advisorPrefs, autoReminders: v})} />
            </div>
            <div className="space-y-2 p-4 rounded-lg border">
              <Label>Rappels avant échéance</Label>
              <div className="flex items-center gap-2">
                <Input type="number" className="w-20" value={advisorPrefs.reminderDays} onChange={(e) => setAdvisorPrefs({...advisorPrefs, reminderDays: Number(e.target.value)})} />
                <span className="text-sm text-muted-foreground">jours</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Alertes par email</p>
              <p className="text-sm text-muted-foreground">Recevoir les alertes importantes par email</p>
            </div>
            <Switch checked={advisorPrefs.alertsEmail} onCheckedChange={(v) => setAdvisorPrefs({...advisorPrefs, alertsEmail: v})} />
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Notifications in-app</p>
              <p className="text-sm text-muted-foreground">Afficher les notifications dans l'application</p>
            </div>
            <Switch checked={advisorPrefs.alertsApp} onCheckedChange={(v) => setAdvisorPrefs({...advisorPrefs, alertsApp: v})} />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Types de notifications à recevoir pour ce client</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Expiration de documents</p><p className="text-sm text-muted-foreground">Documents KYC expirant</p></div></div>
              <Switch checked={notifications.documentExpiry} onCheckedChange={(v) => setNotifications({...notifications, documentExpiry: v})} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Rappels KYC</p><p className="text-sm text-muted-foreground">Mise à jour du dossier KYC</p></div></div>
              <Switch checked={notifications.kycReminder} onCheckedChange={(v) => setNotifications({...notifications, kycReminder: v})} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3"><Calendar className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Rappels de rendez-vous</p><p className="text-sm text-muted-foreground">Avant les rendez-vous planifiés</p></div></div>
              <Switch checked={notifications.appointmentReminder} onCheckedChange={(v) => setNotifications({...notifications, appointmentReminder: v})} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Alertes opportunités</p><p className="text-sm text-muted-foreground">Nouvelles opportunités détectées</p></div></div>
              <Switch checked={notifications.opportunityAlert} onCheckedChange={(v) => setNotifications({...notifications, opportunityAlert: v})} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">Rapports prêts</p><p className="text-sm text-muted-foreground">Notification quand un rapport est généré</p></div></div>
              <Switch checked={notifications.reportReady} onCheckedChange={(v) => setNotifications({...notifications, reportReady: v})} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access & Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-600" />
            <CardTitle>Accès & Sécurité</CardTitle>
          </div>
          <CardDescription>Gestion de l'accès client au portail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PortalAccessSection clientId={clientId} client={_client} />
          
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Authentification à deux facteurs</p>
              <p className="text-sm text-muted-foreground">Sécurité renforcée pour le portail client</p>
            </div>
            <Switch checked={accessSettings.twoFactorAuth} onCheckedChange={(v) => setAccessSettings({...accessSettings, twoFactorAuth: v})} disabled={!accessSettings.portalAccess} />
          </div>

          {accessSettings.lastLogin && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Dernière connexion</p>
              <p className="text-sm text-muted-foreground">{formatDate(accessSettings.lastLogin)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-advisor access */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            <CardTitle>Accès multi-conseillers</CardTitle>
          </div>
          <CardDescription>Autres conseillers ayant accès à ce dossier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {advisorAccess.map((advisor) => (
              <div key={advisor.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{advisor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {advisor.role === 'PRINCIPAL' ? 'Accès complet' : 
                       advisor.role === 'SECONDARY' ? 'Accès secondaire' : 'Lecture seule'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={advisor.role === 'PRINCIPAL' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                    {advisor.role === 'PRINCIPAL' ? 'Principal' : advisor.role === 'SECONDARY' ? 'Secondaire' : 'Lecture'}
                  </Badge>
                  {advisor.role !== 'PRINCIPAL' && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemoveAdvisor(advisor.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4" onClick={() => setShowAddAdvisorModal(true)}>
            <Users className="h-4 w-4 mr-2" />Ajouter un conseiller
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
            <div>
              <p className="font-medium text-red-700">Archiver le dossier</p>
              <p className="text-sm text-red-600">Le dossier sera archivé et ne sera plus visible</p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100" onClick={handleArchive} disabled={saving}>
              {saving ? 'Archivage...' : 'Archiver'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Advisor Modal */}
      <Dialog open={showAddAdvisorModal} onOpenChange={setShowAddAdvisorModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un conseiller</DialogTitle></DialogHeader>
          <AddAdvisorForm onAdd={handleAddAdvisor} saving={saving} onClose={() => setShowAddAdvisorModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Composant pour gérer l'accès portail client avec Supabase
function PortalAccessSection({ clientId, client }: { clientId: string; client: ClientDetail }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [portalStatus, setPortalStatus] = useState<{
    portalAccess: boolean
    hasEmail: boolean
    email: string | null
    lastLogin: string | null
  } | null>(null)

  // Charger le statut initial
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/advisor/clients/${clientId}/portal-access`)
        if (res.ok) {
          const data = await res.json()
          setPortalStatus(data)
        }
      } catch {
        // Fallback sur les données client
        setPortalStatus({
          portalAccess: Boolean(client.portalAccess),
          hasEmail: !!client.email,
          email: client.email || null,
          lastLogin: null,
        })
      }
    }
    fetchStatus()
  }, [clientId, client])

  const handleEnableAccess = async () => {
    if (!portalStatus?.hasEmail) {
      toast({
        title: 'Email requis',
        description: 'Le client doit avoir une adresse email pour accéder au portail.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/portal-access`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        setPortalStatus(prev => prev ? { ...prev, portalAccess: true } : null)
        toast({
          title: 'Accès activé',
          description: data.message || `Un email d'invitation a été envoyé à ${portalStatus.email}`,
        })
      } else {
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible d\'activer l\'accès',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'activation',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDisableAccess = async () => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver l\'accès portail de ce client ?')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/advisor/clients/${clientId}/portal-access`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setPortalStatus(prev => prev ? { ...prev, portalAccess: false } : null)
        toast({
          title: 'Accès désactivé',
          description: 'Le client ne peut plus accéder au portail.',
        })
      } else {
        const data = await res.json()
        toast({
          title: 'Erreur',
          description: data.error || 'Impossible de désactiver l\'accès',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la désactivation',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!portalStatus) {
    return (
      <div className="p-4 rounded-lg border animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className="p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Accès au portail client</p>
          <p className="text-sm text-muted-foreground">
            {portalStatus.hasEmail 
              ? `Permettre à ${client.firstName} ${client.lastName} d'accéder à son espace`
              : 'Email requis pour activer l\'accès'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {portalStatus.portalAccess ? (
            <Badge className="bg-green-100 text-green-700">Activé</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-700">Désactivé</Badge>
          )}
        </div>
      </div>

      {portalStatus.hasEmail && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{portalStatus.email}</span>
        </div>
      )}

      {portalStatus.lastLogin && (
        <div className="text-sm text-muted-foreground">
          Dernière connexion: {formatDate(portalStatus.lastLogin)}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        {portalStatus.portalAccess ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDisableAccess}
            disabled={loading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {loading ? 'Désactivation...' : 'Désactiver l\'accès'}
          </Button>
        ) : (
          <Button 
            size="sm" 
            onClick={handleEnableAccess}
            disabled={loading || !portalStatus.hasEmail}
          >
            {loading ? 'Activation...' : 'Activer l\'accès portail'}
          </Button>
        )}
      </div>

      {portalStatus.portalAccess && (
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <p className="font-medium">✓ Accès activé</p>
          <p>Le client peut se connecter sur <strong>/login</strong> avec son email. Un email d'invitation lui a été envoyé pour créer son mot de passe.</p>
        </div>
      )}
    </div>
  )
}

function AddAdvisorForm({ onAdd, saving, onClose }: { 
  onAdd: (data: { email: string; role: 'PRINCIPAL' | 'SECONDARY' | 'READONLY' }) => void
  saving: boolean
  onClose: () => void 
}) {
  const [data, setData] = useState({ email: '', role: 'SECONDARY' as 'PRINCIPAL' | 'SECONDARY' | 'READONLY' })
  
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Email du conseiller *</Label>
        <Input 
          type="email" 
          value={data.email} 
          onChange={(e) => setData({...data, email: e.target.value})} 
          placeholder="conseiller@cabinet.fr"
        />
      </div>
      <div className="space-y-2">
        <Label>Niveau d'accès</Label>
        <Select value={data.role} onValueChange={(v: any) => setData({...data, role: v})}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="SECONDARY">Accès secondaire (lecture/écriture)</SelectItem>
            <SelectItem value="READONLY">Lecture seule</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Annuler</Button>
        <Button onClick={() => onAdd(data)} disabled={saving || !data.email}>
          {saving ? 'Ajout...' : 'Ajouter'}
        </Button>
      </DialogFooter>
    </div>
  )
}

export default TabParametresComplet
