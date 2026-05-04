package tn.esprit.event;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(TestSecurityConfig.class)
class EventApplicationTests {

    @Test
    void contextLoads() {
    }

}
