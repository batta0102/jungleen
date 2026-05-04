package tn.esprit.jungle.gestioncours.service.impl;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import tn.esprit.jungle.gestioncours.dto.RealtimeNotificationResponse;
import tn.esprit.jungle.gestioncours.entites.NotificationType;
import tn.esprit.jungle.gestioncours.entites.RealtimeNotification;
import tn.esprit.jungle.gestioncours.repositorie.RealtimeNotificationRepository;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de {@link NotificationServiceImpl} (JUnit 5 + Mockito, sans contexte Spring).
 * Étape 1 : {@code createNotification}.
 */
@ExtendWith(MockitoExtension.class)
class  NotificationServiceImplTest {

    @Mock
    private RealtimeNotificationRepository repository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @Test
    void createNotification_success_savesEntityAndCallsMessagingTemplate() {
        when(repository.save(any(RealtimeNotification.class))).thenAnswer(invocation -> {
            RealtimeNotification entity = invocation.getArgument(0);
            entity.setId(55L);
            return entity;
        });

        RealtimeNotification result = notificationService.createNotification(
                1L,
                NotificationType.COURSE_CREATED,
                "Mon cours",
                "Le cours a été ajouté.",
                "{\"courseId\":1}");

        assertThat(result.getId()).isEqualTo(55L);
        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getType()).isEqualTo(NotificationType.COURSE_CREATED);
        assertThat(result.getTitle()).isEqualTo("Mon cours");
        assertThat(result.getMessage()).isEqualTo("Le cours a été ajouté.");
        assertThat(result.getPayloadJson()).isEqualTo("{\"courseId\":1}");
        assertThat(result.isRead()).isFalse();

        verify(repository).save(any(RealtimeNotification.class));
        verify(messagingTemplate).convertAndSendToUser(
                eq("1"),
                eq("/queue/notifications"),
                any(RealtimeNotificationResponse.class));
    }

    @Test
    void getMyNotifications_returnsMappedResponses() {
        LocalDateTime createdAt = LocalDateTime.of(2026, 4, 10, 12, 0);
        RealtimeNotification entity = new RealtimeNotification();
        entity.setId(10L);
        entity.setUserId(1L);
        entity.setType(NotificationType.ATTENDANCE_UPDATED);
        entity.setTitle("Titre");
        entity.setMessage("Corps");
        entity.setPayloadJson("{\"k\":\"v\"}");
        entity.setRead(false);
        entity.setCreatedAt(createdAt);
        entity.setReadAt(null);

        when(repository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(entity));

        List<RealtimeNotificationResponse> result = notificationService.getMyNotifications(1L);

        assertThat(result).hasSize(1).hasOnlyElementsOfType(RealtimeNotificationResponse.class);
        RealtimeNotificationResponse r = result.get(0);
        assertThat(r.getId()).isEqualTo(10L);
        assertThat(r.getUserId()).isEqualTo(1L);
        assertThat(r.getType()).isEqualTo(NotificationType.ATTENDANCE_UPDATED);
        assertThat(r.getTitle()).isEqualTo("Titre");
        assertThat(r.getMessage()).isEqualTo("Corps");
        assertThat(r.getPayloadJson()).isEqualTo("{\"k\":\"v\"}");
        assertThat(r.isRead()).isFalse();

        verify(repository).findByUserIdOrderByCreatedAtDesc(1L);
    }
}
