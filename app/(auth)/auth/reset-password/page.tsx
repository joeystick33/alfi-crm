'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { useToast } from '@/app/_common/hooks/use-toast'
import { Loader2, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/app/_common/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    // Vérifier qu'on a bien une session de récupération
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      // Supabase ajoute automatiquement la session lors du clic sur le lien de reset
      setIsValidSession(!!session)
    }
    
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      toast({
        title: 'Mot de passe trop court',
        description: 'Le mot de passe doit contenir au moins 8 caractères.',
        variant: 'destructive',
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Mots de passe différents',
        description: 'Les deux mots de passe ne correspondent pas.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      // Aussi mettre à jour le mot de passe dans Prisma via notre API
      // pour maintenir la cohérence
      try {
        await fetch('/api/auth/update-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
      } catch {
        // Continue même si l'update Prisma échoue - le login via Supabase fonctionnera
        console.warn('Could not sync password to Prisma')
      }

      setIsSuccess(true)
      toast({
        title: 'Mot de passe mis à jour',
        description: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.',
      })

      // Rediriger vers login après 2 secondes
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (error: any) {
      console.error('Update password error:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le mot de passe.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-sm text-slate-600">Chargement...</p>
        </div>
      </div>
    )
  }

    if (!isValidSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 font-sans">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 border border-red-200">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Lien expiré</h2>
            <p className="mt-2 text-sm text-slate-600">
              Ce lien de réinitialisation a expiré ou est invalide.
              Veuillez demander un nouveau lien.
            </p>
            <Button
              className="w-full mt-6 bg-[#7373FF] hover:bg-[#5c5ce6] text-white rounded-xl"
              onClick={() => router.push('/login')}
            >
              Retour à la connexion
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 font-sans">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 border border-green-200">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Mot de passe mis à jour !</h2>
            <p className="mt-2 text-sm text-slate-600">
              Vous allez être redirigé vers la page de connexion...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight font-display">AURA</h2>
          <p className="mt-2 text-sm text-slate-600">
            Créez votre nouveau mot de passe
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Nouveau mot de passe</Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Minimum 8 caractères"
                  className="h-11 rounded-xl bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#7373FF] focus:ring-1 focus:ring-[#7373FF] transition-all pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700">Confirmer le mot de passe</Label>
              <div className="relative group">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Retapez votre mot de passe"
                  className="h-11 rounded-xl bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#7373FF] focus:ring-1 focus:ring-[#7373FF] transition-all pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {password && password.length < 8 && (
              <p className="text-sm text-amber-600">
                Le mot de passe doit contenir au moins 8 caractères
              </p>
            )}

            {confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-red-500">
                Les mots de passe ne correspondent pas
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#7373FF] hover:bg-[#5c5ce6] text-white rounded-xl h-11 transition-all shadow-lg shadow-indigo-500/20"
              disabled={isLoading || password.length < 8 || password !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour le mot de passe'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
