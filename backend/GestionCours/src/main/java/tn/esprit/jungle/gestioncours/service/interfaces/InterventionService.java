package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.dto.InterventionRequestDto;
import tn.esprit.jungle.gestioncours.dto.InterventionResponseDto;
import tn.esprit.jungle.gestioncours.entites.InterventionStatus;

import java.util.List;

public interface InterventionService {
    InterventionResponseDto create(InterventionRequestDto requestDto);

    List<InterventionResponseDto> getByStudent(Long studentId);

    InterventionResponseDto updateStatus(Long id, InterventionStatus status);

    List<InterventionResponseDto> getByCourse(Long courseId);
}
