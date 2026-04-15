package tn.esprit.pidraft.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidraft.Repositories.CandidatureRepository;
import tn.esprit.pidraft.Repositories.InterviewRepository;
import tn.esprit.pidraft.entities.Candidature;
import tn.esprit.pidraft.entities.Interview;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository repository;
    private final CandidatureRepository candidatureRepository;
    private final EmailService emailService;

    public Interview add(Interview i){
        System.out.println("🔔 InterviewService.add() called");
        
        // Validate and fetch the full Candidature from DB
        if (i.getCandidature() == null || i.getCandidature().getId() == null) {
            throw new IllegalArgumentException("Candidature ID is required");
        }
        
        Candidature fullCandidature = candidatureRepository.findById(i.getCandidature().getId())
                .orElseThrow(() -> new IllegalArgumentException("Candidature not found with ID: " + i.getCandidature().getId()));
        
        i.setCandidature(fullCandidature);
        System.out.println("✅ Loaded full candidature: " + fullCandidature.getNom() + " / " + fullCandidature.getEmail());
        
        // Set default values for potentially null fields
        if (i.getDateInterview() == null) {
            i.setDateInterview(java.time.LocalDateTime.now().plusDays(7));
        }
        if (i.getType() == null || i.getType().isEmpty()) {
            i.setType("EN_LIGNE");
        }
        if (i.getResultat() == null || i.getResultat().isEmpty()) {
            i.setResultat("EN_ATTENTE");
        }
        if (i.getCommentaire() == null) {
            i.setCommentaire("");
        }
        if (i.getMeetLink() == null) {
            i.setMeetLink("");
        }
        
        System.out.println("📝 Interview details - Type: " + i.getType() + ", Date: " + i.getDateInterview() + ", Candidate: " + fullCandidature.getNom());
        
        try {
            Interview savedInterview = repository.save(i);
            System.out.println("✅ Interview saved with ID: " + savedInterview.getId());
            
            // Send email notification after saving interview
            System.out.println("🔔 Interview saved, email notifications temporarily disabled");
            // sendInterviewEmail(savedInterview);
            
            return savedInterview;
        } catch (Exception e) {
            System.err.println("❌ Error saving interview: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to save interview: " + e.getMessage(), e);
        }
    }

    private void sendInterviewEmail(Interview interview) {
        System.out.println("📧 InterviewService.sendInterviewEmail() called");
        try {
            if (interview.getCandidature() != null) {
                // Get real candidate email and name
                String candidateEmail = interview.getCandidature().getEmail();
                String candidateName = interview.getCandidature().getNom();
                String jobTitle = interview.getCandidature().getPoste() != null ? 
                    interview.getCandidature().getPoste().getTitre() : "Position";
                
                System.out.println("📧 Email details - Candidate: " + candidateName + ", Email: " + candidateEmail + ", Job: " + jobTitle);
                
                // Null-check candidate email before sending
                if (candidateEmail != null && !candidateEmail.isEmpty()) {
                    try {
                        // Format interview date nicely
                        String formattedDate = interview.getDateInterview() != null ?
                            interview.getDateInterview().format(DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' h:mm a")) :
                            "TBD";
                        
                        String interviewType = interview.getType();
                        String meetLink = interview.getMeetLink();
                        
                        System.out.println("📧 Calling EmailService.sendInterviewEmail()");
                        emailService.sendInterviewEmail(
                            candidateEmail,   // ✅ Real candidate email
                            candidateName,
                            jobTitle,
                            formattedDate,
                            interviewType,
                            meetLink
                        );
                        System.out.println("✅ Email sent to real candidate: " + candidateEmail);
                    } catch (Exception mailException) {
                        // Log email error but don't fail the interview creation
                        System.err.println("⚠️ Failed to send email to " + candidateEmail + ": " + mailException.getMessage());
                        mailException.printStackTrace();
                    }
                } else {
                    System.out.println("❌ No email found for candidate: " + candidateName);
                }
            } else {
                System.out.println("⚠️ Cannot send email - interview has no candidature");
            }
        } catch (Exception e) {
            System.err.println("❌ Unexpected error in sendInterviewEmail: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public List<Interview> getAll(){
        return repository.findAll();
    }

    public Interview getById(Long id){
        return repository.findById(id)
                .orElseThrow();
    }

    public Interview update(Long id,
                            Interview i){

        Interview in = getById(id);

        in.setDateInterview(
                i.getDateInterview());
        in.setType(i.getType());
        in.setResultat(i.getResultat());
        in.setCommentaire(
                i.getCommentaire());
        in.setMeetLink(i.getMeetLink());

        return repository.save(in);
    }

    public void delete(Long id){
        repository.deleteById(id);
    }
}