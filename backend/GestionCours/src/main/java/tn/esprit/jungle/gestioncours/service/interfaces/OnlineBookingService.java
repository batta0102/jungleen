package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.entites.OnlineBooking;
import tn.esprit.jungle.gestioncours.entites.OnlineSession;
import tn.esprit.jungle.gestioncours.service.model.BookingCreationResult;
import tn.esprit.jungle.gestioncours.service.model.StudentOverloadCheckResult;

import java.util.List;

/**
 * OnlineBookingService Interface
 * Defines the business logic contract for online booking operations
 * Manages online booking CRUD operations and business rules
 */
public interface OnlineBookingService {

    /**
     * Creates a new online booking
     * 
     * @param booking the booking object containing booking details
     * @return the created booking
     */
    BookingCreationResult<OnlineBooking> addBooking(OnlineBooking booking);

    /**
     * Runs overload checks before booking confirmation.
     * Throws a conflict exception when overlap or weekly overload is detected.
     *
     * @param studentId student to validate
     * @param newSession session to check against existing bookings
     * @return result containing optional daily warning
     */
    StudentOverloadCheckResult checkStudentOverload(Long studentId, OnlineSession newSession);

    /**
     * Retrieves all online bookings
     * 
     * @return list of all bookings
     */
    List<OnlineBooking> getAllBookings();

    /**
     * Retrieves a specific booking by id
     * 
     * @param id the booking id
     * @return the booking with the given id
     */
    OnlineBooking getBookingById(Long id);

    /**
     * Updates an existing booking
     * 
     * @param id the booking id
     * @param booking the updated booking data
     * @return the updated booking
     */
    OnlineBooking updateBooking(Long id, OnlineBooking booking);

    /**
     * Deletes a booking
     * 
     * @param id the booking id
     */
    void deleteBooking(Long id);

    /**
     * Get all bookings for a specific session
     * 
     * @param sessionId the session id
     * @return list of bookings for the session
     */
    List<OnlineBooking> getBookingsBySession(Long sessionId);

    /**
     * Get all bookings for a specific student
     * 
     * @param studentId the student id
     * @return list of bookings for the student
     */
    List<OnlineBooking> getBookingsByStudent(Long studentId);

    /**
     * Get bookings by status
     * 
     * @param status the booking status
     * @return list of bookings with the specified status
     */
    List<OnlineBooking> getBookingsByStatus(String status);
}
