import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ALFI CRM - SuperAdmin',
  description: 'Interface d\'administration système',
}

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="superadmin-layout">
      {/* TODO: Ajouter SuperAdminSidebar */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
