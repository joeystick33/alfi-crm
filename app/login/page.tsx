import { LoginForm } from '@/components/auth/LoginForm'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900">ALFI CRM</h2>
          <p className="mt-2 text-sm text-slate-600">
            Gestion de patrimoine et conseil financier
          </p>
        </div>
        
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-lg">
          <Suspense fallback={<div>Chargement...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
