/**
 * Système de permissions basé sur les rôles
 * Définit ce que chaque rôle peut faire dans l'application
 */

export type Permission =
  // Cabinet Management
  | 'canAccessAllCabinets'
  | 'canManageCabinets'
  | 'canViewCabinetStats'
  
  // User Management
  | 'canManageUsers'
  | 'canViewAllUsers'
  | 'canManageOwnProfile'
  
  // Client Management
  | 'canManageClients'
  | 'canManageOwnClients'
  | 'canViewAssignedClients'
  | 'canEditAssignedClients'
  | 'canDeleteClients'
  | 'canExportClients'
  
  // Document Management
  | 'canManageDocuments'
  | 'canViewDocuments'
  | 'canDeleteDocuments'
  | 'canSignDocuments'
  
  // Financial Management
  | 'canManageActifs'
  | 'canManagePassifs'
  | 'canManageContrats'
  | 'canViewFinancialData'
  
  // Task & Calendar
  | 'canManageTasks'
  | 'canManageOwnTasks'
  | 'canManageCalendar'
  | 'canViewCalendar'
  
  // Opportunities
  | 'canManageOpportunities'
  | 'canViewOpportunities'
  
  // Communications
  | 'canSendEmails'
  | 'canManageCampagnes'
  | 'canViewCommunications'
  
  // Templates
  | 'canManageTemplates'
  | 'canUseTemplates'
  
  // Simulations
  | 'canCreateSimulations'
  | 'canViewSimulations'
  | 'canShareSimulations'
  
  // Reports & Analytics
  | 'canViewReports'
  | 'canViewOwnReports'
  | 'canExportData'
  | 'canExportOwnData'
  | 'canExportAllData'
  
  // Audit & Compliance
  | 'canViewAuditLogs'
  | 'canManageCompliance'
  | 'canManageReclamations'
  
  // Apporteurs
  | 'canManageApporteurs'
  | 'canManageOwnApporteurs'
  | 'canViewApporteurs'

/**
 * Permissions par rôle SuperAdmin
 */
export const SUPERADMIN_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: [
    'canAccessAllCabinets',
    'canManageCabinets',
    'canViewCabinetStats',
    'canManageUsers',
    'canViewAllUsers',
    'canManageOwnProfile',
    'canManageClients',
    'canDeleteClients',
    'canExportClients',
    'canManageDocuments',
    'canViewDocuments',
    'canDeleteDocuments',
    'canSignDocuments',
    'canManageActifs',
    'canManagePassifs',
    'canManageContrats',
    'canViewFinancialData',
    'canManageTasks',
    'canManageCalendar',
    'canViewCalendar',
    'canManageOpportunities',
    'canViewOpportunities',
    'canSendEmails',
    'canManageCampagnes',
    'canViewCommunications',
    'canManageTemplates',
    'canUseTemplates',
    'canCreateSimulations',
    'canViewSimulations',
    'canShareSimulations',
    'canViewReports',
    'canExportData',
    'canExportAllData',
    'canViewAuditLogs',
    'canManageCompliance',
    'canManageReclamations',
    'canManageApporteurs',
    'canViewApporteurs',
  ],
  
  ADMIN: [
    'canAccessAllCabinets',
    'canManageCabinets',
    'canViewCabinetStats',
    'canManageUsers',
    'canViewAllUsers',
    'canManageOwnProfile',
    'canViewAuditLogs',
    'canExportAllData',
  ],
  
  DEVELOPER: [
    'canAccessAllCabinets',
    'canViewCabinetStats',
    'canViewAllUsers',
    'canManageOwnProfile',
    'canViewAuditLogs',
  ],
  
  SUPPORT: [
    'canAccessAllCabinets',
    'canViewCabinetStats',
    'canViewAllUsers',
    'canManageOwnProfile',
    'canViewDocuments',
    'canViewAuditLogs',
  ],
}

/**
 * Permissions par rôle utilisateur (dans un cabinet)
 */
