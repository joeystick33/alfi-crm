package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.time.LocalDate;

public record MetadataResult(
		LocalDate studyDate,
		CustomerResult customer,
		AdvisorResult advisor,
		String matrimonialRegime,
		String maritalStatus
) {}
