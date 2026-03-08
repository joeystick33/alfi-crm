package com.alkaus.smp.domain.succession;

import java.math.BigDecimal;
import java.util.List;

import com.alkaus.smp.domain.succession.util.RightReceivedEnum;

public record ScenarioAllocation(
		List<AllocationLine> lines
) {
	public record AllocationLine(
		String heirName,					
		RightReceivedEnum rightReceived,	
		BigDecimal quotaPercentage			// % on net asset
	) {}
}
