package tn.esprit.event.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.event.model.Event;
import tn.esprit.event.model.enums.EventStatus;
import tn.esprit.event.model.enums.EventType;

public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatus(EventStatus status);

    List<Event> findByType(EventType type);

    List<Event> findByStartDateBefore(LocalDateTime dateTime);
}
