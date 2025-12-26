 
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers';
import { ActifService } from '@/app/_common/lib/services/actif-service';
import { isRegularUser } from '@/app/_common/lib/auth-types';
import { z } from 'zod';

// === MAPPING TYPES SIMPLIFIÉS → PRISMA ActifType (FR uniforme) ===
// Migration 2024-12-10: Valeurs Prisma maintenant en FR
const mapActifType = (type: string, category?: string): string => {
  const typeMapping: Record<string, string> = {
    // Types simplifiés (formulaires) → Nouvelles valeurs FR
    'IMMOBILIER': 'RESIDENCE_PRINCIPALE',
    'MOBILIER': 'AUTRE',
    'FINANCIER': 'ASSURANCE_VIE',
    'PROFESSIONNEL': 'PARTS_SOCIALES',
    // Sous-types immobiliers (déjà FR)
    'RESIDENCE_PRINCIPALE': 'RESIDENCE_PRINCIPALE',
    'RESIDENCE_SECONDAIRE': 'RESIDENCE_SECONDAIRE',
    'INVESTISSEMENT_LOCATIF': 'IMMOBILIER_LOCATIF',
    'IMMOBILIER_LOCATIF': 'IMMOBILIER_LOCATIF',
    'TERRAIN': 'RESIDENCE_PRINCIPALE',
    // Sous-types financiers
    'ASSURANCE_VIE': 'ASSURANCE_VIE',
    'PEA': 'PEA',
    'PEA_PME': 'PEA_PME',
    'COMPTE_TITRES': 'COMPTE_TITRES',
    'LIVRET_A': 'LIVRETS',
    'LDDS': 'LIVRETS',
    'LEP': 'LIVRETS',
    'LIVRETS': 'LIVRETS',
    'PEL': 'PEL',
    'CEL': 'CEL',
    'PER': 'PER',
    'PERP': 'PERP',
    'MADELIN': 'MADELIN',
    'COMPTE_COURANT': 'COMPTE_BANCAIRE',
    'COMPTE_BANCAIRE': 'COMPTE_BANCAIRE',
    'CRYPTO': 'CRYPTO',
    'SCPI': 'SCPI',
    'SCI': 'SCI',
    // Sous-types professionnels
    'PARTS_SOCIALES': 'PARTS_SOCIALES',
    'FONDS_COMMERCE': 'FONDS_COMMERCE',
    'IMMOBILIER_PRO': 'IMMOBILIER_PRO',
    // Sous-types mobilier
    'OR': 'METAUX_PRECIEUX',
    'METAUX_PRECIEUX': 'METAUX_PRECIEUX',
    'OEUVRES_ART': 'OEUVRES_ART',
    'BIJOUX': 'BIJOUX',
    'VEHICULES': 'VEHICULES',
    // Anciennes valeurs EN → Nouvelles valeurs FR (rétrocompatibilité)
    'REAL_ESTATE_MAIN': 'RESIDENCE_PRINCIPALE',
    'REAL_ESTATE_RENTAL': 'IMMOBILIER_LOCATIF',
    'REAL_ESTATE_SECONDARY': 'RESIDENCE_SECONDAIRE',
    'LIFE_INSURANCE': 'ASSURANCE_VIE',
    'SECURITIES_ACCOUNT': 'COMPTE_TITRES',
    'BANK_ACCOUNT': 'COMPTE_BANCAIRE',
    'SAVINGS_ACCOUNT': 'LIVRETS',
    'COMPANY_SHARES': 'PARTS_SOCIALES',
    'PROFESSIONAL_REAL_ESTATE': 'IMMOBILIER_PRO',
    'PRECIOUS_METALS': 'METAUX_PRECIEUX',
    'ART_COLLECTION': 'OEUVRES_ART',
  }
  
  // Nouvelles valeurs Prisma FR valides
  const validPrismaTypes = [
    'RESIDENCE_PRINCIPALE', 'IMMOBILIER_LOCATIF', 'RESIDENCE_SECONDAIRE', 'IMMOBILIER_COMMERCIAL',
    'SCPI', 'SCI', 'OPCI', 'CROWDFUNDING_IMMO', 'VIAGER', 'NUE_PROPRIETE', 'USUFRUIT',
    'PEE', 'PEG', 'PERCO', 'PERECO', 'CET', 'PARTICIPATION', 'INTERESSEMENT',
    'STOCK_OPTIONS', 'ACTIONS_GRATUITES', 'BSPCE',
    'PER', 'PERP', 'MADELIN', 'ARTICLE_83', 'PREFON', 'COREM',
    'ASSURANCE_VIE', 'CONTRAT_CAPITALISATION', 'COMPTE_TITRES', 'PEA', 'PEA_PME',
    'COMPTE_BANCAIRE', 'LIVRETS', 'PEL', 'CEL', 'COMPTE_A_TERME',
    'PARTS_SOCIALES', 'IMMOBILIER_PRO', 'MATERIEL_PRO', 'FONDS_COMMERCE', 'BREVETS_PI',
    'METAUX_PRECIEUX', 'BIJOUX', 'OEUVRES_ART', 'VINS', 'MONTRES', 'VEHICULES', 'MOBILIER',
    'CRYPTO', 'NFT', 'AUTRE'
  ]
  
  if (validPrismaTypes.includes(type)) {
    return type
  }
  
  return typeMapping[type] || typeMapping[category || ''] || 'AUTRE'
}

