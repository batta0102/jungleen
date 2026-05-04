package tn.esprit.jungle.gestioncours.repositorie;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.jungle.gestioncours.entites.Attendance;
import tn.esprit.jungle.gestioncours.entites.AttendanceStatus;
import tn.esprit.jungle.gestioncours.entites.SessionType;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findBySessionTypeAndSessionIdAndStudentId(SessionType type, Long sessionId, Long studentId);

    List<Attendance> findBySessionTypeAndSessionId(SessionType type, Long sessionId);

    List<Attendance> findBySessionTypeAndSessionIdIn(SessionType type, List<Long> sessionIds);

    long countByStudentIdAndSessionTypeAndSessionIdInAndStatusIn(Long studentId, SessionType type, List<Long> sessionIds, List<AttendanceStatus> statuses);
}
