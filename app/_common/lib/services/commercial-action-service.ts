
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { CommercialActionStatus } from '@prisma/client'

export class CommercialActionService {
    private prisma

    constructor(
        private cabinetId: string,
        private userId: string,
        private isSuperAdmin: boolean = false
    ) {
        this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
    }

    /**
     * Get commercial actions with filtering
     */
    async getActions(filters?: {
        status?: CommercialActionStatus
    }) {
        const where: Record<string, unknown> = {
            cabinetId: this.cabinetId,
        }

        if (filters?.status) {
            where.status = filters.status
        }

        return this.prisma.commercialAction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        })
    }

    /**
     * Create a new commercial action
     */
    async createAction(data: {
        title: string
        objective?: string
        segmentKey?: string
        segmentLabel?: string
        channels?: string[]
        scheduledAt?: Date | string
        notes?: string
    }) {
        return this.prisma.commercialAction.create({
            data: {
                ...data,
                cabinetId: this.cabinetId,
                createdBy: this.userId,
                status: 'BROUILLON',
            },
        })
    }

    /**
     * Update a commercial action
     */
    async updateAction(id: string, data: Partial<{
        title: string
        objective: string
        segmentKey: string
        segmentLabel: string
        channels: string[]
        scheduledAt: Date | string
        notes: string
        status: CommercialActionStatus
    }>) {
        const { count } = await this.prisma.commercialAction.updateMany({
            where: {
                id,
                cabinetId: this.cabinetId,
            },
            data,
        })

        if (count === 0) {
            throw new Error('Action not found or access denied')
        }

        return this.prisma.commercialAction.findFirst({
            where: { id, cabinetId: this.cabinetId },
        })
    }

    /**
     * Delete a commercial action
     */
    async deleteAction(id: string) {
        const { count } = await this.prisma.commercialAction.deleteMany({
            where: {
                id,
                cabinetId: this.cabinetId,
            },
        })

        if (count === 0) {
            throw new Error('Action not found or access denied')
        }

        return { success: true }
    }
}
