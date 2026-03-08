package com.alkaus.smp.application.inheritanceCompleteResults.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.alkaus.smp.application.inheritanceCompleteResults.command.AssetCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.AssetDetailResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.RepartitionItemResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.RepartitionResult;
import com.alkaus.smp.application.utils.Constantes;
import com.alkaus.smp.application.utils.ServiceUtils;

/**
 * Implementation of @link HeritageCalculationService
 * 
 * @author Alkaus
 */
@Service
public class HeritageCalculationServiceImpl implements HeritageCalculationService {

	private final static BigDecimal ZERO = Constantes.ZERO;
	private final static BigDecimal ONE_HUNDRED = Constantes.ONE_HUNDRED;

	@Override
	public HeritageResult calculate(CompleteResultsCommand cmd) {
		List<AssetCommand> assets = cmd.assets() != null ? cmd.assets() : List.of();

		BigDecimal patrimoineNetFourni = ServiceUtils.bigDecimalNullOrZero(cmd.totalNetWorth());
		BigDecimal dettesTotales = ServiceUtils.bigDecimalNullOrZero(cmd.totalDebts());

		boolean reCalcul = patrimoineNetFourni.compareTo(ZERO) == 0;

		BigDecimal totalGross = ZERO;
		BigDecimal netAssets = ZERO;

		BigDecimal imm = ZERO;
		BigDecimal fin = ZERO;
		BigDecimal pro = ZERO;
		BigDecimal oth = ZERO;

		var details = assets.stream().map(a -> {
			BigDecimal value = ServiceUtils.bigDecimalNullOrZero(a.value());
			BigDecimal debt = ServiceUtils.bigDecimalNullOrZero(a.debt());
			BigDecimal netValue = value.subtract(debt);

			// totals
			// totalBrut = gross values sum
			// netAssets = sum of (value - debt) if recalcul
			// NB: we add totalGross/netAssets after (otherwise lambda "effectively
			// final")
			return new AssetDetailResult(a.type(), designationFromType(a.type()), a.label(), value, debt, netValue);
		}).toList();

		for (AssetCommand a : assets) {
			BigDecimal value = ServiceUtils.bigDecimalNullOrZero(a.value());
			BigDecimal debt = ServiceUtils.bigDecimalNullOrZero(a.debt());
			BigDecimal netValue = value.subtract(debt);

			// Exclude PROPRE_CONJOINT from displayed patrimony — it doesn't enter this succession
			String own = a.ownership();
			boolean isConjointOwn = own != null && !own.isBlank()
					&& own.trim().toUpperCase(Locale.ROOT).contains("PROPRE_CONJOINT");
			if (isConjointOwn) continue;

			totalGross = totalGross.add(value);
			if (reCalcul) {
				netAssets = netAssets.add(netValue);
			}

			String t = a.type() == null ? "" : stripAccents(a.type().toUpperCase(Locale.ROOT));
			if (isRealEstate(t))
				imm = imm.add(netValue);
			else if (isFinancial(t))
				fin = fin.add(netValue);
			else if (isProfessional(t))
				pro = pro.add(netValue);
			else
				oth = oth.add(netValue);
		}

		BigDecimal baseNet = reCalcul ? netAssets : patrimoineNetFourni;
		BigDecimal totalNet = baseNet.subtract(dettesTotales);

		var repartition = new RepartitionResult(repartitionItem(totalNet, imm), repartitionItem(totalNet, fin),
				repartitionItem(totalNet, pro), repartitionItem(totalNet, oth));

		return new HeritageResult(totalGross.setScale(2, RoundingMode.HALF_UP),
				totalNet.setScale(2, RoundingMode.HALF_UP), repartition, details);
	}

	/**
	 * Build the repartitionItemResult of the type of asset
	 * 
	 * @param totalNet
	 * @param amount
	 * @return
	 */
	private RepartitionItemResult repartitionItem(BigDecimal totalNet, BigDecimal amount) {
		BigDecimal pct = ZERO;
		if (totalNet != null && totalNet.compareTo(ZERO) > 0) {
			pct = amount.multiply(ONE_HUNDRED).divide(totalNet, 2, RoundingMode.HALF_UP);
		}
		return new RepartitionItemResult(amount.setScale(2, RoundingMode.HALF_UP), pct);
	}

	/**
	 * If it is real estate type
	 * 
	 * @param t
	 * @return
	 */
	private boolean isRealEstate(String t) {
		return t.contains(Constantes.H_ASSET_TYPE_REAL_ESTATE_UP_CASE)
				|| t.contains(Constantes.H_ASSET_TYPE_REAL_ESTATE_RESIDENCE)
				|| t.contains(Constantes.H_ASSET_TYPE_REAL_ESTATE_HOUSE)
				|| t.contains(Constantes.H_ASSET_TYPE_REAL_ESTATE_FLAT);
	}

	/**
	 * If it is financial type
	 * 
	 * @param t
	 * @return
	 */
	private boolean isFinancial(String t) {
		return t.contains("FINANCIER") || t.contains("FINANCE") || t.contains("COMPTE") || t.contains("LIVRET")
				|| t.contains("PEA") || t.contains("ASSURANCE") || t.contains("PLACEMENT") || t.contains("EPARGNE")
				|| t.contains("LIQUIDITE");
	}

	/**
	 * If it is professional type
	 * 
	 * @param t
	 * @return
	 */
	private boolean isProfessional(String t) {
		return t.contains("PROFESSIONNEL") || t.contains("ENTREPRISE") || t.contains("SOCIETE") || t.contains("FONDS")
				|| t.contains("PARTS");
	}

	/**
	 * Determines the type of asset
	 * 
	 * @param type
	 * @return
	 */
	private String designationFromType(String type) {
		if (type == null)
			return Constantes.H_ASSET_TYPE_OTHERS;
		String t = stripAccents(type.toUpperCase(Locale.ROOT));
		if (isRealEstate(t))
			return Constantes.H_ASSET_TYPE_REAL_ESTATE;
		if (isFinancial(t))
			return Constantes.H_ASSET_TYPE_FINANCIAL;
		if (isProfessional(t))
			return Constantes.H_ASSET_TYPE_PROFESSIONAL;
		return Constantes.H_ASSET_TYPE_OTHERS;
	}

	private String stripAccents(String s) {
		return Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
	}
}
