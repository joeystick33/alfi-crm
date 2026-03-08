package com.alkaus.smp.application.inheritanceCompleteResults.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.alkaus.smp.application.inheritanceCompleteResults.command.AssetCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeirResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.OptimizationItemResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.OptimizationsResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;
import com.alkaus.smp.domain.fiscal.RelationshipEnum;

/**
 * Generates optimization strategies based on the family situation and scenario results.
 * Uses actual marginal tax rates per heir type (from fiscal-rules.yml barèmes).
 */
@Service
public class OptimizationServiceImpl implements OptimizationService {

	private static final BigDecimal ZERO = BigDecimal.ZERO;
	private static final BigDecimal BD_100K = new BigDecimal("100000");
	private static final BigDecimal BD_15932 = new BigDecimal("15932");
	private static final BigDecimal BD_7967 = new BigDecimal("7967");
	private static final BigDecimal AV_ABAT_BEFORE_70 = new BigDecimal("152500");
	private static final BigDecimal AV_ABAT_AFTER_70 = new BigDecimal("30500");

	// Siblings bracket boundary: 0–24 430 € → 35 %, au-delà → 45 %
	private static final BigDecimal SIBLINGS_BRACKET_LIMIT = new BigDecimal("24430");
	private static final BigDecimal RATE_SIBLINGS_LOW = new BigDecimal("0.35");
	private static final BigDecimal RATE_SIBLINGS_HIGH = new BigDecimal("0.45");
	private static final BigDecimal RATE_NEPHEW = new BigDecimal("0.55");
	private static final BigDecimal RATE_OTHERS = new BigDecimal("0.60");

	// Usufruit scale art. 669 CGI — key = max age inclusive, value = USF %
	private static final int[][] USF_SCALE = {
			{20, 90}, {30, 80}, {40, 70}, {50, 60}, {60, 50}, {70, 40}, {80, 30}, {90, 20}, {91, 10}
	};

