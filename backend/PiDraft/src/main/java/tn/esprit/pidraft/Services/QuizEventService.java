package tn.esprit.pidraft.Services;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.pidraft.Repositories.QuizEventRepository;
import tn.esprit.pidraft.Repositories.SessionTestRepository;
import tn.esprit.pidraft.dto.quiz.QuizEventCreateRequest;
import tn.esprit.pidraft.entities.QuizEvent;
import tn.esprit.pidraft.entities.SessionTest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class QuizEventService {

    private final QuizEventRepository quizEventRepository;
    private final SessionTestRepository sessionTestRepository;

    // Threshold for automatic quiz submission/failure
    private static final int TAB_SWITCH_THRESHOLD = 2;

    public QuizEventService(
            QuizEventRepository quizEventRepository,
            SessionTestRepository sessionTestRepository
    ) {
        this.quizEventRepository = quizEventRepository;
        this.sessionTestRepository = sessionTestRepository;
    }

    /**
     * Record a quiz event (tab switch, blur, etc.)
     */
    public QuizEvent recordQuizEvent(QuizEventCreateRequest request) {
        System.out.println("Recording quiz event: " + request.getEventType() + " for session: " + request.getSessionTestId());

        QuizEvent event = new QuizEvent();
        event.setUserId(request.getUserId() != null ? request.getUserId().toString() : null);
        event.setQuizId(request.getQuizId());
        event.setEventType(QuizEvent.QuizEventType.valueOf(request.getEventType()));
        event.setTimestamp(request.getTimestamp() != null ? request.getTimestamp() : LocalDateTime.now());
        event.setDetails(request.getDetails());

        // Link to session if provided
        if (request.getSessionTestId() != null) {
            Optional<SessionTest> session = sessionTestRepository.findById(request.getSessionTestId());
            session.ifPresent(s -> {
                event.setSessionTest(s);
                if (s.getQuizEvents() == null) {
                    s.setQuizEvents(new java.util.ArrayList<>());
                }
                s.getQuizEvents().add(event);
            });
        }

        QuizEvent savedEvent = quizEventRepository.save(event);

        // Check if we need to trigger auto-submission
        if (request.getSessionTestId() != null) {
            evaluateSuspiciousBehavior(request.getSessionTestId());
        }

        return savedEvent;
    }

    /**
     * Evaluate suspicious behavior based on tab switches
     */
    private void evaluateSuspiciousBehavior(Long sessionTestId) {
        Optional<SessionTest> session = sessionTestRepository.findById(sessionTestId);

        session.ifPresent(s -> {
            // Count tab switches
            Long tabSwitchCount = quizEventRepository.countTabSwitchesBySessionId(sessionTestId);
            s.setTabSwitchCount(tabSwitchCount.intValue());

            System.out.println("⚠️ Tab switch detected for session " + sessionTestId + ": count = " + tabSwitchCount);

            // If threshold exceeded, mark as suspicious
            if (tabSwitchCount >= TAB_SWITCH_THRESHOLD) {
                s.setSuspiciousBehavior(true);
                System.out.println("🚨 SUSPICIOUS BEHAVIOR DETECTED at session " + sessionTestId + ": Tab switches = " + tabSwitchCount);
            }

            sessionTestRepository.save(s);
        });
    }

    /**
     * Get all events for a session
     */
    public List<QuizEvent> getEventsBySessionId(Long sessionTestId) {
        return quizEventRepository.findEventsBySessionIdOrderedByTimestamp(sessionTestId);
    }

    /**
     * Count tab switches for a session
     */
    public Long countTabSwitches(Long sessionTestId) {
        return quizEventRepository.countTabSwitchesBySessionId(sessionTestId);
    }

    /**
     * Get tab switch analysis for a session
     */
    public TabSwitchAnalysisDto getTabSwitchAnalysis(Long sessionTestId) {
        Long tabSwitchCount = countTabSwitches(sessionTestId);
        List<QuizEvent> events = getEventsBySessionId(sessionTestId);

        return new TabSwitchAnalysisDto(
                sessionTestId,
                tabSwitchCount,
                tabSwitchCount >= TAB_SWITCH_THRESHOLD,
                events.size()
        );
    }

    /**
     * DTO for tab switch analysis
     */
    public static class TabSwitchAnalysisDto {
        public Long sessionTestId;
        public Long tabSwitchCount;
        public Boolean isSuspicious;
        public Integer totalEventCount;

        public TabSwitchAnalysisDto(Long sessionTestId, Long tabSwitchCount, Boolean isSuspicious, Integer totalEventCount) {
            this.sessionTestId = sessionTestId;
            this.tabSwitchCount = tabSwitchCount;
            this.isSuspicious = isSuspicious;
            this.totalEventCount = totalEventCount;
        }
    }
}

