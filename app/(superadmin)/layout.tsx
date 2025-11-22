import { Metadata } from 'next'
import { SuperAdminSidebar } from '@/components/superadmin/SuperAdminSidebar'
import { requireSuperAdmin } from '@/lib/supabase/auth-helpers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'ALFI CRM - SuperAdmin',
  description: 'Interface d\'administration système',
}

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Vérifier que l'utilisateur est SuperAdmin
  try {
    await requireSuperAdmin()
  } catch {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
        {children}
      </main>
    </div>
  )
}
