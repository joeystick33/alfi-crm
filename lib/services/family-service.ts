import { getPrismaClient, setRLSContext } from '../prisma'
import { FamilyRelationship } from '@prisma/client'

export interface CreateFamilyMemberInput {
  clientId: string
  firstName: string
  lastName: string
  birthDate?: Date
  relationship: FamilyRelationship
  linkedClientId?: string
  isBeneficiary?: boolean
}

export interface UpdateFamilyMemberInput {
  firstName?: string
  lastName?: string
  birthDate?: Date
  relationship?: FamilyRelationship
  linkedClientId?: string
  isBeneficiary?: boolean
}

/**
 * Service de gestion des membres de la famille
 * Gère les liens familiaux et les bénéficiaires
 */
export class FamilyService {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Ajoute un membre de la famille
   */
  async addFamilyMember(data: CreateFamilyMemberInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    // Si linkedClientId, vérifier que le client lié existe
    if (data.linkedClientId) {
      const linkedClient = await this.prisma.client.findUnique({
        where: { id: data.linkedClientId },
      })

      if (!linkedClient) {
        throw new Error('Linked client not found')
      }
    }

    const familyMember = await this.prisma.familyMember.create({
      data,
    })

    return familyMember
  }

  /**
   * Récupère un membre de la famille par ID
   */
  async getFamilyMemberById(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const familyMember = await this.prisma.familyMember.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return familyMember
  }

  /**
   * Liste les membres de la famille d'un client
   */
  async listFamilyMembers(clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const familyMembers = await this.prisma.familyMember.findMany({
      where: { clientId },
      orderBy: [
        { relationship: 'asc' },
        { lastName: 'asc' },
      ],
    })

    return familyMembers
  }

  /**
   * Met à jour un membre de la famille
   */
  async updateFamilyMember(id: string, data: UpdateFamilyMemberInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const familyMember = await this.prisma.familyMember.update({
      where: { id },
      data,
    })

    return familyMember
  }

  /**
   * Supprime un membre de la famille
   */
  async deleteFamilyMember(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    await this.prisma.familyMember.delete({
      where: { id },
    })

    return { success: true }
  }

  /**
   * Récupère les bénéficiaires d'un client
   */
  async getBeneficiaries(clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const beneficiaries = await this.prisma.familyMember.findMany({
      where: {
        clientId,
        isBeneficiary: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    })

    return beneficiaries
  }

  /**
   * Marque un membre comme bénéficiaire
   */
  async setBeneficiary(id: string, isBeneficiary: boolean) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const familyMember = await this.prisma.familyMember.update({
      where: { id },
      data: { isBeneficiary },
    })

    return familyMember
  }

  /**
   * Lie un membre de la famille à un client existant
   */
  async linkToClient(id: string, linkedClientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le client lié existe
    const linkedClient = await this.prisma.client.findUnique({
      where: { id: linkedClientId },
    })

    if (!linkedClient) {
      throw new Error('Linked client not found')
    }

    const familyMember = await this.prisma.familyMember.update({
      where: { id },
      data: { linkedClientId },
    })

    return familyMember
  }

  /**
   * Récupère l'arbre familial d'un client
   */
  async getFamilyTree(clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        maritalStatus: true,
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    const familyMembers = await this.prisma.familyMember.findMany({
      where: { clientId },
      orderBy: [
        { relationship: 'asc' },
        { birthDate: 'desc' },
      ],
    })

    // Organiser par type de relation
    const tree = {
      client,
      spouse: familyMembers.filter(m => m.relationship === 'SPOUSE'),
      children: familyMembers.filter(m => m.relationship === 'CHILD'),
      parents: familyMembers.filter(m => m.relationship === 'PARENT'),
      siblings: familyMembers.filter(m => m.relationship === 'SIBLING'),
      grandchildren: familyMembers.filter(m => m.relationship === 'GRANDCHILD'),
      other: familyMembers.filter(m => m.relationship === 'OTHER'),
    }

    return tree
  }

  /**
   * Calcule l'âge d'un membre de la famille
   */
  calculateAge(birthDate: Date): number {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  /**
   * Récupère les statistiques familiales d'un client
   */
  async getFamilyStats(clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const familyMembers = await this.prisma.familyMember.findMany({
      where: { clientId },
    })

    const stats = {
      totalMembers: familyMembers.length,
      byRelationship: {
        spouse: familyMembers.filter(m => m.relationship === 'SPOUSE').length,
        children: familyMembers.filter(m => m.relationship === 'CHILD').length,
        parents: familyMembers.filter(m => m.relationship === 'PARENT').length,
        siblings: familyMembers.filter(m => m.relationship === 'SIBLING').length,
        grandchildren: familyMembers.filter(m => m.relationship === 'GRANDCHILD').length,
        other: familyMembers.filter(m => m.relationship === 'OTHER').length,
      },
      beneficiaries: familyMembers.filter(m => m.isBeneficiary).length,
      linkedClients: familyMembers.filter(m => m.linkedClientId).length,
      minors: familyMembers.filter(m => {
        if (!m.birthDate) return false
        return this.calculateAge(m.birthDate) < 18
      }).length,
    }

    return stats
  }
}
