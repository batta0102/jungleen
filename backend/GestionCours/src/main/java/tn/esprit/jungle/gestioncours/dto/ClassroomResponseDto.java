package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.jungle.gestioncours.entites.ClassroomType;

/**
 * ClassroomResponseDto
 * DTO for returning classroom data in API responses
 * Provides a clean and consistent response format to clients
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomResponseDto {

    private Long id;
    private String name;
    private Integer capacity;
    private ClassroomType type;
    private String featuresDescription;

    private String sketchfabModelUid;
}
