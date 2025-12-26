// FILE: instrumentation.ts

export async function register() {
    // BullMQ workers ne doivent tourner que dans l'environnement Node.js
    // et pas pendant le build
    if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NEXT_IS_EXPORT_WORKER !== 'true') {
        console.log('🏗️ Registering BullMQ workers...')

        // On importe dynamiquement pour éviter de charger BullMQ dans l'edge runtime par erreur
        const { startAllWorkers } = await import('@/lib/queues/workers')

        try {
            await startAllWorkers()
        } catch (error) {
            console.error('❌ Failed to start BullMQ workers:', error)
        }
    }
}
