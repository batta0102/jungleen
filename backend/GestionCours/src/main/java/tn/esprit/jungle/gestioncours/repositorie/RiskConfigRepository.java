package tn.esprit.jungle.gestioncours.repositorie;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.jungle.gestioncours.entites.RiskConfig;

import java.util.Optional;

public interface RiskConfigRepository extends JpaRepository<RiskConfig, Long> {
    Optional<RiskConfig> findByCourseId(Long courseId);
}
