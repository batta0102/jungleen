package tn.esprit.jungle.gestioncours.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.jungle.gestioncours.entites.ClassroomType;

/**
 * ClassroomRequestDto
 * DTO for creating and updating classrooms
 * Contains validation annotations for request validation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomRequestDto {

    @NotBlank(message = "Classroom name is required")
    private String name;

    @NotNull(message = "Capacity is required")
    @Positive(message = "Capacity must be a positive number")
    private Integer capacity;

    @NotNull(message = "Classroom type is required")
    private ClassroomType type;

    private String featuresDescription;

    /** Sketchfab model UID (optional). */
    private String sketchfabModelUid;
}
