package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskExplanationResponseDto {
    private Long studentId;
    private String riskLevel;
    private Double score;
    private List<RiskReasonDto> reasons;
    private List<RiskTimelineItemDto> timeline;
}
