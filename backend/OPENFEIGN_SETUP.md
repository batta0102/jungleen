# OpenFeign Secure Inter-Service Communication Setup

## Overview
This document describes how OpenFeign is configured across the Jungle in English microservices to enable **secure inter-service communication with JWT token propagation**.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                             │
│                    (Spring Cloud Gateway)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
            ┌───▼───┐  ┌──────▼──────┐  ┌──▼────────┐
            │ Event │  │    User     │  │ Resources │
            │Service│  │   Service   │  │ Service   │
            └───┬───┘  └─────┬───────┘  └──┬────────┘
                │            │             │
        │Feign │            │Feign│        │Feign│
        │Client│  ◄─────►   │Client       │Client
        └──────┘             └──────┘       └──────┘
                JWT Propagation via FeignRequestInterceptor
```

## Key Components

### 1. FeignRequestInterceptor
**Location**: Each microservice has this in its `config` package
- **File**: `FeignRequestInterceptor.java`
- **Purpose**: Automatically adds JWT tokens to outgoing inter-service requests
- **How it works**: 
  - Extracts JWT from Spring Security context
  - Adds `Authorization: Bearer <token>` header to all Feign requests
  - Ensures downstream services can validate the token

### 2. Feign Clients
Each microservice defines client interfaces for calling other services:

#### Event Service
- **UserClient.java**: Calls User Service for user information
- **EventClient.java**: Defines Event Service endpoints (called by other services)

#### User Service
- **EventClient.java**: Calls Event Service if needed
- Defines user endpoints for other services to consume

#### Resources Service  
- **UserClient.java**: Calls User Service for user information
- **EventClient.java**: Calls Event Service for event information

### 3. Configuration
**Application Properties** - All microservices include:
```properties
# OpenFeign Configuration
feign.client.config.default.connect-timeout=5000
feign.client.config.default.read-timeout=5000

# Keycloak OAuth2 Configuration
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8180/realms/myrealm
```

## How It Works

### Request Flow

1. **Client Makes Request to Microservice A**
   ```
   GET /api/events
   Headers: Authorization: Bearer <JWT_TOKEN>
   ```

2. **Microservice A Receives Request**
   - Spring Security validates JWT token
   - Token is stored in SecurityContext
   - FeignRequestInterceptor can access it

3. **Microservice A Calls Microservice B using Feign**
   ```java
   @Autowired
   private UserClient userClient;
   
   public void createEvent(...) {
       String userEmail = userClient.getUserEmail(userId).get("email");
       // ...
   }
   ```

4. **FeignRequestInterceptor Intercepts Feign Request**
   - Extracts JWT from SecurityContext
   - Adds it to Authorization header automatically
   - Request goes to Microservice B with valid JWT

5. **Microservice B Receives Request**
   ```
   GET /api/users/user123/email
   Headers: Authorization: Bearer <JWT_TOKEN>
   ```
   - Validates JWT using same Keycloak configuration
   - Processes request and returns response

## Implementation Guide

### Using Feign Clients in Your Service

#### 1. Inject the Feign Client
```java
@Service
public class EventServiceImpl implements EventService {
    
    @Autowired
    private UserClient userClient;
    
    // Now you can use userClient in your methods
}
```

#### 2. Call Other Services
```java
// Get user email
Map<String, String> userEmail = userClient.getUserEmail(userId);

// Get current user info (JWT token automatically included)
Map<String, Object> currentUser = userClient.getCurrentUser();

// List all users (requires admin role)
List<Map<String, Object>> users = userClient.listUsers(50);
```

#### 3. Handle Exceptions
```java
import feign.FeignException;

