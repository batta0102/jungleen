package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

/**
 * OnSiteSessionResponseDto
 * DTO for returning on-site session data in API responses
 * Provides a clean and consistent response format to clients
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnSiteSessionResponseDto {

    private Long id;
    private Date date;
    private Integer capacity;
    private Long courseId;
    private Long classroomId;
}
