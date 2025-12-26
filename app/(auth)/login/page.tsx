import { LoginForm } from '@/app/_common/components/auth/LoginForm'
import { Suspense } from 'react'
import { ProductShowcase } from './components/ProductShowcase'
import { ShieldCheck, Lock } from 'lucide-react'
import Link from 'next/link'
import { AuraLogo } from '@/app/_common/components/AuraLogo'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-[#0b0b26] overflow-hidden font-sans">
      {/* Left side - Product Showcase (Desktop only) */}
      <div className="hidden lg:block lg:w-[60%] relative bg-[#0f0f2d] border-r border-[#ffffff0d]">
        <ProductShowcase />
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative z-10 bg-[#0b0b26]">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7373FF] opacity-[0.03] blur-[100px] rounded-full -z-10" />

        <div className="w-full max-w-[440px] flex flex-col h-full justify-center relative z-10 py-12">

          {/* Brand Header */}
          <div className="mb-12">
            <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
              <AuraLogo variant="white" />
            </Link>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-white tracking-tight leading-tight">
                Gérez votre cabinet <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7373FF] to-[#8b8bff]">
                  avec excellence.
                </span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed font-light">
                Connectez-vous à votre espace conseiller pour accéder à vos dossiers et simulations.
              </p>
            </div>

            {/* Login Form Container */}
            <div className="bg-[#0f0f2d] rounded-2xl border border-[#ffffff1a] shadow-xl shadow-[#000000]/20 p-6 backdrop-blur-sm">
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#7373FF] border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <LoginForm />
              </Suspense>
            </div>

            <div className="text-center pt-2">
              <p className="text-slate-500 text-sm">
                Vous n'avez pas encore d'accès ?{' '}
                <Link href="/register" className="text-[#7373FF] hover:text-[#8b8bff] font-medium transition-colors hover:underline underline-offset-4">
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>

          {/* Footer / Trust Badges */}
          <div className="mt-auto pt-16 flex flex-col items-center gap-6">
            <div className="flex items-center gap-6 text-[10px] text-slate-500 font-medium uppercase tracking-widest">
              <div className="flex items-center gap-1.5 bg-[#ffffff05] px-3 py-1.5 rounded-full border border-[#ffffff0d]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Données chiffrées</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#ffffff05] px-3 py-1.5 rounded-full border border-[#ffffff0d]">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Conforme RGPD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

