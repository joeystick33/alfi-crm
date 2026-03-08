package com.alkaus.smp.application.inheritanceCompleteResults.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.AdvisorResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.CustomerResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.MetadataResult;

@Service
public class MetadataServiceImpl implements MetadataService {

	@Override
	public MetadataResult build(CompleteResultsCommand cmd) {
		var clientCmd = cmd.client();
		var advisorCmd = cmd.advisor();
		
		return new MetadataResult(LocalDate.now(), 
				new CustomerResult(
						clientCmd.firstName(),
						clientCmd.lastName(),
						clientCmd.age(),
						clientCmd.sex()
				),
				advisorCmd == null 
					? new AdvisorResult(null, null, null)
					: new AdvisorResult(advisorCmd.name(), advisorCmd.firm(), advisorCmd.email()),
					normalizeMatrimonialRegime(cmd.matrimonialRegime()),
					normalizeMaritalStatus(cmd.maritalStatus())
		);
	}

	/**
	 * Normalize the matrimonialRegime
	 * 
	 * @param matrimonialRegime
	 * @return normalize String
	 */
	private String normalizeMatrimonialRegime(String matrimonialRegime) {
		 if (matrimonialRegime == null || matrimonialRegime.isBlank()) return null;
	        String s = matrimonialRegime.trim().toLowerCase();
	        return switch (s) {
	            case "communaute", "communauté", "communaute reduite", "communauté réduite" ->
	                    "Communauté réduite aux acquêts";
	            case "separation", "séparation" -> "Séparation de biens";
	            case "participation" -> "Participation aux acquêts";
	            case "communaute universelle", "communauté universelle" -> "Communauté universelle";
	            default -> matrimonialRegime.trim();
	        };
	}

	/**
	 * Normalize the maritalStatus
	 * 
	 * @param maritalStatus
	 * @return normalize String
	 */
	private String normalizeMaritalStatus(String maritalStatus) {
		if (maritalStatus == null || maritalStatus.isBlank()) return null;
        String s = maritalStatus.trim().toLowerCase();
        return switch (s) {
            case "marie", "marié", "mariée" -> "Marié(e)";
            case "pacse", "pacsé", "pacsée" -> "Pacsé(e)";
            case "celibataire", "célibataire" -> "Célibataire";
            case "divorce", "divorcé", "divorcée" -> "Divorcé(e)";
            case "veuf", "veuve" -> "Veuf(ve)";
            default -> maritalStatus.trim();
        };
	}

}
