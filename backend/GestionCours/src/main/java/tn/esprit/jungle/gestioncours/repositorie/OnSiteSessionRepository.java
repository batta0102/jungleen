package tn.esprit.jungle.gestioncours.repositorie;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import tn.esprit.jungle.gestioncours.entites.OnSiteSession;

import java.util.List;

public interface OnSiteSessionRepository extends JpaRepository<OnSiteSession, Long> {
    List<OnSiteSession> findByCourseId(Long courseId);
    boolean existsByClassroomIdAndDate(Long classroomId, java.util.Date date);
    boolean existsByClassroomIdAndDateAndIdNot(Long classroomId, java.util.Date date, Long id);

    @Query("select s.id from OnSiteSession s where s.course.id = :courseId")
    List<Long> findIdsByCourseId(Long courseId);
}
