package tn.esprit.jungle.gestioncours.dto;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
public class RiskConfigRequestDto {
    private Double highThreshold = 60.0;
    private Double mediumThreshold = 75.0;
    private Map<Long, Double> sessionOverrides = new HashMap<>();
}
