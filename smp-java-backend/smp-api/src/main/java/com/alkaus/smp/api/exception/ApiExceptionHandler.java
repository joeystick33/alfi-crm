package com.alkaus.smp.api.exception;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Gestion globale des exceptions REST
 * Traduit les exceptions métiers en status HTTP cohérents
 * 
 * @author Alkaus
 */
@RestControllerAdvice
public class ApiExceptionHandler {
	
	@ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
	public Map<String, String> handleIllegalArgument(IllegalArgumentException ex) {
		return Map.of(
			"error", "BAD_REQUEST",
			"message", ex.getMessage()
		);
	}
	
	@ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, String> handleIllegalState(IllegalStateException ex) {
        return Map.of(
            "error", "CONFLICT",
            "message", ex.getMessage()
        );
    }
}
