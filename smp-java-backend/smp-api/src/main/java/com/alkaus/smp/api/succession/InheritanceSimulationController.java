package com.alkaus.smp.api.succession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.alkaus.smp.api.succession.dto.request.InheritanceCompleteRequestDto;
import com.alkaus.smp.api.succession.dto.response.InheritanceCompleteResponseDto;
import com.alkaus.smp.api.succession.mapper.InheritanceCompleteMapper;
import com.alkaus.smp.application.inheritanceCompleteResults.model.CompleteResultsResult;
import com.alkaus.smp.application.inheritanceCompleteResults.service.InheritanceSimulationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class InheritanceSimulationController {

	private static final Logger logger = LoggerFactory.getLogger(InheritanceSimulationController.class);

	private final InheritanceSimulationService inheritanceSimulationService;
	private final InheritanceCompleteMapper inheritanceCompleteMapper;

	public InheritanceSimulationController(InheritanceSimulationService inheritanceSimulationService,
			InheritanceCompleteMapper inheritanceCompleteMapper) {
		this.inheritanceSimulationService = inheritanceSimulationService;
		this.inheritanceCompleteMapper = inheritanceCompleteMapper;
	}

	/**
	 * Add swagger : Endpoint for completeResult
	 * 
	 * @param request
	 * @return
	 */
	@PostMapping(value = "/resultats-complets", produces = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<InheritanceCompleteResponseDto> inheritanceCompleteResults(
			@Valid @RequestBody InheritanceCompleteRequestDto request) {

		try {
			var command = inheritanceCompleteMapper.toCommand(request);

			// Scenario A: client dies first (standard)
			CompleteResultsResult result = inheritanceSimulationService.calculateCompleteResults(command);
			InheritanceCompleteResponseDto response = inheritanceCompleteMapper.toResponse(result);

			// Mode couple: compute Scenario B (spouse dies first) and embed in response
			if (Boolean.TRUE.equals(request.modeCouple()) && command.spouse() != null) {
				var inverseCommand = inheritanceCompleteMapper.toInverseCommand(command);
				if (inverseCommand != null) {
					CompleteResultsResult inverseResult = inheritanceSimulationService.calculateCompleteResults(inverseCommand);
					InheritanceCompleteResponseDto inverseResponse = inheritanceCompleteMapper.toResponse(inverseResult);
					// Wrap both into final response with resultatInverse
					response = new InheritanceCompleteResponseDto(
							response.metadata(), response.heritage(),
							response.scenario1(), response.scenario2(),
							response.ddvScenarios(), response.legalScenarios(),
							response.optimisations(), response.alerts(),
							response.fiscalDetails(), inverseResponse);
				}
			}

			return ResponseEntity.ok(response);
		} catch (Exception e) {
			if (e instanceof IllegalArgumentException) {
				logger.warn("Requête succession invalide: {}", e.getMessage());
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
			}
			logger.error("Erreur calcul succession", e);
			throw e;
		}

	}

}
