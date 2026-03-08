package com.alkaus.smp.domain.succession.util;

import java.util.Arrays;

import lombok.AllArgsConstructor;

@AllArgsConstructor
public enum StatutMatrimonialEnum {
	CELIBATAIRE("célibataire"),
	CONCUBINAGE("concubinage"),
	DIVORCE( "divorcé"),
	PACSE("pacsé"),
	MARIE("marié"),
	VEUVE("veuf");
	
	private String label;
	
	public String getLabel() {
		return label;
	}
	
	public StatutMatrimonialEnum contains(String l) {
		return Arrays.stream(StatutMatrimonialEnum.values())
				.filter(e -> e.label.equals(l))
				.findFirst()
				.orElseThrow(() -> new IllegalStateException(String.format("Unsupported code %s.", l)));
	}
	
}
