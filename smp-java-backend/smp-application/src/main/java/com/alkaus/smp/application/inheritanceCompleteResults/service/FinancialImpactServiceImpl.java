package com.alkaus.smp.application.inheritanceCompleteResults.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.FinancialImpactResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.YearImpactResult;
import com.alkaus.smp.application.utils.Constantes;
import com.alkaus.smp.application.utils.ServiceUtils;

/**
 * Implementation of @link FinancialImpactService
 * 
 * @author alkaus
 */
@Service
public class FinancialImpactServiceImpl implements FinancialImpactService {
	
	private static final BigDecimal ZERO = Constantes.ZERO;
    private static final BigDecimal FUNERAL_FEES = new BigDecimal("5000");
    private static final BigDecimal REVENUES_N1_FACTOR = new BigDecimal("0.60");
    private static final BigDecimal CHARGES_N1_FACTOR = new BigDecimal("0.80");

	@Override
	public ScenarioResult enrichImpact(CompleteResultsCommand cmd, ScenarioResult scenario) {
		if (scenario == null) return null;

        // Si scénario non applicable => on ne touche pas
        if (!scenario.relevant()) return scenario;

        BigDecimal incomes = ServiceUtils.bigDecimalNullOrZero(cmd.annualIncome());
        BigDecimal charges = ServiceUtils.bigDecimalNullOrZero(cmd.annualCharges());

        BigDecimal rights = ServiceUtils.bigDecimalNullOrZero(scenario.inheritanceRights());
        BigDecimal notary = ServiceUtils.bigDecimalNullOrZero(scenario.notaryFees());

        // Année N
        BigDecimal totalYearN = charges.add(FUNERAL_FEES).add(rights).add(notary);
        BigDecimal balanceYearN = incomes.subtract(totalYearN);

        YearImpactResult yearN = new YearImpactResult(
                scale(incomes),
                scale(charges),
                scale(FUNERAL_FEES),
                scale(rights),
                scale(notary),
                scale(totalYearN),
                scale(balanceYearN)
        );

        // Année N+1
        BigDecimal incomesYearN1 = incomes.multiply(REVENUES_N1_FACTOR);
        BigDecimal chargesN1 = charges.multiply(CHARGES_N1_FACTOR);
        BigDecimal totalYearN1 = chargesN1;
        BigDecimal balanceYearN1 = incomesYearN1.subtract(totalYearN1);

        YearImpactResult yearN1 = new YearImpactResult(
                scale(incomesYearN1),
                scale(chargesN1),
                ZERO,
                ZERO,
                ZERO,
                scale(totalYearN1),
                scale(balanceYearN1)
        );

        FinancialImpactResult impact = new FinancialImpactResult(yearN, yearN1);

        // On retourne un nouveau ScenarioResult avec impact mis à jour (record immuable)
        return new ScenarioResult(
                scenario.label(),
                scenario.deceased(),
                scenario.spouseOption(),
                scenario.inheritanceAsset(),
                scenario.liquidation(),
                scenario.mass(),
                scenario.heirs(),
                scenario.inheritanceRights(),
                scenario.notaryFees(),
                scenario.netTransmission(),
                scenario.transmissionRate(),
                impact,
                scenario.relevant()
        );
	}
	
	private BigDecimal scale(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }

}
