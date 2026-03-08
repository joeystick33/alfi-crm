package com.alkaus.smp.domain.fiscal;

import java.util.NavigableMap;
import java.util.TreeMap;


/**
 * Pourcentages d'usufruit selon l'âge de l'usufruitier au jour de la succession
 * 
 * @author alkaus
 */
public class UsufructScales {

	private final NavigableMap<Integer, Integer> maxAgeInclusToPct = new TreeMap<>();

	public UsufructScales addRange(int maxAgeInclus, int pctUsufruit) {
		maxAgeInclusToPct.put(maxAgeInclus, pctUsufruit);
		return this;
	}

	/**
	 * Retourne le % d’usufruit (0..100) pour un âge donné.
	 * 
	 * @param age
	 * @return
	 */
	public int pctForAge(int age) {
		var entry = maxAgeInclusToPct.ceilingEntry(age);
		return entry != null ? entry.getValue() : maxAgeInclusToPct.lastEntry().getValue();
	}

}
