package tn.esprit.userservice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.keycloak")
public record KeycloakProperties(
        String serverUrl,
        String realm,
        String clientId,
        String clientSecret,
        String adminRealm,
        String adminClientId,
        String adminClientSecret,
        String adminUsername,
        String adminPassword
) {
}
