package tn.esprit.jungle.gestioncours.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.jungle.gestioncours.entites.NotificationType;

/**
 * Corps pour POST /api/notifications — création manuelle (démo / back-office).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RealtimeNotificationCreateRequest {

    @NotNull(message = "userId is required")
    @Positive(message = "userId must be positive")
    private Long userId;

    @NotNull(message = "type is required")
    private NotificationType type;

    @NotBlank(message = "title is required")
    private String title;

    @NotBlank(message = "message is required")
    private String message;

    /** Optionnel (JSON brut). */
    private String payloadJson;
}
