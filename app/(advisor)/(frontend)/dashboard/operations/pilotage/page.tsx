"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirect /dashboard/operations/pilotage to /dashboard/pilotage
 * 
 * This page was duplicating functionality with /dashboard/pilotage
 * and its required APIs don't exist. Redirecting to the working version.
 */
export default function OperationsPilotagePage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard/pilotage')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7373FF] mx-auto mb-4" />
        <p className="text-gray-500">Redirection vers le pilotage...</p>
      </div>
    </div>
  )
}
