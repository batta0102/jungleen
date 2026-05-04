package tn.esprit.jungle.gestioncours.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import tn.esprit.jungle.gestioncours.dto.AttendanceResponseDto;
import tn.esprit.jungle.gestioncours.entites.NotificationType;
import tn.esprit.jungle.gestioncours.service.interfaces.NotificationService;

@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceNotificationListener {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAttendanceMarked(AttendanceMarkedEvent event) {
        AttendanceResponseDto a = event.attendance();

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(a);
        } catch (JsonProcessingException e) {
            log.warn("Could not serialize attendance payload for notification: {}", e.getMessage());
            return;
        }

        String title = "Présence enregistrée";
        String message = String.format(
                "Votre présence pour la session %s (session #%d) a été enregistrée : %s.",
                a.getSessionType(),
                a.getSessionId(),
                a.getStatus());

        notificationService.createNotification(
                a.getStudentId(),
                NotificationType.ATTENDANCE_UPDATED,
                title,
                message,
                payloadJson);
    }
}
