'use client'

import { createContext, useContext } from 'react'

type PresentationModeContextValue = {
  presentationMode: boolean
}

const PresentationModeContext = createContext<PresentationModeContextValue>({
  presentationMode: false,
})

export function PresentationModeProvider({
  value,
  children,
}: {
  value: boolean
  children: React.ReactNode
}) {
  return (
    <PresentationModeContext.Provider value={{ presentationMode: value }}>
      {children}
    </PresentationModeContext.Provider>
  )
}

export function usePresentationMode(): boolean {
  return useContext(PresentationModeContext).presentationMode
}
