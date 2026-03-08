'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * /dashboard/calendrier redirige vers /dashboard/agenda
 * Les deux pages avaient la même fonctionnalité.
 * L'agenda (FullCalendar) est la version maintenue.
 */
export default function CalendrierRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/agenda')
  }, [router])

  return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      Redirection vers l&apos;agenda...
    </div>
  )
}

