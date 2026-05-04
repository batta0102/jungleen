package tn.esprit.jungle.gestioncours.repositorie;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.jungle.gestioncours.entites.OnlineBooking;

import java.util.List;

/**
 * OnlineBookingRepository
 * Data access layer for OnlineBooking entity
 * Provides CRUD operations and custom queries for online bookings
 */
@Repository
public interface OnlineBookingRepository extends JpaRepository<OnlineBooking, Long> {
    
    /**
     * Find all bookings for a specific session
     * 
     * @param sessionId the session id
     * @return list of bookings for the session
     */
    List<OnlineBooking> findBySessionId(Long sessionId);
    
    /**
     * Find all bookings for a specific student
     * 
     * @param studentId the student id
     * @return list of bookings for the student
     */
    List<OnlineBooking> findByStudentId(Long studentId);
    
    /**
     * Find bookings by status
     * 
     * @param status the booking status
     * @return list of bookings with the specified status
     */
    List<OnlineBooking> findByStatus(String status);
}
