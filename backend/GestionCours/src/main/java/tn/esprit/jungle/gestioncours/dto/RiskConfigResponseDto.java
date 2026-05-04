package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskConfigResponseDto {
    private Long id;
    private Long courseId;
    private Double highThreshold;
    private Double mediumThreshold;
    private Map<Long, Double> sessionOverrides;
    private LocalDateTime updatedAt;
    private boolean defaultConfig;
}
