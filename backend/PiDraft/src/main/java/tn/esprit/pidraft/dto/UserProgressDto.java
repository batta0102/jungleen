package tn.esprit.pidraft.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProgressDto {

    private Long userId;
    private String userName;
    private String userEmail;

    // Quiz progress
    private List<QuizProgressDto> quizzesCompleted;
    private List<CertificateDto> certificates;
    private Double averageQuizScore;
    private Integer totalQuizzesAttempted;

    // Career center progress
    private List<JobApplicationDto> jobApplications;
    private Integer interviewsScheduled;
    private Integer interviewsCompleted;

    // Overall progress
    private LocalDateTime lastActivityDate;
    private String progressPercentage;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizProgressDto {
        private Long sessionId;
        private String qcmTitle;
        private Double score;
        private Double percentage;
        private LocalDateTime completedDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CertificateDto {
        private Long certificateId;
        private String certificateNumber;
        private String subject;
        private Double averageScore;
        private LocalDateTime issuedDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JobApplicationDto {
        private Long candidatureId;
        private String jobTitle;
        private String status;
        private LocalDateTime applicationDate;
        private String interviewStatus;
    }
}
