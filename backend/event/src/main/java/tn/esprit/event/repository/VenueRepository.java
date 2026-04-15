package tn.esprit.event.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.event.model.Venue;

public interface VenueRepository extends JpaRepository<Venue, Long> {
}