public void createEvent(CreateEventRequest request) {
    try {
        userClient.getUserEmail(request.getTutorId());
    } catch (FeignException.NotFound e) {
        throw new ResourceNotFoundException("Tutor not found");
    } catch (FeignException.Unauthorized e) {
        throw new UnauthorizedException("Invalid or expired token");
    } catch (FeignException.ServiceUnavailable e) {
        throw new ServiceUnavailableException("User service is down");
    }
}
```

#### 4. Chain Calls Across Multiple Services
```java
public void processEvent(Long eventId) {
    // Call Event Service
    Map<String, Object> event = eventClient.getEventById(eventId);
    
    // Extract user ID from event
    String userId = (String) event.get("organizer_id");
    
    // Call User Service (JWT automatically propagated)
    Map<String, String> userEmail = userClient.getUserEmail(userId);
    
    // Process both pieces of information
    // ...
}
```

## Service-to-Service Communication Matrix

### Event Service
- ✅ Calls: User Service (email, current user, list users)
- ✅ Calls: Resources Service (venue info)

### User Service
- ✅ Calls: Event Service (if needed for notifications)
- ✅ Called by: Event Service, Resources Service

### Resources Service
- ✅ Calls: User Service (email, validation)
- ✅ Calls: Event Service (event details)

## Security Features

### 1. JWT Token Propagation
- Every inter-service request automatically includes the original JWT token
- Token is extracted from SecurityContext and added to Feign request headers
- Downstream services validate the same JWT using Keycloak

### 2. Role-Based Access Control (RBAC)
```java
@PreAuthorize("hasAnyRole('tutor', 'TUTOR', 'tuteur')")
public Event createEvent(CreateEventRequest request) {
    // Only tutors can execute this
    // Even if called via Feign from another service
}
```

### 3. SSL/TLS Support
Configure in application.properties if needed:
```properties
feign.client.config.default.keystore-path=path/to/keystore
feign.client.config.default.keystore-password=password
```

### 4. Error Handling
FeignRequestInterceptor safely handles:
- Missing authentication
- Invalid tokens
- Expired tokens
- Non-JWT credentials

## Debugging and Monitoring

### Enable Feign Logging
Add to application.properties:
```properties
logging.level.org.springframework.cloud.openfeign=DEBUG
logging.level.org.springframework.cloud.openfeign.ribbon=DEBUG
logging.level.tn.esprit.event.client=DEBUG
```

### Check Token Propagation
Log in FeignRequestInterceptor to see token extraction:
```java
String token = getJWTToken();
if (token != null) {
    logger.debug("Propagating JWT token via Feign: " + token.substring(0, 20) + "...");
    requestTemplate.header(AUTHORIZATION_HEADER, BEARER_TOKEN_PREFIX + token);
}
```

### Monitor Inter-Service Calls
- Check Eureka dashboard: http://localhost:8761
- Verify service registration and health
- Monitor Feign timeouts and failures

## Best Practices

### 1. Always Handle Exceptions
```java
try {
    userClient.getUserEmail(userId);
} catch (FeignException.NotFound e) {
    // Handle 404
} catch (FeignException.Unauthorized e) {
    // Handle 401
} catch (FeignException e) {
    // Handle other Feign exceptions
}
```

### 2. Use Service Discovery
Feign clients use service names from Eureka:
- Event Service: `@FeignClient(name = "event-service")`
- User Service: `@FeignClient(name = "user-service")`
- Resources Service: `@FeignClient(name = "ressources")`

### 3. Set Appropriate Timeouts
```properties
feign.client.config.default.connect-timeout=5000  # 5 seconds
feign.client.config.default.read-timeout=5000    # 5 seconds
```

### 4. Validate Tokens Downstream
Each service must validate the JWT independently:
```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8180/realms/myrealm
```

## Troubleshooting

### Issue: 401 Unauthorized in Inter-Service Calls
**Cause**: JWT token not being propagated
**Solution**: 
1. Verify FeignRequestInterceptor is registered as @Component
2. Check SecurityContext has Authentication object
3. Verify @EnableFeignClients is on main application class

### Issue: 403 Forbidden
**Cause**: Valid token but user lacks required role
**Solution**:
1. Check @PreAuthorize annotations on target endpoint
2. Verify Keycloak role mappings
3. Check token contains correct role claims

### Issue: Service Unavailable
**Cause**: Inter-service call failing due to timeout or network
**Solution**:
1. Verify all services are registered in Eureka
2. Check service availability on correct ports
3. Increase timeout if services are slow

### Issue: Token Expiry During Long Operations
**Cause**: Token expires while inter-service calls are happening
**Solution**:
1. Use short-lived tokens (5-15 minutes)
2. Implement token refresh in frontend
3. For long operations, consider async processing

## Testing Inter-Service Communication

### 1. Unit Test with Mocked Feign Client
```java
@RunWith(SpringRunner.class)
public class EventServiceTest {
    
    @MockBean
    private UserClient userClient;
    
    @Test
    public void testEventCreationWithUserValidation() {
        Mockito.when(userClient.getUserEmail("user123"))
               .thenReturn(Map.of("email", "user@example.com"));
        
        // Test your service method
    }
}
```

### 2. Integration Test
```java
@SpringBootTest
public class FeignIntegrationTest {
    
    @Autowired
    private EventServiceImpl eventService;
    
    @Test
    public void testInterServiceCommunication() {
        // Start all services (docker-compose recommended)
        // Test actual Feign calls between services
    }
}
```

## Next Steps

1. **Integrate Feign Clients into Existing Services**
   - Update EventServiceImpl to use UserClient
   - Update VenueController to use UserClient for authorization
   - Update ResourceService to use UserClient and EventClient

2. **Add More Client Interfaces as Needed**
   - Create PaymentClient if payment service exists
   - Create NotificationClient for email/notification service
   - Create AuthClient for advanced auth scenarios

3. **Monitor and Log**
   - Set up ELK stack for centralized logging
   - Monitor inter-service latency
   - Track failed calls and timeouts

4. **Production Deployment**
   - Use environment-specific service URLs
   - Implement circuit breaker pattern (Hystrix/Resilience4j)
   - Enable SSL/TLS for inter-service communication
   - Use API keys or mTLS for additional security

## References

- [Spring Cloud OpenFeign Documentation](https://spring.io/projects/spring-cloud-openfeign)
- [Keycloak Security](https://www.keycloak.org/)
- [Spring Security OAuth2 Resource Server](https://spring.io/projects/spring-security)
- [Eureka Service Discovery](https://github.com/Netflix/eureka)
