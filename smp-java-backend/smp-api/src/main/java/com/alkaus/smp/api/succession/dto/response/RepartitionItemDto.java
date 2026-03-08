package com.alkaus.smp.api.succession.dto.response;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RepartitionItemDto(
		BigDecimal total,
		@JsonProperty("pourcentage")
		BigDecimal percentage
) {}
