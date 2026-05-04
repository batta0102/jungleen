package tn.esprit.event;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.event.client.UserClient;
import tn.esprit.event.service.FeignClientExampleService;

@ExtendWith(MockitoExtension.class)
class FeignClientExampleServiceTest {

    @Mock
    private UserClient userClient;

    @InjectMocks
    private FeignClientExampleService service;

    @Test
    void getUserEmailExample_shouldReturnEmailFromUserService() {
        when(userClient.getUserEmail("u-1")).thenReturn(Map.of("email", "admin@company.tn"));

        String email = service.getUserEmailExample("u-1");

        assertEquals("admin@company.tn", email);
    }

    @Test
    void getUserEmailExample_shouldWrapFeignFailureAsServiceUnavailable() {
        when(userClient.getUserEmail("u-2")).thenThrow(new RuntimeException("timeout"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.getUserEmailExample("u-2"));

        assertEquals(503, ex.getStatusCode().value());
    }

    @Test
    void isUserTutorExample_shouldGracefullyHandleUnavailableUserService() {
        when(userClient.getUserEmail("u-3")).thenThrow(new RuntimeException("connection refused"));

        assertFalse(service.isUserTutorExample("u-3"));
    }

    @Test
    void isUserTutorExample_shouldReturnTrueWhenEmailPresent() {
        when(userClient.getUserEmail("u-4")).thenReturn(Map.of("email", "tutor@school.tn"));

        assertTrue(service.isUserTutorExample("u-4"));
    }
}
