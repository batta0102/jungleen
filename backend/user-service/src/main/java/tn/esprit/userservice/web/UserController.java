package tn.esprit.userservice.web;

import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.userservice.service.KeycloakUserService;
import tn.esprit.userservice.web.dto.CreateUserRequest;
import tn.esprit.userservice.web.dto.CreateUserResponse;
import tn.esprit.userservice.web.dto.CurrentUserResponse;
import tn.esprit.userservice.web.dto.SignupRequest;
import tn.esprit.userservice.web.dto.UserSummaryResponse;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final KeycloakUserService keycloakUserService;

    public UserController(KeycloakUserService keycloakUserService) {
        this.keycloakUserService = keycloakUserService;
    }

    @GetMapping("/me")
    public CurrentUserResponse me(@AuthenticationPrincipal Jwt jwt) {
        String fullName = (jwt.getClaimAsString("name") == null || jwt.getClaimAsString("name").isBlank())
                ? jwt.getClaimAsString("preferred_username")
                : jwt.getClaimAsString("name");

        return new CurrentUserResponse(
                jwt.getSubject(),
                jwt.getClaimAsString("preferred_username"),
                jwt.getClaimAsString("email"),
                fullName,
                extractRoles(jwt)
        );
    }

    @GetMapping("/{userId}/email")
    public Map<String, String> getUserEmail(@PathVariable String userId) {
        UserSummaryResponse user = keycloakUserService.getUserById(userId);
        if (user == null || user.email() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        return Map.of("email", user.email());
    }

    @GetMapping
    @PreAuthorize("hasRole('admin')")
    public List<UserSummaryResponse> listUsers(@RequestParam(defaultValue = "50") int max) {
        int cappedMax = Math.max(1, Math.min(max, 200));
        return keycloakUserService.listUsers(cappedMax);
    }

    @PostMapping
    @PreAuthorize("hasRole('admin')")
    public CreateUserResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        String id = keycloakUserService.createUser(request);
        return new CreateUserResponse(id, "User created");
    }

    @PostMapping("/signup")
    public CreateUserResponse signup(@Valid @RequestBody SignupRequest request) {
        CreateUserRequest createUserRequest = new CreateUserRequest();
        createUserRequest.setUsername(request.getUsername());
        createUserRequest.setEmail(request.getEmail());
        createUserRequest.setFirstName(request.getFirstName());
        createUserRequest.setLastName(request.getLastName());
        createUserRequest.setPassword(request.getPassword());
        createUserRequest.setEnabled(Boolean.TRUE);
        createUserRequest.setRoles(List.of(normalizeSignupRole(request.getRole())));

        String id = keycloakUserService.createUser(createUserRequest);
        return new CreateUserResponse(id, "Account created");
    }

    private String normalizeSignupRole(String role) {
        if (role == null) {
            return "student";
        }

        String normalized = role.trim().toLowerCase();
        if (normalized.equals("teacher") || normalized.equals("tutor")) {
            return "teacher";
        }

        return "student";
    }

    private List<String> extractRoles(Jwt jwt) {
        Set<String> roles = new TreeSet<>();

        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null) {
            Object roleObj = realmAccess.get("roles");
            if (roleObj instanceof List<?> roleList) {
                for (Object role : roleList) {
                    if (role instanceof String roleString && !roleString.isBlank()) {
                        roles.add(roleString);
                    }
                }
            }
        }

        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            for (Object clientEntry : resourceAccess.values()) {
                if (clientEntry instanceof Map<?, ?> clientAccess) {
                    Object roleObj = clientAccess.get("roles");
                    if (roleObj instanceof List<?> roleList) {
                        for (Object role : roleList) {
                            if (role instanceof String roleString && !roleString.isBlank()) {
                                roles.add(roleString);
                            }
                        }
                    }
                }
            }
        }

        return new ArrayList<>(roles);
    }
}
