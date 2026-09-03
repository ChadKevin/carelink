package com.medtech.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Makes the app boot cleanly on Render (and any host that injects a Postgres URL
 * in the {@code postgres://} scheme).
 *
 * <p>Render's Postgres URL looks like
 * {@code postgres://user:password@host:5432/db}. The Postgres JDBC driver does
 * not support credentials in the URL authority, which causes it to fail parsing
 * and fall back to {@code localhost:5432}. This initializer extracts the host,
 * port, database, and credentials using {@link URI}, building a clean
 * {@code jdbc:postgresql://host:port/db} URL and injecting the username and
 * password.</p>
 */
public class RenderDatabaseInitializer
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final Logger log = LoggerFactory.getLogger(RenderDatabaseInitializer.class);

    private static final String DATASOURCE_URL = "spring.datasource.url";
    private static final String DATASOURCE_USERNAME = "spring.datasource.username";
    private static final String DATASOURCE_PASSWORD = "spring.datasource.password";
    private static final String DATASOURCE_DRIVER = "spring.datasource.driver-class-name";
    private static final String DRIVER = "org.postgresql.Driver";

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        ConfigurableEnvironment env = applicationContext.getEnvironment();
        String rawUrl = env.getProperty(DATASOURCE_URL);

        if (rawUrl == null || rawUrl.isBlank()) {
            log.debug("SPRING_DATASOURCE_URL is not set — leaving datasource configuration untouched.");
            return;
        }

        rawUrl = rawUrl.trim();

        // If already a clean JDBC URL without embedded user:pass@, leave it untouched
        if (rawUrl.startsWith("jdbc:") && !rawUrl.contains("@")) {
            log.info("Datasource URL is already a clean JDBC URL — no conversion needed.");
            return;
        }

        String toParse = rawUrl;
        if (toParse.startsWith("jdbc:")) {
            toParse = toParse.substring("jdbc:".length());
        }

        boolean isPostgresUrl = toParse.startsWith("postgres://") || toParse.startsWith("postgresql://");
        if (!isPostgresUrl) {
            log.warn("Datasource URL is neither postgres:// nor jdbc:. Leaving untouched: {}", rawUrl);
            return;
        }

        try {
            // Standardize scheme to postgres:// for java.net.URI
            String uriString = toParse.startsWith("postgresql://")
                    ? "postgres://" + toParse.substring("postgresql://".length())
                    : toParse;

            URI uri = URI.create(uriString);

            String host = uri.getHost();
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String path = uri.getPath() != null ? uri.getPath() : "";
            String query = uri.getQuery();

            StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                    .append(host)
                    .append(":")
                    .append(port)
                    .append(path);

            if (query != null && !query.isBlank()) {
                jdbcUrl.append("?").append(query);
            }

            MutablePropertySources sources = env.getPropertySources();
            Map<String, Object> map = new LinkedHashMap<>();
            map.put(DATASOURCE_URL, jdbcUrl.toString());
            map.put(DATASOURCE_DRIVER, DRIVER);

            // Extract credentials from userInfo if present (user:password)
            String userInfo = uri.getUserInfo();
            if (userInfo != null && !userInfo.isBlank()) {
                String[] parts = userInfo.split(":", 2);
                if (parts.length > 0 && !parts[0].isBlank()) {
                    map.put(DATASOURCE_USERNAME, parts[0]);
                }
                if (parts.length > 1) {
                    map.put(DATASOURCE_PASSWORD, parts[1]);
                }
            }

            sources.addFirst(new MapPropertySource("carelinkRenderDatabase", map));
            log.info("Successfully translated Render postgres URL to clean JDBC URL (host: {}:{})", host, port);
        } catch (Exception e) {
            log.error("Failed to parse Render database URL: {}", e.getMessage(), e);
        }
    }
}