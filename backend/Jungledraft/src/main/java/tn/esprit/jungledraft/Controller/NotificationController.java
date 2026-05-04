package tn.esprit.jungledraft.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungledraft.Services.NotificationRappelService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRappelService notificationService;

    /**
     * Endpoint pour vérifier les sessions proches (appelé par le frontend toutes les 30 secondes)
     * Retourne les sessions qui commencent dans les 5 minutes
     */
    @GetMapping("/sessions-proches/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getSessionsProches(@PathVariable Long userId) {
        List<Map<String, Object>> sessionsProches = notificationService.getSessionsProchesPourUtilisateur(userId);
        return ResponseEntity.ok(sessionsProches);
    }

    /**
     * Endpoint pour récupérer toutes les sessions à venir d'un utilisateur
     */
    @GetMapping("/sessions-a-venir/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getSessionsAVenir(@PathVariable Long userId) {
        List<Map<String, Object>> sessionsAVenir = notificationService.getSessionsAVenirPourUtilisateur(userId);
        return ResponseEntity.ok(sessionsAVenir);
    }

    /**
     * Marquer qu'une notification a été vue
     */
    @PostMapping("/marquer-vue/{sessionId}/{userId}")
    public ResponseEntity<Void> marquerNotificationVue(@PathVariable Long sessionId, @PathVariable Long userId) {
        notificationService.marquerNotificationVue(sessionId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/status")
    public ResponseEntity<String> getStatus() {
        return ResponseEntity.ok("Service de notifications actif - Vérification toutes les minutes");
    }
}