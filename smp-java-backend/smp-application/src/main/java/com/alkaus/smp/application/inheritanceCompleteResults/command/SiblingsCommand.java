package com.alkaus.smp.application.inheritanceCompleteResults.command;

import java.util.List;

public record SiblingsCommand(
		String firstName,
		boolean alive,
		List<String> childrenNames,
		String relationship // SIBLING (default) | GRANDPARENT | UNCLE_AUNT
) {
	/** Backward-compatible constructor (default relation = SIBLING) */
	public SiblingsCommand(String firstName, boolean alive, List<String> childrenNames) {
		this(firstName, alive, childrenNames, "SIBLING");
	}

	/** Backward-compatible constructor (no children) */
	public SiblingsCommand(String firstName, boolean alive) {
		this(firstName, alive, List.of(), "SIBLING");
	}
}
