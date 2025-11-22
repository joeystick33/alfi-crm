import { getPrismaClient, setRLSContext } from '../prisma'
import { getPermissions } from '../permissions'
import { SessionUser, SessionSuperAdmin } from '../auth-types'
import bcrypt from 'bcryptjs'

/**
 * Service d'authentification
 * Gère le login/logout et la validation des sessions
 */
export class AuthService {
  /**
   * Authentifie un utilisateur normal (cabinet)
   */
  static async loginUser(
    email: string,
    password: string
  ): Promise<SessionUser | null> {
    // Utiliser le client global pour la recherche initiale
    const prisma = getPrismaClient('', true) // SuperAdmin mode pour recherche
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        cabinet: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })

    if (!user) {
      return null
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return null
    }

    // Vérifier que le cabinet est actif
    if (user.cabinet.status !== 'ACTIVE' && user.cabinet.status !== 'TRIALING') {
      throw new Error('Cabinet is not active')
    }

    // Vérifier que l'utilisateur est actif
    if (!user.isActive) {
      throw new Error('User is not active')
    }

    // Mettre à jour la date de dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Récupérer les permissions
    const permissions = getPermissions(user.role, false)

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      cabinetId: user.cabinetId,
      cabinetName: user.cabinet.name,
      permissions: permissions as string[],
      avatar: user.avatar || undefined,
    }
  }

  /**
   * Authentifie un SuperAdmin
   */
  static async loginSuperAdmin(
    email: string,
    password: string
  ): Promise<SessionSuperAdmin | null> {
    const prisma = getPrismaClient('', true)
    
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email },
    })

    if (!superAdmin) {
      return null
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, superAdmin.password)
    if (!isValidPassword) {
      return null
    }

    // Vérifier que le SuperAdmin est actif
    if (!superAdmin.isActive) {
      throw new Error('SuperAdmin is not active')
    }

    // Mettre à jour la date de dernière connexion
    await prisma.superAdmin.update({
      where: { id: superAdmin.id },
      data: { lastLogin: new Date() },
    })

    // Récupérer les permissions
    const permissions = getPermissions(superAdmin.role, true, superAdmin.role)

    return {
      id: superAdmin.id,
      email: superAdmin.email,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      role: superAdmin.role,
      permissions: permissions as string[],
      isSuperAdmin: true,
    }
  }

  /**
   * Crée un hash de mot de passe
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  /**
   * Vérifie un mot de passe
   */
  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Valide un token de session (à implémenter avec NextAuth)
   */
  static async validateSession(token: string): Promise<SessionUser | SessionSuperAdmin | null> {
    // TODO: Implémenter avec NextAuth ou votre système de session
    // Pour l'instant, retourne null
    return null
  }

  /**
   * Révoque une session
   */
  static async logout(userId: string, isSuperAdmin: boolean = false): Promise<void> {
    // TODO: Implémenter la révocation de session
    // Peut inclure la suppression de tokens, mise à jour de lastLogout, etc.
  }
}
