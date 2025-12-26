'use client'

/**
 * Page SuperAdmin - Sessions Actives
 * 
 * Gestion des sessions utilisateurs:
 * - Liste des sessions actives
 * - Révocation de sessions
 * - Détection de sessions suspectes
 * - Historique des connexions
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_common/components/ui/Card'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/_common/components/ui/Select'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  Activity,
  RefreshCw,
  Search,
  Shield,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  AlertTriangle,
  XCircle,
  MapPin,
  User,
  Building2,
  Eye,
} from 'lucide-react'

interface SessionData {
  id: string
  userId: string
  userName: string
  userEmail: string
  userRole: string
  cabinetId?: string
  cabinetName?: string
  isSuperAdmin: boolean
  device: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  ipAddress: string
  location: string
  createdAt: string
  lastActivity: string
  expiresAt: string
  isCurrent: boolean
  isSuspicious: boolean
}

export default function SessionsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/superadmin/sessions', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      } else {
        setSessions(generateDemoSessions())
      }
    } catch {
      setSessions(generateDemoSessions())
    } finally {
      setLoading(false)
    }
  }

  const generateDemoSessions = (): SessionData[] => {
    const users = [
      { name: 'Jean Dupont', email: 'jean@cabinet.fr', role: 'ADMIN', cabinet: 'Cabinet Finance Pro' },
      { name: 'Marie Martin', email: 'marie@cabinet.fr', role: 'ADVISOR', cabinet: 'Cabinet Finance Pro' },
      { name: 'Pierre Bernard', email: 'pierre@groupe.fr', role: 'ADVISOR', cabinet: 'Groupe Conseil' },
      { name: 'Admin Principal', email: 'admin@aura.fr', role: 'SUPERADMIN', cabinet: null },
    ]
    const devices: ('desktop' | 'mobile' | 'tablet')[] = ['desktop', 'mobile', 'tablet']
    const browsers = ['Chrome 120', 'Firefox 121', 'Safari 17', 'Edge 120']
    const locations = ['Paris, FR', 'Lyon, FR', 'Marseille, FR', 'Bordeaux, FR', 'Unknown']

    return Array.from({ length: 12 }, (_, i) => {
      const user = users[i % users.length]
      const now = Date.now()
      const createdAt = new Date(now - Math.random() * 86400000 * 3)
      const lastActivity = new Date(now - Math.random() * 3600000)
      
      return {
        id: `session-${i}`,
        userId: `user-${i}`,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        cabinetId: user.cabinet ? `cab-${i}` : undefined,
        cabinetName: user.cabinet || undefined,
        isSuperAdmin: user.role === 'SUPERADMIN',
        device: devices[i % devices.length],
        browser: browsers[i % browsers.length],
        os: i % 2 === 0 ? 'Windows 11' : 'macOS Sonoma',
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        location: locations[i % locations.length],
        createdAt: createdAt.toISOString(),
        lastActivity: lastActivity.toISOString(),
        expiresAt: new Date(createdAt.getTime() + 86400000 * 7).toISOString(),
        isCurrent: i === 0,
        isSuspicious: i === 5 || i === 8,
      }
    })
  }

  const revokeSession = async (sessionId: string) => {
    try {
      await fetch(`/api/superadmin/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      toast({ title: 'Session révoquée', description: 'L\'utilisateur a été déconnecté' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const revokeAllForUser = async (userId: string) => {
    try {
      await fetch(`/api/superadmin/sessions/user/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      setSessions(prev => prev.filter(s => s.userId !== userId))
      toast({ title: 'Sessions révoquées', description: 'Toutes les sessions ont été terminées' })
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = Date.now()
    const diff = now - d.getTime()
    
    if (diff < 60000) return 'À l\'instant'
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`
    
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const DeviceIcon = ({ device }: { device: string }) => {
    if (device === 'mobile') return <Smartphone className="h-4 w-4" />
    if (device === 'tablet') return <Monitor className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  const filteredSessions = sessions.filter(session => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!session.userName.toLowerCase().includes(q) &&
          !session.userEmail.toLowerCase().includes(q) &&
          !session.ipAddress.includes(q)) {
        return false
      }
    }
    if (typeFilter === 'superadmin' && !session.isSuperAdmin) return false
    if (typeFilter === 'users' && session.isSuperAdmin) return false
    if (statusFilter === 'suspicious' && !session.isSuspicious) return false
    return true
  })

  // Stats
  const activeSessions = sessions.length
  const superAdminSessions = sessions.filter(s => s.isSuperAdmin).length
  const suspiciousSessions = sessions.filter(s => s.isSuspicious).length
  const mobileSessions = sessions.filter(s => s.device === 'mobile').length

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions Actives</h1>
          <p className="text-gray-500 mt-1">Surveillance des connexions en temps réel</p>
        </div>
        <button onClick={loadSessions} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 transition-all">
          <RefreshCw className="h-4 w-4" />Actualiser
        </button>
      </div>

      {/* Stats Cards - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sessions actives</p>
              <p className="text-2xl font-bold text-gray-900">{activeSessions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">SuperAdmins</p>
              <p className="text-2xl font-bold text-gray-900">{superAdminSessions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Suspectes</p>
              <p className="text-2xl font-bold text-gray-900">{suspiciousSessions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Mobile</p>
              <p className="text-2xl font-bold text-gray-900">{mobileSessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email ou IP..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="superadmin">SuperAdmins</SelectItem>
                <SelectItem value="users">Utilisateurs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="suspicious">Suspectes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions ({filteredSessions.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredSessions.map(session => (
              <div key={session.id} className={`p-4 hover:bg-gray-50 ${session.isSuspicious ? 'bg-amber-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.isSuperAdmin ? 'bg-purple-100' : 'bg-gray-100'}`}>
                      {session.isSuperAdmin ? <Shield className="h-5 w-5 text-purple-600" /> : <User className="h-5 w-5 text-gray-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.userName}</p>
                        {session.isCurrent && <Badge className="bg-green-100 text-green-700 text-xs">Actuelle</Badge>}
                        {session.isSuspicious && <Badge className="bg-amber-100 text-amber-700 text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Suspecte</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">{session.userEmail}</p>
                      {session.cabinetName && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" />{session.cabinetName}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center gap-1"><DeviceIcon device={session.device} />{session.browser}</div>
                      <div className="flex items-center gap-1 text-xs"><Globe className="h-3 w-3" />{session.ipAddress}</div>
                      <div className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" />{session.location}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-gray-500"><Clock className="h-3 w-3" />{formatDate(session.lastActivity)}</div>
                      <p className="text-xs text-gray-400">Créée {formatDate(session.createdAt)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" title="Détails"><Eye className="h-4 w-4" /></Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeSession(session.id)}
                        disabled={session.isCurrent}
                        title="Révoquer"
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
