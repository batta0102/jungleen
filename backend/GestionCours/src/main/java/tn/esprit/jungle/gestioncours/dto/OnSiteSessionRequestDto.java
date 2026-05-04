package tn.esprit.jungle.gestioncours.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

/**
 * OnSiteSessionRequestDto
 * DTO for creating and updating on-site sessions
 * Contains validation annotations for request validation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnSiteSessionRequestDto {

    @NotNull(message = "Session date is required")
    private Date date;

    @NotNull(message = "Capacity is required")
    @Positive(message = "Capacity must be a positive number")
    private Integer capacity;

    @NotNull(message = "Course ID is required")
    @Positive(message = "Course ID must be a positive number")
    private Long courseId;

    @NotNull(message = "Classroom ID is required")
    @Positive(message = "Classroom ID must be a positive number")
    private Long classroomId;
}
