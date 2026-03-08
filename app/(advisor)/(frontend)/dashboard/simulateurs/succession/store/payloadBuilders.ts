import { mapUIOptionToEnum, resolveAgeConjoint } from '../utils/ddv';
import type { SimulationData } from './successionStore';
import type {
  ConjointPartenaire,
  HeritierNotarialDTO,
  LienHeir,
  NotarialRequestDTO,
  OptionDonationDernierVivant,
  PatrimoineActifDTO,
  ResidencePrincipaleDTO,
  StatutMatrimonial,
} from './types';

const asNumber = (value: unknown) => Number(value ?? 0);

export const normalizeStatut = (
  statut: SimulationData['statut_matrimonial'],
): string => {
  if (!statut) return '';
  return statut
    .normalize('NFD')
    .replace(/\(.*?\)/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

export const mapStatutToEnum = (
  statut: SimulationData['statut_matrimonial'],
): StatutMatrimonial | null => {
  const s = normalizeStatut(statut);
  if (s === 'marie') return 'MARIE';
  if (s === 'pacse' || s === 'pacs') return 'PACSE';
  if (s === 'concubinage' || s === 'concubin') return 'CONCUBIN';
  if (s === 'celibataire') return 'CELIBATAIRE';
  return null;
};

const buildResidencePrincipale = (sd: SimulationData): ResidencePrincipaleDTO | null => {
  if (!sd.presence_residence_principale) return null;
  const valeur = asNumber(sd.valeur_residence_principale);
  if (valeur <= 0) return null;
  const occupationEligibleAuDeces =
    !!sd.residence_occupation_conjoint || !!sd.residence_occupation_enfant_mineur;
  return { valeur, occupationEligibleAuDeces };
};

/**
 * Maps frontend proprietaire values to backend propriete enum.
 * MONSIEUR → PROPRE_CLIENT (deceased's own asset)
 * MADAME  → PROPRE_CONJOINT (survivor's own asset)
 * COMMUN  → COMMUN (common pool, split per matrimonial regime)
 * INDIVISION → INDIVISION (undivided, treated as common)
 */
const mapProprietaireToBackend = (proprietaire?: string): string | undefined => {
  if (!proprietaire) return undefined;
  const mapping: Record<string, string> = {
    MONSIEUR: 'PROPRE_CLIENT',
    MADAME: 'PROPRE_CONJOINT',
    COMMUN: 'COMMUN',
    INDIVISION: 'INDIVISION',
  };
  return mapping[proprietaire] ?? undefined;
};

export const buildActifs = (sd: SimulationData): PatrimoineActifDTO[] => {
  if (!Array.isArray(sd.actifs)) return [];
  return sd.actifs
    .filter((actif) => actif && !isNaN(Number((actif as any).valeur)))
    .map((actif: any) => {
      const valeur = Number(actif.valeur);
      return {
        ...actif,
        valeur,
        conditions: actif.conditions ?? null,
        proprietaire: actif.proprietaire ?? undefined,
        propriete: mapProprietaireToBackend(actif.proprietaire),
        quotiteProprietaire:
          actif.quotiteProprietaire != null ? Number(actif.quotiteProprietaire) : actif.quotiteProprietaire,
      } as PatrimoineActifDTO;
    });
};

const buildLiberalites = (sd: SimulationData) => [
  ...(Array.isArray(sd.donations)
    ? sd.donations.map((d) => ({
        type: d.type,
        valeur: Number(d.valeur || 0),
        horsPart: !!d.horsPart,
        beneficiaireNom: d.beneficiaireNom,
        dateActe: d.dateActe || null,
        valeurPartage: d.valeurPartage ?? null,
      }))
    : []),
  ...(Array.isArray(sd.legs_particuliers)
    ? sd.legs_particuliers.map((l) => ({
        type: 'LEGS' as const,
        valeur: Number(l.valeur || 0),
        horsPart: true,
        beneficiaireNom: l.beneficiaireNom,
        dateActe: null,
        valeurPartage: Number(l.valeur || 0),
      }))
    : []),
];

const pushHeir = (
  resultat: HeritierNotarialDTO[],
  nom: string,
  lien: LienHeir,
  options: {
    estConjoint?: boolean;
    souche?: string | null;
    representant?: boolean;
    fiscal?: SimulationData['enfants'][number]['fiscalConditions'] | null;
  } = {},
) => {
  if (!nom || nom.trim().length === 0) return;
  resultat.push({
    nom,
    estConjoint: options.estConjoint ?? false,
    lien,
    fiscalConditions: options.fiscal ?? null,
    souche: options.souche ?? null,
    representant: options.representant ?? false,
  } as HeritierNotarialDTO);
};

export const buildHeritiers = (sd: SimulationData): HeritierNotarialDTO[] => {
  const resultat: HeritierNotarialDTO[] = [];
  const statut = normalizeStatut(sd.statut_matrimonial);

  if (statut === 'marie') {
    pushHeir(resultat, sd.conjoint?.prenom || 'Conjoint', 'CONJOINT', { estConjoint: true });
  } else if (statut === 'pacse' || statut === 'pacs') {
    pushHeir(resultat, sd.conjoint?.prenom || 'Partenaire PACS', 'PARTENAIRE_PACS');
  } else if (statut === 'concubinage' || statut === 'concubin') {
    pushHeir(resultat, sd.conjoint?.prenom || 'Concubin', 'CONCUBIN');
  } else if (sd.presence_ddv && (sd.conjoint?.prenom || '').trim().length > 0) {
    pushHeir(resultat, sd.conjoint?.prenom || 'Conjoint', 'CONJOINT', { estConjoint: true });
  }

  const enfants = Array.isArray(sd.enfants) ? sd.enfants.filter(Boolean) : [];
  enfants.forEach((enfant, idx) => {
    const baseNom = enfant?.prenom && enfant.prenom.trim().length > 0
      ? `${enfant.prenom}${enfant.nom ? ` ${enfant.nom}` : ''}`
      : `Enfant ${idx + 1}`;
    const souche = enfant?.id || baseNom;

    if (enfant?.predecede) {
      const representants = Array.isArray(enfant.representants) ? enfant.representants.filter(Boolean) : [];
      representants.forEach((rep, repIdx) => {
        const nomRep = rep?.prenom && rep.prenom.trim().length > 0
          ? rep.prenom
          : `${baseNom} - représentant ${repIdx + 1}`;
        const lienRep = (rep?.lien as LienHeir) || 'PETIT_ENFANT';
        pushHeir(resultat, nomRep, lienRep, {
          souche,
          representant: true,
        });
      });
    } else {
      pushHeir(resultat, baseNom, 'ENFANT', { souche, fiscal: enfant?.fiscalConditions ?? null });
    }
  });

  const descendantsCount = resultat.filter((h) =>
    h.lien === 'ENFANT' || h.lien === 'PETIT_ENFANT' || h.lien === 'ARRIERE_PETIT_ENFANT',
  ).length;

  if (descendantsCount === 0) {
    if (sd.parents_defunt?.pere?.vivant) {
      pushHeir(resultat, sd.parents_defunt.pere.prenom || 'Père', 'PERE');
    }
    if (sd.parents_defunt?.mere?.vivant) {
      pushHeir(resultat, sd.parents_defunt.mere.prenom || 'Mère', 'MERE');
    }
  }

  const fratrie = Array.isArray(sd.fratrie_defunt) ? sd.fratrie_defunt.filter(Boolean) : [];
  fratrie.forEach((sibling, idx) => {
    const baseNom = sibling?.prenom && sibling.prenom.trim().length > 0
      ? `${sibling.prenom}${sibling.nom ? ` ${sibling.nom}` : ''}`
      : `Frère/Sœur ${idx + 1}`;
    const lien = (sibling?.lien as LienHeir) || 'FRERE';
    if (sibling?.vivant) {
      pushHeir(resultat, baseNom, lien, { fiscal: sibling?.fiscalConditions ?? null });
    } else {
      const representants = Array.isArray(sibling?.representants) ? sibling.representants.filter(Boolean) : [];
      representants.forEach((rep, repIdx) => {
        const nomRep = rep?.prenom && rep.prenom.trim().length > 0
          ? rep.prenom
          : `${baseNom} - représentant ${repIdx + 1}`;
        const lienRep = (rep?.lien as LienHeir) || 'NEVEU';
        pushHeir(resultat, nomRep, lienRep, {
          souche: sibling?.id || baseNom,
          representant: true,
          fiscal: rep?.fiscalConditions ?? null,
        });
      });
    }
  });

  return resultat;
};

export const buildSuccessionPayload = (sd: SimulationData) => {
  const statut = (sd.statut_matrimonial || 'célibataire') as SuccessionPayload['statut_matrimonial'];
  const mapRegime = (r: ConjointPartenaire['regimeMatrimonial']): string | null => {
    const mapping: Record<string, string> = {
      SEPARATION_BIENS: 'separation_biens',
      COMMUNAUTE_UNIVERSELLE: 'communaute_universelle',
      COMMUNAUTE_LEGALE: 'communaute_reduite',
      PARTICIPATION_ACQUETS: 'participation_acquets',
    };
    return r ? mapping[r] ?? null : null;
  };

  return {
    statut_matrimonial: statut,
    nombre_enfants: asNumber(sd.nombre_enfants),
    age_defunt: sd.identite?.age ?? null,
    age_conjoint_survivant: sd.conjoint?.age ?? null,
    regime_matrimonial: statut === 'marié' ? mapRegime(sd.conjoint?.regimeMatrimonial ?? null) : null,
    presence_assurance_vie: !!sd.presence_assurance_vie,
    nombre_contrats_av: asNumber(sd.nombre_contrats_av),
    valeur_immobilier_principal: asNumber(sd.valeur_residence_principale),
    valeur_mobilier: 0,
    valeur_placements: 0,
    valeur_biens_professionnels: 0,
    valeur_autres_biens: 0,
    passif_total: asNumber(sd.dettes_totales),
    presence_donations: !!sd.presence_donations,
    presence_legs_particuliers: !!sd.presence_legs_particuliers,
  } satisfies SuccessionPayload;
};

export const buildNotarialRequestDTO = (
  sd: SimulationData,
  opts: { ddvOption?: OptionDonationDernierVivant | null; conjointUsufruitAbIntestat?: boolean } = {},
): NotarialRequestDTO => {
  const actifs = Array.isArray(sd.actifs) ? sd.actifs.reduce((sum, a) => sum + asNumber(a?.valeur), 0) : 0;
  const patrimoine = Math.max(0, actifs - asNumber(sd.dettes_totales));

  return {
    patrimoine,
    statut: mapStatutToEnum(sd.statut_matrimonial),
    conjointUsufruit: !!opts.conjointUsufruitAbIntestat,
    ageConjoint: resolveAgeConjoint(sd.conjoint?.age ?? null, sd.age_conjoint_usufruit ?? null),
    donationDernierVivantOption:
      opts.ddvOption ?? (sd.presence_ddv ? mapUIOptionToEnum((sd.option_ddv as any) ?? null) : null),
    heritiers: buildHeritiers(sd),
    liberalites: buildLiberalites(sd),
    dateDeces: sd.date_deces || null,
    residencePrincipale: buildResidencePrincipale(sd),
    residencePrincipaleRepartition: null,
    actifsPatrimoniaux: buildActifs(sd),
  } as NotarialRequestDTO;
};

export interface SuccessionPayload {
  statut_matrimonial: 'célibataire' | 'marié' | 'pacsé' | 'concubinage';
  nombre_enfants: number;
  age_defunt: number | null;
  age_conjoint_survivant: number | null;
  regime_matrimonial: string | null;
  presence_assurance_vie: boolean;
  nombre_contrats_av: number;
  valeur_immobilier_principal: number;
  valeur_mobilier: number;
  valeur_placements: number;
  valeur_biens_professionnels: number;
  valeur_autres_biens: number;
  passif_total: number;
  presence_donations: boolean;
  presence_legs_particuliers: boolean;
}
