package tn.esprit.jungle.gestioncours.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import tn.esprit.jungle.gestioncours.entites.InterventionType;

@Data
public class InterventionRequestDto {
    @NotNull
    private Long studentId;

    @NotNull
    private Long courseId;

    @NotNull
    private InterventionType type;

    private String notes;

    @NotNull
    private String createdBy;
}
