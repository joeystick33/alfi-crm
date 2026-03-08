package com.alkaus.smp.infra.fiscal;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import com.alkaus.smp.domain.repository.FiscalRulesRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

@Configuration
public class YamlFiscalRulesConfig {

	@Bean
	FiscalRulesRepository fiscalRulesRepository(
			@Value("classpath:fiscal-rules.yml") Resource yamlFile) {
		ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
		yamlMapper.findAndRegisterModules();
		return new YamlFiscalRulesRepositoryImpl(yamlMapper, yamlFile);
	}

	// ------------ Inner classes ---------------------
	record YamlFiscalRulesRoot(List<YamlFiscalRules> rules) {}
	
	record YamlFiscalRules (
			int year,
			Map<String, YamlAbatement> abatementsByLink,
			Map<String, YamlScale> scalesByLink,
         	YamlUsufructScales usufructScales,
         	BigDecimal abatementsPrincipalResidencePct,
         	BigDecimal lifeInsuranceBefore70GlobalAbatement,
         	BigDecimal lifeInsuranceAfter70ReintegrationTreshold,
         	BigDecimal disabilityAllowance,
         	Integer donationRecallYears,
         	BigDecimal lifeInsurance990IRate1,
         	BigDecimal lifeInsurance990IRate2,
         	BigDecimal lifeInsurance990IThreshold) {
	}
	
	record YamlAbatement(BigDecimal amount) {}
	
	record YamlScale(List<YamlSlice> slices) {}
	
	record YamlSlice (BigDecimal upperLimitInc, BigDecimal rate){}
	
	record YamlUsufructScales(Map<Integer, Integer> levels) {}

}
