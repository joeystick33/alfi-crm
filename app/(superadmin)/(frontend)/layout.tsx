import { Metadata } from 'next'
import { SuperAdminSidebar } from '@/app/(superadmin)/(frontend)/components/SuperAdminSidebar'
import { SuperAdminHeader } from '@/app/(superadmin)/(frontend)/components/SuperAdminHeader'
import { requireSuperAdmin } from '@/app/_common/lib/auth-helpers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Aura CRM - SuperAdmin',
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
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Left Navigation Sidebar */}
      <SuperAdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col transition-all duration-300">
        {/* Header */}
        <SuperAdminHeader />

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-auto bg-[#f1f5f9]">
          <div className="max-w-[1600px] mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
