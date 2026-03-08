import {
  ABATTEMENT_757B_APRES70,
} from '../constants/fiscal2025';

// Ratio de réserve en fonction du nombre d'enfants
export function reserveRatio(nbEnfants: number): number {
  if (!nbEnfants || nbEnfants <= 0) return 0;
  if (nbEnfants === 1) return 0.5;
  if (nbEnfants === 2) return 2 / 3;
  return 0.75; // 3 enfants ou +
}

export function masseCalculCivile(patrimoineNet: number, donationsRapportables: number): number {
  const p = Number(patrimoineNet || 0);
  const d = Number(donationsRapportables || 0);
  return Math.max(0, p + d);
}

export function reserveMontant(masseCivile: number, nbEnfants: number): number {
  const ratio = reserveRatio(nbEnfants);
  return Math.round(Math.max(0, Number(masseCivile || 0) * ratio));
}

export function quotiteDisponible(masseCivile: number, nbEnfants: number): number {
  const r = reserveMontant(masseCivile, nbEnfants);
  return Math.max(0, Math.round(Number(masseCivile || 0) - r));
}

export function abattementResidencePrincipale(
  presenceRP: boolean,
  occConjoint: boolean,
  occEnfantMineur: boolean,
  valeurRP: number
): number {
  const v = Number(valeurRP || 0);
  if (!presenceRP) return 0;
  if (!(occConjoint || occEnfantMineur)) return 0;
  return Math.round(v * 0.2);
}

export function baseHorsAV(patrimoineTotal: number, abatRP: number): number {
  return Math.max(0, Number(patrimoineTotal || 0) - Number(abatRP || 0));
}

export function base757B(avApres70: number, abattementGlobal: number = ABATTEMENT_757B_APRES70): number {
  return Math.max(0, Number(avApres70 || 0) - Number(abattementGlobal || 0));
}
