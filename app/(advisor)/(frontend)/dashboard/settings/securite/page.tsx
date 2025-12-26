"use client"

import { useState } from 'react'
import Link from 'next/link'
import { 
  useProfile, 
  useChangePassword 
} from '@/app/_common/hooks/api/use-profile-api'
import { useAuth } from '@/app/_common/hooks/use-auth'
import { Card, CardContent } from '@/app/_common/components/ui/Card'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { Badge } from '@/app/_common/components/ui/Badge'
import { useToast } from '@/app/_common/hooks/use-toast'
import { 
  Shield, 
  Key, 
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  Monitor,
  Smartphone,
  Globe,
  LogOut,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Jamais'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDateShort = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function SecuritePage() {
  const { toast } = useToast()
  const { logout } = useAuth()
  const { data: profile, isLoading, error, refetch } = useProfile()
  const changePassword = useChangePassword()

  // Form states
  const [showPassword, setShowPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erreur', description: 'Les mots de passe ne correspondent pas', variant: 'destructive' })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: 'Erreur', description: 'Le mot de passe doit contenir au moins 8 caractères', variant: 'destructive' })
      return
    }
    
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword })
      toast({ title: 'Mot de passe modifié', description: 'Votre mot de passe a été mis à jour avec succès' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast({ title: 'Erreur', description: error instanceof Error ? error.message : 'Impossible de changer le mot de passe', variant: 'destructive' })
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  // Password validation
  const passwordValid = newPassword.length >= 8
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0
  const canSubmit = currentPassword && newPassword && confirmPassword && passwordValid && passwordsMatch

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Erreur de chargement</h2>
        <p className="text-sm text-gray-500 mt-1">Impossible de charger les informations</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/settings"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sécurité</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez votre mot de passe et vos sessions</p>
        </div>
      </div>

      {/* Password Change */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-indigo-50">
              <Key className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Modifier le mot de passe</h2>
              <p className="text-xs text-gray-500">Utilisez un mot de passe fort et unique</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword" className="text-xs font-medium text-gray-700">
                Mot de passe actuel
              </Label>
              <div className="relative">
                <Input 
                  id="currentPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-xs font-medium text-gray-700">
                Nouveau mot de passe
              </Label>
              <Input 
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {newPassword && !passwordValid && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Le mot de passe doit contenir au moins 8 caractères
                </p>
              )}
              {passwordValid && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Longueur suffisante
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-gray-700">
                Confirmer le nouveau mot de passe
              </Label>
              <Input 
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Répétez le nouveau mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Les mots de passe ne correspondent pas
                </p>
              )}
              {passwordsMatch && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Les mots de passe correspondent
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button 
                onClick={handleChangePassword}
                disabled={changePassword.isPending || !canSubmit}
                className="w-full gap-2"
              >
                {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Lock className="h-4 w-4" />
                Modifier le mot de passe
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <Monitor className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Sessions actives</h2>
              <p className="text-xs text-gray-500">Appareils connectés à votre compte</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Current Session */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Monitor className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Session actuelle</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Navigateur web • {new Date().toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <Badge variant="success" size="sm" className="gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Active
                </Badge>
              </div>
            </div>

            {/* Security Info */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Dernière connexion</span>
                <span className="text-gray-900 font-medium">{formatDate(profile.lastLogin)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Compte créé le</span>
                <span className="text-gray-900 font-medium">{formatDateShort(profile.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Statut du compte</span>
                <Badge variant={profile.isActive ? 'success' : 'default'} size="xs">
                  {profile.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Déconnecter cette session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-blue-50">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Conseils de sécurité</h2>
              <p className="text-xs text-gray-500">Protégez votre compte efficacement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <Lock className="h-5 w-5 text-slate-600 mb-3" />
              <h4 className="text-sm font-medium text-gray-900">Mot de passe fort</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Utilisez au moins 8 caractères avec des lettres, chiffres et symboles.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <Smartphone className="h-5 w-5 text-slate-600 mb-3" />
              <h4 className="text-sm font-medium text-gray-900">Connexion sécurisée</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Évitez les réseaux Wi-Fi publics non sécurisés pour vous connecter.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <Globe className="h-5 w-5 text-slate-600 mb-3" />
              <h4 className="text-sm font-medium text-gray-900">Vigilance</h4>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Ne partagez jamais vos identifiants et méfiez-vous des emails suspects.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
