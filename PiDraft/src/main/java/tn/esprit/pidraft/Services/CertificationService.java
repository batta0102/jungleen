package tn.esprit.pidraft.Services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.pidraft.Repositories.CertificatRepository;
import tn.esprit.pidraft.Repositories.SessionTestRepository;
import tn.esprit.pidraft.entities.Certificat;
import tn.esprit.pidraft.entities.SessionTest;
import tn.esprit.pidraft.entities.StatutSession;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificationService {

    private final SessionTestRepository sessionTestRepository;
    private final CertificatRepository certificatRepository;
    private final EmailService emailService;

    private static final double SCORE_THRESHOLD = 80.0;
    private static final int REQUIRED_DISTINCT_QUIZZES = 3;

    /**
     * Check if the user qualifies for a certificate after completing a quiz.
     * Requirements: pass 3 DIFFERENT QCMs each with >= 80%.
     * Returns the Certificat if generated, or null if not yet qualified.
     */
    public Certificat checkAndGenerateCertificate(String userEmail, String userName) {
        log.info("Checking certification eligibility for: {} ({})", userName, userEmail);

        // Already has a certificate? Don't generate again.
        if (certificatRepository.existsByUserEmail(userEmail)) {
            log.info("User {} already has a certificate", userEmail);
            return certificatRepository.findByUserEmail(userEmail).get(0);
        }

        // Get all completed sessions for this user
        List<SessionTest> completedSessions = sessionTestRepository
                .findByUserEmailAndStatutOrderByDateFinDesc(userEmail, StatutSession.TERMINEE);

        // Group by QCM id -> keep the best score for each unique QCM
        Map<Long, SessionTest> bestPerQcm = new LinkedHashMap<>();
        for (SessionTest session : completedSessions) {
            if (session.getQcm() == null) continue;
            Long qcmId = session.getQcm().getId();

            if (!bestPerQcm.containsKey(qcmId) ||
                    session.getPourcentage() > bestPerQcm.get(qcmId).getPourcentage()) {
                bestPerQcm.put(qcmId, session);
            }
        }

        // Filter only those with >= 80%
        List<SessionTest> qualifyingSessions = bestPerQcm.values().stream()
                .filter(s -> s.getPourcentage() != null && s.getPourcentage() >= SCORE_THRESHOLD)
                .collect(Collectors.toList());

        log.info("User {} has {} distinct QCMs with >= 80%", userEmail, qualifyingSessions.size());

        if (qualifyingSessions.size() < REQUIRED_DISTINCT_QUIZZES) {
            // Not enough qualifying quizzes yet
            return null;
        }

        // Take the first 3 qualifying quizzes
        List<SessionTest> top3 = qualifyingSessions.subList(0,
                Math.min(REQUIRED_DISTINCT_QUIZZES, qualifyingSessions.size()));

        // Calculate average score
        double avgPercentage = top3.stream()
                .mapToDouble(SessionTest::getPourcentage)
                .average()
                .orElse(0.0);

        String quizTitles = top3.stream()
                .map(s -> s.getQcm().getTitre())
                .collect(Collectors.joining(", "));

        // Generate certificate
        Certificat certificat = new Certificat();
        certificat.setNumeroCertificat("JIE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        certificat.setMatiere("English Proficiency");
        certificat.setScoreFinal(avgPercentage);
        certificat.setDateDelivrance(LocalDate.now());
        certificat.setUserName(userName);
        certificat.setUserEmail(userEmail);
        certificat.setQualifyingQuizTitles(quizTitles);
        certificat.setAveragePercentage(avgPercentage);

        certificat = certificatRepository.save(certificat);
        log.info("Certificate generated for {}: {}", userEmail, certificat.getNumeroCertificat());

        // Send certificate email
        try {
            String certificateHtml = buildCertificateHtml(certificat);
            emailService.sendCertificateEmail(userEmail, userName, certificat.getNumeroCertificat(), certificateHtml);
            log.info("Certificate email sent to {}", userEmail);
        } catch (Exception e) {
            log.error("Failed to send certificate email to {}: {}", userEmail, e.getMessage());
            // Don't fail the whole operation if email fails
        }

        return certificat;
    }

    /**
     * Get certification progress for a user.
     */
    public Map<String, Object> getCertificationProgress(String userEmail) {
        Map<String, Object> progress = new LinkedHashMap<>();

        boolean hasCertificate = certificatRepository.existsByUserEmail(userEmail);
        progress.put("hasCertificate", hasCertificate);

        if (hasCertificate) {
            Certificat cert = certificatRepository.findByUserEmail(userEmail).get(0);
            progress.put("certificate", cert);
        }

        List<SessionTest> completedSessions = sessionTestRepository
                .findByUserEmailAndStatutOrderByDateFinDesc(userEmail, StatutSession.TERMINEE);

        Map<Long, SessionTest> bestPerQcm = new LinkedHashMap<>();
        for (SessionTest session : completedSessions) {
            if (session.getQcm() == null) continue;
            Long qcmId = session.getQcm().getId();
            if (!bestPerQcm.containsKey(qcmId) ||
                    session.getPourcentage() > bestPerQcm.get(qcmId).getPourcentage()) {
                bestPerQcm.put(qcmId, session);
            }
        }

        long qualifyingCount = bestPerQcm.values().stream()
                .filter(s -> s.getPourcentage() != null && s.getPourcentage() >= SCORE_THRESHOLD)
                .count();

        progress.put("qualifyingQuizzes", qualifyingCount);
        progress.put("requiredQuizzes", REQUIRED_DISTINCT_QUIZZES);
        progress.put("scoreThreshold", SCORE_THRESHOLD);

        List<Map<String, Object>> quizDetails = bestPerQcm.values().stream()
                .map(s -> {
                    Map<String, Object> detail = new LinkedHashMap<>();
                    detail.put("qcmId", s.getQcm().getId());
                    detail.put("qcmTitle", s.getQcm().getTitre());
                    detail.put("bestScore", s.getPourcentage());
                    detail.put("qualifies", s.getPourcentage() != null && s.getPourcentage() >= SCORE_THRESHOLD);
                    return detail;
                })
                .collect(Collectors.toList());

        progress.put("quizScores", quizDetails);
        return progress;
    }

    /**
     * Build a beautiful HTML certificate matching the Jungle in English design.
     */
    private String buildCertificateHtml(Certificat cert) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
        String dateStr = cert.getDateDelivrance().format(formatter);

        return """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');

          body {
            margin: 0; padding: 0;
            background-color: #f7ede2;
            font-family: 'Inter', sans-serif;
          }

          .certificate-wrapper {
            max-width: 700px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(45,87,87,0.15);
            border: 3px solid #2d5757;
          }

          .cert-header {
            background: linear-gradient(135deg, #2d5757 0%%, #3a7070 50%%, #2d5757 100%%);
            padding: 40px 40px 30px;
            text-align: center;
            position: relative;
          }

          .cert-header::after {
            content: '';
            position: absolute;
            bottom: -20px;
            left: 50%%;
            transform: translateX(-50%%);
            width: 60px;
            height: 60px;
            background: #f7ede2;
            border-radius: 50%%;
            border: 4px solid #2d5757;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .cert-logo {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 700;
            color: #f7ede2;
            letter-spacing: 1px;
            margin-bottom: 4px;
          }

          .cert-subtitle {
            color: rgba(247,237,226,0.8);
            font-size: 13px;
            font-weight: 300;
            letter-spacing: 3px;
            text-transform: uppercase;
          }

          .cert-badge {
            display: block;
            margin: 25px auto 0;
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #d4af37, #f4d03f, #d4af37);
            border-radius: 50%%;
            border: 3px solid rgba(247,237,226,0.5);
            line-height: 70px;
            text-align: center;
            font-size: 32px;
          }

          .cert-body {
            padding: 50px 50px 30px;
            text-align: center;
          }

          .cert-ornament {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 30px;
          }

          .cert-ornament-line {
            width: 80px;
            height: 1px;
            background: linear-gradient(to right, transparent, #2d5757, transparent);
          }

          .cert-ornament-diamond {
            width: 8px;
            height: 8px;
            background: #2d5757;
            transform: rotate(45deg);
          }

          .cert-presented {
            font-size: 14px;
            color: #6b8e8e;
            text-transform: uppercase;
            letter-spacing: 4px;
            font-weight: 500;
            margin-bottom: 15px;
          }

          .cert-name {
            font-family: 'Playfair Display', serif;
            font-size: 38px;
            font-weight: 700;
            color: #2d5757;
            margin: 10px 0 20px;
            line-height: 1.2;
          }

          .cert-description {
            font-size: 15px;
            color: #5a7a7a;
            line-height: 1.7;
            max-width: 500px;
            margin: 0 auto 30px;
          }

          .cert-stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 30px 0;
            flex-wrap: wrap;
          }

          .cert-stat {
            background: linear-gradient(135deg, #f7ede2, #fdf6ef);
            border: 1px solid rgba(45,87,87,0.15);
            border-radius: 14px;
            padding: 18px 25px;
            min-width: 130px;
          }

          .cert-stat-value {
            font-family: 'Playfair Display', serif;
            font-size: 26px;
            font-weight: 700;
            color: #2d5757;
            margin-bottom: 4px;
          }

          .cert-stat-label {
            font-size: 11px;
            color: #8ba3a3;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 500;
          }

          .cert-quizzes {
            margin: 25px auto;
            max-width: 450px;
          }

          .cert-quiz-tag {
            display: inline-block;
            background: #2d5757;
            color: #f7ede2;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            margin: 4px;
          }

          .cert-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 20px 50px 40px;
            border-top: 1px solid rgba(45,87,87,0.1);
          }

          .cert-footer-col {
            text-align: center;
          }

          .cert-footer-value {
            font-size: 14px;
            font-weight: 600;
            color: #2d5757;
            margin-bottom: 4px;
          }

          .cert-footer-label {
            font-size: 11px;
            color: #8ba3a3;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .cert-id {
            text-align: center;
            padding: 15px;
            background: #f7ede2;
            font-size: 11px;
            color: #8ba3a3;
            letter-spacing: 2px;
          }
        </style>
        </head>
        <body>

        <div class="certificate-wrapper">
          <div class="cert-header">
            <div class="cert-logo">Jungle in English</div>
            <div class="cert-subtitle">Certificate of Achievement</div>
            <span class="cert-badge">\uD83C\uDFC6</span>
          </div>

          <div class="cert-body">
            <div class="cert-ornament">
              <div class="cert-ornament-line"></div>
              <div class="cert-ornament-diamond"></div>
              <div class="cert-ornament-line"></div>
            </div>

            <div class="cert-presented">This is proudly presented to</div>
            <div class="cert-name">%s</div>
            <div class="cert-description">
              For demonstrating outstanding English proficiency by successfully completing
              <strong>%d quizzes</strong> with a minimum score of <strong>80%%</strong> each,
              achieving an average score of <strong>%.1f%%</strong>.
            </div>

            <div class="cert-stats">
              <div class="cert-stat">
                <div class="cert-stat-value">%.1f%%</div>
                <div class="cert-stat-label">Average Score</div>
              </div>
              <div class="cert-stat">
                <div class="cert-stat-value">%d/%d</div>
                <div class="cert-stat-label">Quizzes Passed</div>
              </div>
              <div class="cert-stat">
                <div class="cert-stat-value">\u2713</div>
                <div class="cert-stat-label">Certified</div>
              </div>
            </div>

            <div class="cert-quizzes">
              %s
            </div>
          </div>

          <div class="cert-footer">
            <div class="cert-footer-col">
              <div class="cert-footer-value">%s</div>
              <div class="cert-footer-label">Date Issued</div>
            </div>
            <div class="cert-footer-col">
              <div class="cert-footer-value">Jungle in English</div>
              <div class="cert-footer-label">Issued By</div>
            </div>
          </div>

          <div class="cert-id">CERTIFICATE ID: %s</div>
        </div>

        </body>
        </html>
        """.formatted(
                cert.getUserName(),
                REQUIRED_DISTINCT_QUIZZES,
                cert.getAveragePercentage(),
                cert.getAveragePercentage(),
                REQUIRED_DISTINCT_QUIZZES, REQUIRED_DISTINCT_QUIZZES,
                buildQuizTags(cert.getQualifyingQuizTitles()),
                dateStr,
                cert.getNumeroCertificat()
        );
    }

    private String buildQuizTags(String quizTitles) {
        if (quizTitles == null || quizTitles.isBlank()) return "";
        return Arrays.stream(quizTitles.split(","))
                .map(String::trim)
                .map(title -> "<span class=\"cert-quiz-tag\">" + title + "</span>")
                .collect(Collectors.joining("\n"));
    }
}
