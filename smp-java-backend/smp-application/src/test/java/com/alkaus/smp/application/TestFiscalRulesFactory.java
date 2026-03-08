package com.alkaus.smp.application;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import com.alkaus.smp.domain.fiscal.Abatement;
import com.alkaus.smp.domain.fiscal.FiscalRules;
import com.alkaus.smp.domain.fiscal.RelationshipEnum;
import com.alkaus.smp.domain.fiscal.Scale;
import com.alkaus.smp.domain.fiscal.Slice;
import com.alkaus.smp.domain.fiscal.UsufructScales;

/**
 * Builds real FiscalRules matching fiscal-rules.yml 2026 for tests — no mocks.
 */
public final class TestFiscalRulesFactory {

	private TestFiscalRulesFactory() {}

	public static FiscalRules rules2026() {
		Map<RelationshipEnum, Abatement> abatements = new EnumMap<>(RelationshipEnum.class);
		abatements.put(RelationshipEnum.DIRECT_LINE, new Abatement(new BigDecimal("100000")));
		abatements.put(RelationshipEnum.SIBLINGS, new Abatement(new BigDecimal("15932")));
		abatements.put(RelationshipEnum.NIECE_NEPHEW, new Abatement(new BigDecimal("7967")));
		abatements.put(RelationshipEnum.OTHERS, new Abatement(new BigDecimal("1594")));

		Map<RelationshipEnum, Scale> scales = new EnumMap<>(RelationshipEnum.class);
		scales.put(RelationshipEnum.DIRECT_LINE, new Scale(List.of(
				new Slice(new BigDecimal("8072"), new BigDecimal("0.05")),
				new Slice(new BigDecimal("12109"), new BigDecimal("0.10")),
				new Slice(new BigDecimal("15932"), new BigDecimal("0.15")),
				new Slice(new BigDecimal("552324"), new BigDecimal("0.20")),
				new Slice(new BigDecimal("902838"), new BigDecimal("0.30")),
				new Slice(new BigDecimal("1805677"), new BigDecimal("0.40")),
				new Slice(null, new BigDecimal("0.45"))
		)));
		scales.put(RelationshipEnum.SIBLINGS, new Scale(List.of(
				new Slice(new BigDecimal("24430"), new BigDecimal("0.35")),
				new Slice(null, new BigDecimal("0.45"))
		)));
		scales.put(RelationshipEnum.NIECE_NEPHEW, new Scale(List.of(
				new Slice(null, new BigDecimal("0.55"))
		)));
		scales.put(RelationshipEnum.OTHERS, new Scale(List.of(
				new Slice(null, new BigDecimal("0.60"))
		)));

		UsufructScales usufruct = new UsufructScales();
		usufruct.addRange(20, 90).addRange(30, 80).addRange(40, 70).addRange(50, 60)
				.addRange(60, 50).addRange(70, 40).addRange(80, 30).addRange(90, 20).addRange(91, 10);

		return new FiscalRules(2026, abatements, scales, usufruct,
				new BigDecimal("0.20"),
				new BigDecimal("152500"),
				new BigDecimal("30500"),
				new BigDecimal("159325"),
				15,
				new BigDecimal("0.20"),
				new BigDecimal("0.3125"),
				new BigDecimal("700000"));
	}
}