const createActifSchema = z.object({
    // Support both 'name' and 'nom' fields
    name: z.string().min(1, 'Le nom est requis').optional(),
    nom: z.string().min(1, 'Le nom est requis').optional(),
    type: z.string().optional(), // certains formulaires n'envoient pas explicitement "type"
    // Accepter n'importe quelle string pour category - sera mappée côté serveur
    category: z.string().optional(),
    // Support multiple value field variants from different forms
    value: z.number().min(0).optional(),
    valeurActuelle: z.number().min(0).optional(),
    valorisationActuelle: z.number().min(0).optional(), // BienImmobilierForm
    montant: z.number().min(0).optional(), // Other forms
    // Accepter string, null ou undefined pour les dates
    acquisitionDate: z.string().nullish().transform(val => val ? new Date(val) : undefined),
    dateAcquisition: z.string().nullish().transform(val => val ? new Date(val) : undefined),
    acquisitionValue: z.number().optional(),
    prixAcquisition: z.number().optional(),
    valeurAcquisition: z.number().optional(),
    description: z.string().optional(),
    managedByFirm: z.boolean().default(false),
    gereParCabinet: z.boolean().default(false),
    ownershipPercentage: z.number().min(0).max(100).default(100),
    quotePart: z.number().min(0).max(100).optional(),
    quotiteDetention: z.number().min(0).max(100).optional(),
    // Additional fields from detailed forms
    clientId: z.string().optional(),
    usage: z.string().optional(),
    etat: z.string().optional(),
    adresse: z.any().optional(),
    surface: z.number().optional(),
    surfaceHabitable: z.number().optional(),
    nbPieces: z.number().optional(),
    nombrePieces: z.number().optional(),
    anneeConstruction: z.number().optional(),
    dpe: z.string().optional(),
    modeDetention: z.string().optional(),
    details: z.any().optional(),
    // Immobilier-specific fields
    fraisNotaire: z.number().optional(),
    montantTravaux: z.number().optional(),
    plusValueLatente: z.number().optional(),
    valeurIFI: z.number().optional(),
    inclureDansIFI: z.boolean().optional(),
    estLoue: z.boolean().optional(),
    regimeFiscal: z.string().optional(),
    charges: z.any().optional(),
    equipements: z.any().optional(),
    documents: z.any().optional(),
}).refine(data => data.name || data.nom, {
    message: "Le nom est requis",
}).refine(data => {
    // Check any of the value field variants
    const hasValue = (data.value !== undefined && data.value >= 0) ||
                     (data.valeurActuelle !== undefined && data.valeurActuelle >= 0) ||
                     (data.valorisationActuelle !== undefined && data.valorisationActuelle >= 0) ||
                     (data.montant !== undefined && data.montant >= 0)
    return hasValue
}, {
    message: "La valeur est requise",
});

