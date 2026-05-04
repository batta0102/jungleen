package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.jungle.gestioncours.entites.Level;

/**
 * OnSiteCourseResponseDto
 * DTO for returning on-site course data in API responses
 * Provides a clean and consistent response format to clients
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnSiteCourseResponseDto {

    private Long id;
    private String title;
    private String description;
    private Level level;
    private Long tutorId;
    private String classroomName;
}
