import { RegisterForm } from '@/app/_common/components/auth/RegisterForm'
import { Suspense } from 'react'
import { ProductShowcase } from '@/app/(auth)/login/components/ProductShowcase'
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { AuraLogo } from '@/app/_common/components/AuraLogo'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden font-sans">
      {/* Left side - Product Showcase (Desktop only) */}
      <div className="hidden lg:block lg:w-[60%] relative bg-white border-r border-slate-200">
        <ProductShowcase />
      </div>
      
      {/* Right side - Register form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative z-10 bg-slate-50">
        <div className="w-full max-w-[440px] flex flex-col h-full justify-center relative z-10 py-12">
          
          {/* Brand Header */}
          <div className="mb-10">
            <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
              <AuraLogo variant="color" />
            </Link>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                Commencez votre <br/>
                <span className="text-[#7373FF]">
                  essai gratuit.
                </span>
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed font-light">
                Rejoignez les 500+ cabinets qui utilisent Aura pour gérer leur patrimoine.
              </p>
              
              {/* Micro-proofs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>14 jours offerts</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Sans engagement</span>
                </div>
              </div>
            </div>
            
            {/* Register Form Container */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6">
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#7373FF] border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <RegisterForm />
              </Suspense>
            </div>
            
            <div className="text-center pt-2">
              <p className="text-slate-500 text-sm">
                Vous avez déjà un compte ?{' '}
                <Link href="/login" className="text-[#7373FF] hover:text-[#5c5ce6] font-medium transition-colors hover:underline underline-offset-4">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>

          {/* Footer / Trust Badges */}
          <div className="mt-auto pt-10 flex flex-col items-center gap-6">
             <div className="flex items-center gap-6 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Données chiffrées</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Conforme RGPD</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
