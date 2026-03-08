package com.alkaus.smp.domain.succession;

import java.math.BigDecimal;

import com.alkaus.smp.domain.fiscal.RelationshipEnum;
import com.alkaus.smp.domain.succession.util.RightReceivedEnum;

public record HeirResult(
		String name,
        RelationshipEnum relationship,
        RightReceivedEnum taxReceived,                 // PP / US / NP
        BigDecimal quotaPercentage,
        BigDecimal grossValueReceived,         // “civil” value
        BigDecimal taxableValue,            // value after US/NP evaluation
        BigDecimal allowanceUsed,
        BigDecimal baseTaxableAfterAllowance,
        BigDecimal rights,
        boolean disabled                     // art. 779 II CGI
) {
	/** Backward-compatible constructor */
	public HeirResult(String name, RelationshipEnum relationship, RightReceivedEnum taxReceived,
			BigDecimal quotaPercentage, BigDecimal grossValueReceived, BigDecimal taxableValue,
			BigDecimal allowanceUsed, BigDecimal baseTaxableAfterAllowance, BigDecimal rights) {
		this(name, relationship, taxReceived, quotaPercentage, grossValueReceived, taxableValue,
				allowanceUsed, baseTaxableAfterAllowance, rights, false);
	}
}
