package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EarlyWarningDto {
    private Long studentId;
    private String studentName;
    private Double currentRate;
    private Double trendSlope;
    private Double predictedRateIn2Weeks;
    private String warningLevel;
}
