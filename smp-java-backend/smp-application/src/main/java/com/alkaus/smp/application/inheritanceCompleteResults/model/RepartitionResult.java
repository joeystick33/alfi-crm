package com.alkaus.smp.application.inheritanceCompleteResults.model;

public record RepartitionResult(
		RepartitionItemResult realEstate,
		RepartitionItemResult financial,
		RepartitionItemResult professional,
		RepartitionItemResult other
) {}
