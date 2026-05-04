package tn.esprit.userservice;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.userservice.config.SecurityConfig;
import tn.esprit.userservice.service.KeycloakUserService;
import tn.esprit.userservice.config.KeycloakProperties;
import tn.esprit.userservice.web.UserController;
import tn.esprit.userservice.web.dto.CreateUserRequest;
import tn.esprit.userservice.web.dto.UserSummaryResponse;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, UserControllerSecurityTest.TestBeans.class})
class UserControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

        @org.springframework.boot.test.mock.mockito.MockBean
    private JwtDecoder jwtDecoder;

        @TestConfiguration
        static class TestBeans {
                @Bean
                KeycloakUserService keycloakUserService() {
                        return new FakeKeycloakUserService();
                }
        }

        static class FakeKeycloakUserService extends KeycloakUserService {
                FakeKeycloakUserService() {
                        super(new KeycloakProperties("http://localhost:8180", "myrealm", "client", null,
                                        "master", "admin-cli", null, "admin", "admin"));
                }

                @Override
                public List<UserSummaryResponse> listUsers(int max) {
                        return List.of(new UserSummaryResponse("u1", "john", "john@mail.com", "John", "Doe", true, false, 1L));
                }

                @Override
                public String createUser(CreateUserRequest request) {
                        return "new-user-id";
                }

                @Override
                public UserSummaryResponse getUserById(String userId) {
                        return new UserSummaryResponse(userId, "user-" + userId, userId + "@mail.com", "U", "S", true, false, 1L);
                }
        }

    @Test
    void listUsers_shouldReturnUnauthorizedWithoutJwt() throws Exception {
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listUsers_shouldReturnForbiddenForNonAdminRole() throws Exception {
        mockMvc.perform(get("/api/users")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_student"))))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Access Denied"));
    }

        @Test
        void listUsers_shouldReturnForbiddenForTutorRole() throws Exception {
                mockMvc.perform(get("/api/users")
                                                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_teacher"))))
                                .andExpect(status().isInternalServerError())
                                .andExpect(jsonPath("$.message").value("Access Denied"));
        }

    @Test
    void listUsers_shouldAllowAdminRole() throws Exception {
        mockMvc.perform(get("/api/users")
                                                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_admin"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("john"));
    }

    @Test
    void me_shouldExposeMergedRolesFromJwtClaims() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .with(jwt().jwt(jwt -> jwt
                                .subject("user-123")
                                .claim("preferred_username", "alice")
                                .claim("email", "alice@school.tn")
                                .claim("name", "Alice Doe")
                                .claim("realm_access", Map.of("roles", List.of("student", "admin")))
                                .claim("resource_access", Map.of("jungle-web", Map.of("roles", List.of("teacher")))))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-123"))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.roles[0]").value("admin"));
    }

    @Test
    void signup_shouldBePublicAndCreateAccount() throws Exception {
        String body = """
                {
                  "username": "new.user",
                  "email": "new.user@mail.com",
                  "firstName": "New",
                  "lastName": "User",
                  "password": "password123",
                  "role": "Tutor"
                }
                """;

        mockMvc.perform(post("/api/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("new-user-id"));
    }

    @Test
    void createUser_shouldAllowAdminRole() throws Exception {
        String body = """
                {
                  "username": "new.admin",
                  "email": "new.admin@mail.com",
                  "firstName": "New",
                  "lastName": "Admin",
                  "password": "password123",
                  "roles": ["student"]
                }
                """;

        mockMvc.perform(post("/api/users")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_admin")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("new-user-id"));
    }

    @Test
    void createUser_shouldRejectStudentRole() throws Exception {
        String body = """
                {
                  "username": "new.student",
                  "email": "new.student@mail.com",
                  "firstName": "New",
                  "lastName": "Student",
                  "password": "password123",
                  "roles": ["student"]
                }
                """;

        mockMvc.perform(post("/api/users")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_student")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Access Denied"));
    }
}
