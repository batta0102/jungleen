package tn.esprit.pidraft.Controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.Services.CertificationService;
import tn.esprit.pidraft.entities.Certificat;

import java.util.Map;

@RestController
@RequestMapping("/api/certification")
@RequiredArgsConstructor
public class CertificationController {

    private final CertificationService service;

    /**
     * POST /api/certification/check
     * Body: { "userEmail": "...", "userName": "..." }
     * Called after each quiz completion to check if the user now qualifies.
     * Returns the certificate if generated, or a progress status.
     */
    @PostMapping("/check")
    public ResponseEntity<Map<String, Object>> checkCertification(
            @RequestBody Map<String, String> payload) {

        String userEmail = payload.get("userEmail");
        String userName = payload.get("userName");

        if (userEmail == null || userEmail.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "userEmail is required"));
        }
        if (userName == null || userName.isBlank()) {
            userName = "Student";
        }

        Certificat cert = service.checkAndGenerateCertificate(userEmail, userName);

        if (cert != null) {
            return ResponseEntity.ok(Map.of(
                    "certified", true,
                    "certificate", Map.of(
                            "id", cert.getId(),
                            "certificateNumber", cert.getNumeroCertificat(),
                            "subject", cert.getMatiere(),
                            "averageScore", cert.getAveragePercentage(),
                            "dateIssued", cert.getDateDelivrance().toString(),
                            "quizTitles", cert.getQualifyingQuizTitles(),
                            "userName", cert.getUserName()
                    ),
                    "message", "Congratulations! Your certificate has been generated and sent to your email."
            ));
        }

        // Not yet qualified – return progress
        Map<String, Object> progress = service.getCertificationProgress(userEmail);
        progress.put("certified", false);
        progress.put("message", "Keep going! Pass " +
                (3 - ((Number) progress.get("qualifyingQuizzes")).intValue()) +
                " more quiz(zes) with 80%+ to earn your certificate.");
        return ResponseEntity.ok(progress);
    }

    /**
     * GET /api/certification/progress?email=...
     * Returns the user's progress toward certification.
     */
    @GetMapping("/progress")
    public ResponseEntity<Map<String, Object>> getProgress(
            @RequestParam String email) {
        Map<String, Object> progress = service.getCertificationProgress(email);
        return ResponseEntity.ok(progress);
    }
}
