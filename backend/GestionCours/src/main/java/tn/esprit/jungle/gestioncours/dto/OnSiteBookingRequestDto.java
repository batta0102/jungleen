package tn.esprit.jungle.gestioncours.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

/**
 * OnSiteBookingRequestDto
 * DTO for creating and updating on-site bookings
 * Contains validation annotations for request validation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnSiteBookingRequestDto {

    @NotNull(message = "Booking date is required")
    private Date bookingDate;

    @NotBlank(message = "Status is required")
    private String status;

    @NotNull(message = "Student ID is required")
    @Positive(message = "Student ID must be a positive number")
    private Long studentId;

    @NotNull(message = "Session ID is required")
    @Positive(message = "Session ID must be a positive number")
    private Long sessionId;
}
