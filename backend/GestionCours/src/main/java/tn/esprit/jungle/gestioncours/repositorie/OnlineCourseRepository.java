package tn.esprit.jungle.gestioncours.repositorie;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.jungle.gestioncours.entites.OnlineCourse;

public interface OnlineCourseRepository extends JpaRepository<OnlineCourse, Long> {
}
