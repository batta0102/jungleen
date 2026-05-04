package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.jungle.gestioncours.entites.NotificationType;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RealtimeNotificationResponse {

    private Long id;
    private Long userId;
    private NotificationType type;
    private String title;
    private String message;
    private String payloadJson;
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
