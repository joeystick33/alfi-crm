'use client'

import React, { Suspense } from 'react'
import { ChakraProvider, Box, Spinner, Center, Toaster, ToastRoot, ToastTitle, ToastDescription, ToastCloseTrigger, ToastIndicator } from '@chakra-ui/react'
import { smpToaster } from './compat'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import modernTheme from './theme/modernTheme'
import ErrorBoundary from './components/ErrorBoundary'

const Simulateur = React.lazy(() => import('./pages/Simulateur'))
const ResultatsSimulation = React.lazy(() => import('./pages/ResultatsSimulation'))
const ResultatsRapportProfessionnel = React.lazy(() => import('./pages/ResultatsRapportProfessionnel'))
const ParametresConseiller = React.lazy(() => import('./pages/ParametresConseiller'))
const MentionsLegales = React.lazy(() => import('./pages/MentionsLegales'))

function LoadingFallback() {
  return (
    <Center minH="400px">
      <Spinner size="xl" color="brand.500" />
    </Center>
  )
}

export default function SuccessionSmpPage() {
  return (
    <div className="smp-simulator" style={{ isolation: 'isolate' }}>
      <ChakraProvider value={modernTheme}>
        <ErrorBoundary>
          <MemoryRouter initialEntries={['/simulateur']}>
            <Box
              as="main"
              minH="80vh"
              bg="#fafafa"
              color="#171717"
              fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
              lineHeight="1.5"
            >
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/simulateur" replace />} />
                  <Route path="/simulateur" element={<Simulateur />} />
                  <Route path="/resultats" element={<ResultatsSimulation />} />
                  <Route path="/resultats-pro" element={<ResultatsRapportProfessionnel />} />
                  <Route path="/parametres" element={<ParametresConseiller />} />
                  <Route path="/mentions-legales" element={<MentionsLegales />} />
                  <Route path="*" element={<Navigate to="/simulateur" replace />} />
                </Routes>
              </Suspense>
            </Box>
          </MemoryRouter>
          <Toaster toaster={smpToaster}>
            {(toast) => (
              <ToastRoot>
                <ToastIndicator />
                <Box flex="1">
                  {toast.title && <ToastTitle>{toast.title}</ToastTitle>}
                  {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
                </Box>
                <ToastCloseTrigger />
              </ToastRoot>
            )}
          </Toaster>
        </ErrorBoundary>
      </ChakraProvider>
    </div>
  )
}
