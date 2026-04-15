package tn.esprit.pidraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.pidraft.entities.SessionTest;
import tn.esprit.pidraft.entities.StatutSession;

import java.util.List;

public interface SessionTestRepository extends JpaRepository<SessionTest, Long> {

    List<SessionTest> findByUserEmailAndStatutOrderByDateFinDesc(
            String userEmail, StatutSession statut);

    List<SessionTest> findByUserEmailAndStatut(
            String userEmail, StatutSession statut);
}
