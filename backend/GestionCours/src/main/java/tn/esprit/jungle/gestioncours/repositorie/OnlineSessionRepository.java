package tn.esprit.jungle.gestioncours.repositorie;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tn.esprit.jungle.gestioncours.entites.OnlineSession;

import java.util.List;

/**
 * OnlineSessionRepository
 * Data access layer for OnlineSession entity
 * Provides CRUD operations and custom queries for online sessions
 */
@Repository
public interface OnlineSessionRepository extends JpaRepository<OnlineSession, Long> {

    /**
     * Find all sessions for a specific course
     *
     * @param courseId the course id
     * @return list of sessions for the course
     */
    List<OnlineSession> findByCourseId(Long courseId);

    /**
     * Find session IDs for a specific course
     *
     * @param courseId the course id
     * @return list of session IDs
     */
    @Query("select s.id from OnlineSession s where s.course.id = :courseId")
    List<Long> findIdsByCourseId(Long courseId);
}
