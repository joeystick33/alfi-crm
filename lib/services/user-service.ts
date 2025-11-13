import { getPrismaClient, setRLSContext } from '../prisma'
import { AuthService } from './auth-service'
import { UserRole } from '@prisma/client'

export interface CreateUserInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  permissions?: any
}

export interface UpdateUserInput {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  avatar?: string
  role?: UserRole
  permissions?: any
  isActive?: boolean
}

export interface AssignAssistantInput {
  assistantId: string
  advisorId: string
  permissions?: any
}

/**
 * Service de gestion des utilisateurs
 * Gère les opérations CRUD sur les utilisateurs d'un cabinet
 */
export class UserService {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Crée un nouvel utilisateur dans le cabinet
   */
  async createUser(data: CreateUserInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que l'email n'existe pas déjà
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      throw new Error('Email already exists')
    }

    // Hasher le mot de passe
    const hashedPassword = await AuthService.hashPassword(data.password)

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        cabinetId: this.cabinetId,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        permissions: data.permissions,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return user
  }

  /**
   * Récupère un utilisateur par ID
   */
  async getUserById(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        stats: true,
        preferences: true,
      },
    })

    return user
  }

  /**
   * Liste tous les utilisateurs du cabinet
   */
  async listUsers(filters?: {
    role?: UserRole
    isActive?: boolean
    search?: string
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

    if (filters?.role) {
      where.role = filters.role
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    })

    return users
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(id: string, data: UpdateUserInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que l'utilisateur existe
    const existing = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new Error('User not found')
    }

    // Si l'email change, vérifier qu'il n'est pas déjà utilisé
    if (data.email && data.email !== existing.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: data.email },
      })

      if (emailExists) {
        throw new Error('Email already exists')
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    })

    return user
  }

  /**
   * Désactive un utilisateur (soft delete)
   */
  async deactivateUser(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    return user
  }

  /**
   * Réactive un utilisateur
   */
  async reactivateUser(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    })

    return user
  }

  /**
   * Change le mot de passe d'un utilisateur
   */
  async changePassword(id: string, newPassword: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const hashedPassword = await AuthService.hashPassword(newPassword)

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    })

    return { success: true }
  }

  /**
   * Assigne un assistant à un conseiller
   */
  async assignAssistant(data: AssignAssistantInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que l'assistant existe et a le bon rôle
    const assistant = await this.prisma.user.findUnique({
      where: { id: data.assistantId },
    })

    if (!assistant || assistant.role !== 'ASSISTANT') {
      throw new Error('Invalid assistant')
    }

    // Vérifier que le conseiller existe et a le bon rôle
    const advisor = await this.prisma.user.findUnique({
      where: { id: data.advisorId },
    })

    if (!advisor || advisor.role !== 'ADVISOR') {
      throw new Error('Invalid advisor')
    }

    // Créer l'assignation
    const assignment = await this.prisma.assistantAssignment.create({
      data: {
        cabinetId: this.cabinetId,
        assistantId: data.assistantId,
        advisorId: data.advisorId,
        permissions: data.permissions,
      },
      include: {
        assistant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return assignment
  }

  /**
   * Retire l'assignation d'un assistant
   */
  async unassignAssistant(assistantId: string, advisorId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    await this.prisma.assistantAssignment.delete({
      where: {
        assistantId_advisorId: {
          assistantId,
          advisorId,
        },
      },
    })

    return { success: true }
  }

  /**
   * Liste les assistants assignés à un conseiller
   */
  async getAdvisorAssistants(advisorId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const assignments = await this.prisma.assistantAssignment.findMany({
      where: { advisorId },
      include: {
        assistant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    })

    return assignments
  }

  /**
   * Liste les conseillers auxquels un assistant est assigné
   */
  async getAssistantAdvisors(assistantId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const assignments = await this.prisma.assistantAssignment.findMany({
      where: { assistantId },
      include: {
        assistant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    })

    return assignments.map(a => ({
      ...a.assistant,
      permissions: a.permissions,
    }))
  }

  /**
   * Récupère les statistiques d'un utilisateur
   */
  async getUserStats(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clientsPrincipaux: true,
            clientsRemplacants: true,
            taches: true,
            rendezvous: true,
            opportunites: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      totalClients: user._count.clientsPrincipaux + user._count.clientsRemplacants,
      clientsPrincipaux: user._count.clientsPrincipaux,
      clientsRemplacants: user._count.clientsRemplacants,
      totalTasks: user._count.taches,
      totalAppointments: user._count.rendezvous,
      totalOpportunities: user._count.opportunites,
    }
  }
}
