package tn.esprit.ressources.config;


import java.util.ArrayList;
import java.util.Arrays;
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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:4200"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        jwtConverter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/api/users/signup").permitAll()
                        .requestMatchers("/debug/**").permitAll()
                        // Allow public access to read products (browsing)
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/reviews/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/resources/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/recommendations/**").permitAll()
                        .requestMatchers("/me").authenticated()
                        .requestMatchers("/orders/addOrder").authenticated()  // Allow any authenticated user
                        .requestMatchers("/orders/**").authenticated()         // Other order endpoints protected by @PreAuthorize
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter)));

        return http.build();
    }

    static class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

        @Override
        public Collection<GrantedAuthority> convert(Jwt jwt) {
            List<GrantedAuthority> authorities = new ArrayList<>();

            // Extract realm roles
            Map<String, Object> realmAccess = jwt.getClaim("realm_access");
            if (realmAccess != null) {
                Object rolesObj = realmAccess.get("roles");
                if (rolesObj instanceof Collection<?> roles) {
                    System.out.println("🔐 [KeycloakRoleConverter] Realm roles: " + roles);
                    addAuthorities(authorities, roles);
                }
            }

            // Extract resource/client roles
            Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
            if (resourceAccess != null) {
                for (Map.Entry<String, Object> entry : resourceAccess.entrySet()) {
                    if (entry.getValue() instanceof Map<?, ?> clientAccessMap) {
                        Object rolesObj = clientAccessMap.get("roles");
                        if (rolesObj instanceof Collection<?> roles) {
                            System.out.println("🔐 [KeycloakRoleConverter] Client '" + entry.getKey() + "' roles: " + roles);
                            addAuthorities(authorities, roles);
                        }
                    }
                }
            }

            System.out.println("✅ [KeycloakRoleConverter] Final authorities: " + authorities);
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
