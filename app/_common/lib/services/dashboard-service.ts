import { getPrismaClient } from '../prisma'

type UserRole = 'ADMIN' | 'ADVISOR' | 'ASSISTANT'

export class DashboardService {
    private prisma

    constructor(
        private cabinetId: string,
        private userId: string,
        private isSuperAdmin: boolean = false,
        private userRole: UserRole = 'ADVISOR',
        private linkedAdvisorId?: string // For assistants
    ) {
        this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
    }

    /**
     * Get counters scoped by role:
     * - ADMIN: Cabinet-wide data (or filtered by advisorId if provided)
     * - ADVISOR: Only their own data
     * - ASSISTANT: Their linked advisor's data (read-only)
     */
    async getCounters(advisorId?: string) {
        const cabinetId = this.cabinetId
        
        // Determine the advisor scope
        let scopedAdvisorId: string | undefined
        
        if (this.userRole === 'ADMIN') {
            // Admin can see all or filter by specific advisor
            scopedAdvisorId = advisorId // undefined = all cabinet
        } else if (this.userRole === 'ADVISOR') {
            // Advisor sees only their own data
            scopedAdvisorId = this.userId
        } else if (this.userRole === 'ASSISTANT') {
            // Assistant sees their linked advisor's data
            scopedAdvisorId = this.linkedAdvisorId
        }

        // Build where clauses based on scope
        const clientWhere = scopedAdvisorId 
            ? { cabinetId, conseillerId: scopedAdvisorId }
            : { cabinetId }
        
        const taskWhere = scopedAdvisorId
            ? { cabinetId, assignedToId: scopedAdvisorId }
            : { cabinetId }
        
        const appointmentWhere = scopedAdvisorId
            ? { cabinetId, conseillerId: scopedAdvisorId }
            : { cabinetId }
        
        const opportunityWhere = scopedAdvisorId
            ? { cabinetId, conseillerId: scopedAdvisorId }
            : { cabinetId }

        const [
            clientsCount,
            activeClientsCount,
            prospectsCount,
            tasksCount,
            overdueTasksCount,
            todayTasksCount,
            appointmentsCount,
            todayAppointmentsCount,
            opportunitiesCount,
            qualifiedOpportunitiesCount,
            unreadNotificationsCount
        ] = await Promise.all([
            // Clients
            this.prisma.client.count({ where: { ...clientWhere, status: { not: 'ARCHIVE' } } }),
            this.prisma.client.count({ where: { ...clientWhere, status: 'ACTIF' } }),
            this.prisma.client.count({ where: { ...clientWhere, status: 'PROSPECT' } }),

            // Tasks
            this.prisma.tache.count({ where: { ...taskWhere, status: { not: 'TERMINE' } } }),
            this.prisma.tache.count({ where: { ...taskWhere, status: { not: 'TERMINE' }, dueDate: { lt: new Date() } } }),
            this.prisma.tache.count({ 
                where: { 
                    ...taskWhere, 
                    status: { not: 'TERMINE' },
                    dueDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                } 
            }),

            // Appointments
            this.prisma.rendezVous.count({ where: appointmentWhere }),
            this.prisma.rendezVous.count({
                where: {
                    ...appointmentWhere,
                    startDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                }
            }),

            // Opportunities
            this.prisma.opportunite.count({ where: { ...opportunityWhere, status: { notIn: ['PERDUE', 'REJETEE', 'CONVERTIE'] } } }),
            this.prisma.opportunite.count({ where: { ...opportunityWhere, status: 'QUALIFIEE' } }),

            // Notifications non lues pour l'utilisateur
            this.prisma.notification.count({ 
                where: { 
                    cabinetId, 
                    userId: scopedAdvisorId || this.userId,
                    isRead: false 
                } 
            }).catch(() => 0) // Fallback si table notification n'existe pas
        ]);

        return {
            clients: {
                total: clientsCount,
                active: activeClientsCount,
                prospects: prospectsCount
            },
            tasks: {
                total: tasksCount,
                overdue: overdueTasksCount,
                today: todayTasksCount
            },
            appointments: {
                total: appointmentsCount,
                today: todayAppointmentsCount
            },
            opportunities: {
                total: opportunitiesCount,
                qualified: qualifiedOpportunitiesCount
            },
            alerts: {
                total: 0,
                kycExpiring: 0
            },
            notifications: {
                unread: unreadNotificationsCount
            },
            scope: scopedAdvisorId ? 'personal' : 'cabinet'
        };
    }

