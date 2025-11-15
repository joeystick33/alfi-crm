import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  slug: z.string().min(2, 'Le slug doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  plan: z.enum(['TRIAL', 'STARTER', 'BUSINESS', 'PREMIUM', 'ENTERPRISE', 'CUSTOM']).default('TRIAL'),
  trialDays: z.number().default(30),
  adminUser: z.object({
    email: z.string().email('Email invalide'),
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  }),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est SuperAdmin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: session.user.email! },
    });

    if (!superAdmin || !superAdmin.isActive) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer toutes les organisations avec leurs statistiques
    const organizations = await prisma.cabinet.findMany({
      include: {
        _count: {
          select: {
            users: true,
            clients: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Formater les données
    const formattedOrganizations = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      email: org.email,
      phone: org.phone,
      address: org.address,
      plan: org.plan,
      status: org.status,
      subscriptionStart: org.subscriptionStart,
      subscriptionEnd: org.subscriptionEnd,
      trialEndsAt: org.trialEndsAt,
      quotas: org.quotas,
      usage: org.usage,
      features: org.features,
      restrictions: org.restrictions,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      advisorsCount: org._count.users,
      clientsCount: org._count.clients,
    }));

    return NextResponse.json({
      organizations: formattedOrganizations,
    });
  } catch (error) {
    console.error('Erreur lors du chargement des organisations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est SuperAdmin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: session.user.email! },
    });

    if (!superAdmin || !superAdmin.isActive) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createOrganizationSchema.parse(body);

    // Vérifier que le slug n'existe pas déjà
    const existingCabinet = await prisma.cabinet.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingCabinet) {
      return NextResponse.json(
        { error: 'Ce slug est déjà utilisé' },
        { status: 400 }
      );
    }

    // Vérifier que l'email admin n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.adminUser.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Calculer la date de fin d'essai
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + validatedData.trialDays);

    // Définir les quotas par défaut selon le plan
    const defaultQuotas = {
      TRIAL: {
        maxUsers: 2,
        maxClients: 50,
        maxStorage: 1024, // 1 GB en MB
        maxSimulations: 100,
      },
      STARTER: {
        maxUsers: 5,
        maxClients: 200,
        maxStorage: 5120, // 5 GB
        maxSimulations: 500,
      },
      BUSINESS: {
        maxUsers: 15,
        maxClients: 1000,
        maxStorage: 20480, // 20 GB
        maxSimulations: 2000,
      },
      PREMIUM: {
        maxUsers: 50,
        maxClients: 5000,
        maxStorage: 102400, // 100 GB
        maxSimulations: 10000,
      },
      ENTERPRISE: {
        maxUsers: -1, // Illimité
        maxClients: -1,
        maxStorage: -1,
        maxSimulations: -1,
      },
      CUSTOM: {
        maxUsers: -1,
        maxClients: -1,
        maxStorage: -1,
        maxSimulations: -1,
      },
    };

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.adminUser.password, 10);

    // Créer le cabinet et l'utilisateur admin en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer le cabinet
      const cabinet = await tx.cabinet.create({
        data: {
          name: validatedData.name,
          slug: validatedData.slug,
          email: validatedData.email,
          phone: validatedData.phone,
          address: validatedData.address,
          plan: validatedData.plan,
          status: 'TRIALING',
          trialEndsAt,
          quotas: defaultQuotas[validatedData.plan],
          usage: {
            users: 0,
            clients: 0,
            storage: 0,
            simulations: 0,
          },
          features: {},
          restrictions: {},
          createdBy: superAdmin.id,
        },
      });

      // Créer l'utilisateur admin
      const adminUser = await tx.user.create({
        data: {
          cabinetId: cabinet.id,
          email: validatedData.adminUser.email,
          password: hashedPassword,
          firstName: validatedData.adminUser.firstName,
          lastName: validatedData.adminUser.lastName,
          role: 'ADMIN',
          isActive: true,
        },
      });

      // Créer un log d'audit
      await tx.auditLog.create({
        data: {
          superAdminId: superAdmin.id,
          cabinetId: cabinet.id,
          action: 'CREATE',
          entityType: 'Cabinet',
          entityId: cabinet.id,
          changes: {
            created: {
              name: cabinet.name,
              slug: cabinet.slug,
              plan: cabinet.plan,
              adminEmail: adminUser.email,
            },
          },
        },
      });

      return { cabinet, adminUser };
    });

    return NextResponse.json({
      success: true,
      cabinet: result.cabinet,
      adminUser: {
        id: result.adminUser.id,
        email: result.adminUser.email,
        firstName: result.adminUser.firstName,
        lastName: result.adminUser.lastName,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la création de l\'organisation:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
