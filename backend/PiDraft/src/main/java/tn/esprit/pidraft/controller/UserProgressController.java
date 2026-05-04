package tn.esprit.pidraft.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.dto.UserProgressDto;
import tn.esprit.pidraft.service.UserProgressService;

@RestController
@RequestMapping("/api/user-progress")
@AllArgsConstructor
public class UserProgressController {

    private final UserProgressService userProgressService;

    /**
     * Get comprehensive user progress
     */
    @GetMapping("/{userId}")
    public ResponseEntity<UserProgressDto> getUserProgress(
            @PathVariable Long userId,
            @RequestParam String userEmail) {
        UserProgressDto progress = userProgressService.getUserProgress(userId, userEmail);
        return ResponseEntity.ok(progress);
    }

    /**
     * Get user progress by email
     */
    @GetMapping("/email/{userEmail}")
    public ResponseEntity<UserProgressDto> getUserProgressByEmail(@PathVariable String userEmail) {
        // This endpoint assumes userId can be derived from email or comes from auth context
        // In production, you'd fetch userId from user-service
        UserProgressDto progress = userProgressService.getUserProgress(null, userEmail);
        return ResponseEntity.ok(progress);
    }

    /**
     * Update quiz session with userId
     */
    @PutMapping("/session/{sessionId}/user/{userId}")
    public ResponseEntity<Void> updateSessionUserId(
            @PathVariable Long sessionId,
            @PathVariable Long userId,
            @RequestParam String userEmail) {
        userProgressService.updateSessionUserId(sessionId, userId, userEmail);
        return ResponseEntity.ok().build();
    }

    /**
     * Update job application with userId
     */
    @PutMapping("/candidature/{candidatureId}/user/{userId}")
    public ResponseEntity<Void> updateCandidatureUserId(
            @PathVariable Long candidatureId,
            @PathVariable Long userId,
            @RequestParam String userEmail) {
        userProgressService.updateCandidatureUserId(candidatureId, userId, userEmail);
        return ResponseEntity.ok().build();
    }

    /**
     * Update certificate with userId
     */
    @PutMapping("/certificate/{certificateId}/user/{userId}")
    public ResponseEntity<Void> updateCertificateUserId(
            @PathVariable Long certificateId,
            @PathVariable Long userId,
            @RequestParam String userEmail) {
        userProgressService.updateCertificateUserId(certificateId, userId, userEmail);
        return ResponseEntity.ok().build();
    }
}
