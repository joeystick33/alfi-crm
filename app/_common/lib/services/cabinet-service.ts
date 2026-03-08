import { getPrismaClient } from '../prisma'
import { AuthService } from './auth-service'
import { createAdminClient } from '../supabase/server'
import { logger } from '@/app/_common/lib/logger'
export interface CreateCabinetInput {
    name: string
    slug: string
    email: string
    phone?: string
    address?: string
    plan?: 'TRIAL' | 'STARTER' | 'BUSINESS' | 'PREMIUM' | 'ENTERPRISE'
    quotas?: {
        maxUsers?: number
        maxClients?: number
        maxStorage?: number
    }
}

export interface CreateCabinetAdminInput {
    email: string
    password: string
    firstName: string
    lastName: string
}

export class CabinetService {
    private prisma

    constructor(private isSuperAdmin: boolean = false) {
        // CabinetService is mostly for SuperAdmins, so we use global client usually
        // But we can restrict if needed. For creation, we need global access.
        this.prisma = getPrismaClient('', true)
    }

    /**
     * Crée un nouveau cabinet avec son administrateur
     */
    async createCabinet(cabinetData: CreateCabinetInput, adminData: CreateCabinetAdminInput) {
        // 1. Vérifier que le slug est unique
        const existingCabinet = await this.prisma.cabinet.findUnique({
            where: { slug: cabinetData.slug },
        })

        if (existingCabinet) {
            throw new Error('Ce slug est déjà utilisé')
        }

        // 2. Vérifier que l'email admin n'existe pas
        const existingUser = await this.prisma.user.findUnique({
            where: { email: adminData.email.toLowerCase() },
        })

        if (existingUser) {
            throw new Error('Cet email est déjà utilisé')
        }

        // 3. Créer le cabinet
        const newCabinet = await this.prisma.cabinet.create({
            data: {
                name: cabinetData.name,
                slug: cabinetData.slug,
                email: cabinetData.email,
                phone: cabinetData.phone || null,
                address: cabinetData.address || null,
                plan: cabinetData.plan || 'BUSINESS',
                status: 'ACTIVE',
                quotas: {
                    maxUsers: cabinetData.quotas?.maxUsers || 10,
                    maxClients: cabinetData.quotas?.maxClients || 100,
                    maxStorage: cabinetData.quotas?.maxStorage || 10737418240,
                },
                usage: {
                    users: 0,
                    clients: 0,
                    storage: 0,
                },
                features: {
                    analytics: true,
                    emailSync: true,
                    advancedReports: cabinetData.plan === 'PREMIUM' || cabinetData.plan === 'ENTERPRISE',
                    api: cabinetData.plan === 'ENTERPRISE',
                    whiteLabel: cabinetData.plan === 'ENTERPRISE',
                },
            },
        })

        // 4. Hasher le mot de passe
        const hashedPassword = await AuthService.hashPassword(adminData.password)

        // 5. Créer l'utilisateur admin dans Prisma
        const newAdmin = await this.prisma.user.create({
            data: {
                email: adminData.email.toLowerCase(),
                password: hashedPassword,
                firstName: adminData.firstName,
                lastName: adminData.lastName,
                role: 'ADMIN',
                cabinetId: newCabinet.id,
                isActive: true,
                permissions: {
                    canManageUsers: true,
                    canManageClients: true,
                    canManageDocuments: true,
                    canViewReports: true,
                    canManageSettings: true,
                },
            },
        })

        // 6. Créer l'utilisateur dans Supabase Auth
        try {
            const supabase = createAdminClient()
            const { error: authError } = await supabase.auth.admin.createUser({
                email: adminData.email.toLowerCase(),
                password: adminData.password,
                email_confirm: true,
                user_metadata: {
                    firstName: adminData.firstName,
                    lastName: adminData.lastName,
                    role: 'ADMIN',
                    cabinetId: newCabinet.id,
                    isSuperAdmin: false,
                }
            })

            if (authError && !authError.message.includes('already')) {
                logger.error('Erreur Supabase Auth: ' + authError.message)
                // On ne bloque pas la création si Supabase échoue (on pourra réessayer ou le user le fera au login)
            }
        } catch (error) {
            logger.error('Erreur lors de la création Supabase:', { error: error instanceof Error ? error.message : String(error) })
        }

        // 7. Mettre à jour l'usage du cabinet
        await this.prisma.cabinet.update({
            where: { id: newCabinet.id },
            data: {
                usage: {
                    users: 1,
                    clients: 0,
                    storage: 0,
                },
            },
        })

        return {
            cabinet: newCabinet,
            admin: newAdmin,
        }
    }

    /**
     * Récupère un cabinet par ID
     */
    async getCabinetById(id: string) {
        return this.prisma.cabinet.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        isActive: true,
                    }
                }
            }
        })
    }

    /**
     * Liste tous les cabinets (SuperAdmin)
     */
    async listCabinets() {
        return this.prisma.cabinet.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { users: true, clients: true }
                }
            }
        })
    }
}
