package com.alkaus.smp.application.engines;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

import com.alkaus.smp.application.inheritanceCompleteResults.model.LiquidationResult;

/**
 * Computes the estate liquidation based on the matrimonial regime.
 * Determines the deceased's share that enters the succession vs. the surviving spouse's share.
 */
@Service
public class LiquidationRegimeService {

	private static final BigDecimal TWO = new BigDecimal("2");

	/**
	 * Computes the liquidation of the matrimonial regime.
	 *
	 * @param regime            normalized regime string (from MetadataService)
	 * @param grossAsset        total gross asset of the couple
	 * @param totalPassif       total debts
	 * @param separateAsset     deceased's separate (own) assets (may be null)
	 * @param commonAsset       common assets of the couple (may be null)
	 * @return liquidation breakdown
	 */
	public LiquidationResult liquidate(String regime, BigDecimal grossAsset, BigDecimal totalPassif,
			BigDecimal separateAsset, BigDecimal commonAsset) {

		BigDecimal gross = safe(grossAsset);
		BigDecimal passif = safe(totalPassif);
		BigDecimal netTotal = gross.subtract(passif).max(BigDecimal.ZERO);

		if (regime == null || regime.isBlank()) {
			return simple(netTotal);
		}

		String r = regime.toLowerCase().trim();

		if (r.contains("universelle") && r.contains("clause")) {
			return universalCommunityWithClause(netTotal);
		}
		if (r.contains("universelle")) {
			return universalCommunity(netTotal);
		}
		if (r.contains("séparation") || r.contains("separation")) {
			return separateProperty(netTotal, separateAsset);
		}
		if (r.contains("participation")) {
			return participationInAcquisitions(netTotal, separateAsset, commonAsset);
		}
		// Default: communauté réduite aux acquêts
		return communityProperty(netTotal, separateAsset, commonAsset);
	}

	/** Communauté réduite aux acquêts: propres + 50% communs */
	private LiquidationResult communityProperty(BigDecimal netTotal, BigDecimal separateAsset, BigDecimal commonAsset) {
		BigDecimal own = safe(separateAsset);
		BigDecimal common = safe(commonAsset);

		// If no detail provided, assume all is common
		if (own.signum() == 0 && common.signum() == 0) {
			common = netTotal;
		}

		BigDecimal deceasedShare = own.add(common.divide(TWO, 2, RoundingMode.HALF_UP));
		BigDecimal spouseShare = common.divide(TWO, 2, RoundingMode.HALF_UP);

		return new LiquidationResult(
				scale(own), scale(common), scale(deceasedShare), scale(spouseShare), scale(deceasedShare));
	}

	/** Communauté universelle sans clause: each spouse owns 50% */
	private LiquidationResult universalCommunity(BigDecimal netTotal) {
		BigDecimal half = netTotal.divide(TWO, 2, RoundingMode.HALF_UP);
		return new LiquidationResult(BigDecimal.ZERO, scale(netTotal), scale(half), scale(half), scale(half));
	}

	/** Communauté universelle avec clause d'attribution intégrale: everything goes to spouse, nothing in succession */
	private LiquidationResult universalCommunityWithClause(BigDecimal netTotal) {
		return new LiquidationResult(BigDecimal.ZERO, scale(netTotal), BigDecimal.ZERO, scale(netTotal), BigDecimal.ZERO);
	}

	/** Séparation de biens: only deceased's own assets enter succession */
	private LiquidationResult separateProperty(BigDecimal netTotal, BigDecimal separateAsset) {
		BigDecimal own = safe(separateAsset);
		if (own.signum() == 0) {
			own = netTotal; // fallback: assume all belongs to deceased
		}
		BigDecimal spouseShare = netTotal.subtract(own).max(BigDecimal.ZERO);
		return new LiquidationResult(scale(own), BigDecimal.ZERO, scale(own), scale(spouseShare), scale(own));
	}

	/** Participation aux acquêts: treated like séparation during marriage, communauté at dissolution */
	private LiquidationResult participationInAcquisitions(BigDecimal netTotal, BigDecimal separateAsset, BigDecimal commonAsset) {
		// Simplified: same as communauté réduite for succession purposes
		return communityProperty(netTotal, separateAsset, commonAsset);
	}

	/** No regime info: full net enters succession */
	private LiquidationResult simple(BigDecimal netTotal) {
		return new LiquidationResult(null, null, null, null, scale(netTotal));
	}

	private BigDecimal safe(BigDecimal v) {
		return v != null ? v : BigDecimal.ZERO;
	}

	private BigDecimal scale(BigDecimal v) {
		return v.setScale(2, RoundingMode.HALF_UP);
	}
}
