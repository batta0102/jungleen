package tn.esprit.jungledraft.Repositories;

import tn.esprit.jungledraft.Entities.EvenementCalendrier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EvenementCalendrierRepository extends JpaRepository<EvenementCalendrier, Long> {

    // SOLUTION 1 : Utiliser le bon nom de propriété
    List<EvenementCalendrier> findByBuddyPairIdPair(Long buddyPairId);

    List<EvenementCalendrier> findByBuddyPairIdPairAndDateDebutBetween(Long buddyPairId, LocalDateTime debut, LocalDateTime fin);

    // Cette méthode n'a pas besoin de correction
    List<EvenementCalendrier> findByRappelEnvoyeFalseAndDateDebutLessThan(LocalDateTime date);
    List<EvenementCalendrier> findByRappelEnvoyeFalseAndDateDebutBetween(LocalDateTime debut, LocalDateTime fin);
    List<EvenementCalendrier> findByDateDebutBetween(LocalDateTime debut, LocalDateTime fin);
}