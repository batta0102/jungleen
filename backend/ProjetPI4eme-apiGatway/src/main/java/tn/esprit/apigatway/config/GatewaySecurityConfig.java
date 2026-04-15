package tn.esprit.apigatway.config;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverterAdapter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableReactiveMethodSecurity
public class GatewaySecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());

        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .pathMatchers("/actuator/**").permitAll()
                        .pathMatchers("/admin/**").hasAnyRole("admin", "ADMIN", "teacher", "TEACHER", "tutor", "TUTOR", "tuteur")
                        .pathMatchers("/api/users/signup").permitAll()
                        .pathMatchers(HttpMethod.GET,
                                "/api/events/**",
                                "/api/venues/**",
                                "/api/products/**",
                                "/api/resources/**",
                                "/api/reviews/**",
                                "/api/recommendations/**",
                                "/api/games/**",
                                "/api/badges/**",
                                "/api/avatars/**",
                                "/api/skins/**",
                                "/api/crosswords/**",
                                "/api/candidature/**",
                                "/api/poste/**",
                                "/api/qcms/**",
                                "/api/questions/**",
                                "/api/certification/**",
                                "/api/certificat/**",
                                "/api/interview/**",
                                "/api/analytics/predict-attendance/**",
                                "/api/analytics/trends/**",
                                "/api/analytics/top-events/**",
                                "/api/analytics/dashboard/**")
                        .permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/events/optimize-schedule").permitAll()
                        .pathMatchers(HttpMethod.POST, "/api/events/*/registrations").permitAll()
                        .pathMatchers(HttpMethod.POST,
                                "/api/events/**",
                                "/api/venues/**",
                                "/api/analytics/admission/**")
                        .hasAnyRole("admin", "ADMIN", "teacher", "TEACHER", "tutor", "TUTOR", "tuteur")
                        .pathMatchers(HttpMethod.PUT,
                                "/api/events/**",
                                "/api/venues/**",
                                "/api/analytics/admission/**")
                        .hasAnyRole("admin", "ADMIN", "teacher", "TEACHER", "tutor", "TUTOR", "tuteur")
                        .pathMatchers(HttpMethod.DELETE,
                                "/api/events/**",
                                "/api/venues/**")
                        .hasAnyRole("admin", "ADMIN", "teacher", "TEACHER", "tutor", "TUTOR", "tuteur")
                        .anyExchange().authenticated())
                                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt ->
                                                jwt.jwtAuthenticationConverter(new ReactiveJwtAuthenticationConverterAdapter(jwtAuthenticationConverter))))
                .build();
    }

        static class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

                @Override
                public Collection<GrantedAuthority> convert(Jwt jwt) {
                        List<GrantedAuthority> authorities = new ArrayList<>();
                        Set<String> seen = new HashSet<>();

                        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
                        if (realmAccess != null) {
                                Object rolesObj = realmAccess.get("roles");
                                if (rolesObj instanceof Collection<?> roles) {
                                        addAuthorities(authorities, seen, roles);
                                }
                        }

                        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
                        if (resourceAccess != null) {
                                for (Object clientAccessObj : resourceAccess.values()) {
                                        if (clientAccessObj instanceof Map<?, ?> clientAccessMap) {
                                                Object rolesObj = clientAccessMap.get("roles");
                                                if (rolesObj instanceof Collection<?> roles) {
                                                        addAuthorities(authorities, seen, roles);
                                                }
                                        }
                                }
                        }

                        return authorities;
                }

                private void addAuthorities(List<GrantedAuthority> authorities, Set<String> seen, Collection<?> roles) {
                        for (Object roleObj : roles) {
                                if (!(roleObj instanceof String role) || role.isBlank()) {
                                        continue;
                                }
                                String authority = "ROLE_" + role.trim();
                                if (seen.add(authority)) {
                                        authorities.add(new SimpleGrantedAuthority(authority));
                                }
                        }
                }
        }
}
