package tn.esprit.userservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(
        properties = {
                "eureka.client.enabled=false",
                "spring.cloud.discovery.enabled=false",
                "spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:8180/realms/myrealm"
        }
)
class UserServiceApplicationTests {

    @Test
    void contextLoads() {
    }
}
