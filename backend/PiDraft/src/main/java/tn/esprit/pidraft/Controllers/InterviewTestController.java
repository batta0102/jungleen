package tn.esprit.pidraft.Controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.Services.InterviewService;
import tn.esprit.pidraft.entities.Interview;
import tn.esprit.pidraft.entities.Candidature;
import tn.esprit.pidraft.entities.Poste;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class InterviewTestController {

    private final InterviewService interviewService;

    @GetMapping("/create-test-interview")
    public String createTestInterview() {
        try {
            System.out.println("🧪 Creating test interview...");
            
            // Create a test interview
            Interview interview = new Interview();
            interview.setDateInterview(LocalDateTime.now().plusDays(1));
            interview.setType("EN_LIGNE");
            interview.setResultat("EN_ATTENTE");
            interview.setCommentaire("Test interview");
            interview.setMeetLink("https://meet.google.com/test-abc-def");
            
            // Create test candidature
            Candidature candidature = new Candidature();
            candidature.setId(1L); // Use existing candidature ID
            candidature.setNom("Test Applicant");
            candidature.setEmail("test@example.com");
            
            // Create test poste
            Poste poste = new Poste();
            poste.setId(1L); // Use existing poste ID
            poste.setTitre("Test Position");
            candidature.setPoste(poste);
            
            interview.setCandidature(candidature);
            
            Interview saved = interviewService.add(interview);
            
            return "✅ Test interview created successfully! ID: " + saved.getId();
        } catch (Exception e) {
            System.err.println("❌ Test interview failed: " + e.getMessage());
            e.printStackTrace();
            return "❌ Test interview failed: " + e.getMessage();
        }
    }
}
