package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

/**
 * OnSiteBookingResponseDto
 * DTO for returning on-site booking data in API responses
 * Provides a clean and consistent response format to clients
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnSiteBookingResponseDto {

    private Long id;
    private Date bookingDate;
    private String status;
    private Long studentId;
    private Long sessionId;
}
