package tn.esprit.event.config;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

class EventSecurityRoleConverterTest {

    @Test
    void keycloakRoleConverter_shouldExtractRolesFromRealmAndResources() {
        SecurityConfig.KeycloakRoleConverter converter = new SecurityConfig.KeycloakRoleConverter();

        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .claim("realm_access", Map.of("roles", List.of("admin", "teacher")))
                .claim("resource_access", Map.of("jungle-web", Map.of("roles", List.of("tutor"))))
                .build();

        Collection<GrantedAuthority> authorities = converter.convert(jwt);

        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_admin")));
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_teacher")));
        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_tutor")));
    }

    @Test
    void keycloakRoleConverter_shouldIgnoreBlankRoles() {
        SecurityConfig.KeycloakRoleConverter converter = new SecurityConfig.KeycloakRoleConverter();

        Jwt jwt = Jwt.withTokenValue("test-token")
                .header("alg", "none")
                .claim("realm_access", Map.of("roles", List.of("", "  ", "admin")))
                .build();

        Collection<GrantedAuthority> authorities = converter.convert(jwt);

        assertTrue(authorities.stream().anyMatch(a -> a.getAuthority().equals("ROLE_admin")));
        assertTrue(authorities.stream().noneMatch(a -> a.getAuthority().equals("ROLE_")));
    }
}
