export interface WizardData {
  relationType: 'PROSPECT' | 'CLIENT' | ''
  clientType: 'PERSONNE_PHYSIQUE' | 'PROFESSIONAL' | ''
  civility: string
  firstName: string
  lastName: string
  maidenName?: string
  birthDate: string
  birthPlace?: string
  nationality: string
  taxResidence: string
  email: string
  phone?: string
  mobile?: string
  address: { 
    street: string
    city: string
    postalCode: string
    country: string
    // Champs enrichis par API BAN
    codeInsee?: string
    departement?: string
    coordinates?: [number, number]
  }
  maritalStatus: string
  matrimonialRegime?: string
  numberOfChildren: number
  dependents: number
  profession?: string
  professionCategory?: string
  employmentType?: string
  employer?: string
  employmentSince?: string
  annualIncome: number
  netWealth: number
  financialAssets: number
  realEstateAssets: number
  otherAssets: number
  totalLiabilities: number
  riskProfile: string
  investmentHorizon?: string
  investmentObjective?: string
  investmentKnowledge: number
  isPEP: boolean
  originOfFunds?: string
}

export interface StepValidation {
  valid: boolean
  errors: Record<string, string>
}

export interface StepProps {
  data: WizardData
  updateData: (updates: Partial<WizardData>) => void
  errors: Record<string, string>
}
