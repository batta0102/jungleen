package tn.esprit.apigatway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

@SpringBootApplication
public class ApiGatwayApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiGatwayApplication.class, args);
	}

	@Bean
	public RouteLocator gatewayRoutes(RouteLocatorBuilder builder) {
		return builder.routes()
				// GestionCours routes
				.route(r -> r.path("/api/courses")
						.uri("lb://gestioncours"))
				.route(r -> r.path("/api/courses/**")
						.uri("lb://gestioncours"))
				.route(r -> r.path("/api/v1/onlinecourses/**")
						.uri("lb://gestioncours"))
				.route(r -> r.path("/api/v1/onsitecourses/**")
						.uri("lb://gestioncours"))
				.route(r -> r.path("/api/v1/online-sessions/**")
						.uri("lb://gestioncours"))
				.route(r -> r.path("/api/v1/onsite-sessions/**")
						.uri("lb://gestioncours"))
				.route(r -> r.path("/api/v1/online-bookings/**")
						.uri("lb://gestioncours"))
				.route(r -> r.path("/api/v1/onsite-bookings/**")
						.uri("lb://gestioncours"))
				.route(r -> r.path("/api/v1/classrooms/**")
						.uri("lb://gestioncours"))
				.route(r -> r.path("/api/advanced/**")
						.uri("lb://gestioncours"))
				// Event Service routes (must be before generic /api/**)
				.route(r -> r.path("/api/events/**")
						.uri("lb://event"))

				.route(r -> r.path("/api/venues/**")
						.uri("lb://event"))

				// PiDraft admission analytics must be before /api/analytics/**
				.route(r -> r.path("/api/analytics/admission/**")
						.uri("lb://pidraft"))

				.route(r -> r.path("/api/analytics/**")
						.uri("lb://event"))

				// pi4eme02 routes
				.route(r -> r.path("/api/games/**")
						.uri("lb://pi4eme02"))

				.route(r -> r.path("/api/badges/**")
						.uri("lb://pi4eme02"))

				.route(r -> r.path("/api/avatars/**")
						.uri("lb://pi4eme02"))

				.route(r -> r.path("/api/skins/**")
						.uri("lb://pi4eme02"))

				.route(r -> r.path("/api/crosswords/**")
						.uri("lb://pi4eme02"))

				.route(r -> r.path("/api/chat/**")
						.uri("lb://pi4eme02"))

				// Ressources service routes (products, orders, resources, reviews, deliveries, recommendations)
				.route("products_route", r -> r.path("/api/products/**")
						.uri("lb://ressources"))

				.route("orders_route", r -> r.path("/api/orders/**")
						.uri("lb://ressources"))

				.route("resources_route", r -> r.path("/api/resources/**")
						.uri("lb://ressources"))

				.route("reviews_route", r -> r.path("/api/reviews/**")
						.uri("lb://ressources"))

				.route("deliveries_route", r -> r.path("/api/deliveries/**")
						.uri("lb://ressources"))

				.route("recommendations_route", r -> r.path("/api/recommendations/**")
						.uri("lb://ressources"))

				// User Service routes (must be before generic /api/**)
				.route(r -> r.path("/api/users/**")
						.uri("lb://user-service"))

				// PiDraft specific routes
				.route(r -> r.path("/api/candidature/**")
						.uri("lb://pidraft"))

				.route(r -> r.path("/api/certificat/**")
						.uri("lb://pidraft"))

				.route(r -> r.path("/api/certification/**")
						.uri("lb://pidraft"))

				.route(r -> r.path("/api/interview/**")
						.uri("lb://pidraft"))

				.route(r -> r.path("/api/poste/**")
						.uri("lb://pidraft"))

				.route(r -> r.path("/api/qcms/**")
						.uri("lb://pidraft"))

				.route(r -> r.path("/api/questions/**")
						.uri("lb://pidraft"))

				.route(r -> r.path("/api/reponses/**")
						.uri("lb://pidraft"))

				.route(r -> r.path("/api/resultats/**")
						.uri("lb://pidraft"))

				.route(r -> r.path("/api/session-tests/**")
						.uri("lb://pidraft"))

				.route(r -> r.path("/api/choix-reponses/**")
						.uri("lb://pidraft"))

				// Jungledraft (clubs) routes
				.route(r -> r.path("/api/clubs/**")
						.uri("lb://jungledraft"))

				.route(r -> r.path("/api/clubMessages/**")
						.uri("lb://jungledraft"))

				.route(r -> r.path("/api/comments/**")
						.uri("lb://jungledraft"))

				.route(r -> r.path("/api/memberships/**")
						.uri("lb://jungledraft"))

				.route(r -> r.path("/api/buddyPairs/**")
						.uri("lb://jungledraft"))

				.route(r -> r.path("/api/buddySessions/**")
						.uri("lb://jungledraft"))

				.route(r -> r.path("/api/calendrier/**")
						.uri("lb://jungledraft"))

				.route(r -> r.path("/api/vision/**")
						.uri("lb://jungledraft"))

				.route(r -> r.path("/api/notifications/**")
						.uri("lb://jungledraft"))

				// Generic fallback for any other /api/** routes to PiDraft
				.route(r -> r.path("/api/**")
						.uri("lb://pidraft"))

				.build();
	}

	@Bean
	public CorsWebFilter corsWebFilter() {
		CorsConfiguration corsConfig = new CorsConfiguration();
		corsConfig.setAllowedOrigins(Arrays.asList("http://localhost:4200", "http://localhost:4201"));
		corsConfig.setMaxAge(3600L);
		corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
		corsConfig.setAllowedHeaders(Collections.singletonList("*"));
		corsConfig.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", corsConfig);

		return new CorsWebFilter(source);
	}

}
