package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.esprit.jungle.gestioncours.entites.OnSiteBooking;
import tn.esprit.jungle.gestioncours.entites.OnSiteSession;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.exception.ResourceNotFoundException;
import tn.esprit.jungle.gestioncours.repositorie.OnSiteBookingRepository;
import tn.esprit.jungle.gestioncours.repositorie.OnSiteSessionRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.OnSiteBookingService;
import tn.esprit.jungle.gestioncours.service.model.BookingCreationResult;
import tn.esprit.jungle.gestioncours.service.model.StudentOverloadCheckResult;

import java.util.List;

/**
 * OnSiteBookingService Implementation
 * Contains business logic for on-site booking operations
 * Handles validation, mapping, and persistence coordination
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OnSiteBookingServiceImpl implements OnSiteBookingService {

    private final OnSiteBookingRepository repository;
    private final OnSiteSessionRepository sessionRepository;
    private final StudentOverloadService studentOverloadService;

    @Override
    public BookingCreationResult<OnSiteBooking> addBooking(OnSiteBooking booking) {
        log.info("Attempting to add new on-site booking with bookingDate: {}, status: {}, studentId: {}, sessionId: {}", 
                 booking.getBookingDate(), booking.getStatus(), booking.getStudentId(),
                 booking.getSession() != null ? booking.getSession().getId() : null);
        
        validateInput(booking);

        Long sessionId = booking.getSession().getId();
        OnSiteSession managedSession = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("OnSiteSession with id " + sessionId + " not found"));

        StudentOverloadCheckResult overloadCheck = checkStudentOverload(booking.getStudentId(), managedSession);
        booking.setSession(managedSession);
        OnSiteBooking savedBooking = repository.save(booking);
        
        log.info("✅ On-site booking successfully saved to database with ID: {} | Date: {} | Status: {} | Student ID: {} | Session ID: {}", 
                 savedBooking.getId(), savedBooking.getBookingDate(), savedBooking.getStatus(), 
                 savedBooking.getStudentId(), savedBooking.getSession() != null ? savedBooking.getSession().getId() : null);
        
        return new BookingCreationResult<>(savedBooking, overloadCheck.getDailyWarningMessage());
    }

    @Override
    public StudentOverloadCheckResult checkStudentOverload(Long studentId, OnSiteSession newSession) {
        if (newSession == null || newSession.getDate() == null) {
            throw new InvalidInputException("Session date is required to validate overload");
        }
        return studentOverloadService.checkStudentOverload(studentId, newSession.getDate());
    }

    @Override
    public List<OnSiteBooking> getAllBookings() {
        log.info("Fetching all on-site bookings from database...");
        List<OnSiteBooking> bookings = repository.findAll();
        log.info("✅ Retrieved {} on-site booking(s) from database", bookings.size());
        return bookings;
    }

    @Override
    public OnSiteBooking getBookingById(Long id) {
        log.info("Fetching on-site booking with ID: {}", id);
        validateId(id);

        OnSiteBooking booking = repository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ On-site booking with ID {} not found in database", id);
                    return new ResourceNotFoundException(
                            "OnSiteBooking with id " + id + " not found");
                });
        
        log.info("✅ On-site booking found: ID={}, Status={}, StudentId={}", 
                 booking.getId(), booking.getStatus(), booking.getStudentId());
        return booking;
    }

    @Override
    public OnSiteBooking updateBooking(Long id, OnSiteBooking booking) {
        log.info("Attempting to update on-site booking with ID: {}", id);
        validateId(id);
        validateInput(booking);

        OnSiteBooking existingBooking = repository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Update failed: On-site booking with ID {} not found", id);
                    return new ResourceNotFoundException(
                            "OnSiteBooking with id " + id + " not found");
                });

        log.debug("Existing on-site booking before update: Status={}, StudentId={}",
                 existingBooking.getStatus(), existingBooking.getStudentId());
        
        if (booking.getBookingDate() != null) {
            existingBooking.setBookingDate(booking.getBookingDate());
        }
        if (booking.getStatus() != null) {
            existingBooking.setStatus(booking.getStatus());
        }
        if (booking.getStudentId() != null) {
            existingBooking.setStudentId(booking.getStudentId());
        }
        if (booking.getSession() != null) {
            existingBooking.setSession(booking.getSession());
        }

        OnSiteBooking updatedBooking = repository.save(existingBooking);
        log.info("✅ On-site booking with ID {} successfully updated in database | New Status: {} | New Student ID: {}", 
                 id, updatedBooking.getStatus(), updatedBooking.getStudentId());
        
        return updatedBooking;
    }

    @Override
    public void deleteBooking(Long id) {
        log.info("Attempting to delete on-site booking with ID: {}", id);
        validateId(id);

        OnSiteBooking existingBooking = repository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Delete failed: On-site booking with ID {} not found", id);
                    return new ResourceNotFoundException(
                            "OnSiteBooking with id " + id + " not found");
                });

        log.debug("On-site booking to be deleted: ID={}, Status={}, StudentId={}", 
                 existingBooking.getId(), existingBooking.getStatus(), existingBooking.getStudentId());
        
        repository.deleteById(id);
        log.info("✅ On-site booking with ID {} successfully deleted from database", id);
    }

    @Override
    public List<OnSiteBooking> getBookingsBySession(Long sessionId) {
        log.info("Fetching on-site bookings for session ID: {}", sessionId);
        validateId(sessionId);

        // Verify session exists
        sessionRepository.findById(sessionId)
                .orElseThrow(() -> {
                    log.error("❌ Session with ID {} not found", sessionId);
                    return new ResourceNotFoundException("OnSiteSession with id " + sessionId + " not found");
                });

        List<OnSiteBooking> bookings = repository.findBySessionId(sessionId);
        log.info("✅ Retrieved {} on-site booking(s) for session ID: {}", bookings.size(), sessionId);
        return bookings;
    }

    @Override
    public List<OnSiteBooking> getBookingsByStudent(Long studentId) {
        log.info("Fetching on-site bookings for student ID: {}", studentId);
        validateId(studentId);

        List<OnSiteBooking> bookings = repository.findByStudentId(studentId);
        log.info("✅ Retrieved {} on-site booking(s) for student ID: {}", bookings.size(), studentId);
        return bookings;
    }

    @Override
    public List<OnSiteBooking> getBookingsByStatus(String status) {
        log.info("Fetching on-site bookings with status: {}", status);
        
        if (status == null || status.isBlank()) {
            log.warn("⚠️ Status filter is null or blank");
            throw new InvalidInputException("Status cannot be null or blank");
        }

        List<OnSiteBooking> bookings = repository.findByStatus(status);
        log.info("✅ Retrieved {} on-site booking(s) with status: {}", bookings.size(), status);
        return bookings;
    }

    /**
     * Validates if the provided on-site booking has required fields
     * 
     * @param booking the on-site booking to validate
     * @throws InvalidInputException if validation fails
     */
    private void validateInput(OnSiteBooking booking) {
        if (booking == null) {
            log.warn("⚠️ Validation failed: On-site booking object is null");
            throw new InvalidInputException("On-site booking cannot be null");
        }
        if (booking.getBookingDate() == null) {
            log.warn("⚠️ Validation failed: On-site booking date is null");
            throw new InvalidInputException("Booking date is required");
        }
        if (booking.getStatus() == null || booking.getStatus().isBlank()) {
            log.warn("⚠️ Validation failed: On-site booking status is null or blank");
            throw new InvalidInputException("Status is required and cannot be blank");
        }
        if (booking.getStudentId() == null || booking.getStudentId() <= 0) {
            log.warn("⚠️ Validation failed: On-site booking studentId is invalid");
            throw new InvalidInputException("Student ID must be a positive number");
        }
        if (booking.getSession() == null || booking.getSession().getId() == null) {
            log.warn("⚠️ Validation failed: On-site booking session is missing or invalid");
            throw new InvalidInputException("Session is required for the booking");
        }
        log.debug("✅ On-site booking validation passed");
    }

    /**
     * Validates if the provided ID is valid (positive)
     * 
     * @param id the ID to validate
     * @throws InvalidInputException if ID is invalid
     */
    private void validateId(Long id) {
        if (id == null || id <= 0) {
            log.warn("⚠️ Validation failed: Invalid ID provided: {}", id);
            throw new InvalidInputException("ID must be a positive number");
        }
    }
}
