export type UIOptionDDV =
  | 'TOTALITE_USUFRUIT'
  | 'QUOTITE_DISPONIBLE_PP'
  | 'QUART_PP_TROIS_QUARTS_USUFRUIT'
  | 'QUART_PP'
  | null;

export type BackendOptionDDV =
  | 'TOTALITE_EN_USUFRUIT'
  | 'PP_QUOTITE_DISPONIBLE'
  | 'QUART_PP_ET_TROIS_QUARTS_USUFRUIT'
  | 'QUART_PP'
  | null;

export function mapUIOptionToEnum(ui: UIOptionDDV): BackendOptionDDV {
  switch (ui) {
    case 'TOTALITE_USUFRUIT':
      return 'TOTALITE_EN_USUFRUIT';
    case 'QUOTITE_DISPONIBLE_PP':
      return 'PP_QUOTITE_DISPONIBLE';
    case 'QUART_PP_TROIS_QUARTS_USUFRUIT':
      return 'QUART_PP_ET_TROIS_QUARTS_USUFRUIT';
    case 'QUART_PP':
      return 'QUART_PP';
    default:
      return null;
  }
}

export function isUsufruitOption(opt: BackendOptionDDV | UIOptionDDV | null): boolean {
  return opt === 'TOTALITE_EN_USUFRUIT' || opt === 'TOTALITE_USUFRUIT' || opt === 'QUART_PP_ET_TROIS_QUARTS_USUFRUIT' || opt === 'QUART_PP_TROIS_QUARTS_USUFRUIT';
}

export function resolveAgeConjoint(agePrincipal?: number | null, ageFallback?: number | null): number | null {
  if (agePrincipal != null && !isNaN(Number(agePrincipal))) return Number(agePrincipal);
  if (ageFallback != null && !isNaN(Number(ageFallback))) return Number(ageFallback);
  return null;
}
