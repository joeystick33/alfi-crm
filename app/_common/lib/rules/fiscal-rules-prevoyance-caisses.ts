/**
 * CAISSES COMPLÉMENTAIRES PL — Détail par caisse 2026
 */
import type { CaissePLConfig } from './fiscal-rules-prevoyance-types'
import { CAISSES_PL_SUITE } from './fiscal-rules-prevoyance-caisses-2'

const CAISSES_PL_BASE: Record<string, CaissePLConfig> = {
  CIPAV: {
    code: 'CIPAV',
    nom: 'Caisse Interprofessionnelle de Prévoyance et d\'Assurance Vieillesse',
    professions: ['Architectes','Architectes d\'intérieur','Économistes de la construction','Géomètres experts','Ingénieurs-conseils','Maîtres d\'œuvre','Ostéopathes','Psychologues','Psychothérapeutes','Ergothérapeutes','Diététiciens','Chiropracteurs','Psychomotriciens','Experts automobiles','Experts devant les tribunaux','Guides de haute montagne','Moniteurs de ski','Artistes non affiliés à la Maison des Artistes'],
    retraite_complementaire: { systeme: 'points', valeur_point_service: 2.63, taux_cotisation: 0.09, plafond_cotisation: 192240, description: 'Depuis 2023, cotisations proportionnelles au revenu (fin des classes forfaitaires). Points acquis en fonction des cotisations versées.' },
    invalidite_deces: { taux_cotisation: 0.005, pension_invalidite_totale: '5% PASS forfaitaire (2 403 €) + 1/3 des points prévoyance × valeur service (3,01 €)', pension_invalidite_partielle: 'Pension totale × taux d\'invalidité', capital_deces_conjoint: 'Points prévoyance × valeur service (3,01 €)', rente_orphelin: '1,5% PASS forfaitaire (720,90 €) + 1/10 des points × valeur service', rente_conjoint: '1,5% PASS forfaitaire (720,90 €) + 1/10 des points × valeur service', description: 'Depuis 2023 : cotisation proportionnelle 0,50% du revenu. Valeur d\'achat du point prévoyance : 0,013 €. Valeur de service : 3,01 € (2026).' },
    reversion: { taux_base: 0.54, taux_complementaire: 0.60, conditions: 'Conjoint marié ou ex-conjoint non remarié. Réversion base sous conditions de ressources. Réversion complémentaire sans condition de ressources.' },
    cumul_emploi_retraite: { plafond_cumul_partiel: 48060, cumul_integral_conditions: 'Taux plein atteint + liquidation de toutes les retraites', cotisations_generent_droits: true, description: 'Cumul intégral sans limite si taux plein + toutes retraites liquidées. Nouveaux droits acquis en régime de base depuis 09/2023.' },
  },
  CARMF: {
    code: 'CARMF',
    nom: 'Caisse Autonome de Retraite des Médecins de France',
    professions: ['Médecins libéraux (thésés)'],
    retraite_complementaire: { systeme: 'points', valeur_point_service: 77.14, taux_cotisation: 0.118, plafond_cotisation: 168210, points_max_annuel: 10, prix_achat_point: 16821, description: 'Régime par points. 1 point acquis par tranche de 16 821 € de revenus. Max 10 points/an.' },
    asv: { valeur_point_service: 11.82, cotisation_forfaitaire: 5556, taux_proportionnel_secteur_1: 0.012667, taux_proportionnel_secteur_2: 0.038, prise_en_charge_am: 0.6666, description: 'ASV obligatoire pour conventionnés. Forfait + proportionnel. Secteur 1 : AM prend en charge 2/3.' },
    invalidite_deces: { cotisation_forfaitaire: 434, taux_cotisation: 0.0032, pension_invalidite_totale: 'Rente selon classe de cotisation + ancienneté d\'affiliation', pension_invalidite_partielle: 'Proportionnelle au taux d\'invalidité', capital_deces_conjoint: 'Selon cotisations versées et classe', rente_conjoint: 'Variable selon durée d\'affiliation et revenus', ij_montant: 0, description: 'Cotisation variable : forfait 434 € + 0,32% revenus (maladie) + 0,08% revenus (invalidité). Pas d\'IJ CARMF ; CPAM prend le relais 60 premiers jours.' },
    reversion: { taux_base: 0.54, taux_complementaire: 0.60, taux_asv: 0.50, conditions: 'Mariage requis (durée min 2 ans sauf enfant né de l\'union). Réversion base sous conditions de ressources.' },
    cumul_emploi_retraite: { plafond_cumul_partiel: 48060, cumul_integral_conditions: 'Âge légal + taux plein en base + toutes retraites liquidées', cotisations_generent_droits: false, description: 'En cumul intégral, cotisations RC et ASV sont « de solidarité ». Nouveaux droits uniquement en régime de base, max 5% PASS/an.' },
  },
  CARPIMKO: {
    code: 'CARPIMKO',
    nom: 'Caisse Autonome de Retraite et de Prévoyance des Infirmiers, Masseurs-kinésithérapeutes, Pédicures-podologues, Orthophonistes et Orthoptistes',
    professions: ['Infirmiers libéraux','Masseurs-kinésithérapeutes','Pédicures-podologues','Orthophonistes','Orthoptistes'],
    retraite_complementaire: { systeme: 'points', valeur_point_service: 21.48, taux_cotisation: 0.087, plafond_cotisation: 144180, description: 'Réforme 2026 : 100% proportionnel. Taux unique de 8,70% entre 0,5 et 3 PASS.' },
    asv: { valeur_point_service: 1.50, cotisation_forfaitaire: 224, taux_proportionnel_secteur_1: 0.004, taux_proportionnel_secteur_2: 0.004, prise_en_charge_am: 0.6666, description: 'ASV pour conventionnés. Forfait 224 € + 0,40% revenus conventionnés. AM prend en charge 2/3.' },
    invalidite_deces: { cotisation_forfaitaire: 1022, pension_invalidite_totale: 20160, pension_invalidite_partielle: 10080, capital_deces_conjoint: 54432, capital_deces_enfants: 36288, rente_orphelin: 'Variable', rente_conjoint: 'Variable', ij_montant: 55.44, ij_debut_jour: 91, ij_duree_max_jours: 1095, description: 'Cotisation forfaitaire unique 1 022 € en 2026. CARPIMKO prend le relais à partir du 91e jour : 55,44 €/jour.' },
    reversion: { taux_base: 0.54, taux_complementaire: 0.60, taux_asv: 0.50, conditions: 'Conjoint marié ou ex-conjoint non remarié.' },
    cumul_emploi_retraite: { plafond_cumul_partiel: 48060, cumul_integral_conditions: 'Âge légal + taux plein + toutes retraites liquidées', cotisations_generent_droits: true, description: 'Cumul possible dès l\'âge légal. Nouveaux droits en base depuis 09/2023.' },
  },
  CAVEC: {
    code: 'CAVEC',
    nom: 'Caisse d\'Assurance Vieillesse des Experts-Comptables et des Commissaires aux Comptes',
    professions: ['Experts-comptables','Commissaires aux comptes'],
    retraite_complementaire: {
      systeme: 'classes', valeur_point_service: 1.385,
      classes: [
        { nom: 'A', cotisation: 863, points: 100, revenus_min: 0, revenus_max: 14919 },
        { nom: 'B', cotisation: 2576, points: 200, revenus_min: 14919, revenus_max: 31835 },
        { nom: 'C', cotisation: 4621, points: 334, revenus_min: 31835, revenus_max: 48060 },
        { nom: 'D', cotisation: 6893, points: 498, revenus_min: 48060, revenus_max: 60075 },
        { nom: 'E', cotisation: 8280, points: 598, revenus_min: 60075, revenus_max: 72090 },
        { nom: 'F', cotisation: 13951, points: 1008, revenus_min: 72090, revenus_max: 96120 },
        { nom: 'G', cotisation: 17244, points: 1246, revenus_min: 96120, revenus_max: 144180 },
        { nom: 'H', cotisation: 20776, points: 1500, revenus_min: 144180, revenus_max: 181208 },
        { nom: 'I', cotisation: 25483, points: 1841, revenus_min: 181208, revenus_max: Infinity },
      ],
      points_max_annuel: 1841,
      description: 'Système par classes de revenus. 9 classes (A à I) depuis 2026 (ajout classe I). Taux de rendement 2026 : 8,33%.',
    },
    invalidite_deces: { cotisation_forfaitaire: 828, pension_invalidite_totale: 49860, pension_invalidite_partielle: 'Proportionnel au taux d\'invalidité', capital_deces_conjoint: 290850, rente_orphelin: 'Variable selon classe', rente_conjoint: 'Variable selon classe', ij_montant: 130, ij_debut_jour: 91, ij_duree_max_jours: 1095, description: 'Prévoyance exceptionnelle : capital décès jusqu\'à 290 850 € (classe 4). IJ 130 €/jour à partir du 91e jour, max 36 mois.' },
    reversion: { taux_base: 0.54, taux_complementaire: 0.60, conditions: 'Réversion complémentaire sans condition de ressources. Taux porté à 100% si cotisation facultative de conjoint payée.' },
    cumul_emploi_retraite: { plafond_cumul_partiel: 48060, cumul_integral_conditions: 'Âge du taux plein (65 ans CAVEC) + toutes retraites liquidées', cotisations_generent_droits: true, description: 'Taux plein CAVEC à 65 ans. Décote de 5% par année manquante avant 65 ans.' },
  },
  CARCDSF: {
    code: 'CARCDSF',
    nom: 'Caisse Autonome de Retraite des Chirurgiens-Dentistes et des Sages-Femmes',
    professions: ['Chirurgiens-dentistes','Sages-femmes'],
    retraite_complementaire: { systeme: 'points', valeur_point_service: 22.20, taux_cotisation: 0.105, plafond_cotisation: 192240, description: 'Régime par points. Cotisation proportionnelle aux revenus professionnels.' },
    invalidite_deces: { cotisation_forfaitaire: 780, pension_invalidite_totale: 'Selon cotisations et durée d\'affiliation', pension_invalidite_partielle: 'Proportionnel au taux d\'invalidité', capital_deces_conjoint: 'Variable selon affiliation', description: 'Régime invalidité-décès géré par la CARCDSF.' },
    reversion: { taux_base: 0.54, taux_complementaire: 0.60, conditions: 'Conditions standard CNAVPL pour la base.' },
    cumul_emploi_retraite: { plafond_cumul_partiel: 48060, cumul_integral_conditions: 'Taux plein + toutes retraites liquidées', cotisations_generent_droits: true, description: 'Cumul intégral sans limite si conditions remplies.' },
  },
}

export const PREVOYANCE_RETRAITE_CAISSES_PL: Record<string, CaissePLConfig> = {
  ...CAISSES_PL_BASE,
  ...CAISSES_PL_SUITE,
}
