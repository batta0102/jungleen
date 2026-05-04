package tn.esprit.jungle.gestioncours.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tn.esprit.jungle.gestioncours.dto.RealtimeNotificationResponse;
import tn.esprit.jungle.gestioncours.entites.NotificationType;
import tn.esprit.jungle.gestioncours.entites.RealtimeNotification;
import tn.esprit.jungle.gestioncours.service.interfaces.NotificationService;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificationService notificationService;

    @Test
    void createNotification_returns201() throws Exception {
        RealtimeNotification saved = new RealtimeNotification();
        saved.setId(11L);
        saved.setUserId(1L);
        saved.setType(NotificationType.COURSE_CREATED);
        saved.setTitle("Cours ajouté");
        saved.setMessage("Le cours Java a été ajouté");
        saved.setPayloadJson("{\"courseId\":11}");
        saved.setRead(false);
        saved.setCreatedAt(LocalDateTime.now());

        when(notificationService.createNotification(
                eq(1L),
                eq(NotificationType.COURSE_CREATED),
                eq("Cours ajouté"),
                eq("Le cours Java a été ajouté"),
                eq("{\"courseId\":11}")
        )).thenReturn(saved);

        String requestBody = """
                {
                  "userId": 1,
                  "type": "COURSE_CREATED",
                  "title": "Cours ajouté",
                  "message": "Le cours Java a été ajouté",
                  "payloadJson": "{\\"courseId\\":11}"
                }
                """;

        mockMvc.perform(post("/api/notifications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(11))
                .andExpect(jsonPath("$.type").value("COURSE_CREATED"));
    }

    @Test
    void getMyNotifications_returns200() throws Exception {
        RealtimeNotificationResponse response = new RealtimeNotificationResponse(
                22L,
                1L,
                NotificationType.COURSE_CREATED,
                "Titre",
                "Message",
                "{\"courseId\":22}",
                false,
                LocalDateTime.now(),
                null
        );

        when(notificationService.getMyNotifications(1L)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/notifications/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(22))
                .andExpect(jsonPath("$[0].type").value("COURSE_CREATED"));

        verify(notificationService).getMyNotifications(1L);
    }
}
