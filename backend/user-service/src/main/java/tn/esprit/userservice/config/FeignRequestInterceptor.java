package tn.esprit.userservice.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Feign Request Interceptor for propagating JWT tokens from Keycloak
 * across microservices for secure inter-service communication.
 */
@Component
public class FeignRequestInterceptor implements RequestInterceptor {

    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_TOKEN_PREFIX = "Bearer ";

    /**
     * Intercepts outgoing Feign requests and adds JWT token to Authorization header.
     * This ensures that the JWT token from the current request context is propagated
     * to downstream microservices.
     *
     * @param requestTemplate the request template to be modified
     */
    @Override
    public void apply(RequestTemplate requestTemplate) {
        String token = getJWTToken();
        if (token != null && !token.isEmpty()) {
            requestTemplate.header(AUTHORIZATION_HEADER, BEARER_TOKEN_PREFIX + token);
        }
    }

    /**
     * Extracts JWT token from the current security context.
     * The token is obtained from the Spring Security Authentication object
     * which is populated by the OAuth2 resource server configuration.
     *
     * @return JWT token string if available, null otherwise
     */
    private String getJWTToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        // Extract token from the principal
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof Jwt) {
            Jwt jwt = (Jwt) principal;
            return jwt.getTokenValue();
        }

        // Fallback for other authentication types
        if (authentication.getCredentials() instanceof String) {
            return (String) authentication.getCredentials();
        }

        return null;
    }
}
