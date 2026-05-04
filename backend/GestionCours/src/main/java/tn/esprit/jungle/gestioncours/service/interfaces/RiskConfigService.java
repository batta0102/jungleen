package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.dto.RiskConfigRequestDto;
import tn.esprit.jungle.gestioncours.dto.RiskConfigResponseDto;
import tn.esprit.jungle.gestioncours.entites.RiskConfig;

public interface RiskConfigService {
    RiskConfigResponseDto getByCourseId(Long courseId);

    RiskConfigResponseDto updateByCourseId(Long courseId, RiskConfigRequestDto requestDto);

    RiskConfig getConfigOrDefault(Long courseId);
}
