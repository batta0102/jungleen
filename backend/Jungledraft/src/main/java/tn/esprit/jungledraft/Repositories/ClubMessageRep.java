package tn.esprit.jungledraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.jungledraft.Entities.ClubMessage;

import java.util.Date;
import java.util.List;

@Repository
public interface ClubMessageRep extends JpaRepository<ClubMessage, Long> {

    @Query("SELECT cm FROM ClubMessage cm WHERE cm.club.idClub = :clubId")
    List<ClubMessage> findByClubId(@Param("clubId") Long clubId);

    // 🔥 TOUTES LES MÉTHODES AVEC @Query - PAS DE MÉTHODES DÉRIVÉES

    @Query("SELECT m FROM ClubMessage m WHERE m.club.idClub = :clubId AND m.epingle = true ORDER BY m.dateEpingle DESC")
    List<ClubMessage> getMessagesEpingle(@Param("clubId") Long clubId);

    @Query("SELECT COUNT(m) FROM ClubMessage m WHERE m.club.idClub = :clubId AND m.epingle = true")
    long countMessagesEpingle(@Param("clubId") Long clubId);

    @Query("SELECT m FROM ClubMessage m WHERE m.club.idClub = :clubId AND m.epingle = false AND m.likes >= :minLikes AND m.dateEnvoi >= :dateLimite")
    List<ClubMessage> findMessagesViraux(@Param("clubId") Long clubId,
                                         @Param("minLikes") int minLikes,
                                         @Param("dateLimite") Date dateLimite);

    @Modifying
    @Transactional
    @Query("UPDATE ClubMessage m SET m.epingle = false, m.dateEpingle = NULL WHERE m.epingle = true AND m.dateEpingle <= :dateLimite")
    int desepinglerMessagesAnciens(@Param("dateLimite") Date dateLimite);
}