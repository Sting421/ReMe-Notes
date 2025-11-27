package com.ReMe.ReMe.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * Application configuration class that loads properties from application.properties
 * and provides them as beans for dependency injection.
 */
@Configuration
public class AppConfig {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private Long jwtExpiration;

    /**
     * Get the JWT secret key.
     * 
     * @return the JWT secret key
     */
    public String getJwtSecret() {
        return jwtSecret;
    }

    /**
     * Get the JWT expiration time in milliseconds.
     * 
     * @return the JWT expiration time
     */
    public Long getJwtExpiration() {
        return jwtExpiration;
    }
}
