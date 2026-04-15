package tn.esprit.ressources.Service.Impliments;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.ressources.config.UserServiceAuthForwardingInterceptor;

import java.util.Map;
import java.util.List;

@Service
@Slf4j
public class UserClient {

    private final String userServiceBaseUrl;

    private final RestTemplate restTemplate;

    public UserClient(
            RestTemplateBuilder restTemplateBuilder,
            UserServiceAuthForwardingInterceptor authForwardingInterceptor,
            @Value("${app.user-service.base-url:http://localhost:8083}") String userServiceBaseUrl
    ) {
        this.userServiceBaseUrl = userServiceBaseUrl;
        this.restTemplate = restTemplateBuilder
                .additionalInterceptors(authForwardingInterceptor)
                .build();
    }

    public String getEmailByUserId(String userId) {
        String url = userServiceBaseUrl + "/api/users/" + userId + "/email";

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Map.class
            );

            Map<String, Object> body = response.getBody();
            if (body == null || body.get("email") == null || body.get("email").toString().isBlank()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found in keycloak");
            }

            return body.get("email").toString();
        } catch (HttpStatusCodeException exception) {
            int statusCode = exception.getStatusCode().value();

            if (statusCode == 401 || statusCode == 403) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "not authorized to fetch customer email", exception);
            }

            if (statusCode == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found in keycloak", exception);
            }

            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "user-service call failed", exception);
        } catch (ResourceAccessException exception) {
            log.error("user-service unreachable for userId={}", userId, exception);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "user-service unavailable", exception);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "user-service call failed", exception);
        }
    }
}