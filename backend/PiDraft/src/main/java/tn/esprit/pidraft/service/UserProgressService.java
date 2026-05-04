package tn.esprit.pidraft.service;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidraft.dto.UserProgressDto;
import tn.esprit.pidraft.entities.*;
import tn.esprit.pidraft.Repositories.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UserProgressService {

    private final SessionTestRepository sessionTestRepository;
    private final CertificatRepository certificatRepository;
    private final CandidatureRepository candidatureRepository;
    private final InterviewRepository interviewRepository;
    private final ResultatRepository resultatRepository;

    /**
     * Get comprehensive user progress including quizzes, certificates, and job applications
     */
    public UserProgressDto getUserProgress(Long userId, String userEmail) {
        UserProgressDto progress = new UserProgressDto();
        progress.setUserId(userId);
        progress.setUserEmail(userEmail);

        // Get all quiz sessions for this user
        List<SessionTest> sessions = sessionTestRepository.findAll().stream()
                .filter(s -> s.getUserId() != null && s.getUserId().equals(userId))
                .collect(Collectors.toList());

        // Build quiz progress list
        List<UserProgressDto.QuizProgressDto> quizzes = sessions.stream()
                .map(session -> new UserProgressDto.QuizProgressDto(
                        session.getId(),
                        session.getQcm() != null ? session.getQcm().getTitre() : "Unknown",
                        session.getScoreTotal(),
                        session.getPourcentage(),
                        session.getDateFin()
                ))
                .sorted(Comparator.comparing(UserProgressDto.QuizProgressDto::getCompletedDate).reversed())
                .collect(Collectors.toList());

        progress.setQuizzesCompleted(quizzes);
        progress.setTotalQuizzesAttempted(quizzes.size());

        // Calculate average score
        if (!quizzes.isEmpty()) {
            Double avgScore = quizzes.stream()
                    .mapToDouble(q -> q.getPercentage() != null ? q.getPercentage() : 0)
                    .average()
                    .orElse(0.0);
            progress.setAverageQuizScore(avgScore);
        }

        // Get all certificates for this user
        List<Certificat> certificates = certificatRepository.findAll().stream()
                .filter(c -> c.getUserId() != null && c.getUserId().equals(userId))
                .collect(Collectors.toList());

        List<UserProgressDto.CertificateDto> certs = certificates.stream()
                .map(cert -> new UserProgressDto.CertificateDto(
                        cert.getId(),
                        cert.getNumeroCertificat(),
                        cert.getMatiere(),
                        cert.getAveragePercentage(),
                        cert.getDateDelivrance().atStartOfDay()
                ))
                .collect(Collectors.toList());

        progress.setCertificates(certs);

        // Get all job applications for this user
        List<Candidature> applications = candidatureRepository.findAll().stream()
                .filter(c -> c.getUserId() != null && c.getUserId().equals(userId))
                .collect(Collectors.toList());

        List<UserProgressDto.JobApplicationDto> jobs = applications.stream()
                .map(app -> {
                    String interviewStatus = "NO_INTERVIEW";
                    List<Interview> interviews = interviewRepository.findAll().stream()
                            .filter(i -> i.getCandidature() != null && i.getCandidature().getId().equals(app.getId()))
                            .collect(Collectors.toList());
                    if (!interviews.isEmpty()) {
                        interviewStatus = interviews.get(0).getResultat() != null ? 
                                interviews.get(0).getResultat() : "SCHEDULED";
                    }

                    return new UserProgressDto.JobApplicationDto(
                            app.getId(),
                            app.getPoste() != null ? app.getPoste().getTitre() : "Unknown",
                            app.getStatut() != null ? app.getStatut().toString() : "PENDING",
                            app.getDateSoumission().atStartOfDay(),
                            interviewStatus
                    );
                })
                .sorted(Comparator.comparing(UserProgressDto.JobApplicationDto::getApplicationDate).reversed())
                .collect(Collectors.toList());

        progress.setJobApplications(jobs);

        // Get interview statistics
        long interviewsScheduledCount = interviewRepository.findAll().stream()
                .filter(i -> i.getUserId() != null && i.getUserId().equals(userId))
                .count();
        progress.setInterviewsScheduled((int) interviewsScheduledCount);

        long interviewsCompleted = interviewRepository.findAll().stream()
                .filter(i -> i.getUserId() != null && i.getUserId().equals(userId) && 
                       i.getResultat() != null)
                .count();
        progress.setInterviewsCompleted((int) interviewsCompleted);

        // Set last activity date
        LocalDateTime lastActivity = LocalDateTime.of(2000, 1, 1, 0, 0);
        if (!quizzes.isEmpty()) {
            lastActivity = quizzes.get(0).getCompletedDate();
        }
        if (!jobs.isEmpty() && jobs.get(0).getApplicationDate().isAfter(lastActivity)) {
            lastActivity = jobs.get(0).getApplicationDate();
        }
        progress.setLastActivityDate(lastActivity);

        // Calculate progress percentage (simple: certificates / (quizzes + jobs) + interviews)
        int totalActivities = quizzes.size() + jobs.size() + (int) interviewsCompleted;
        int completedActivities = certs.size() + (int) jobs.stream()
                .filter(j -> j.getInterviewStatus().equals("COMPLETED") || 
                            j.getStatus().equals("ACCEPTED"))
                .count();
        
        if (totalActivities > 0) {
            double percentage = (completedActivities * 100.0) / totalActivities;
            progress.setProgressPercentage(String.format("%.1f%%", percentage));
        } else {
            progress.setProgressPercentage("0.0%");
        }

        return progress;
    }

    /**
     * Update userId for a quiz session
     */
    public void updateSessionUserId(Long sessionId, Long userId, String userEmail) {
        sessionTestRepository.findById(sessionId).ifPresent(session -> {
            session.setUserId(userId);
            session.setUserEmail(userEmail);
            sessionTestRepository.save(session);
        });
    }

    /**
     * Update userId for a job application
     */
    public void updateCandidatureUserId(Long candidatureId, Long userId, String userEmail) {
        candidatureRepository.findById(candidatureId).ifPresent(candidature -> {
            candidature.setUserId(userId);
            candidature.setEmail(userEmail);
            candidatureRepository.save(candidature);
        });
    }

    /**
     * Update userId for a certificate
     */
    public void updateCertificateUserId(Long certificateId, Long userId, String userEmail) {
        certificatRepository.findById(certificateId).ifPresent(cert -> {
            cert.setUserId(userId);
            cert.setUserEmail(userEmail);
            certificatRepository.save(cert);
        });
    }
}
