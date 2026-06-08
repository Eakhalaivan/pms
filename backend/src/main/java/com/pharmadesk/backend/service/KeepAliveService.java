package com.pharmadesk.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Keep-alive service for Render free tier deployments.
 *
 * Render's free tier spins down web services after ~15 minutes of inactivity,
 * causing a 30–60 second cold-start delay for the next request.
 * This service pings the app's own health endpoint every 10 minutes to keep
 * the server warm and eliminate cold starts for end users.
 */
@Service
public class KeepAliveService {

    private static final Logger log = LoggerFactory.getLogger(KeepAliveService.class);

    @Value("${app.url:http://localhost:5173}")
    private String appUrl;

    @Value("${RENDER_EXTERNAL_URL:}")
    private String renderExternalUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Pings /actuator/health every 10 minutes (600,000 ms).
     * The RENDER_EXTERNAL_URL env variable is automatically set by Render
     * (e.g. https://your-app.onrender.com). Falls back gracefully on localhost.
     */
    @Scheduled(fixedRate = 600_000)
    public void keepAlive() {
        String baseUrl = resolveBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            log.debug("Keep-alive: no external URL configured, skipping ping.");
            return;
        }

        String healthUrl = baseUrl + "/actuator/health";
        try {
            String response = restTemplate.getForObject(healthUrl, String.class);
            log.debug("Keep-alive ping OK → {} | response: {}", healthUrl, response);
        } catch (Exception e) {
            log.warn("Keep-alive ping failed → {}: {}", healthUrl, e.getMessage());
        }
    }

    /**
     * Prefer the Render-provided external URL; fall back to APP_URL only if
     * it is a real HTTPS address (not localhost), to avoid pointless local pings.
     */
    private String resolveBaseUrl() {
        if (renderExternalUrl != null && !renderExternalUrl.isBlank()) {
            return renderExternalUrl;
        }
        if (appUrl != null && appUrl.startsWith("https://")) {
            return appUrl;
        }
        return null;
    }
}
