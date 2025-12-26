import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                // Utiliser localStorage au lieu des cookies pour permettre
                // les tests depuis n'importe quel WiFi/IP sans problèmes CORS
                persistSession: true,
                storageKey: 'aura-crm-auth',
                storage: typeof window !== 'undefined' ? window.localStorage : undefined,
                flowType: 'pkce',
                detectSessionInUrl: true,
                autoRefreshToken: true,
            },
            // Désactiver les cookies pour le mode développement multi-IP
            cookies: {
                get: () => undefined,
                set: () => {},
                remove: () => {},
            },
        }
    )
}
