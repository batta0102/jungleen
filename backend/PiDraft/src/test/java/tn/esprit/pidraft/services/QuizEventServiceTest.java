package tn.esprit.pidraft.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.pidraft.Repositories.QuizEventRepository;
import tn.esprit.pidraft.Repositories.SessionTestRepository;
import tn.esprit.pidraft.Services.QuizEventService;
import tn.esprit.pidraft.dto.quiz.QuizEventCreateRequest;
import tn.esprit.pidraft.entities.QuizEvent;
import tn.esprit.pidraft.entities.SessionTest;

@ExtendWith(MockitoExtension.class)
class QuizEventServiceTest {

    @Mock
    private QuizEventRepository quizEventRepository;

    @Mock
    private SessionTestRepository sessionTestRepository;

    @InjectMocks
    private QuizEventService quizEventService;

    @Test
    void recordQuizEvent_shouldMarkSessionSuspiciousWhenThresholdReached() {
        SessionTest session = new SessionTest();
        session.setId(99L);
        session.setSuspiciousBehavior(false);
        session.setTabSwitchCount(0);

        QuizEventCreateRequest request = new QuizEventCreateRequest();
        request.setUserId(10L);
        request.setQuizId(20L);
        request.setSessionTestId(99L);
        request.setEventType("TAB_SWITCH");
        request.setTimestamp(LocalDateTime.now());

        when(sessionTestRepository.findById(99L)).thenReturn(Optional.of(session));
        when(quizEventRepository.save(any(QuizEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        when(quizEventRepository.countTabSwitchesBySessionId(99L)).thenReturn(2L);

        QuizEvent saved = quizEventService.recordQuizEvent(request);

        assertNotNull(saved);
        assertEquals(20L, saved.getQuizId());
        assertTrue(session.getSuspiciousBehavior());
        assertEquals(2, session.getTabSwitchCount());
        verify(sessionTestRepository).save(session);
    }

    @Test
    void recordQuizEvent_withoutSessionIdShouldNotTriggerSessionUpdate() {
        QuizEventCreateRequest request = new QuizEventCreateRequest();
        request.setEventType("TAB_SWITCH");
        request.setQuizId(1L);
        request.setUserId(2L);

        when(quizEventRepository.save(any(QuizEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        QuizEvent saved = quizEventService.recordQuizEvent(request);

        assertNotNull(saved);
        assertEquals(QuizEvent.QuizEventType.TAB_SWITCH, saved.getEventType());
        verify(sessionTestRepository, never()).save(any(SessionTest.class));
        verify(quizEventRepository, never()).countTabSwitchesBySessionId(any());
    }

    @Test
    void getTabSwitchAnalysis_shouldReturnComputedFlags() {
        QuizEvent event = new QuizEvent();
        event.setEventType(QuizEvent.QuizEventType.TAB_SWITCH);

        when(quizEventRepository.countTabSwitchesBySessionId(7L)).thenReturn(1L);
        when(quizEventRepository.findEventsBySessionIdOrderedByTimestamp(7L)).thenReturn(List.of(event));

        QuizEventService.TabSwitchAnalysisDto analysis = quizEventService.getTabSwitchAnalysis(7L);

        assertEquals(7L, analysis.sessionTestId);
        assertEquals(1L, analysis.tabSwitchCount);
        assertFalse(analysis.isSuspicious);
        assertEquals(1, analysis.totalEventCount);
        verify(quizEventRepository).countTabSwitchesBySessionId(eq(7L));
    }
}