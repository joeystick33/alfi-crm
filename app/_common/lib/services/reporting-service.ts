import { getPrismaClient } from '@/app/_common/lib/prisma'

export class ReportingService {
    private prisma

    constructor(
        private cabinetId: string,
        private userId: string,
        private isSuperAdmin: boolean = false
    ) {
        this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
    }

    /**
     * Get comprehensive portfolio reporting for a client
     */
    async getClientPortfolio(clientId: string) {
        // 1. Fetch all assets linked to the client
        const clientActifs = await this.prisma.clientActif.findMany({
            where: {
                clientId,
                client: {
                    cabinetId: this.cabinetId,
                },
            },
            include: {
                actif: true,
            },
        })

        // 2. Calculate Totals
        let totalValue = 0
        let totalInvestment = 0

        // For allocation chart
        const allocationMap = new Map<string, number>()

        // For performance estimation (earliest acquisition date)
        let earliestDate = new Date()
        let hasAssets = false

        clientActifs.forEach((ca) => {
            const actif = ca.actif
            const ownership = Number(ca.ownershipPercentage) / 100
            const currentValue = Number(actif.value) * ownership
            const acquisitionValue = actif.acquisitionValue ? Number(actif.acquisitionValue) * ownership : currentValue

            totalValue += currentValue
            totalInvestment += acquisitionValue

            // Allocation
            const category = actif.category
            const currentCategoryValue = allocationMap.get(category) || 0
            allocationMap.set(category, currentCategoryValue + currentValue)

            // Date check
            if (actif.acquisitionDate && actif.acquisitionDate < earliestDate) {
                earliestDate = actif.acquisitionDate
            }
            hasAssets = true
        })

        // 3. Format Allocation Data
        const allocation = Array.from(allocationMap.entries()).map(([name, value]) => ({
            name: this.formatCategoryName(name),
            value: totalValue > 0 ? Math.round((value / totalValue) * 100) : 0,
            amount: value,
            color: this.getCategoryColor(name),
        })).sort((a, b) => b.value - a.value)

        // 4. Generate Performance History (Interpolated)
        // Since we don't have historical data, we interpolate between acquisition and now
        const history = this.generatePerformanceHistory(totalInvestment, totalValue, earliestDate)

        return {
            metrics: {
                totalValue,
                totalInvestment,
                unrealizedGain: totalValue - totalInvestment,
                performancePercent: totalInvestment > 0 ? ((totalValue - totalInvestment) / totalInvestment) * 100 : 0,
                lastUpdate: new Date(),
            },
            allocation,
            history,
            hasAssets,
        }
    }

    private formatCategoryName(category: string): string {
        const map: Record<string, string> = {
            'IMMOBILIER': 'Immobilier',
            'FINANCIER': 'Financier',
            'PROFESSIONNEL': 'Professionnel',
            'AUTRE': 'Autre',
        }
        return map[category] || category
    }

    private getCategoryColor(category: string): string {
        const map: Record<string, string> = {
            'IMMOBILIER': '#f59e0b', // amber-500
            'FINANCIER': '#3b82f6', // blue-500
            'PROFESSIONNEL': '#64748b', // slate-500
            'AUTRE': '#10b981', // emerald-500
        }
        return map[category] || '#94a3b8'
    }

    private generatePerformanceHistory(startValue: number, endValue: number, startDate: Date) {
        const history = []
        const now = new Date()
        const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth())

        // Limit to last 12 months for the chart if history is long, or show all if short
        // For this 'Professional' view, let's show last 12 months always, 
        // but if asset is new, we start from acquisition.

        const points = 12
        const valueStep = (endValue - startValue) / Math.max(monthsDiff, 1)

        for (let i = points - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const monthName = date.toLocaleDateString('fr-FR', { month: 'short' })

            // Simple linear interpolation for now
            // In a real app, this would query a 'WealthHistory' table
            let value = endValue
            if (date < startDate) {
                value = 0 // Before acquisition
            } else {
                // Calculate theoretical value at this date
                const monthsFromStart = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth())
                value = startValue + (valueStep * monthsFromStart)
            }

            // Add some random noise to make it look like a chart (only for demo realism if needed, but let's keep it clean linear for now)
            // Actually, linear is too boring. Let's add a tiny bit of curve.

            history.push({
                date: monthName,
                value: Math.max(0, Math.round(value)),
            })
        }

        return history
    }
}
