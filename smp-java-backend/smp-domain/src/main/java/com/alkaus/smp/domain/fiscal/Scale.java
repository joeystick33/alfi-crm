package com.alkaus.smp.domain.fiscal;

import java.util.List;

public record Scale(
		List<Slice> slices) // ordonnés par borne croissante
{}