	@Override
	public OptimizationsResult calculateOptimization(CompleteResultsCommand cmd, HeritageResult heritage,
			ScenarioResult scenario1, ScenarioResult scenario2) {

		List<OptimizationItemResult> items = new ArrayList<>();
		BigDecimal totalSavings = ZERO;

		BigDecimal netAsset = scenario1 != null && scenario1.inheritanceAsset() != null
				? scenario1.inheritanceAsset() : ZERO;
		int nbChildren = cmd.children() != null ? cmd.children().size() : 0;
		boolean hasSpouse = cmd.spouse() != null;
		boolean isMarried = cmd.maritalStatus() != null
				&& cmd.maritalStatus().toLowerCase().contains("mar");
		int clientAge = cmd.client() != null && cmd.client().age() != null ? cmd.client().age() : 65;
		boolean isBefore70 = clientAge < 70;
		int yearsTo70 = Math.max(70 - clientAge, 0);

		// ── Analyse des héritiers réels depuis le scénario ──
		int nbSiblings = 0, nbNephews = 0, nbDirectLine = 0;
		boolean hasAscendants = false; // parents vivants (ascendants)
		List<HeirResult> heirs = (scenario1 != null && scenario1.heirs() != null)
				? scenario1.heirs() : List.of();
		for (HeirResult h : heirs) {
			if (h.relationship() == RelationshipEnum.SIBLINGS) nbSiblings++;
			else if (h.relationship() == RelationshipEnum.NIECE_NEPHEW) nbNephews++;
			else if (h.relationship() == RelationshipEnum.DIRECT_LINE) nbDirectLine++;
		}
		// Ascendants = DIRECT_LINE heirs when no children (those are parents, not descendants)
		if (nbChildren == 0 && nbDirectLine > 0) hasAscendants = true;

		// AV bénéficiaires = héritiers HORS ascendants (un parent de 90 ans ne sera pas
		// désigné bénéficiaire d'un contrat d'assurance-vie)
		int nbAVBeneficiaries;
		if (nbChildren > 0) {
			// Children are the natural beneficiaries
			nbAVBeneficiaries = nbChildren;
		} else {
			// Siblings + nephews only (exclude ascendants)
			nbAVBeneficiaries = nbSiblings + nbNephews;
		}
		// Ne pas forcer 1 bénéficiaire fictif — si 0 éligibles, pas de stratégie AV pertinente

		BigDecimal liquidity = computeLiquidity(cmd);
		BigDecimal realEstateValue = computeRealEstateValue(cmd);

		// ──────────────────────────────────────────────
		// 1) Donation anticipée — enfants (100 000 € × nb enfants)
		// ──────────────────────────────────────────────
		if (nbChildren > 0) {
			BigDecimal maxDon = BD_100K.multiply(BigDecimal.valueOf(nbChildren));
			// Marginal rate for children: use actual rate from heir data
			BigDecimal childRate = marginalRateForDirectLine(heirs, nbChildren);
			BigDecimal saving = maxDon.multiply(childRate).setScale(2, RoundingMode.HALF_UP);
			if (netAsset.compareTo(maxDon) > 0) {
				items.add(new OptimizationItemResult(
						"Donation anticipée aux enfants",
						"Abattement de " + fmt(BD_100K) + " par enfant (art. 779 CGI), "
								+ "renouvelable tous les 15 ans. Pour vos " + nbChildren + " enfant(s) : "
								+ "montant total " + fmt(maxDon)
								+ ". Économie estimée : " + fmt(saving)
								+ " (taux marginal effectif ~" + pctStr(childRate) + ").",
						saving, true, "Dès que possible"));
				totalSavings = totalSavings.add(saving);
			}
		}

		// ──────────────────────────────────────────────
		// 2) Donation anticipée — fratrie (15 932 € × nb frères/sœurs)
		//    Taux marginal réel : 45 % si base > 24 430 €, sinon 35 %
		// ──────────────────────────────────────────────
		if (nbSiblings > 0 && nbChildren == 0) {
			BigDecimal maxDon = BD_15932.multiply(BigDecimal.valueOf(nbSiblings));
			// Determine actual marginal rate from heirs' baseAfterAllowance
			BigDecimal sibRate = marginalRateForSiblings(heirs);
			BigDecimal saving = maxDon.multiply(sibRate).setScale(2, RoundingMode.HALF_UP);
			items.add(new OptimizationItemResult(
					"Donation anticipée aux frères et sœurs",
					"Abattement de " + fmt(BD_15932) + " par frère/sœur (art. 779 CGI), "
							+ "renouvelable tous les 15 ans. Pour vos " + nbSiblings + " frère(s)/sœur(s) : "
							+ "montant total " + fmt(maxDon)
							+ ". Économie estimée : " + fmt(saving)
							+ " (taux marginal effectif ~" + pctStr(sibRate) + ").",
					saving, true, "Dès que possible"));
			totalSavings = totalSavings.add(saving);
		}

		// ──────────────────────────────────────────────
		// 3) Donation anticipée — neveux/nièces (7 967 € × nb)
		//    Taux unique : 55 %
		// ──────────────────────────────────────────────
		if (nbNephews > 0 && nbChildren == 0) {
			BigDecimal maxDon = BD_7967.multiply(BigDecimal.valueOf(nbNephews));
			BigDecimal saving = maxDon.multiply(RATE_NEPHEW).setScale(2, RoundingMode.HALF_UP);
			items.add(new OptimizationItemResult(
					"Donation anticipée aux neveux/nièces",
					"Abattement de " + fmt(BD_7967) + " par neveu/nièce (art. 779 CGI), "
							+ "renouvelable tous les 15 ans. Pour vos " + nbNephews
							+ " neveu(x)/nièce(s) : montant total " + fmt(maxDon)
							+ ". Économie estimée : " + fmt(saving) + " (taux unique 55 %).",
					saving, true, "Dès que possible"));
			totalSavings = totalSavings.add(saving);
		}

		// ──────────────────────────────────────────────
		// 4) Assurance-vie — taux d'économie pondéré par type d'héritier
		//    Bénéficiaires = héritiers hors ascendants
		// ──────────────────────────────────────────────
		if (netAsset.compareTo(new BigDecimal("200000")) > 0 && nbAVBeneficiaries > 0) {
			BigDecimal avOptimalTheorique = AV_ABAT_BEFORE_70.multiply(BigDecimal.valueOf(nbAVBeneficiaries));
			// Cap: min(optimal théorique, 80 % de la liquidité) pour conserver une réserve
			BigDecimal availableForAV = liquidity.compareTo(ZERO) > 0
					? liquidity.multiply(new BigDecimal("0.80")).setScale(0, RoundingMode.DOWN)
					: avOptimalTheorique;
			BigDecimal avOptimal = avOptimalTheorique.min(availableForAV);

			// Saving: per-beneficiary at their actual marginal succession rate
			BigDecimal avSaving;
			String description;

			if (isBefore70) {
				avSaving = computeAVSavingWeighted(heirs, nbChildren, AV_ABAT_BEFORE_70, avOptimal, nbAVBeneficiaries);
				BigDecimal avgRatePct = avOptimal.compareTo(ZERO) > 0
						? avSaving.multiply(new BigDecimal("100")).divide(avOptimal, 1, RoundingMode.HALF_UP)
						: ZERO;

				description = "Abattement de " + fmt(AV_ABAT_BEFORE_70)
						+ " par bénéficiaire (art. 990 I CGI). "
						+ nbAVBeneficiaries + " bénéficiaire(s) désigné(s) "
						+ describeAVBeneficiaries(nbChildren, nbSiblings, nbNephews, hasAscendants)
						+ " : montant optimal " + fmt(avOptimal) + ".";
				if (liquidity.compareTo(ZERO) > 0 && availableForAV.compareTo(avOptimalTheorique) < 0) {
					description += " Plafonné à 80 % de votre liquidité (" + fmt(liquidity)
							+ ") pour conserver une réserve de trésorerie.";
				}
				description += " Économie estimée : " + fmt(avSaving)
						+ " (taux moyen pondéré ~" + avgRatePct.setScale(0, RoundingMode.HALF_UP) + " %). "
						+ "Après 70 ans, l'abattement tombe à " + fmt(AV_ABAT_AFTER_70)
						+ " global — il est urgent d'agir dans les " + yearsTo70 + " prochaines années.";
			} else {
				avSaving = AV_ABAT_AFTER_70.multiply(new BigDecimal("0.35")).setScale(2, RoundingMode.HALF_UP);
				description = "Vous avez dépassé 70 ans. L'abattement applicable est de "
						+ fmt(AV_ABAT_AFTER_70) + " global (art. 757 B CGI), partagé entre "
						+ nbAVBeneficiaries + " bénéficiaire(s). "
						+ "L'assurance-vie reste intéressante : les produits (intérêts/plus-values) sont exonérés de droits.";
			}

			items.add(new OptimizationItemResult(
					isBefore70 ? "Assurance-vie avant 70 ans (art. 990 I CGI)"
							: "Assurance-vie après 70 ans (art. 757 B CGI)",
					description, avSaving, true,
					isBefore70 ? "Avant " + yearsTo70 + " an(s) — avant vos 70 ans" : "Dès que possible"));
			totalSavings = totalSavings.add(avSaving);
		}

		// ──────────────────────────────────────────────
		// 5) DDV si marié avec enfants
		// ──────────────────────────────────────────────
		if (isMarried && hasSpouse && nbChildren > 0) {
			items.add(new OptimizationItemResult(
					"Donation au dernier vivant",
					"Une DDV (art. 1094-1 C.civ) permet au conjoint survivant de choisir "
							+ "entre l'usufruit total, 1/4 PP + 3/4 USF, ou la quotité disponible en PP. "
							+ "Coût : 200–400 € (acte notarié). Sécurise le conjoint et offre une flexibilité fiscale.",
					ZERO, true, "Dès que possible (acte notarié)"));
		}

		// ──────────────────────────────────────────────
		// 6) Comparaison des scénarios (si 2 scénarios)
		// ──────────────────────────────────────────────
		if (scenario1 != null && scenario2 != null
				&& scenario1.inheritanceRights() != null && scenario2.inheritanceRights() != null
				&& scenario1.relevant() && scenario2.relevant()) {
			BigDecimal diff = scenario1.inheritanceRights().subtract(scenario2.inheritanceRights()).abs();
			if (diff.compareTo(new BigDecimal("1000")) > 0) {
				String cheaper = scenario1.inheritanceRights().compareTo(scenario2.inheritanceRights()) < 0
						? scenario1.label() : scenario2.label();
				items.add(new OptimizationItemResult(
						"Comparaison des scénarios",
						"Le scénario « " + cheaper + " » est fiscalement plus avantageux, avec une économie de "
								+ fmt(diff) + " sur les droits de succession.",
						diff, true, null));
				totalSavings = totalSavings.add(diff);
			}
		}

		// ──────────────────────────────────────────────
		// 7) Démembrement de propriété — UNIQUEMENT si enfants (ligne directe)
		//    Pour fratrie/neveux : abattements trop faibles (15 932 / 7 967 €)
		//    → la NP serait taxée à 35-55 % sur la quasi-totalité, non-sens fiscal
		// ──────────────────────────────────────────────
		BigDecimal grossTotal = heritage != null && heritage.totalGross() != null ? heritage.totalGross() : ZERO;
		BigDecimal immoForDem = realEstateValue.compareTo(ZERO) > 0 ? realEstateValue : grossTotal;
		if (immoForDem.compareTo(new BigDecimal("200000")) > 0 && nbChildren > 0) {
			int usfPct = getUsfPct(clientAge);
			int npPct = 100 - usfPct;
			BigDecimal npValue = immoForDem.multiply(BigDecimal.valueOf(npPct))
					.divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);
			BigDecimal usfValue = immoForDem.subtract(npValue);
			BigDecimal childRate = marginalRateForDirectLine(heirs, nbChildren);
			BigDecimal demSaving = usfValue.multiply(childRate).setScale(2, RoundingMode.HALF_UP);

			items.add(new OptimizationItemResult(
					"Démembrement de propriété (art. 669 CGI)",
					"À " + clientAge + " ans : usufruit = " + usfPct + " %, nue-propriété = " + npPct + " %. "
							+ "Sur " + fmt(immoForDem) + " de patrimoine immobilier : "
							+ "NP = " + fmt(npValue) + " (transmise aux enfants), USF = " + fmt(usfValue) + ". "
							+ "Chaque enfant bénéficie d'un abattement de " + fmt(BD_100K)
							+ " en ligne directe (art. 779 CGI). "
							+ "La part usufruit (" + fmt(usfValue)
							+ ") échappe aux droits de succession à votre décès. "
							+ "Économie estimée : " + fmt(demSaving)
							+ " (taux marginal ligne directe ~" + pctStr(childRate) + ").",
					demSaving, true, "À étudier avec un notaire"));
			totalSavings = totalSavings.add(demSaving);
		}

