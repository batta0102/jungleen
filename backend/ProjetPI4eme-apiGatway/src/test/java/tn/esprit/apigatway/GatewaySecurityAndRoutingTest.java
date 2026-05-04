package tn.esprit.apigatway;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "eureka.client.enabled=false",
                "eureka.client.register-with-eureka=false",
                "eureka.client.fetch-registry=false"
        }
)
@AutoConfigureWebTestClient
class GatewaySecurityAndRoutingTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private RouteLocator routeLocator;

    @Test
    void protectedRoute_shouldRejectAnonymousRequest() {
        webTestClient.get()
                .uri("/api/users")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void protectedRoute_withValidJwt_shouldPassSecurityLayer() {
        webTestClient.mutateWith(mockJwt().authorities(() -> "ROLE_admin"))
                .get()
                .uri("/api/users")
                .exchange()
                .expectStatus().is5xxServerError();
    }

    @Test
    void routeLocator_shouldContainEventAndUserServiceRoutes() {
        List<Route> routes = routeLocator.getRoutes().collectList().block();

        assertThat(routes).isNotNull();
        assertThat(routes)
                .anyMatch(route -> "lb://event".equals(route.getUri().toString()))
                .anyMatch(route -> "lb://user-service".equals(route.getUri().toString()));
    }
}
