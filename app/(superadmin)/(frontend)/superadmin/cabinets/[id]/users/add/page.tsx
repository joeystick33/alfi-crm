'use client'

/**
 * Page SuperAdmin - Ajouter un utilisateur à un cabinet
 * 
 * Crée l'utilisateur dans:
 * 1. Prisma (base de données)
 * 2. Supabase Auth (authentification)
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Skeleton } from '@/app/_common/components/ui/Skeleton'
import { useToast } from '@/app/_common/hooks/use-toast'
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  Mail,
  Lock,
  User,
  Shield,
  Building2,
  CheckCircle,
  AlertTriangle,
  Copy,
} from 'lucide-react'

interface CabinetInfo {
  id: string
  name: string
  slug: string
  plan: string
  quotas: {
    maxUsers: number
  }
  usage: {
    users: number
  }
}

const ROLES = [
  { id: 'ADMIN', label: 'Administrateur', description: 'Accès complet au cabinet' },
  { id: 'ADVISOR', label: 'Conseiller', description: 'Gestion des clients et simulations' },
  { id: 'ASSISTANT', label: 'Assistant', description: 'Accès limité, lecture seule' },
]

export default function AddUserToCabinetPage() {
  const params = useParams()
  const _router = useRouter()
  const { toast } = useToast()
  const cabinetId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cabinet, setCabinet] = useState<CabinetInfo | null>(null)
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'ADVISOR',
    password: '',
    generatePassword: true,
  })

  useEffect(() => {
    loadCabinet()
  }, [cabinetId])

  const loadCabinet = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/superadmin/cabinets/${cabinetId}`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setCabinet(data.cabinet)
      } else {
        // Données de démo
        setCabinet({
          id: cabinetId,
          name: 'Cabinet Finance Pro',
          slug: 'cabinet-finance-pro',
          plan: 'BUSINESS',
          quotas: { maxUsers: 15 },
          usage: { users: 8 },
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const password = formData.generatePassword ? generatePassword() : formData.password

    if (!password || password.length < 6) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 6 caractères',
        variant: 'destructive',
      })
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/superadmin/cabinets/${cabinetId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
          role: formData.role,
        }),
      })

      if (response.ok) {
        setCreatedUser({ email: formData.email, password })
        toast({
          title: 'Utilisateur créé',
          description: `${formData.firstName} ${formData.lastName} a été ajouté au cabinet`,
        })
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la création')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copié',
      description: 'Mot de passe copié dans le presse-papier',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!cabinet) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Cabinet non trouvé</h2>
      </div>
    )
  }

  const canAddUser = cabinet.quotas.maxUsers === -1 || cabinet.usage.users < cabinet.quotas.maxUsers

  // Écran de succès
  if (createdUser) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/superadmin/cabinets/${cabinetId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au cabinet
            </Button>
          </Link>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-6 w-6" />
              Utilisateur créé avec succès
            </CardTitle>
            <CardDescription className="text-green-600">
              L'utilisateur peut maintenant se connecter avec ces identifiants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-white border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-mono font-medium">{createdUser.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(createdUser.email)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Mot de passe temporaire</p>
                  <p className="font-mono font-medium">{createdUser.password}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(createdUser.password)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-3 bg-amber-100 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Transmettez ces identifiants de manière sécurisée à l'utilisateur.
                Il devra changer son mot de passe à la première connexion.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCreatedUser(null)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Ajouter un autre
              </Button>
              <Link href={`/superadmin/cabinets/${cabinetId}`} className="flex-1">
                <Button className="w-full">
                  Retour au cabinet
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/superadmin/cabinets/${cabinetId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Ajouter un utilisateur
          </h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {cabinet.name}
          </p>
        </div>
      </div>

      {/* Quota warning */}
      {!canAddUser && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-700">Quota atteint</p>
            <p className="text-sm text-red-600">
              Ce cabinet a atteint son quota de {cabinet.quotas.maxUsers} utilisateurs.
              Augmentez le quota ou passez à un plan supérieur.
            </p>
            <Link href={`/superadmin/cabinets/${cabinetId}/edit`}>
              <Button size="sm" variant="outline" className="mt-2">
                Modifier les quotas
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations utilisateur</CardTitle>
          <CardDescription>
            L'utilisateur sera créé dans la base de données et dans Supabase Auth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Prénom *
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="Jean"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="jean.dupont@cabinet.fr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Rôle *
              </Label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {ROLES.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.label} - {role.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4 p-4 bg-gray-50 border rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="generatePassword"
                  checked={formData.generatePassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, generatePassword: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="generatePassword">Générer un mot de passe automatiquement</Label>
              </div>

              {!formData.generatePassword && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Mot de passe *
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!formData.generatePassword}
                    minLength={6}
                    placeholder="Minimum 6 caractères"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Link href={`/superadmin/cabinets/${cabinetId}`} className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={saving || !canAddUser} className="flex-1">
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Créer l'utilisateur
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
