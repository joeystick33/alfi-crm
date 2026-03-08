package com.alkaus.smp.api.succession;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/pdf")
@CrossOrigin(origins = "*")
public class PdfController {

	private static final Logger logger = LoggerFactory.getLogger(PdfController.class);

	private final RestTemplate restTemplate;

	@Value("${pdf.service.url:http://localhost:3001}")
	private String pdfServiceUrl;

	public PdfController() {
		this.restTemplate = new RestTemplate();
	}

	/**
	 * Génère le PDF du diagnostic successoral en délégant au microservice Node.js (Puppeteer).
	 * Le frontend envoie les données complètes de simulation, le backend les transmet au service PDF
	 * et retourne le buffer PDF en réponse.
	 *
	 * @param data Données complètes de la simulation (même structure que /resultats-complets + champs auxiliaires)
	 * @return Le fichier PDF en bytes
	 */
	@PostMapping(value = "/diagnostic", produces = MediaType.APPLICATION_PDF_VALUE)
	public ResponseEntity<byte[]> generateDiagnostic(@RequestBody Map<String, Object> data) {
		long start = System.currentTimeMillis();
		logger.info("[PDF] Requête de génération PDF reçue");

		try {
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);

			HttpEntity<Map<String, Object>> request = new HttpEntity<>(data, headers);

			ResponseEntity<byte[]> pdfResponse = restTemplate.exchange(
					pdfServiceUrl + "/generate/diagnostic-successoral",
					HttpMethod.POST,
					request,
					byte[].class);

			byte[] pdfBytes = pdfResponse.getBody();

			if (pdfBytes == null || pdfBytes.length == 0) {
				logger.error("[PDF] Le service PDF a retourné un buffer vide");
				return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
			}

			// Extraire le nom du client pour le nom de fichier
			String clientName = extractClientName(data);
			String dateStr = java.time.LocalDate.now().toString();
			String filename = String.format("diagnostic-successoral-%s-%s.pdf", clientName, dateStr);

			HttpHeaders responseHeaders = new HttpHeaders();
			responseHeaders.setContentType(MediaType.APPLICATION_PDF);
			responseHeaders.setContentDisposition(
					ContentDisposition.attachment().filename(filename).build());

			long elapsed = System.currentTimeMillis() - start;
			logger.info("[PDF] PDF généré en {}ms — {} octets — {}", elapsed, pdfBytes.length, filename);

			return new ResponseEntity<>(pdfBytes, responseHeaders, HttpStatus.OK);

		} catch (Exception e) {
			logger.error("[PDF] Erreur lors de la génération du PDF", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(("Erreur génération PDF: " + e.getMessage()).getBytes());
		}
	}

	@SuppressWarnings("unchecked")
	private String extractClientName(Map<String, Object> data) {
		try {
			Map<String, Object> metadata = (Map<String, Object>) data.get("metadata");
			if (metadata != null) {
				Map<String, Object> client = (Map<String, Object>) metadata.get("client");
				if (client != null) {
					String prenom = (String) client.getOrDefault("prenom", "");
					String nom = (String) client.getOrDefault("nom", "");
					return (prenom + "-" + nom).trim().replaceAll("\\s+", "-");
				}
			}
		} catch (Exception e) {
			logger.warn("[PDF] Impossible d'extraire le nom du client", e);
		}
		return "client";
	}
}
