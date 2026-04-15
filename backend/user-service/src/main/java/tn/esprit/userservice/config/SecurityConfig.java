package tn.esprit.userservice.config;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        jwtConverter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());

        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                    .requestMatchers("/api/users/signup").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter)))
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    static class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

        @Override
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            List<GrantedAuthority> authorities = new ArrayList<>();

            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null) {
                Object rolesObj = realmAccess.get("roles");
                if (rolesObj instanceof Collection<?> roles) {
                    addAuthorities(authorities, roles);
                }
            }

            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess != null) {
                for (Object clientAccessObj : resourceAccess.values()) {
                    if (clientAccessObj instanceof Map<?, ?> clientAccessMap) {
                        Object rolesObj = clientAccessMap.get("roles");
                        if (rolesObj instanceof Collection<?> roles) {
                            addAuthorities(authorities, roles);
                        }
                    }
                }
            }

            return authorities;
        }

        private void addAuthorities(List<GrantedAuthority> authorities, Collection<?> roles) {
            Set<String> seen = new java.util.HashSet<>();
            for (Object roleObj : roles) {
                if (!(roleObj instanceof String role) || role.isBlank()) {
                    continue;
                }
                String normalized = role.trim();
                String authority = "ROLE_" + normalized;
                if (seen.add(authority)) {
                    authorities.add(new SimpleGrantedAuthority(authority));
                }
            }
        }
    }
}
