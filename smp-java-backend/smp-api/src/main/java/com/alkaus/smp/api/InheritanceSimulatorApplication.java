package com.alkaus.smp.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.alkaus.smp")
public class InheritanceSimulatorApplication {

	public static void main(String[] args) {
		final Logger logger = LoggerFactory.getLogger(InheritanceSimulatorApplication.class);

		try {
			SpringApplication.run(InheritanceSimulatorApplication.class, args);
			logger.info("✅ Simulator launch with success !");
		} catch (Exception e) {
			logger.error("❌ Error at starting : {}", e.getMessage(), e);
			System.exit(1);
		}
	}
}
