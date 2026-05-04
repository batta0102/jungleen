package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

/**
 * OnlineBookingResponseDto
 * DTO for returning online booking data in API responses
 * Provides a clean and consistent response format to clients
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnlineBookingResponseDto {

    private Long id;
    private Date bookingDate;
    private String status;
    private Long studentId;
    private Long sessionId;
}
