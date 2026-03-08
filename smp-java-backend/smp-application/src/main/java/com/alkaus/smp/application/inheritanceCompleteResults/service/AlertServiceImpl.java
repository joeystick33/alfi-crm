package com.alkaus.smp.application.inheritanceCompleteResults.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.AlertResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;
import com.alkaus.smp.application.utils.ServiceUtils;

/**
 * Generates contextual alerts based on the family situation and calculation results.
 * Alerts can be of type: DANGER, WARNING, INFO.
 */
@Service
public class AlertServiceImpl implements AlertService {

	private static final BigDecimal ZERO = BigDecimal.ZERO;

	@Override
	public List<AlertResult> generate(CompleteResultsCommand cmd, HeritageResult heritage,
			ScenarioResult scenario1, ScenarioResult scenario2) {

		List<AlertResult> alerts = new ArrayList<>();

		BigDecimal netAsset = scenario1 != null && scenario1.inheritanceAsset() != null
				? scenario1.inheritanceAsset() : ZERO;
		BigDecimal rights = scenario1 != null && scenario1.inheritanceRights() != null
				? scenario1.inheritanceRights() : ZERO;
		BigDecimal annualIncome = ServiceUtils.bigDecimalNullOrZero(cmd.annualIncome());

		// 1) Liquidity alert: rights exceed 50% of annual income
		if (rights.compareTo(ZERO) > 0 && annualIncome.compareTo(ZERO) > 0) {
			BigDecimal ratio = rights.divide(annualIncome, 2, RoundingMode.HALF_UP);
			if (ratio.compareTo(new BigDecimal("0.50")) > 0) {
				alerts.add(new AlertResult("DANGER",
						"Risque de tension de trésorerie",
						"Les droits de succession (" + formatMoney(rights)
								+ ") représentent plus de 50% du revenu annuel. "
								+ "Il est conseillé de prévoir un financement ou une assurance-vie dédiée."));
			}
		}

		// 2) High tax rate alert
		if (netAsset.compareTo(ZERO) > 0 && rights.compareTo(ZERO) > 0) {
			BigDecimal taxRate = rights.multiply(new BigDecimal("100"))
					.divide(netAsset, 2, RoundingMode.HALF_UP);
			if (taxRate.compareTo(new BigDecimal("20")) > 0) {
				alerts.add(new AlertResult("WARNING",
						"Taux d'imposition élevé",
						"Le taux effectif d'imposition est de " + taxRate + "%. "
								+ "Des stratégies d'optimisation (donation, assurance-vie, démembrement) "
								+ "pourraient réduire significativement ce taux."));
			}
		}

		// 3) No spouse protection alert
		boolean isMarried = cmd.maritalStatus() != null
				&& cmd.maritalStatus().toLowerCase().contains("mar");
		boolean isPacsed = cmd.maritalStatus() != null
				&& cmd.maritalStatus().toLowerCase().contains("pacs");
		if (cmd.spouse() != null && !isMarried && !isPacsed) {
			alerts.add(new AlertResult("DANGER",
					"Concubin non protégé",
					"Le concubin n'a aucun droit successoral légal et serait taxé à 60% en cas de legs. "
							+ "Il est fortement recommandé de souscrire un PACS ou de recourir à l'assurance-vie."));
		}

		// 4) PACS without will alert — only if no testament is in place
		if (isPacsed && cmd.spouse() != null && !cmd.hasWill()) {
			alerts.add(new AlertResult("WARNING",
					"Partenaire pacsé : pensez au testament",
					"Le partenaire de PACS n'hérite pas légalement sans testament. "
							+ "Bien que fiscalement exonéré, un testament est indispensable pour qu'il hérite."));
		}
		if (isPacsed && cmd.spouse() != null && cmd.hasWill()) {
			alerts.add(new AlertResult("INFO",
					"Testament en place pour le partenaire pacsé",
					"Un testament est en place au profit de votre partenaire pacsé. "
							+ "Il pourra hériter de la quotité disponible en totale exonération de droits (art. 796-0 bis CGI)."));
		}

		// 5) Order 3/4 fallback alert — no close heirs identified
		boolean hasChildren = cmd.children() != null && !cmd.children().isEmpty();
		boolean hasParents = cmd.parentsOfDeceased() != null
				&& (cmd.parentsOfDeceased().livingFather() || cmd.parentsOfDeceased().livingMother());
		boolean hasSiblings = cmd.siblingsOfDeceased() != null && !cmd.siblingsOfDeceased().isEmpty();
		if (!hasChildren && !hasParents && !hasSiblings && cmd.spouse() == null) {
			alerts.add(new AlertResult("WARNING",
					"Héritiers d'ordre 3/4 estimés",
					"Aucun héritier de rang 1 ou 2 (enfants, parents, fratrie) n'a été identifié. "
							+ "La simulation utilise un héritier d'ordre 3 ou 4 (ascendant ordinaire ou collatéral) "
							+ "avec un abattement et un barème estimés. "
							+ "Pour un résultat plus précis, renseignez les grands-parents ou collatéraux du défunt."));
		}

		// 6) 6-month deadline for declaration
		alerts.add(new AlertResult("INFO",
				"Délai de déclaration",
				"La déclaration de succession doit être déposée dans les 6 mois suivant le décès "
						+ "(12 mois si le décès a lieu hors de France métropolitaine). "
						+ "Le paiement des droits est dû à la même date."));

		// 6) Payment deferral option for large amounts
		if (rights.compareTo(new BigDecimal("10000")) > 0) {
			alerts.add(new AlertResult("INFO",
					"Paiement fractionné ou différé possible",
					"Pour les droits supérieurs à 10 000 €, un paiement fractionné (jusqu'à 3 ans) "
							+ "ou différé (en cas d'usufruit, jusqu'au décès de l'usufruitier) peut être demandé "
							+ "auprès de l'administration fiscale."));
		}

		// 7) Communauté universelle avec clause alert
		if (cmd.matrimonialRegime() != null
				&& cmd.matrimonialRegime().toLowerCase().contains("universelle")
				&& cmd.matrimonialRegime().toLowerCase().contains("clause")) {
			alerts.add(new AlertResult("INFO",
					"Communauté universelle avec clause d'attribution intégrale",
					"L'intégralité du patrimoine commun revient au conjoint survivant sans succession. "
							+ "Attention : les enfants n'héritent qu'au second décès, ce qui peut augmenter "
							+ "la charge fiscale globale."));
		}

		return alerts;
	}

	private String formatMoney(BigDecimal amount) {
		return String.format("%,.0f €", amount);
	}
}
