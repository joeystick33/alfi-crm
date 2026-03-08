package com.alkaus.smp.application.utils;

import java.math.BigDecimal;

/**
 * Classe utils pour les services
 * 
 * @author alkaus
 */
public class ServiceUtils {

	public static BigDecimal bigDecimalNullOrZero(BigDecimal input) {
		return input == null ? BigDecimal.ZERO : input;
	}

	public static BigDecimal doubleToBigDecimal(double input) {
		return input == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(input);
	}

}
