package tn.esprit.jungle.gestioncours.controller;

import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.jungle.gestioncours.entites.NotificationType;
import tn.esprit.jungle.gestioncours.entites.RealtimeNotification;
import tn.esprit.jungle.gestioncours.service.interfaces.NotificationService;

import java.util.Map;

/**
 * <strong>TEMPORAIRE — DEBUG UNIQUEMENT.</strong>
 * <p>
 * Le mapping REST est toujours enregistre ; la creation via POST n'est autorisee que si
 * {@code notifications.debug-create-endpoint-enabled=true}. Sinon POST renvoie 403.
 * </p>
 */
@Slf4j
@RestController
@RequestMapping("/api/debug/notifications")
@RequiredArgsConstructor
@Hidden
public class NotificationDebugController {

    private final NotificationService notificationService;

    @Value("${notifications.debug-create-endpoint-enabled:false}")
    private boolean debugCreateEnabled;

    /**
     * Corps optionnel : {@code userId} (defaut 1), {@code type}, {@code title}, {@code message}, {@code payloadJson}.
     */
    public record CreateTestNotificationRequest(
            Long userId,
            NotificationType type,
            String title,
            String message,
            String payloadJson
    ) {}

    /** Permet de verifier la config sans POST (evite "No static resource" si GET par erreur). */
    @GetMapping
    @Operation(summary = "[DEBUG] Statut endpoint creation", hidden = true)
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
                "debugCreateEnabled", debugCreateEnabled,
                "usage", "POST avec corps JSON optionnel (userId, type, title, message, payloadJson)"
        ));
    }

    @PostMapping
    @Operation(summary = "[DEBUG] Creer une notification de test", hidden = true)
    public ResponseEntity<?> create(@RequestBody(required = false) CreateTestNotificationRequest req) {
        if (!debugCreateEnabled) {
            log.warn("[DEBUG] Creation refusee: notifications.debug-create-endpoint-enabled=false");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "Debug create desactive. Mettre notifications.debug-create-endpoint-enabled=true puis redemarrer."
            ));
        }
        log.warn("[DEBUG] NotificationDebugController: creation notification de test (endpoint a desactiver en prod)");
        Long userId = (req != null && req.userId() != null) ? req.userId() : 1L;
        NotificationType type = (req != null && req.type() != null) ? req.type() : NotificationType.RISK_ALERT;
        String title = (req != null && req.title() != null && !req.title().isBlank())
                ? req.title()
                : "Debug — notification de test";
        String message = (req != null && req.message() != null && !req.message().isBlank())
                ? req.message()
                : "Corps genere par POST /api/debug/notifications (TEMP).";
        String payload = req != null ? req.payloadJson() : null;
        RealtimeNotification saved = notificationService.createNotification(userId, type, title, message, payload);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
