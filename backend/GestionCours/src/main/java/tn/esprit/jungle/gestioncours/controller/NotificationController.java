package tn.esprit.jungle.gestioncours.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungle.gestioncours.dto.RealtimeNotificationCreateRequest;
import tn.esprit.jungle.gestioncours.dto.RealtimeNotificationResponse;
import tn.esprit.jungle.gestioncours.entites.RealtimeNotification;
import tn.esprit.jungle.gestioncours.service.interfaces.NotificationService;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Gestion des notifications temps reel")
public class NotificationController {

    private final NotificationService notificationService;

    /** TEMP: voir {@code notifications.debug-user-id} dans application.properties (auth a brancher). */
    @Value("${notifications.debug-user-id:1}")
    private long debugUserId;

    /**
     * Création manuelle d'une notification (persistée + push STOMP si session ouverte).
     */
    @PostMapping
    @Operation(summary = "Creer une notification")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Notification creee"),
            @ApiResponse(responseCode = "400", description = "Corps invalide")
    })
    public ResponseEntity<RealtimeNotificationResponse> createNotification(
            @Valid @RequestBody RealtimeNotificationCreateRequest request) {
        RealtimeNotification saved = notificationService.createNotification(
                request.getUserId(),
                request.getType(),
                request.getTitle(),
                request.getMessage(),
                request.getPayloadJson());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @GetMapping("/my")
    @Operation(summary = "Recuperer mes notifications")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Notifications retournees")
    })
    public ResponseEntity<List<RealtimeNotificationResponse>> getMyNotifications() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(notificationService.getMyNotifications(userId));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Marquer une notification comme lue")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Notification marquee comme lue"),
            @ApiResponse(responseCode = "404", description = "Notification introuvable")
    })
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Marquer toutes les notifications comme lues")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Toutes les notifications sont marquees comme lues")
    })
    public ResponseEntity<Void> markAllAsRead() {
        Long userId = getCurrentUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId() {
        return debugUserId;
    }

    private static RealtimeNotificationResponse toResponse(RealtimeNotification entity) {
        return new RealtimeNotificationResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getType(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getPayloadJson(),
                entity.isRead(),
                entity.getCreatedAt(),
                entity.getReadAt());
    }
}
