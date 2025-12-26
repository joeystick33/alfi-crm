'use client'

import { useState } from 'react'
import { Button } from '@/app/_common/components/ui/Button'
import { Input } from '@/app/_common/components/ui/Input'
import { Label } from '@/app/_common/components/ui/Label'
import { useToast } from '@/app/_common/hooks/use-toast'
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { createClient } from '@/app/_common/lib/supabase/client'

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: 'Email requis',
        description: 'Veuillez entrer votre adresse email.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      toast({
        title: 'Email envoyé',
        description: 'Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.',
      })
    } catch (error: any) {
      console.error('Reset password error:', error)
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer l\'email de réinitialisation.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

    if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Email envoyé !</h3>
          <p className="mt-2 text-sm text-slate-600">
            Nous avons envoyé un lien de réinitialisation à <strong className="text-slate-900">{email}</strong>.
            Vérifiez votre boîte de réception (et vos spams).
          </p>
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            onClick={() => setEmailSent(false)}
          >
            <Mail className="mr-2 h-4 w-4" />
            Renvoyer l'email
          </Button>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-sm text-[#7373FF] hover:text-[#5c5ce6] font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la connexion
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-[#7373FF]/10 rounded-full flex items-center justify-center mb-4 border border-[#7373FF]/20">
          <Mail className="h-6 w-6 text-[#7373FF]" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900">Mot de passe oublié ?</h3>
        <p className="mt-2 text-sm text-slate-600">
          Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-email" className="text-slate-700 font-medium">Email</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="nom@exemple.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
          className="h-11 rounded-xl bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#7373FF] focus:ring-1 focus:ring-[#7373FF] transition-all"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full h-11 bg-[#7373FF] hover:bg-[#5c5ce6] text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          'Envoyer le lien'
        )}
      </Button>

      <button
        type="button"
        onClick={onBack}
        disabled={isLoading}
        className="w-full text-sm text-slate-500 hover:text-slate-900 font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors mt-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la connexion
      </button>
    </form>
  )
}
