// ============================================================================
// Formation DDA Service — Suivi formation continue (15h/an)
//
// Base juridique :
//   • Directive Distribution Assurance (DDA/IDD) — Art. L. 511-2 Code Assurances
//   • Recommandation ACPR 2022-R-01 — 15h/an minimum
//   • Répartition recommandée :
//     - Technique produits : ≥ 7h
//     - Juridique/fiscal : ≥ 3h
//     - Commercial/relation client : ≥ 2h
//     - Conformité : ≥ 2h
//     - Digital : ≥ 1h
// ============================================================================

import { prisma } from '../prisma'
import { logger } from '../logger'

const OBLIGATION_HEURES_ANNUEL = 15

interface FormationInput {
  cabinetId: string
  userId: string
  titre: string
  organisme: string
  type: 'PRESENTIEL' | 'DISTANCIEL' | 'E_LEARNING' | 'CONFERENCE' | 'WEBINAIRE' | 'CERTIFICATION'
  dateDebut: Date
  dateFin?: Date
  dureeHeures: number
  categorieDDA?: string
  attestation?: boolean
  attestationUrl?: string
  notes?: string
}

interface BilanFormation {
  annee: number
  userId: string
  totalHeures: number
  objectifHeures: number
  progression: number // en %
  conforme: boolean
  parCategorie: Record<string, number>
  formations: Array<{
    id: string
    titre: string
    organisme: string
    dureeHeures: number
    categorieDDA: string | null
    dateDebut: Date
    attestation: boolean
  }>
  alertes: string[]
}

export class FormationDDAService {

  /**
   * Enregistre une formation pour un conseiller.
   */
  static async enregistrerFormation(input: FormationInput) {
    const anneeReference = input.dateDebut.getFullYear()

    const formation = await prisma.formationDDA.create({
      data: {
        cabinetId: input.cabinetId,
        userId: input.userId,
        titre: input.titre,
        organisme: input.organisme,
        type: input.type,
        dateDebut: input.dateDebut,
        dateFin: input.dateFin,
        dureeHeures: input.dureeHeures,
        categorieDDA: input.categorieDDA,
        attestation: input.attestation || false,
        attestationUrl: input.attestationUrl,
        anneeReference,
        notes: input.notes,
      },
    })

    logger.info('Formation DDA enregistrée', {
      module: 'FormationDDA',
      action: 'CREATE',
      metadata: { formationId: formation.id, userId: input.userId, heures: input.dureeHeures, annee: anneeReference } as any,
    })

    return formation
  }

  /**
   * Bilan formation d'un conseiller pour une année donnée.
   */
  static async getBilan(cabinetId: string, userId: string, annee: number): Promise<BilanFormation> {
    const formations = await prisma.formationDDA.findMany({
      where: { cabinetId, userId, anneeReference: annee },
      orderBy: { dateDebut: 'desc' },
    })

    const totalHeures = formations.reduce((sum, f) => sum + Number(f.dureeHeures), 0)
    const progression = Math.min(100, (totalHeures / OBLIGATION_HEURES_ANNUEL) * 100)
    const conforme = totalHeures >= OBLIGATION_HEURES_ANNUEL

    // Répartition par catégorie
    const parCategorie: Record<string, number> = {}
    formations.forEach(f => {
      const cat = f.categorieDDA || 'NON_CLASSE'
      parCategorie[cat] = (parCategorie[cat] || 0) + Number(f.dureeHeures)
    })

    // Alertes
    const alertes: string[] = []
    if (!conforme) {
      alertes.push(`Il manque ${(OBLIGATION_HEURES_ANNUEL - totalHeures).toFixed(1)}h pour atteindre l'obligation de ${OBLIGATION_HEURES_ANNUEL}h/an`)
    }
    if ((parCategorie['TECHNIQUE_PRODUIT'] || 0) < 7) {
      alertes.push(`Technique produits : ${(parCategorie['TECHNIQUE_PRODUIT'] || 0).toFixed(1)}h / 7h recommandées`)
    }
    if ((parCategorie['JURIDIQUE_FISCAL'] || 0) < 3) {
      alertes.push(`Juridique/fiscal : ${(parCategorie['JURIDIQUE_FISCAL'] || 0).toFixed(1)}h / 3h recommandées`)
    }
    const attestationManquante = formations.filter(f => !f.attestation)
    if (attestationManquante.length > 0) {
      alertes.push(`${attestationManquante.length} formation(s) sans attestation`)
    }

    return {
      annee,
      userId,
      totalHeures,
      objectifHeures: OBLIGATION_HEURES_ANNUEL,
      progression: Math.round(progression * 10) / 10,
      conforme,
      parCategorie,
      formations: formations.map(f => ({
        id: f.id,
        titre: f.titre,
        organisme: f.organisme,
        dureeHeures: Number(f.dureeHeures),
        categorieDDA: f.categorieDDA,
        dateDebut: f.dateDebut,
        attestation: f.attestation,
      })),
      alertes,
    }
  }

  /**
   * Bilan de conformité DDA pour tout le cabinet.
   */
  static async getBilanCabinet(cabinetId: string, annee: number) {
    // Récupérer tous les conseillers du cabinet
    const users = await prisma.user.findMany({
      where: { cabinetId, isActive: true },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    })

    const bilans = await Promise.all(
      users.map(async user => {
        const bilan = await this.getBilan(cabinetId, user.id, annee)
        return {
          user: { id: user.id, name: `${user.firstName} ${user.lastName}`.trim(), email: user.email, role: user.role },
          ...bilan,
        }
      })
    )

    const totalConformes = bilans.filter(b => b.conforme).length
    const totalNonConformes = bilans.filter(b => !b.conforme).length

    return {
      annee,
      cabinetId,
      totalConseillers: users.length,
      totalConformes,
      totalNonConformes,
      tauxConformite: users.length > 0 ? Math.round((totalConformes / users.length) * 100) : 0,
      bilans,
    }
  }

  /**
   * Supprime une formation.
   */
  static async supprimerFormation(formationId: string, cabinetId: string) {
    return prisma.formationDDA.delete({
      where: { id: formationId, cabinetId },
    })
  }
}
