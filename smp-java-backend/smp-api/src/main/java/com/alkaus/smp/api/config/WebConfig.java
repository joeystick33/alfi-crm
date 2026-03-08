package com.alkaus.smp.api.config;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void configureContentNegotiation(@NonNull ContentNegotiationConfigurer configurer) {
		configurer
				.favorParameter(false)
				.ignoreAcceptHeader(false)
				.defaultContentType(MediaType.APPLICATION_JSON);
	}

	@Override
	public void extendMessageConverters(@NonNull List<HttpMessageConverter<?>> converters) {
		// Remove any YAML converters so JSON is always used for REST responses
		converters.removeIf(c -> {
			String name = c.getClass().getSimpleName().toLowerCase();
			return name.contains("yaml");
		});
		// Ensure Jackson JSON converter is first in the list
		for (int i = 0; i < converters.size(); i++) {
			if (converters.get(i) instanceof MappingJackson2HttpMessageConverter) {
				HttpMessageConverter<?> jsonConverter = converters.remove(i);
				converters.add(0, jsonConverter);
				break;
			}
		}
	}
}
