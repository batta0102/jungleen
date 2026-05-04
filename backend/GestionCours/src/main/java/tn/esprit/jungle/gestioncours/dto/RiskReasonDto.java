package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskReasonDto {
    private String criterion;
    private Double value;
    private Double weight;
    private String contribution;
    private String description;
}
