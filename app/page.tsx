import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/auth-helpers'

export default async function Home() {
  const user = await getAuthUser()
  
  if (user) {
    // Rediriger selon le rôle
    if (user.isSuperAdmin) {
      redirect('/superadmin/dashboard')
    } else {
      redirect('/dashboard')
    }
  } else {
    redirect('/login')
  }
}
