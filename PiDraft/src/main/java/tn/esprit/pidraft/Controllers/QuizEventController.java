package tn.esprit.pidraft.Controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.Services.QuizEventService;
import tn.esprit.pidraft.dto.quiz.QuizEventCreateRequest;
import tn.esprit.pidraft.entities.QuizEvent;

import java.util.List;

@RestController
@RequestMapping("/api/quiz-events")
public class QuizEventController {

    private final QuizEventService quizEventService;

    public QuizEventController(QuizEventService quizEventService) {
        this.quizEventService = quizEventService;
    }

    /**
     * Record a quiz event (tab switch, blur, etc.)
     * POST /api/quiz-events
     */
    @PostMapping
    public ResponseEntity<QuizEvent> recordEvent(@RequestBody QuizEventCreateRequest request) {
        System.out.println("Recording quiz event: " + request.getEventType());

        try {
            QuizEvent event = quizEventService.recordQuizEvent(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(event);
        } catch (Exception e) {
            System.err.println("Error recording quiz event: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all events for a session
     * GET /api/quiz-events/session/{sessionTestId}
     */
    @GetMapping("/session/{sessionTestId}")
    public ResponseEntity<List<QuizEvent>> getEventsBySession(@PathVariable Long sessionTestId) {
        System.out.println("Fetching events for session: " + sessionTestId);

        List<QuizEvent> events = quizEventService.getEventsBySessionId(sessionTestId);
        return ResponseEntity.ok(events);
    }

    /**
     * Get tab switch analysis for a session
     * GET /api/quiz-events/session/{sessionTestId}/analysis
     */
    @GetMapping("/session/{sessionTestId}/analysis")
    public ResponseEntity<QuizEventService.TabSwitchAnalysisDto> getAnalysis(@PathVariable Long sessionTestId) {
        System.out.println("Getting tab switch analysis for session: " + sessionTestId);

        QuizEventService.TabSwitchAnalysisDto analysis = quizEventService.getTabSwitchAnalysis(sessionTestId);
        return ResponseEntity.ok(analysis);
    }

    /**
     * Count tab switches for a session
     * GET /api/quiz-events/session/{sessionTestId}/tab-switch-count
     */
    @GetMapping("/session/{sessionTestId}/tab-switch-count")
    public ResponseEntity<Long> getTabSwitchCount(@PathVariable Long sessionTestId) {
        System.out.println("Getting tab switch count for session: " + sessionTestId);

        Long count = quizEventService.countTabSwitches(sessionTestId);
        return ResponseEntity.ok(count);
    }
}
