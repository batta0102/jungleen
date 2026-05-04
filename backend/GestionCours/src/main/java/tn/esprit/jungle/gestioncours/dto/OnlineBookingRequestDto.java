package tn.esprit.jungle.gestioncours.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

/**
 * OnlineBookingRequestDto
 * DTO for creating and updating online bookings
 * Contains validation annotations for request validation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnlineBookingRequestDto {

    @NotNull(message = "Booking date is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "UTC")
    private Date bookingDate;

    @NotBlank(message = "Booking status is required")
    private String status;

    @NotNull(message = "Student ID is required")
    @Positive(message = "Student ID must be a positive number")
    private Long studentId;

    @NotNull(message = "Session ID is required")
    @Positive(message = "Session ID must be a positive number")
    private Long sessionId;
}
