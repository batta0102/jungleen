package tn.esprit.jungle.gestioncours.repositorie;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.jungle.gestioncours.entites.OnSiteBooking;
import java.util.List;

public interface OnSiteBookingRepository extends JpaRepository<OnSiteBooking, Long> {
    List<OnSiteBooking> findBySessionId(Long sessionId);
    List<OnSiteBooking> findByStudentId(Long studentId);
    List<OnSiteBooking> findByStatus(String status);
}
