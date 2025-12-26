import { getAuthUser } from '@/app/_common/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { Navbar } from './_landing/components/Navbar'
import { Hero } from './_landing/components/Hero'
import { Features } from './_landing/components/Features'
import { Compliance } from './_landing/components/Compliance'
import { Pricing } from './_landing/components/Pricing'
import { CTA } from './_landing/components/CTA'
import { Footer } from './_landing/components/Footer'

export default async function Home() {
  const user = await getAuthUser()

  // If user is logged in, redirect to dashboard immediately
  if (user) {
    if ('isSuperAdmin' in user && user.isSuperAdmin) {
      redirect('/superadmin/dashboard')
    } else {
      redirect('/dashboard')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-[#7373FF] selection:text-white">
      <Navbar />
      <Hero />
      <Features />
      <Compliance />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  )
}
