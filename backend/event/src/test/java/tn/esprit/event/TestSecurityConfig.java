package tn.esprit.event;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

@TestConfiguration
public class TestSecurityConfig {

    @Bean
    JwtDecoder jwtDecoder() {
        JwtDecoder decoder = Mockito.mock(JwtDecoder.class);
        when(decoder.decode(anyString())).thenAnswer(invocation -> Jwt.withTokenValue(invocation.getArgument(0))
                .header("alg", "none")
                .claim("sub", "test-user")
                .claim("realm_access", Map.of("roles", java.util.List.of("admin")))
                .issuedAt(Instant.now().minusSeconds(60))
                .expiresAt(Instant.now().plusSeconds(3600))
                .build());
        return decoder;
    }
}
