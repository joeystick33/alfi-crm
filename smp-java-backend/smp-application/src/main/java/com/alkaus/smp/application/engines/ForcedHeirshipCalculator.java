package com.alkaus.smp.application.engines;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

/**
 * Computes the forced heirship reserve and available quota (quotité disponible)
 * according to French civil law (art. 913 C.civ).
 */
@Service
public class ForcedHeirshipCalculator {

	/**
	 * Computes the reserve fraction based on the number of children.
	 * Art. 913 C.civ:
	 *   1 child  → reserve = 1/2
	 *   2 children → reserve = 2/3
	 *   3+ children → reserve = 3/4
	 *   0 children → reserve = 0 (no forced heirship for spouse alone)
	 *
	 * @param numberOfChildren number of children (including by representation)
	 * @return reserve as a fraction [0;1]
	 */
	public BigDecimal reserveFraction(int numberOfChildren) {
		return switch (numberOfChildren) {
			case 0 -> BigDecimal.ZERO;
			case 1 -> new BigDecimal("0.50");
			case 2 -> new BigDecimal("0.666667");
			default -> new BigDecimal("0.75");
		};
	}

	/**
	 * Computes the available quota fraction.
	 * @param numberOfChildren number of children
	 * @return available quota as a fraction [0;1]
	 */
	public BigDecimal availableQuotaFraction(int numberOfChildren) {
		return BigDecimal.ONE.subtract(reserveFraction(numberOfChildren));
	}

	/**
	 * Computes the reserve amount.
	 * @param estateValue the civil estate value
	 * @param numberOfChildren number of children
	 * @return reserve amount
	 */
	public BigDecimal reserveAmount(BigDecimal estateValue, int numberOfChildren) {
		return estateValue.multiply(reserveFraction(numberOfChildren))
				.setScale(2, RoundingMode.HALF_UP);
	}

	/**
	 * Computes the available quota amount.
	 * @param estateValue the civil estate value
	 * @param numberOfChildren number of children
	 * @return available quota amount
	 */
	public BigDecimal availableQuotaAmount(BigDecimal estateValue, int numberOfChildren) {
		return estateValue.multiply(availableQuotaFraction(numberOfChildren))
				.setScale(2, RoundingMode.HALF_UP);
	}
}
