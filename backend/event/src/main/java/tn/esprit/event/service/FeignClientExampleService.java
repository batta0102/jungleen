/**
 * Example implementation showing how to use Feign clients for inter-service communication.
 * 
 * This file demonstrates how to inject and use Feign clients in your services
 * to communicate securely with other microservices using JWT token propagation.
 * 
 * IMPORTANT: This is documentation and example code. Integrate these patterns into your 
 * existing service implementations as needed.
 */

package tn.esprit.event.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tn.esprit.event.client.UserClient;
import java.util.Map;

@Service
public class FeignClientExampleService {

    /**
     * Inject the UserClient Feign interface.
     * The FeignRequestInterceptor will automatically add the current user's
     * JWT token to all requests made through this client.
     */
    @Autowired
    private UserClient userClient;

    /**
     * Example 1: Fetch user email by user ID
     * This demonstrates a simple GET request with path parameter.
     */
    public String getUserEmailExample(String userId) {
        try {
            Map<String, String> response = userClient.getUserEmail(userId);
            return response.get("email");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, 
                "User service is unavailable: " + e.getMessage());
        }
    }

    /**
     * Example 2: Get current user information
     * This demonstrates getting the authenticated user's details.
     * The JWT token is automatically added to the Authorization header.
     */
    public Map<String, Object> getCurrentUserExample() {
        try {
            return userClient.getCurrentUser();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, 
                "Failed to fetch current user information: " + e.getMessage());
        }
    }

    /**
     * Example 3: Validate user role for authorization
     * This demonstrates how to use Feign client for authorization checks.
     */
    public boolean isUserTutorExample(String userId) {
        try {
            Map<String, String> emailMap = userClient.getUserEmail(userId);
            // Return true if user exists (further role validation can be added)
            return emailMap != null && emailMap.containsKey("email");
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * INTEGRATION PATTERN FOR EXISTING SERVICES:
     * 
     * 1. In EventServiceImpl, add this field:
     *    @Autowired
     *    private UserClient userClient;
     * 
     * 2. In createEvent() or similar methods, you can now add authorization checks:
     *    
     *    public Event createEvent(CreateOnsiteEventRequest request, String userId) {
     *        // Get user email to validate user exists
     *        try {
     *            userClient.getUserEmail(userId);
     *        } catch (FeignException.NotFound e) {
     *            throw new ResourceNotFoundException("User not found");
     *        }
     *        
     *        // Continue with event creation
     *        // ...
     *    }
     * 
     * 3. For role-based authorization:
     *    
     *    @PreAuthorize("hasRole('tutor')")
     *    public Event createEvent(CreateOnsiteEventRequest request) {
     *        // At this point, the user is guaranteed to have the tutor role
     *        // because of the @PreAuthorize annotation
     *        // No need to call UserClient for role validation
     *        
     *        // Continue with event creation
     *        // ...
     *    }
     * 
     * 4. For complex scenarios requiring role information from User Service:
     *    
     *    public void notifyTutorOfNewEvent(Event event) {
     *        try {
     *            Map<String, Object> currentUser = userClient.getCurrentUser();
     *            String tutorEmail = (String) currentUser.get("email");
     *            
     *            // Send notification to tutor
     *            // ...
     *        } catch (Exception e) {
     *            logger.error("Failed to fetch tutor information", e);
     *        }
     *    }
     */
}
