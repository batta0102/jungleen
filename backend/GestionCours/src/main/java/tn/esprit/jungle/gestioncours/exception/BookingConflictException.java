package tn.esprit.jungle.gestioncours.exception;

/**
 * Raised when a booking violates business conflict rules (schedule overlap, weekly overload).
 */
public class BookingConflictException extends RuntimeException {

    public BookingConflictException(String message) {
        super(message);
    }
}
