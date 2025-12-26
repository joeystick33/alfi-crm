import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aura - Authentification',
  description: 'Portail de connexion sécurisé Aura',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}
