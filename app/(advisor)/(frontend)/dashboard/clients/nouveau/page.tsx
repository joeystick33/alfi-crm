'use client'

import { ClientWizard } from './wizard/ClientWizard'

export default function NouveauClientPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <ClientWizard />
    </div>
  )
}
