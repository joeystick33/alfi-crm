package com.alkaus.smp.application.inheritanceCompleteResults.service;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.MetadataResult;

/**
 * Interface for MetadataService
 * 
 * @author alkaus
 */
public interface MetadataService {

	/**
	 * Build the metadata
	 * 
	 * @param cmd
	 * @return metadataResult
	 */
	MetadataResult build(CompleteResultsCommand cmd);
}
