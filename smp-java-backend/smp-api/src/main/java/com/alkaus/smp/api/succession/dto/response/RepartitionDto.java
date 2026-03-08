package com.alkaus.smp.api.succession.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record RepartitionDto(
		@JsonProperty("immobilier")
		RepartitionItemDto realEstate,

		@JsonProperty("financier")
		RepartitionItemDto financial,

		@JsonProperty("professionnel")
		RepartitionItemDto professional,

		@JsonProperty("autre")
		RepartitionItemDto other
) {}
