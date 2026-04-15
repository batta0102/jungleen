package tn.esprit.userservice.service;

import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.RolesResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.stereotype.Service;
import tn.esprit.userservice.config.KeycloakProperties;
import tn.esprit.userservice.web.dto.CreateUserRequest;
import tn.esprit.userservice.web.dto.UserSummaryResponse;

@Service
public class KeycloakUserService {

    private final KeycloakProperties keycloakProperties;

    public KeycloakUserService(KeycloakProperties keycloakProperties) {
        this.keycloakProperties = keycloakProperties;
    }

    public List<UserSummaryResponse> listUsers(int max) {
        try (Keycloak keycloak = newAdminClient()) {
            RealmResource realm = keycloak.realm(keycloakProperties.realm());
            return realm.users().list(0, max).stream()
                    .map(this::toSummary)
                    .collect(Collectors.toList());
        }
    }

    public UserSummaryResponse getUserById(String userId) {
        try (Keycloak keycloak = newAdminClient()) {
            RealmResource realm = keycloak.realm(keycloakProperties.realm());
            UserRepresentation user = realm.users().get(userId).toRepresentation();
            return toSummary(user);
        } catch (Exception e) {
            return null;
        }
    }

    public String createUser(CreateUserRequest request) {
        try (Keycloak keycloak = newAdminClient()) {
            RealmResource realm = keycloak.realm(keycloakProperties.realm());
            UsersResource users = realm.users();

            UserRepresentation user = new UserRepresentation();
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setEnabled(request.getEnabled() == null || request.getEnabled());
            user.setEmailVerified(Boolean.FALSE);

            CredentialRepresentation credential = new CredentialRepresentation();
            credential.setType(CredentialRepresentation.PASSWORD);
            credential.setTemporary(false);
            credential.setValue(request.getPassword());
            user.setCredentials(List.of(credential));

            Response response = users.create(user);
            int status = response.getStatus();
            if (status != 201) {
                throw new IllegalStateException("Keycloak create user failed with status " + status);
            }

            String userId = extractCreatedId(response);
            assignRolesIfPresent(realm.roles(), users, userId, request.getRoles());
            return userId;
        }
    }

    private Keycloak newAdminClient() {
        KeycloakBuilder builder = KeycloakBuilder.builder()
                .serverUrl(keycloakProperties.serverUrl())
                .realm(keycloakProperties.adminRealm())
                .clientId(keycloakProperties.adminClientId());

        String clientSecret = trimToNull(keycloakProperties.adminClientSecret());
        if (clientSecret != null) {
            builder
                    .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
                    .clientSecret(clientSecret);
        } else {
            builder
                    .grantType(OAuth2Constants.PASSWORD)
                    .username(keycloakProperties.adminUsername())
                    .password(keycloakProperties.adminPassword());
        }

        return builder.build();
    }

    private void assignRolesIfPresent(
            RolesResource rolesResource,
            UsersResource usersResource,
            String userId,
            List<String> roles
    ) {
        if (roles == null || roles.isEmpty()) {
            return;
        }

        List<RoleRepresentation> roleRepresentations = roles.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(rolesResource::get)
                .map(role -> role.toRepresentation())
                .collect(Collectors.toList());

        if (!roleRepresentations.isEmpty()) {
            usersResource.get(userId).roles().realmLevel().add(roleRepresentations);
        }
    }

    private String extractCreatedId(Response response) {
        String path = response.getLocation() == null ? null : response.getLocation().getPath();
        if (path == null || path.isBlank() || !path.contains("/")) {
            throw new IllegalStateException("Unable to extract created user id from Keycloak response");
        }
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private UserSummaryResponse toSummary(UserRepresentation user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.isEnabled(),
                user.isEmailVerified(),
                user.getCreatedTimestamp()
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
