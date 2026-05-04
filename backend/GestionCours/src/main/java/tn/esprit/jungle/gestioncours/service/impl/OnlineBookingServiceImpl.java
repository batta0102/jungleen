package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.jungle.gestioncours.entites.OnlineBooking;
import tn.esprit.jungle.gestioncours.entites.OnlineSession;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.exception.ResourceNotFoundException;
import tn.esprit.jungle.gestioncours.repositorie.OnlineBookingRepository;
import tn.esprit.jungle.gestioncours.repositorie.OnlineSessionRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.OnlineBookingService;
import tn.esprit.jungle.gestioncours.service.model.BookingCreationResult;
import tn.esprit.jungle.gestioncours.service.model.StudentOverloadCheckResult;

import java.util.List;

/**
 * OnlineBookingService Implementation
 * Contains business logic for online booking operations
 * Handles validation, mapping, and persistence coordination
 */
@Service
@RequiredArgsConstructor
public class OnlineBookingServiceImpl implements OnlineBookingService {

    private final OnlineBookingRepository repository;
    private final OnlineSessionRepository sessionRepository;
    private final StudentOverloadService studentOverloadService;

    @Override
    public BookingCreationResult<OnlineBooking> addBooking(OnlineBooking booking) {
        validateInput(booking);

        Long sessionId = booking.getSession() != null ? booking.getSession().getId() : null;
        if (sessionId == null) {
            throw new ResourceNotFoundException(
                    "Session ID is required and must reference an existing online_sessions.id.");
        }
        // Load session from DB so it's a managed entity (avoids FK constraint / detached entity)
        OnlineSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "OnlineSession with id " + sessionId + " not found. Create an Online session first."));

        StudentOverloadCheckResult overloadCheck = checkStudentOverload(booking.getStudentId(), session);
        booking.setSession(session);
        OnlineBooking createdBooking = repository.save(booking);

        return new BookingCreationResult<>(createdBooking, overloadCheck.getDailyWarningMessage());
    }

    @Override
    public StudentOverloadCheckResult checkStudentOverload(Long studentId, OnlineSession newSession) {
        if (newSession == null || newSession.getDate() == null) {
            throw new InvalidInputException("Session date is required to validate overload");
        }
        return studentOverloadService.checkStudentOverload(studentId, newSession.getDate());
    }

    @Override
    public List<OnlineBooking> getAllBookings() {
        return repository.findAll();
    }

    @Override
    public OnlineBooking getBookingById(Long id) {
        validateId(id);

        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "OnlineBooking with id " + id + " not found"));
    }

    @Override
    public OnlineBooking updateBooking(Long id, OnlineBooking booking) {
        validateId(id);
        validateInput(booking);

        OnlineBooking existingBooking = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "OnlineBooking with id " + id + " not found"));

        // Verify that the session exists when updating - load managed entity
        if (booking.getSession() != null && booking.getSession().getId() != null) {
            OnlineSession session = sessionRepository.findById(booking.getSession().getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "OnlineSession with id " + booking.getSession().getId() + " not found"));
            existingBooking.setSession(session);
        } else if (booking.getSession() != null) {
            existingBooking.setSession(booking.getSession());
        }

        if (booking.getBookingDate() != null) {
            existingBooking.setBookingDate(booking.getBookingDate());
        }
        if (booking.getStatus() != null) {
            existingBooking.setStatus(booking.getStatus());
        }
        if (booking.getStudentId() != null) {
            existingBooking.setStudentId(booking.getStudentId());
        }

        return repository.save(existingBooking);
    }

    @Override
    public void deleteBooking(Long id) {
        validateId(id);

        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException(
                    "OnlineBooking with id " + id + " not found");
        }

        repository.deleteById(id);
    }

    @Override
    public List<OnlineBooking> getBookingsBySession(Long sessionId) {
        validateId(sessionId);
        return repository.findBySessionId(sessionId);
    }

    @Override
    public List<OnlineBooking> getBookingsByStudent(Long studentId) {
        validateId(studentId);
        return repository.findByStudentId(studentId);
    }

    @Override
    public List<OnlineBooking> getBookingsByStatus(String status) {
        if (status == null || status.isEmpty()) {
            throw new InvalidInputException("Booking status cannot be empty");
        }
        return repository.findByStatus(status);
    }

    /**
     * Validates the booking input
     * 
     * @param booking the booking to validate
     * @throws InvalidInputException if validation fails
     */
    private void validateInput(OnlineBooking booking) {
        if (booking == null) {
            throw new InvalidInputException("Booking cannot be null");
        }
        if (booking.getBookingDate() == null) {
            throw new InvalidInputException("Booking date is required");
        }
        if (booking.getStatus() == null || booking.getStatus().isEmpty()) {
            throw new InvalidInputException("Booking status is required");
        }
        if (booking.getStudentId() == null || booking.getStudentId() <= 0) {
            throw new InvalidInputException("Valid student ID is required");
        }
        if (booking.getSession() == null) {
            throw new InvalidInputException("Booking must be associated with a session");
        }
    }

    /**
     * Validates the id
     * 
     * @param id the id to validate
     * @throws InvalidInputException if id is invalid
     */
    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw new InvalidInputException("Booking id must be a positive number");
        }
    }
}
