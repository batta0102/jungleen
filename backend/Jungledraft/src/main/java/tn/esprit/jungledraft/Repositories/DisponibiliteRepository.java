package tn.esprit.jungledraft.Repositories;

import tn.esprit.jungledraft.Entities.Disponibilite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DisponibiliteRepository extends JpaRepository<Disponibilite, Long> {


    @Query("SELECT d FROM Disponibilite d WHERE d.buddyPair.idPair = :buddyPairId AND d.debut BETWEEN :debut AND :fin")
    List<Disponibilite> findByBuddyPairIdAndDebutBetween(
            @Param("buddyPairId") Long buddyPairId,
            @Param("debut") LocalDateTime debut,
            @Param("fin") LocalDateTime fin);

    @Query("SELECT d FROM Disponibilite d WHERE d.buddyPair.idPair = :buddyPairId")
    List<Disponibilite> findByBuddyPairId(@Param("buddyPairId") Long buddyPairId);

    @Query("SELECT d FROM Disponibilite d WHERE d.buddyPair.idPair = :buddyPairId AND d.userId = :userId")
    List<Disponibilite> findByBuddyPairIdAndUserId(
            @Param("buddyPairId") Long buddyPairId,
            @Param("userId") Long userId);
}