    /**
     * Get team stats for admins
     */
    async getTeamStats() {
        if (this.userRole !== 'ADMIN') {
            throw new Error('Accès réservé aux administrateurs')
        }

        const cabinetId = this.cabinetId

        // Get all advisors in the cabinet
        const advisors = await this.prisma.user.findMany({
            where: { 
                cabinetId, 
                role: { in: ['ADMIN', 'ADVISOR'] },
                isActive: true 
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                avatar: true,
            }
        })

        // Get stats for each advisor
        const teamStats = await Promise.all(
            advisors.map(async (advisor) => {
                const [clientsCount, tasksCount, overdueTasksCount, appointmentsToday, opportunitiesCount] = await Promise.all([
                    this.prisma.client.count({ where: { cabinetId, conseillerId: advisor.id, status: 'ACTIF' } }),
                    this.prisma.tache.count({ where: { cabinetId, assignedToId: advisor.id, status: { not: 'TERMINE' } } }),
                    this.prisma.tache.count({ where: { cabinetId, assignedToId: advisor.id, status: { not: 'TERMINE' }, dueDate: { lt: new Date() } } }),
                    this.prisma.rendezVous.count({
                        where: {
                            cabinetId,
                            conseillerId: advisor.id,
                            startDate: {
                                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                                lt: new Date(new Date().setHours(23, 59, 59, 999))
                            }
                        }
                    }),
                    this.prisma.opportunite.count({ where: { cabinetId, conseillerId: advisor.id, status: { notIn: ['PERDUE', 'REJETEE', 'CONVERTIE'] } } }),
                ])

                return {
                    advisor: {
                        id: advisor.id,
                        firstName: advisor.firstName,
                        lastName: advisor.lastName,
                        role: advisor.role,
                        avatar: advisor.avatar,
                    },
                    stats: {
                        clients: clientsCount,
                        tasks: tasksCount,
                        overdueTasks: overdueTasksCount,
                        appointmentsToday,
                        opportunities: opportunitiesCount,
                    }
                }
            })
        )

        // Cabinet totals
        const [totalClients, totalTasks, totalOpportunities] = await Promise.all([
            this.prisma.client.count({ where: { cabinetId, status: 'ACTIF' } }),
            this.prisma.tache.count({ where: { cabinetId, status: { not: 'TERMINE' } } }),
            this.prisma.opportunite.count({ where: { cabinetId, status: { notIn: ['PERDUE', 'REJETEE', 'CONVERTIE'] } } }),
        ])

        return {
            team: teamStats,
            totals: {
                clients: totalClients,
                tasks: totalTasks,
                opportunities: totalOpportunities,
                advisors: advisors.length,
            }
        }
    }
    async getAdvisorAlerts(advisorId: string, limit: number = 10, urgentOnly: boolean = false) {
        const now = new Date();
        const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Overdue or today tasks assigned to this user
        const overdueTasks = await this.prisma.tache.findMany({
            where: {
                cabinetId: this.cabinetId,
                assignedToId: advisorId,
                status: { not: 'TERMINE' },
                dueDate: { lt: now },
            },
            select: {
                id: true,
                title: true,
                dueDate: true,
                client: { select: { id: true, firstName: true, lastName: true } },
            },
            take: limit,
        });

        // KYC expiring soon
        const kycExpiring = await this.prisma.client.findMany({
            where: {
                cabinetId: this.cabinetId,
                kycNextReviewDate: {
                    gte: now,
                    lte: soon,
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                kycNextReviewDate: true,
            },
            take: limit,
        });

        // Contracts renewing soon
        const contractsRenewing = await this.prisma.contrat.findMany({
            where: {
                cabinetId: this.cabinetId,
                nextRenewalDate: {
                    gte: now,
                    lte: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
                },
            },
            select: {
                id: true,
                name: true,
                nextRenewalDate: true,
                client: { select: { id: true, firstName: true, lastName: true } },
            },
            take: limit,
        });

        const alerts: Array<{
            id: string;
            type: string;
            severity: string;
            title: string;
            message: string;
            particulierId: { id: string; firstName: string; lastName: string } | null;
        }> = [];

        overdueTasks.forEach((task) => {
            alerts.push({
                id: `task-${task.id}`,
                type: 'task',
                severity: 'urgent',
                title: 'Tâche en retard',
                message: task.title,
                particulierId: task.client
                    ? { id: task.client.id, firstName: task.client.firstName, lastName: task.client.lastName }
                    : null,
            });
        });

        kycExpiring.forEach((client) => {
            alerts.push({
                id: `kyc-${client.id}`,
                type: 'kyc',
                severity: 'high',
                title: 'KYC à renouveler',
                message: `Le KYC de ${client.firstName} ${client.lastName} arrive à échéance le ${client.kycNextReviewDate?.toLocaleDateString('fr-FR')}`,
                particulierId: { id: client.id, firstName: client.firstName, lastName: client.lastName },
            });
        });

        contractsRenewing.forEach((ctr) => {
            alerts.push({
                id: `contract-${ctr.id}`,
                type: 'contract',
                severity: 'medium',
                title: 'Contrat à renouveler',
                message: `Le contrat "${ctr.name}" doit être renouvelé le ${ctr.nextRenewalDate?.toLocaleDateString('fr-FR')}`,
                particulierId: ctr.client
                    ? { id: ctr.client.id, firstName: ctr.client.firstName, lastName: ctr.client.lastName }
                    : null,
            });
        });

        const filteredAlerts = urgentOnly
            ? alerts.filter((a) => a.severity === 'urgent' || a.severity === 'high')
            : alerts;

        const limitedAlerts = filteredAlerts.slice(0, limit);

        const byType = limitedAlerts.reduce(
            (acc, alert) => {
                acc[alert.type] = (acc[alert.type] || 0) + 1;
                return acc;
            },
            { task: 0, document: 0, appointment: 0, objective: 0, kyc: 0, contract: 0 } as Record<string, number>
        );

        const urgentCount = limitedAlerts.filter(
            (a) => a.severity === 'urgent' || a.severity === 'high'
        ).length;

        return {
            alerts: limitedAlerts,
            total: limitedAlerts.length,
            urgent: urgentCount,
            byType,
        };
    }

    async getCelebrations(rangeDays: number = 30) {
        const now = new Date();
        const end = new Date(now.getTime() + rangeDays * 24 * 60 * 60 * 1000);

        // Fetch clients with birthDate
        const clients = await this.prisma.client.findMany({
            where: {
                cabinetId: this.cabinetId,
                birthDate: { not: null },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                birthDate: true,
            },
        });

        // Compute upcoming birthdays in range
        const birthdayEvents = clients
            .map((c) => {
                if (!c.birthDate) return null;
                const birth = new Date(c.birthDate);
                const thisYear = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
                let next = thisYear;
                if (thisYear < now) {
                    next = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
                }
                if (next > end) return null;
                const age = next.getFullYear() - birth.getFullYear();
                return {
                    id: `birthday-${c.id}-${next.toISOString()}`,
                    type: 'birthday' as const,
                    clientId: c.id,
                    clientName: `${c.firstName} ${c.lastName}`,
                    detail: `${age} ans`,
                    date: next.toISOString(),
                };
            })
            .filter((e): e is { id: string; type: string; title: string; detail: string; date: string } => Boolean(e));

        // Fetch life insurance / retirement contracts for 8-year anniversaries
        const contrats = await this.prisma.contrat.findMany({
            where: {
                cabinetId: this.cabinetId,
                startDate: { not: null },
            },
            select: {
                id: true,
                name: true,
                type: true,
                startDate: true,
                client: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });

        const contractEvents = contrats
            .map((ctr) => {
                if (!ctr.startDate) return null;
                const start = new Date(ctr.startDate);
                const anniversary = new Date(start);
                anniversary.setFullYear(now.getFullYear());
                if (anniversary < now) {
                    anniversary.setFullYear(now.getFullYear() + 1);
                }
                if (anniversary > end) return null;

                const years = anniversary.getFullYear() - start.getFullYear();
                const clientName = ctr.client
                    ? `${ctr.client.firstName} ${ctr.client.lastName}`
                    : 'Client inconnu';

                return {
                    id: `contract-${ctr.id}-${anniversary.toISOString()}`,
                    type: 'contract' as const,
                    clientId: ctr.client?.id || null,
                    clientName,
                    contractName: ctr.name,
                    detail: `${years} ans de contrat`,
                    date: anniversary.toISOString(),
                };
            })
            .filter((e): e is { id: string; type: string; title: string; detail: string; date: string } => Boolean(e));

        const events = [...birthdayEvents, ...contractEvents]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 10);

        return { events };
    }
}