export const USER_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    'canManageUsers',
    'canViewAllUsers',
    'canManageOwnProfile',
    'canManageClients',
    'canDeleteClients',
    'canExportClients',
    'canManageDocuments',
    'canViewDocuments',
    'canDeleteDocuments',
    'canSignDocuments',
    'canManageActifs',
    'canManagePassifs',
    'canManageContrats',
    'canViewFinancialData',
    'canManageTasks',
    'canManageCalendar',
    'canViewCalendar',
    'canManageOpportunities',
    'canViewOpportunities',
    'canSendEmails',
    'canManageCampagnes',
    'canViewCommunications',
    'canManageTemplates',
    'canUseTemplates',
    'canCreateSimulations',
    'canViewSimulations',
    'canShareSimulations',
    'canViewReports',
    'canExportData',
    'canManageCompliance',
    'canManageReclamations',
    'canManageApporteurs',
    'canViewApporteurs',
  ],
  
  ADVISOR: [
    'canManageOwnProfile',
    'canManageOwnClients',
    'canExportClients',
    'canManageDocuments',
    'canViewDocuments',
    'canSignDocuments',
    'canManageActifs',
    'canManagePassifs',
    'canManageContrats',
    'canViewFinancialData',
    'canManageOwnTasks',
    'canManageCalendar',
    'canViewCalendar',
    'canManageOpportunities',
    'canViewOpportunities',
    'canSendEmails',
    'canViewCommunications',
    'canUseTemplates',
    'canCreateSimulations',
    'canViewSimulations',
    'canShareSimulations',
    'canViewOwnReports',
    'canExportOwnData',
    'canManageOwnApporteurs',
    'canViewApporteurs',
  ],
  
  ASSISTANT: [
    'canManageOwnProfile',
    'canViewAssignedClients',
    'canEditAssignedClients',
    'canManageDocuments',
    'canViewDocuments',
    'canViewFinancialData',
    'canManageOwnTasks',
    'canViewCalendar',
    'canViewOpportunities',
    'canViewCommunications',
    'canUseTemplates',
    'canViewSimulations',
  ],
}

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export function hasPermission(
  role: string,
  permission: Permission,
  isSuperAdmin: boolean = false,
  superAdminRole?: string
): boolean {
  if (isSuperAdmin && superAdminRole) {
    return SUPERADMIN_PERMISSIONS[superAdminRole]?.includes(permission) ?? false
  }
  
  return USER_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Récupère toutes les permissions d'un rôle
 */
export function getPermissions(
  role: string,
  isSuperAdmin: boolean = false,
  superAdminRole?: string
): Permission[] {
  if (isSuperAdmin && superAdminRole) {
    return SUPERADMIN_PERMISSIONS[superAdminRole] ?? []
  }
  
  return USER_PERMISSIONS[role] ?? []
}

/**
 * Vérifie si un utilisateur peut accéder à un client spécifique
 */
export function canAccessClient(
  userRole: string,
  userId: string,
  clientConseillerId: string,
  clientConseillerRemplacantId?: string,
  assignedAssistants?: string[]
): boolean {
  // Admin peut accéder à tous les clients
  if (userRole === 'ADMIN') {
    return true
  }
  
  // Conseiller peut accéder à ses propres clients
  if (userRole === 'ADVISOR') {
    return (
      userId === clientConseillerId ||
      userId === clientConseillerRemplacantId
    )
  }
  
  // Assistant peut accéder aux clients assignés
  if (userRole === 'ASSISTANT') {
    return assignedAssistants?.includes(userId) ?? false
  }
  
  return false
}

/**
 * Vérifie si un utilisateur peut modifier un client spécifique
 */
export function canEditClient(
  userRole: string,
  userId: string,
  clientConseillerId: string,
  clientConseillerRemplacantId?: string,
  assignedAssistants?: string[]
): boolean {
  // Admin peut modifier tous les clients
  if (userRole === 'ADMIN') {
    return true
  }
  
  // Conseiller peut modifier ses propres clients
  if (userRole === 'ADVISOR') {
    return (
      userId === clientConseillerId ||
      userId === clientConseillerRemplacantId
    )
  }
  
  // Assistant peut modifier les clients assignés
  if (userRole === 'ASSISTANT') {
    return assignedAssistants?.includes(userId) ?? false
  }
  
  return false
}

/**
 * Vérifie si un utilisateur peut supprimer un client
 */
export function canDeleteClient(
  userRole: string,
  userId: string,
  clientConseillerId: string
): boolean {
  // Seul l'admin ou le conseiller principal peut supprimer
  return userRole === 'ADMIN' || (userRole === 'ADVISOR' && userId === clientConseillerId)
}
