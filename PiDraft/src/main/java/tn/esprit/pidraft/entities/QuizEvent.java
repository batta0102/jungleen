package tn.esprit.pidraft.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_events")
public class QuizEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;
    private Long quizId;

    @Enumerated(EnumType.STRING)
    private QuizEventType eventType;

    private LocalDateTime timestamp;
    private String details;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_test_id")
    private SessionTest sessionTest;

    public QuizEvent() {}

    public QuizEvent(String userId, Long quizId, QuizEventType eventType, LocalDateTime timestamp, String details, SessionTest sessionTest) {
        this.userId = userId;
        this.quizId = quizId;
        this.eventType = eventType;
        this.timestamp = timestamp;
        this.details = details;
        this.sessionTest = sessionTest;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Long getQuizId() { return quizId; }
    public void setQuizId(Long quizId) { this.quizId = quizId; }

    public QuizEventType getEventType() { return eventType; }
    public void setEventType(QuizEventType eventType) { this.eventType = eventType; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public SessionTest getSessionTest() { return sessionTest; }
    public void setSessionTest(SessionTest sessionTest) { this.sessionTest = sessionTest; }

    public enum QuizEventType {
        TAB_SWITCH,
        WINDOW_BLUR,
        VISIBILITY_CHANGE,
        QUIZ_SUBMITTED,
        QUIZ_FAILED,
        QUIZ_STARTED,
        QUIZ_PAUSED
    }
}
