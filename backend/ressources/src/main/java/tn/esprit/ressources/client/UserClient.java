package tn.esprit.ressources.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;
import java.util.Map;

/**
 * Feign client for communicating with the User Service.
 * This client is used by the Resources service to fetch user information and roles.
 */
@FeignClient(name = "user-service", path = "/api/users")
public interface UserClient {

    /**
     * Get user's email by user ID.
     * This is a public endpoint that can be called without specific role requirements.
     *
     * @param userId the unique identifier of the user
     * @return a map containing the user's email
     */
    @GetMapping("/{userId}/email")
    Map<String, String> getUserEmail(@PathVariable("userId") String userId);

    /**
     * Get current user information.
     * Returns the authenticated user's details including roles.
     *
     * @return current user response
     */
    @GetMapping("/me")
    Map<String, Object> getCurrentUser();

    /**
     * List all users (requires admin role).
     *
     * @param max maximum number of users to return
     * @return list of user summaries
     */
    @GetMapping
    List<Map<String, Object>> listUsers(@RequestParam(defaultValue = "50") int max);
}
