package tn.esprit.pidraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.pidraft.entities.Candidature;
import tn.esprit.pidraft.entities.Resultat;

import java.util.Optional;

@Repository
public interface CandidatureRepository extends JpaRepository<Candidature, Long> {
    Optional<Candidature> findByResultat(Resultat resultat);
}
