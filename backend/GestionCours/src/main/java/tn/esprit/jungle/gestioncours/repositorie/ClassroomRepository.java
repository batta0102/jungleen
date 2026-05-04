package tn.esprit.jungle.gestioncours.repositorie;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.jungle.gestioncours.entites.Classroom;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
}
