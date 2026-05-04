package tn.esprit.jungledraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.jungledraft.Entities.VocabulairePersonnel;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabulaireRepository extends JpaRepository<VocabulairePersonnel, Long> {

    Optional<VocabulairePersonnel> findByUserIdAndClubIdAndMot(Long userId, Long clubId, String mot);

    List<VocabulairePersonnel> findByUserIdAndClubIdOrderByFoisVuDesc(Long userId, Long clubId);

    List<VocabulairePersonnel> findByClubId(Long clubId);

    long countByUserIdAndClubId(Long userId, Long clubId);

    List<VocabulairePersonnel> findTop10ByClubIdOrderByFoisVuDesc(Long clubId);

    void deleteByUserIdAndClubId(Long userId, Long clubId);
}