		// ──────────────────────────────────────────────
		// 8) Testament si célibataire sans enfant (QD = 100 %)
		// ──────────────────────────────────────────────
		if (!isMarried && !hasSpouse && nbChildren == 0) {
			// Quantify: redistributing to maximize abatements
			String testamentDesc = "Sans héritier réservataire (art. 912 C.civ, réforme 2006), "
					+ "votre quotité disponible est de 100 % du patrimoine (" + fmt(netAsset) + "). "
					+ "Un testament permet de répartir librement votre succession. ";
			if (nbSiblings > 0 || nbNephews > 0) {
				testamentDesc += "Par exemple, privilégier les héritiers ayant les abattements les plus élevés "
						+ "(frères/sœurs : " + fmt(BD_15932) + " d'abattement, taxés à 35–45 %) "
						+ "plutôt que les neveux/nièces (" + fmt(BD_7967) + " d'abattement, taxés à 55 %) "
						+ "permet de réduire le taux moyen d'imposition global.";
			}
			if (hasAscendants) {
				testamentDesc += " Vos ascendants disposent d'un droit de retour légal (art. 738-2 C.civ) "
						+ "mais pas de réserve héréditaire.";
			}
			items.add(new OptimizationItemResult(
					"Testament olographe ou authentique",
					testamentDesc, ZERO, true, "Dès que possible (notaire ou olographe)"));
		}

