import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import SuperAdminDashboard from '@/components/superadmin/SuperAdminDashboard';

export const metadata = {
  title: 'Super Admin - ALFI CRM',
  description: 'Interface de gestion super administrateur',
};

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);

  // Vérifier que l'utilisateur est connecté
  if (!session?.user) {
    redirect('/login');
  }

  // Vérifier que l'utilisateur est SuperAdmin
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email: session.user.email! },
  });

  if (!superAdmin || !superAdmin.isActive) {
    redirect('/dashboard');
  }

  return <SuperAdminDashboard />;
}
