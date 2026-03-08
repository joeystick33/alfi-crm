package com.alkaus.smp.infra.fiscal;

import java.io.IOException;
import java.io.InputStream;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.core.io.Resource;

import com.alkaus.smp.domain.fiscal.Abatement;
import com.alkaus.smp.domain.fiscal.FiscalRules;
import com.alkaus.smp.domain.fiscal.RelationshipEnum;
import com.alkaus.smp.domain.fiscal.Scale;
import com.alkaus.smp.domain.fiscal.Slice;
import com.alkaus.smp.domain.fiscal.UsufructScales;
import com.alkaus.smp.domain.repository.FiscalRulesRepository;
import com.alkaus.smp.infra.fiscal.YamlFiscalRulesConfig.YamlAbatement;
import com.alkaus.smp.infra.fiscal.YamlFiscalRulesConfig.YamlFiscalRules;
import com.alkaus.smp.infra.fiscal.YamlFiscalRulesConfig.YamlFiscalRulesRoot;
import com.alkaus.smp.infra.fiscal.YamlFiscalRulesConfig.YamlScale;
import com.alkaus.smp.infra.fiscal.YamlFiscalRulesConfig.YamlUsufructScales;
import com.fasterxml.jackson.databind.ObjectMapper;

public class YamlFiscalRulesRepositoryImpl implements FiscalRulesRepository {

	private static final String DEFAULT_RESOURCE = "fiscal-rules.yml";

	private final Map<Integer, FiscalRules> rulesByYear;

	// Constructeur package-private utile pour les tests avec un autre fichier si
	// besoin
	YamlFiscalRulesRepositoryImpl(ObjectMapper yamlObjectMapper, Resource yamlFile) {
		this.rulesByYear = loadFromYaml(yamlObjectMapper, yamlFile);
	}

	@Override
	public Optional<FiscalRules> findByYear(int year) {
		return Optional.ofNullable(rulesByYear.get(year));
	}

	/**
	 * Upload Yaml File
	 * 
	 * @param resourcePath
	 * @return
	 */
	private Map<Integer, FiscalRules> loadFromYaml(ObjectMapper mapper, Resource yamlFile) {

		try (InputStream is = yamlFile.getInputStream()) {

			YamlFiscalRulesRoot root = mapper.readValue(is, YamlFiscalRulesRoot.class);
			return root.rules().stream().collect(Collectors.toMap(YamlFiscalRules::year, this::toFiscalRules));
		} catch (IOException e) {
			System.out.println(e.getMessage());
			throw new IllegalStateException("Error on loading file : " + yamlFile.getFilename());
		}
	}

	/**
	 * YamlFiscalRules to domain model FiscalRules
	 * 
	 * @param yaml
	 * @return fiscalRules
	 */
	private FiscalRules toFiscalRules(YamlFiscalRules yaml) {
		Map<RelationshipEnum, Abatement> abatementsByLink = toAbatementByLink(yaml.abatementsByLink());
		Map<RelationshipEnum, Scale> scalesByLink = toScaleByLink(yaml.scalesByLink());
		UsufructScales usufructScales = toUsufructScales(yaml.usufructScales());

		return new FiscalRules(yaml.year(), abatementsByLink, scalesByLink, usufructScales,
				yaml.abatementsPrincipalResidencePct(), yaml.lifeInsuranceBefore70GlobalAbatement(),
				yaml.lifeInsuranceAfter70ReintegrationTreshold(),
				yaml.disabilityAllowance(),
				yaml.donationRecallYears() != null ? yaml.donationRecallYears() : 15,
				yaml.lifeInsurance990IRate1(),
				yaml.lifeInsurance990IRate2(),
				yaml.lifeInsurance990IThreshold());
	}

	/**
	 * YamlAbatement to abatement by link
	 * 
	 * @param source
	 * @return
	 */
	private Map<RelationshipEnum, Abatement> toAbatementByLink(Map<String, YamlAbatement> source) {
		Map<RelationshipEnum, Abatement> result = new EnumMap<>(RelationshipEnum.class);
		if (source == null)
			return result;

		for (Map.Entry<String, YamlAbatement> entry : source.entrySet()) {
			String key = entry.getKey(); // ex: "DIRECT_LINE"
			YamlAbatement yamlAbatement = entry.getValue();

			RelationshipEnum link = RelationshipEnum.valueOf(key); // <-- IMPACT DIRECT DU NOUVEL ENUM
			Abatement abatement = new Abatement(yamlAbatement.amount());
			result.put(link, abatement);
		}
		return result;
	}

	/**
	 * YamlScale to scale by link
	 * 
	 * @param source
	 * @return
	 */
	private Map<RelationshipEnum, Scale> toScaleByLink(Map<String, YamlScale> source) {
		Map<RelationshipEnum, Scale> result = new EnumMap<>(RelationshipEnum.class);
		if (source == null)
			return result;

		for (Map.Entry<String, YamlScale> entry : source.entrySet()) {
			String key = entry.getKey(); // ex: "DIRECT_LINE"
			YamlScale yamlScale = entry.getValue();

			RelationshipEnum link = RelationshipEnum.valueOf(key); // <-- IMPACT DIRECT
			Scale scale = toScale(yamlScale);
			result.put(link, scale);
		}
		return result;
	}

	/**
	 * YamlScale to Scale
	 * 
	 * @param yScale
	 * @return
	 */
	private Scale toScale(YamlScale yScale) {
		List<Slice> slices = List.of();
		if (yScale != null && yScale.slices() != null) {
			slices = yScale.slices().stream().map(t -> new Slice(t.upperLimitInc(), t.rate())).toList();
		}
		return new Scale(slices);
	}

	/**
	 * YamlUsufructScales to UsufructScales
	 * 
	 * @param yUsufructScales
	 * @return
	 */
	private UsufructScales toUsufructScales(YamlUsufructScales yUsufructScales) {
		UsufructScales result = new UsufructScales();
		if (yUsufructScales == null || yUsufructScales.levels() == null) {
			return result;
		}
		yUsufructScales.levels().entrySet().stream().sorted(Map.Entry.comparingByKey())
				.forEach(e -> result.addRange(e.getKey(), e.getValue()));
		return result;
	}

}