		return new OptimizationsResult(totalSavings.setScale(2, RoundingMode.HALF_UP), items);
	}

	// ═══════════════════════════════════════════════
	// Helpers — marginal rate computation
	// ═══════════════════════════════════════════════

	/** Marginal rate for siblings: 35 % if base ≤ 24 430 €, 45 % above */
	private BigDecimal marginalRateForSiblings(List<HeirResult> heirs) {
		for (HeirResult h : heirs) {
			if (h.relationship() == RelationshipEnum.SIBLINGS && h.baseAfterAllowance() != null) {
				return h.baseAfterAllowance().compareTo(SIBLINGS_BRACKET_LIMIT) > 0
						? RATE_SIBLINGS_HIGH : RATE_SIBLINGS_LOW;
			}
		}
		return RATE_SIBLINGS_HIGH; // default: assume > 24 430 for significant estates
	}

	/** Marginal rate for direct-line (children): approximate from baseAfterAllowance */
	private BigDecimal marginalRateForDirectLine(List<HeirResult> heirs, int nbChildren) {
		for (HeirResult h : heirs) {
			if (h.relationship() == RelationshipEnum.DIRECT_LINE && h.baseAfterAllowance() != null) {
				return directLineRate(h.baseAfterAllowance());
			}
		}
		return new BigDecimal("0.20"); // default: 20% bracket
	}

	/** Direct-line progressive scale (art. 777 CGI) */
	private BigDecimal directLineRate(BigDecimal base) {
		if (base == null || base.compareTo(ZERO) <= 0) return new BigDecimal("0.05");
		double b = base.doubleValue();
		if (b <= 8072) return new BigDecimal("0.05");
		if (b <= 12109) return new BigDecimal("0.10");
		if (b <= 15932) return new BigDecimal("0.15");
		if (b <= 552324) return new BigDecimal("0.20");
		if (b <= 902838) return new BigDecimal("0.30");
		if (b <= 1805677) return new BigDecimal("0.40");
		return new BigDecimal("0.45");
	}

	/** Marginal rate for a given heir based on relationship + base */
	private BigDecimal marginalRate(HeirResult h) {
		if (h.relationship() == null) return RATE_OTHERS;
		return switch (h.relationship()) {
			case DIRECT_LINE -> directLineRate(h.baseAfterAllowance());
			case SIBLINGS -> (h.baseAfterAllowance() != null
					&& h.baseAfterAllowance().compareTo(SIBLINGS_BRACKET_LIMIT) > 0)
					? RATE_SIBLINGS_HIGH : RATE_SIBLINGS_LOW;
			case NIECE_NEPHEW -> RATE_NEPHEW;
			default -> RATE_OTHERS;
		};
	}

	/** Compute AV saving weighted by each beneficiary's marginal succession rate */
	private BigDecimal computeAVSavingWeighted(List<HeirResult> heirs, int nbChildren,
			BigDecimal abatPerBenef, BigDecimal avOptimal, int nbBenef) {
		if (heirs.isEmpty() || nbBenef == 0) {
			return avOptimal.multiply(new BigDecimal("0.20")).setScale(2, RoundingMode.HALF_UP);
		}
		// Per-beneficiary allocation
		BigDecimal perBenef = abatPerBenef.min(
				avOptimal.divide(BigDecimal.valueOf(nbBenef), 0, RoundingMode.DOWN));

		BigDecimal totalSav = ZERO;
		for (HeirResult h : heirs) {
			// Skip ascendants (parents) — they won't be AV beneficiaries
			if (nbChildren == 0 && h.relationship() == RelationshipEnum.DIRECT_LINE) continue;
			// Skip OTHERS (rare, e.g. tiers)
			if (h.relationship() == RelationshipEnum.OTHERS) continue;
			BigDecimal rate = marginalRate(h);
			totalSav = totalSav.add(perBenef.multiply(rate));
		}
		return totalSav.setScale(2, RoundingMode.HALF_UP);
	}

	/** Describe who the AV beneficiaries are */
	private String describeAVBeneficiaries(int nbChildren, int nbSiblings, int nbNephews, boolean hasAscendants) {
		List<String> parts = new ArrayList<>();
		if (nbChildren > 0) parts.add(nbChildren + " enfant(s)");
		if (nbSiblings > 0) parts.add(nbSiblings + " frère(s)/sœur(s)");
		if (nbNephews > 0) parts.add(nbNephews + " neveu(x)/nièce(s)");
		if (hasAscendants) parts.add("hors ascendant(s) vivant(s)");
		return parts.isEmpty() ? "" : "(" + String.join(", ", parts) + ")";
	}

	// ═══════════════════════════════════════════════
	// Helpers — usufruit / asset computation
	// ═══════════════════════════════════════════════

	private int getUsfPct(int age) {
		for (int[] entry : USF_SCALE) {
			if (age <= entry[0]) return entry[1];
		}
		return 10; // 91+
	}

	private BigDecimal computeLiquidity(CompleteResultsCommand cmd) {
		if (cmd.assets() == null) return ZERO;
		BigDecimal liq = ZERO;
		for (AssetCommand a : cmd.assets()) {
			if (a.type() != null && !isRealEstate(a.type())) {
				BigDecimal net = (a.value() != null ? a.value() : ZERO)
						.subtract(a.debt() != null ? a.debt() : ZERO);
				liq = liq.add(net.max(ZERO));
			}
		}
		return liq;
	}

	private BigDecimal computeRealEstateValue(CompleteResultsCommand cmd) {
		if (cmd.assets() == null) return ZERO;
		BigDecimal total = ZERO;
		for (AssetCommand a : cmd.assets()) {
			if (a.type() != null && isRealEstate(a.type())) {
				BigDecimal net = (a.value() != null ? a.value() : ZERO)
						.subtract(a.debt() != null ? a.debt() : ZERO);
				total = total.add(net.max(ZERO));
			}
		}
		return total;
	}

	private boolean isRealEstate(String type) {
		String t = type.toUpperCase();
		return t.contains("IMMOBILIER") || t.contains("RESIDENCE") || t.contains("MAISON")
				|| t.contains("APPART") || t.contains("TERRAIN") || t.contains("IMMO");
	}

	private String fmt(BigDecimal amount) {
		return String.format("%,.0f €", amount);
	}

	private String pctStr(BigDecimal rate) {
		return rate.multiply(new BigDecimal("100")).setScale(0, RoundingMode.HALF_UP) + " %";
	}
}