/**
 * GET /api/advisor/clients/[id]/actifs
 * List client assets
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const context = await requireAuth(request); const { user } = context;

        if (!isRegularUser(user)) {
            return createErrorResponse('Invalid user type', 400);
        }

        const { id } = await params;
        const service = new ActifService(context.cabinetId, user.id, context.isSuperAdmin);

        const actifs = await service.getClientActifs(id);

        return createSuccessResponse({
            actifs,
            count: actifs.length,
        });
    } catch (error: any) {
        console.error('Error fetching assets:', error);
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401);
        }
        return createErrorResponse('Internal server error', 500);
    }
}

/**
 * POST /api/advisor/clients/[id]/actifs
 * Create a new asset for client
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const context = await requireAuth(request); const { user } = context;

        if (!isRegularUser(user)) {
            return createErrorResponse('Invalid user type', 400);
        }

        const { id } = await params;
        const body = await request.json();
        const validated = createActifSchema.parse(body);

        // Normalize data to use standard field names
        // Mapper le type simplifié vers le type Prisma ActifType
        const rawType = validated.type || validated.category || 'AUTRE'
        const mappedType = mapActifType(rawType, validated.category)
        
        // Déterminer la catégorie basée sur le type mappé ou le type brut
        const getCategory = (type: string): 'IMMOBILIER' | 'FINANCIER' | 'PROFESSIONNEL' | 'AUTRE' => {
          // Types Prisma mappés
          const immobilierTypes = ['REAL_ESTATE_MAIN', 'REAL_ESTATE_RENTAL', 'REAL_ESTATE_SECONDARY', 'SCPI', 'SCI']
          const financierTypes = ['ASSURANCE_VIE', 'SECURITIES_ACCOUNT', 'PEA', 'PEA_PME', 'BANK_ACCOUNT', 'SAVINGS_ACCOUNT', 'PEL', 'CEL', 'PER', 'PERP', 'MADELIN', 'ARTICLE_83', 'CRYPTO']
          const proTypes = ['COMPANY_SHARES', 'PROFESSIONAL_REAL_ESTATE']
          // Types simplifiés UI
          const immobilierUITypes = ['RESIDENCE_PRINCIPALE', 'RESIDENCE_SECONDAIRE', 'INVESTISSEMENT_LOCATIF', 'TERRAIN', 'IMMOBILIER']
          const financierUITypes = ['ASSURANCE_VIE', 'COMPTE_TITRES', 'LIVRET_A', 'LDDS', 'LEP', 'COMPTE_COURANT', 'FINANCIER']
          const proUITypes = ['PARTS_SOCIALES', 'FONDS_COMMERCE', 'PROFESSIONNEL']
          
          if (immobilierTypes.includes(type) || immobilierUITypes.includes(type)) return 'IMMOBILIER'
          if (financierTypes.includes(type) || financierUITypes.includes(type)) return 'FINANCIER'
          if (proTypes.includes(type) || proUITypes.includes(type)) return 'PROFESSIONNEL'
          return 'AUTRE'
        }

        // Toujours recalculer la catégorie valide (même si validated.category est défini)
        const validCategories = ['IMMOBILIER', 'FINANCIER', 'PROFESSIONNEL', 'AUTRE']
        const categoryFromValidated = validCategories.includes(validated.category || '') 
          ? validated.category as 'IMMOBILIER' | 'FINANCIER' | 'PROFESSIONNEL' | 'AUTRE'
          : null
        const computedCategory = categoryFromValidated || getCategory(rawType) || getCategory(mappedType)
        
        const normalizedData = {
            name: validated.name || validated.nom || '',
            type: mappedType,
            category: computedCategory,
            // Support all value field variants
            value: validated.value ?? validated.valeurActuelle ?? validated.valorisationActuelle ?? validated.montant ?? 0,
            acquisitionDate: validated.acquisitionDate || validated.dateAcquisition,
            acquisitionValue: validated.acquisitionValue ?? validated.prixAcquisition ?? validated.valeurAcquisition,
            description: validated.description,
            managedByFirm: validated.managedByFirm || validated.gereParCabinet || false,
            ownershipPercentage: validated.ownershipPercentage ?? validated.quotePart ?? validated.quotiteDetention ?? 100,
            details: {
                usage: validated.usage,
                etat: validated.etat,
                adresse: validated.adresse,
                surface: validated.surface ?? validated.surfaceHabitable,
                nbPieces: validated.nbPieces ?? validated.nombrePieces,
                anneeConstruction: validated.anneeConstruction,
                dpe: validated.dpe,
                modeDetention: validated.modeDetention,
                // Immobilier-specific
                fraisNotaire: validated.fraisNotaire,
                montantTravaux: validated.montantTravaux,
                plusValueLatente: validated.plusValueLatente,
                valeurIFI: validated.valeurIFI,
                inclureDansIFI: validated.inclureDansIFI,
                estLoue: validated.estLoue,
                regimeFiscal: validated.regimeFiscal,
                charges: validated.charges,
                equipements: validated.equipements,
                ...validated.details,
            },
        };

        const service = new ActifService(context.cabinetId, user.id, context.isSuperAdmin);

        const actif = await service.createActifForClient(
            id,
            normalizedData as any
        );

        return createSuccessResponse({
            actif,
            message: 'Actif créé avec succès',
        }, 201);
    } catch (error: any) {
        console.error('Error creating asset:', error);
        if (error instanceof z.ZodError) {
            const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
            console.error('Zod validation errors:', issues);
            return NextResponse.json(
                { error: 'Données invalides', message: `Validation: ${issues}`, details: error.issues },
                { status: 400 }
            );
        }
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401);
        }
        return createErrorResponse('Internal server error', 500);
    }
}
