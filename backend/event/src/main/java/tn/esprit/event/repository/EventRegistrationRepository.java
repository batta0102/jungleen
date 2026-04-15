package tn.esprit.event.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.event.model.EventRegistration;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {
    
    List<EventRegistration> findByEventId(Long eventId);
    
    Optional<EventRegistration> findByEventIdAndEmail(Long eventId, String email);

    List<EventRegistration> findByEmail(String email);
    
    boolean existsByEventIdAndEmail(Long eventId, String email);
    
    long countByEventId(Long eventId);
}
