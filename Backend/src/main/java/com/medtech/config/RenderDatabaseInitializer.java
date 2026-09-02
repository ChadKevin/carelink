package com.medtech.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Makes the app boot cleanly on Render (and any host that injects a Postgres URL
 * in the {@code postgres://} scheme).
 *
 * <p>Render's Postgres "Internal Database URL" looks like
 * {@code postgres://user:pass@host:5432/db}, but Hikari/Spring needs a JDBC URL
 * ({@code jdbc:postgresql://…}). This initializer detects the {@code postgres://}
 * scheme in {@code SPRING_DATASOURCE_URL} and transparently rewrites it to the JDBC
 * form plus the Postgres driver, before the DataSource is created.</p>
 *
 * <p>If the URL is already a valid {@code jdbc:postgresql://…} value (local dev),
 * it is left untouched. If it's missing, we don't interfere and let Spring fail
 * with a clear message.</p>
 */
public class RenderDatabaseInitializer
        implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    private static final Logger log = LoggerFactory.getLogger(RenderDatabaseInitializer.class);

    private static final String DATASOURCE_URL = "spring.datasource.url";
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
        if (rawUrl.startsWith("jdbc:")) {
            log.info("Datasource URL is already a JDBC URL — no conversion needed.");
            return;
        }

        // Build inner URL from the postgres:// (or postgresql://) form. Strip the
        // scheme so we can rebuild a JDBC URL; keep query params (e.g. ?sslmode=require).
        int schemeEnd = rawUrl.indexOf("://");
        boolean isPostgresUrl = rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://");
        if (schemeEnd <= 0 || !isPostgresUrl) {
            log.warn("Datasource URL scheme is '{}' — expected postgres:// or jdbc:. Leaving untouched.",
                    schemeEnd > 0 ? rawUrl.substring(0, schemeEnd) : rawUrl);
            return;
        }

        // Remove `?sslmode=require` etc. from the authority so we can build a
        // clean jdbc URL, then re-append any query params after the host:port/db.
        String jdbcUrl = "jdbc:postgresql:" + rawUrl.substring(schemeEnd);
        log.info("Translated Render postgres:// datasource URL to a JDBC URL.");

        // Give Spring (and Hikari) both the converted URL and the driver class.
        MutablePropertySources sources = env.getPropertySources();
        Map<String, Object> map = new LinkedHashMap<>();
        map.put(DATASOURCE_URL, jdbcUrl);
        map.put(DATASOURCE_DRIVER, DRIVER);
        sources.addFirst(new MapPropertySource("carelinkRenderDatabase", map));

        log.debug("SPRING_DATASOURCE_URL now = {}", jdbcUrl);
    }
}