package tn.esprit.jungle.gestioncours.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.jungle.gestioncours.entites.Level;

/**
 * OnlineCourseRequestDto
 * DTO for creating and updating online courses
 * Contains validation annotations for request validation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnlineCourseRequestDto {

    @NotBlank(message = "Course title is required")
    private String title;

    private String description;

    @NotNull(message = "Course level is required")
    private Level level;

    @NotNull(message = "Tutor ID is required")
    @Positive(message = "Tutor ID must be a positive number")
    private Long tutorId;
}
