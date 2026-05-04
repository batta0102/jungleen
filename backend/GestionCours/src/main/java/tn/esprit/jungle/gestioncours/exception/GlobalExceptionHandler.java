package tn.esprit.jungle.gestioncours.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import tn.esprit.jungle.gestioncours.response.ApiResponse;

import java.util.stream.Collectors;

/**
 * Global Exception Handler
 * Catches exceptions thrown by controllers and returns appropriate HTTP responses
 * Follows the centralized error handling pattern for clean code
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles ResourceNotFoundException
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {
        
        log.warn("Resource not found: {}", ex.getMessage());
        
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handles InvalidInputException
     */
    @ExceptionHandler(InvalidInputException.class)
    public ResponseEntity<ApiResponse<Object>> handleInvalidInputException(
            InvalidInputException ex, WebRequest request) {
        
        log.warn("Invalid input: {}", ex.getMessage());
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

        /**
         * Handles business conflict exceptions (duplicates, invalid transitions, etc.)
         */
        @ExceptionHandler(BusinessConflictException.class)
        public ResponseEntity<ApiResponse<Object>> handleBusinessConflictException(
                        BusinessConflictException ex, WebRequest request) {

                log.warn("Business conflict: {}", ex.getMessage());

                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(ApiResponse.error(ex.getMessage()));
        }

        /**
         * Handles BookingConflictException (schedule overlap / weekly overload)
         */
        @ExceptionHandler(BookingConflictException.class)
        public ResponseEntity<ApiResponse<Object>> handleBookingConflictException(
                        BookingConflictException ex, WebRequest request) {

                log.warn("Booking conflict: {}", ex.getMessage());

                return ResponseEntity
                                .status(HttpStatus.CONFLICT)
                                .body(ApiResponse.error(ex.getMessage()));
        }

    /**
     * Handles validation errors from @Valid annotation
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, WebRequest request) {
        
        String errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        
        log.warn("Validation failed: {}", errors);
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Validation failed: " + errors));
    }

    /**
     * Handles JSON parse / request body errors (e.g. invalid date format)
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Object>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, WebRequest request) {

        log.warn("Request body not readable: {}", ex.getMessage());

        String detail = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        String message = "Invalid request format (check date and fields). " + (detail != null ? detail : "");
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(message));
    }

    /**
     * Handles general exceptions - return the real message so the frontend can show it
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(
            Exception ex, WebRequest request) {

        log.error("Unexpected error occurred", ex);

        String detail = ex.getMessage();
        if (detail == null || detail.isBlank()) {
            Throwable cause = ex.getCause();
            detail = cause != null ? cause.getMessage() : ex.getClass().getSimpleName();
        }
        String message = "Erreur: " + detail;
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(message));
    }
}
