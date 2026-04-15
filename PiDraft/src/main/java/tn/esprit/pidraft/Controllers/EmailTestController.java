package tn.esprit.pidraft.Controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.Services.EmailService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EmailTestController {

    private final EmailService emailService;

    @GetMapping("/test-email")
    public String testEmail() {
        try {
            System.out.println("🧪 Testing email configuration...");
            
            emailService.sendInterviewEmail(
                "trad.amal02@gmail.com",
                "Test Candidate",
                "Software Engineer",
                "2026-03-18 12:00",
                "EN_LIGNE",
                "https://meet.google.com/abc-defg-hij"
            );
            
            return "Email sent successfully!";
        } catch (Exception e) {
            e.printStackTrace();
            return "Email failed: " + e.getMessage();
        }
    }
}
