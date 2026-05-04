package tn.esprit.jungle.gestioncours.repositorie;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.jungle.gestioncours.entites.Intervention;
import tn.esprit.jungle.gestioncours.entites.InterventionStatus;

import java.util.List;

public interface InterventionRepository extends JpaRepository<Intervention, Long> {

    boolean existsByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, InterventionStatus status);

    List<Intervention> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<Intervention> findByCourseIdOrderByCreatedAtDesc(Long courseId);
}
