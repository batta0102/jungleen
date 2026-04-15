package tn.esprit.pidraft.dto.quiz;

import java.time.LocalDateTime;

public class QuizEventCreateRequest {
    private Long userId;
    private Long quizId;
    private String eventType;
    private LocalDateTime timestamp;
    private String details;
    private Long sessionTestId;

    public QuizEventCreateRequest() {}

    public QuizEventCreateRequest(Long userId, Long quizId, String eventType, LocalDateTime timestamp, String details, Long sessionTestId) {
        this.userId = userId;
        this.quizId = quizId;
        this.eventType = eventType;
        this.timestamp = timestamp;
        this.details = details;
        this.sessionTestId = sessionTestId;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public Long getSessionTestId() { return sessionTestId; }
    public void setSessionTestId(Long sessionTestId) { this.sessionTestId = sessionTestId; }
}

class QuizEventDto {
    private Long id;
    private Long userId;
    private Long quizId;
    private String eventType;
    private LocalDateTime timestamp;
    private String details;
    private Long sessionTestId;

    public QuizEventDto() {}

    public QuizEventDto(Long id, Long userId, Long quizId, String eventType, LocalDateTime timestamp, String details, Long sessionTestId) {
        this.id = id;
        this.userId = userId;
        this.quizId = quizId;
        this.eventType = eventType;
        this.timestamp = timestamp;
        this.details = details;
        this.sessionTestId = sessionTestId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public Long getSessionTestId() { return sessionTestId; }
    public void setSessionTestId(Long sessionTestId) { this.sessionTestId = sessionTestId; }
}
