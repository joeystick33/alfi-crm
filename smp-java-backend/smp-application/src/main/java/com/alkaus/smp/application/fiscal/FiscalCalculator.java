package com.alkaus.smp.application.fiscal;

import java.math.BigDecimal;
import java.math.RoundingMode;

import com.alkaus.smp.application.utils.Constantes;
import com.alkaus.smp.domain.fiscal.Abatement;
import com.alkaus.smp.domain.fiscal.FiscalRules;
import com.alkaus.smp.domain.fiscal.LienParenteEnum;
import com.alkaus.smp.domain.fiscal.Scale;
import com.alkaus.smp.domain.fiscal.Slice;
import com.alkaus.smp.domain.fiscal.UsufructScales;

public final class FiscalCalculator {

	private FiscalCalculator() {
	}

	/**
	 * Max(x, 0)
	 * 
	 * @param x
	 * @return
	 */
	public static BigDecimal maxZero(BigDecimal x) {
		return x.compareTo(Constantes.ZERO) > 0 ? x : Constantes.ZERO;
	}

	/**
	 * Base taxable après abattement selon le lien
	 * 
	 * @param base
	 * @param lien
	 * @param reglesFiscales
	 * @return
	 */
	public static BigDecimal baseTaxableApresAbattement(BigDecimal base, LienParenteEnum lienParente,
			FiscalRules reglesFiscales) {
		BigDecimal montantAbattement = reglesFiscales.abatementsByLink()
				.getOrDefault(lienParente, new Abatement(Constantes.ZERO)).amount();

		return maxZero(base.subtract(montantAbattement));
	}

	/**
	 * Application of a scale per slices (limit included, last slice null = infinity
	 * 
	 * @param base
	 * @param scale
	 * @return rights per scale
	 */
	public static BigDecimal rightsPerSlice(BigDecimal taxable, Scale scale) {
		if (scale == null || scale.slices() == null || scale.slices().isEmpty() || taxable == null
				|| taxable.signum() <= 0)
			return Constantes.ZERO;

		// 1) On sécurise l'ordre des tranches (borneSupIncluse croissante, null en
		// dernier)
//		List<Slice> tranches = scale.slices().stream().filter(Objects::nonNull)
//				.sorted(Comparator.comparing(Slice::upperLimitInc, Comparator.nullsLast(Comparator.naturalOrder())))
//				.toList();

		BigDecimal precedentBase = BigDecimal.ZERO;
		BigDecimal rights = Constantes.ZERO;

		for (Slice t : scale.slices()) {
			BigDecimal upeprLimitInc = t.upperLimitInc(); // peut être null = tranche ouverte (∞)

			// 2) Effective Limit = min(taxable, upperLimitInc) with open limit if null
			BigDecimal effectiveLimit = (upeprLimitInc == null) ? taxable : upeprLimitInc.min(taxable);

			// 3) Slice base = effectiveLimit - precedentBase
			BigDecimal baseSlice = effectiveLimit.subtract(precedentBase);
			if (baseSlice.signum() > 0) {
				BigDecimal rate = (t.rate() == null ? BigDecimal.ZERO : t.rate()); // ex: 0.20 for 20%
				BigDecimal part = baseSlice.multiply(rate);
				rights = rights.add(part);
				precedentBase = effectiveLimit; // borne inf suivante = plafond atteint ici
			}

			// 4) If the entire taxable base has already been reached, we exit
			if (upeprLimitInc == null || precedentBase.compareTo(taxable) >= 0) {
				break;
			}
		}

		return rights.setScale(2, RoundingMode.HALF_EVEN);
	}

	/**
	 * Calcul the taxable value of US/NP with full property as a base
	 * 
	 * @param baseFullProperty
	 * @param usufruct
	 * @param usufructAge
	 * @param usufructScale
	 * @return rights value
	 */
	public static BigDecimal valueRights(BigDecimal baseFullProperty, boolean usufruct, int usufructAge,
			UsufructScales usufructScale) {

		if (baseFullProperty == null || baseFullProperty.signum() <= 0)
			return Constantes.ZERO;
		if (usufructScale == null)
			return baseFullProperty;

		int pctUs = usufructScale.pctForAge(usufructAge); // méthode à fournir dans UsufruitBareme
		BigDecimal pctUsBD = new BigDecimal(pctUs).divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP);
		BigDecimal pctNpBD = BigDecimal.ONE.subtract(pctUsBD);

		BigDecimal valUs = baseFullProperty.multiply(pctUsBD);
		BigDecimal valNp = baseFullProperty.multiply(pctNpBD);

		return usufruct ? valUs : valNp;
	}

}
