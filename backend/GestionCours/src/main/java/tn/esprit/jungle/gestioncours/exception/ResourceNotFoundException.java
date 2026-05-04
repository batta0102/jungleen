package tn.esprit.jungle.gestioncours.exception;

/**
 * Custom exception thrown when a requested resource is not found
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
