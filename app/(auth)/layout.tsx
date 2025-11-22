import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ALFI CRM - Connexion',
  description: 'Authentification',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-layout min-h-screen flex items-center justify-center">
      {children}
    </div>
  )
}
