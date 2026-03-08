package com.alkaus.smp.application.inheritanceCompleteResults.command;

public record PersonCommand(
		String firstName,
		String lastName,
		Integer age,
		String sex,
		boolean disabled,
		String soucheName // non-null if this person represents a predeceased child (souche)
) {
	/** Backward-compatible constructor for existing code */
	public PersonCommand(String firstName, String lastName, Integer age, String sex) {
		this(firstName, lastName, age, sex, false, null);
	}

	public PersonCommand(String firstName, String lastName, Integer age, String sex, boolean disabled) {
		this(firstName, lastName, age, sex, disabled, null);
	}
}
