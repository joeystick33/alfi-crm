package com.alkaus.smp.application.engines;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.alkaus.smp.domain.fiscal.FiscalRules;
import com.alkaus.smp.domain.succession.LifeInsuranceInput;

/**
 * Life insurance fiscal rules service.
 * Art. 990 I CGI: premiums paid before age 70 — 152 500 € allowance per beneficiary,
 *   then 20% up to 700 000 €, 31.25% beyond.
 * Art. 757 B CGI: premiums paid after age 70 — 30 500 € global allowance,
 *   excess reintegrated into the estate (taxed at normal inheritance scale).
 */
@Service
public class AssuranceVieRulesService {

	// Fallback values if not provided in FiscalRules
	private static final BigDecimal DEFAULT_RATE_1 = new BigDecimal("0.20");
	private static final BigDecimal DEFAULT_RATE_2 = new BigDecimal("0.3125");
	private static final BigDecimal DEFAULT_THRESHOLD = new BigDecimal("700000");

	/**
	 * Calculates the life insurance tax (art. 990 I) for a specific beneficiary
	 * on premiums paid before the insured was 70 years old.
	 *
	 * @param beneficiaryName the beneficiary heir name
	 * @param lifeInsurances  all life insurance contracts
	 * @param fiscalRules     current fiscal rules (for the 152 500 € allowance)
	 * @param spouseOrPacs    true if beneficiary is spouse/PACS (fully exempt)
	 * @return tax amount due under art. 990 I
	 */
	public BigDecimal taxBefore70(String beneficiaryName, List<LifeInsuranceInput> lifeInsurances,
			FiscalRules fiscalRules, boolean spouseOrPacs) {

		if (spouseOrPacs || CollectionUtils.isEmpty(lifeInsurances)) {
			return BigDecimal.ZERO;
		}

		// Collect all before-70 entries for this beneficiary
		List<LifeInsuranceInput> before70Entries = lifeInsurances.stream()
				.filter(a -> beneficiaryName.equals(a.beneficiaryName()))
				.filter(a -> a.ageOfInsuredAtPayment() != null && a.ageOfInsuredAtPayment() < 70)
				.toList();

		BigDecimal totalBefore70 = before70Entries.stream()
				.map(a -> a.deathBenefit() != null ? a.deathBenefit() : BigDecimal.ZERO)
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		if (totalBefore70.signum() <= 0) {
			return BigDecimal.ZERO;
		}

		BigDecimal baseAllowance = fiscalRules.lifeInsuranceBefore70GlobalAbatement();
		if (baseAllowance == null) {
			baseAllowance = BigDecimal.ZERO;
		}

		// Art. 990 I avec démembrement : l'abattement de 152 500 € est proratisé
		// entre l'usufruitier et le nu-propriétaire selon le barème art. 669 CGI.
		// Chaque contrat contribue à hauteur de sa fraction (1.0 = PP, NP% = démembrement).
		// Le total est plafonné à 152 500 €.
		BigDecimal effectiveAllowance = BigDecimal.ZERO;
		for (LifeInsuranceInput entry : before70Entries) {
			BigDecimal fraction = entry.allowanceFraction() != null ? entry.allowanceFraction() : BigDecimal.ONE;
			effectiveAllowance = effectiveAllowance.add(baseAllowance.multiply(fraction));
		}
		effectiveAllowance = effectiveAllowance.min(baseAllowance).setScale(2, RoundingMode.HALF_UP);

		BigDecimal taxable = totalBefore70.subtract(effectiveAllowance).max(BigDecimal.ZERO);
		if (taxable.signum() == 0) {
			return BigDecimal.ZERO;
		}

		BigDecimal rate1 = fiscalRules.lifeInsurance990IRate1() != null ? fiscalRules.lifeInsurance990IRate1() : DEFAULT_RATE_1;
		BigDecimal rate2 = fiscalRules.lifeInsurance990IRate2() != null ? fiscalRules.lifeInsurance990IRate2() : DEFAULT_RATE_2;
		BigDecimal threshold = fiscalRules.lifeInsurance990IThreshold() != null ? fiscalRules.lifeInsurance990IThreshold() : DEFAULT_THRESHOLD;

		BigDecimal tax;
		if (taxable.compareTo(threshold) <= 0) {
			tax = taxable.multiply(rate1);
		} else {
			tax = threshold.multiply(rate1)
					.add(taxable.subtract(threshold).multiply(rate2));
		}

		return tax.setScale(2, RoundingMode.HALF_UP);
	}

	/**
	 * Returns the amount of premiums paid after age 70 that must be reintegrated
	 * into the taxable estate (art. 757 B CGI), after the 30 500 € global allowance.
	 * This amount will be added to the heir's taxable base and taxed at the normal scale.
	 *
	 * @param beneficiaryName the beneficiary heir name
	 * @param lifeInsurances  all life insurance contracts
	 * @param fiscalRules     current fiscal rules (for the 30 500 € threshold)
	 * @param totalBeneficiaries total number of beneficiaries (to split the global allowance)
	 * @return reintegrated amount to add to taxable estate
	 */
	public BigDecimal reintegratedAfter70(String beneficiaryName, List<LifeInsuranceInput> lifeInsurances,
			FiscalRules fiscalRules, int totalBeneficiaries) {

		if (CollectionUtils.isEmpty(lifeInsurances)) {
			return BigDecimal.ZERO;
		}

		BigDecimal totalAfter70 = lifeInsurances.stream()
				.filter(a -> beneficiaryName.equals(a.beneficiaryName()))
				.filter(a -> a.ageOfInsuredAtPayment() != null && a.ageOfInsuredAtPayment() >= 70)
				.map(a -> a.bonusesPaid() != null ? a.bonusesPaid() : BigDecimal.ZERO)
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		if (totalAfter70.signum() <= 0) {
			return BigDecimal.ZERO;
		}

		BigDecimal globalAllowance = fiscalRules.lifeInsuranceAfter70ReintegrationTreshold();
		if (globalAllowance == null) {
			globalAllowance = BigDecimal.ZERO;
		}

		int nbBeneficiaries = Math.max(totalBeneficiaries, 1);
		BigDecimal share = globalAllowance.divide(new BigDecimal(nbBeneficiaries), 2, RoundingMode.HALF_UP);

		return totalAfter70.subtract(share).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
	}
}
