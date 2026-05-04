package tn.esprit.pidraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tn.esprit.pidraft.entities.QuizEvent;

import java.time.LocalDateTime;
import java.util.List;

public interface QuizEventRepository extends JpaRepository<QuizEvent, Long> {

    List<QuizEvent> findBySessionTestId(Long sessionTestId);

    List<QuizEvent> findBySessionTestIdAndEventType(Long sessionTestId, QuizEvent.QuizEventType eventType);

    @Query("SELECT COUNT(qe) FROM QuizEvent qe WHERE qe.sessionTest.id = :sessionTestId AND qe.eventType = 'TAB_SWITCH'")
    Long countTabSwitchesBySessionId(@Param("sessionTestId") Long sessionTestId);

    @Query("SELECT qe FROM QuizEvent qe WHERE qe.sessionTest.id = :sessionTestId ORDER BY qe.timestamp DESC")
    List<QuizEvent> findEventsBySessionIdOrderedByTimestamp(@Param("sessionTestId") Long sessionTestId);
}
