package tn.esprit.jungle.gestioncours.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import tn.esprit.jungle.gestioncours.entites.InterventionStatus;

@Data
public class InterventionStatusUpdateDto {
    @NotNull
    private InterventionStatus status;
}
