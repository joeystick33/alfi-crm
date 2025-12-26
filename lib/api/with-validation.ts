// FILE: lib/api/with-validation.ts

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError, ZodSchema } from 'zod'

// ===========================================
// TYPES
// ===========================================

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: ValidationError[]
}

export interface ValidationError {
  path: string
  message: string
  code: string
}

export interface ValidatedRequest<T> {
  body: T
  request: NextRequest
}

// ===========================================
// VALIDATION WRAPPER
// ===========================================

/**
 * Wrapper pour valider les requêtes API avec un schéma Zod
 * 
 * @example
 * export async function POST(request: NextRequest) {
 *   return withValidation(CreateClientSchema, request, async ({ body }) => {
 *     const client = await createClient(body)
 *     return NextResponse.json(client, { status: 201 })
 *   })
 * }
 */
export async function withValidation<T>(
  schema: ZodSchema<T>,
  request: NextRequest,
  handler: (validated: ValidatedRequest<T>) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Parse le body de la requête
    const rawBody = await request.json()
    
    // Valide avec le schéma Zod
    const result = schema.safeParse(rawBody)
    
    if (!result.success) {
      const errors = formatZodErrors(result.error)
      
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      )
    }
    
    // Exécute le handler avec les données validées
    return await handler({
      body: result.data,
      request,
    })
  } catch (error) {
    // Erreur de parsing JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          message: 'The request body is not valid JSON',
        },
        { status: 400 }
      )
    }
    
    // Autre erreur
    console.error('Validation error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ===========================================
// VALIDATION WITH QUERY PARAMS
// ===========================================

/**
 * Valide les query params d'une requête
 */
export function validateQueryParams<T>(
  schema: ZodSchema<T>,
  searchParams: URLSearchParams
): ValidationResult<T> {
  // Convertit URLSearchParams en objet
  const params: Record<string, string | string[]> = {}
  
  searchParams.forEach((value, key) => {
    if (params[key]) {
      // Gère les params multiples
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value)
      } else {
        params[key] = [params[key] as string, value]
      }
    } else {
      params[key] = value
    }
  })
  
  const result = schema.safeParse(params)
  
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    }
  }
  
  return {
    success: true,
    data: result.data,
  }
}

// ===========================================
// VALIDATION HELPERS
// ===========================================

/**
 * Formate les erreurs Zod pour une réponse API lisible
 */
export function formatZodErrors(error: ZodError): ValidationError[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }))
}

/**
 * Crée une réponse d'erreur de validation
 */
export function validationErrorResponse(errors: ValidationError[]): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: errors,
    },
    { status: 400 }
  )
}

/**
 * Valide un objet avec un schéma et retourne le résultat typé
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    return {
      success: false,
      errors: formatZodErrors(result.error),
    }
  }
  
  return {
    success: true,
    data: result.data,
  }
}

// ===========================================
// COMMON SCHEMAS
// ===========================================

/**
 * Schema pour pagination
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationParams = z.infer<typeof PaginationSchema>

/**
 * Schema pour filtres de recherche
 */
export const SearchSchema = z.object({
  q: z.string().optional(),
  search: z.string().optional(),
})

export type SearchParams = z.infer<typeof SearchSchema>

/**
 * Schema pour ID CUID
 */
export const CuidSchema = z.string().cuid()

/**
 * Schema pour liste d'IDs
 */
export const IdsSchema = z.object({
  ids: z.array(z.string().cuid()).min(1),
})

export type IdsInput = z.infer<typeof IdsSchema>
