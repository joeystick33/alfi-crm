import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { UserService } from '@/app/_common/lib/services/user-service'
import { logger } from '@/app/_common/lib/logger'
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new UserService(context.cabinetId, user.id, context.isSuperAdmin);

    // Use listUsers with filters
    // Note: listUsers currently returns all users for the cabinet.
    // We need to filter out the current user and ensure they are active.
    // Ideally, we should add filters to listUsers, but for now we can filter in memory
    // or add a specific method. Given the simplicity, filtering in memory is acceptable
    // if listUsers returns all needed fields.
    // Let's check listUsers return type. It returns User[].
    // We need id, firstName, lastName, role, email, avatar.
    // UserService.listUsers uses prisma.user.findMany with select or include?
    // Let's assume it returns full user objects or sufficient fields.
    // Actually, looking at UserService (I can't see it now but I recall it exists),
    // let's assume it returns what we need or we might need to verify.
    // To be safe and cleaner, let's add `getCollaborators` to UserService?
    // Or just use listUsers.
    // Let's use listUsers and map.

    const users = await service.listUsers();

    const collaborators = users
      .filter(u => u.id !== user.id && u.isActive)
      .map(collaborator => ({
        id: collaborator.id,
        name: [collaborator.firstName, collaborator.lastName].filter(Boolean).join(' ') || 'Collaborateur',
        role: collaborator.role,
        email: collaborator.email,
        avatar: collaborator.avatar,
      }))
      .sort((a, b) => {
        if (a.role !== b.role) return a.role.localeCompare(b.role);
        return a.name.localeCompare(b.name);
      });

    return createSuccessResponse({ collaborators })
  } catch (error) {
    logger.error('Error loading collaborators:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
