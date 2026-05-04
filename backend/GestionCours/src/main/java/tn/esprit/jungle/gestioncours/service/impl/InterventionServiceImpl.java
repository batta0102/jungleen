package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.jungle.gestioncours.dto.InterventionRequestDto;
import tn.esprit.jungle.gestioncours.dto.InterventionResponseDto;
import tn.esprit.jungle.gestioncours.entites.Intervention;
import tn.esprit.jungle.gestioncours.entites.InterventionStatus;
import tn.esprit.jungle.gestioncours.exception.BusinessConflictException;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.exception.ResourceNotFoundException;
import tn.esprit.jungle.gestioncours.repositorie.InterventionRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.InterventionService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InterventionServiceImpl implements InterventionService {

    private final InterventionRepository repository;

    @Override
    public InterventionResponseDto create(InterventionRequestDto requestDto) {
        if (requestDto == null || requestDto.getStudentId() == null || requestDto.getCourseId() == null
                || requestDto.getType() == null || requestDto.getCreatedBy() == null || requestDto.getCreatedBy().isBlank()) {
            throw new InvalidInputException("Les champs studentId, courseId, type et createdBy sont obligatoires");
        }

        boolean alreadyOpen = repository.existsByStudentIdAndCourseIdAndStatus(
                requestDto.getStudentId(), requestDto.getCourseId(), InterventionStatus.OPEN);
        if (alreadyOpen) {
            throw new BusinessConflictException("Une intervention OPEN existe deja pour cet etudiant et ce cours");
        }

        Intervention entity = new Intervention();
        entity.setStudentId(requestDto.getStudentId());
        entity.setCourseId(requestDto.getCourseId());
        entity.setType(requestDto.getType());
        entity.setStatus(InterventionStatus.OPEN);
        entity.setNotes(requestDto.getNotes());
        entity.setCreatedBy(requestDto.getCreatedBy());

        return toDto(repository.save(entity));
    }

    @Override
    public List<InterventionResponseDto> getByStudent(Long studentId) {
        if (studentId == null || studentId <= 0) {
            throw new InvalidInputException("studentId doit etre un entier positif");
        }
        return repository.findByStudentIdOrderByCreatedAtDesc(studentId).stream().map(this::toDto).toList();
    }

    @Override
    public InterventionResponseDto updateStatus(Long id, InterventionStatus status) {
        if (id == null || id <= 0) {
            throw new InvalidInputException("id doit etre un entier positif");
        }
        if (status == null) {
            throw new InvalidInputException("Le statut cible est obligatoire");
        }

        Intervention entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention introuvable avec id " + id));

        if (!isValidTransition(entity.getStatus(), status)) {
            throw new BusinessConflictException("Transition de statut invalide: " + entity.getStatus() + " -> " + status);
        }

        entity.setStatus(status);
        return toDto(repository.save(entity));
    }

    @Override
    public List<InterventionResponseDto> getByCourse(Long courseId) {
        if (courseId == null || courseId <= 0) {
            throw new InvalidInputException("courseId doit etre un entier positif");
        }
        return repository.findByCourseIdOrderByCreatedAtDesc(courseId).stream().map(this::toDto).toList();
    }

    private boolean isValidTransition(InterventionStatus current, InterventionStatus target) {
        if (current == target) {
            return true;
        }
        if (current == InterventionStatus.OPEN && target == InterventionStatus.IN_PROGRESS) {
            return true;
        }
        return current == InterventionStatus.IN_PROGRESS && target == InterventionStatus.CLOSED;
    }

    private InterventionResponseDto toDto(Intervention i) {
        return new InterventionResponseDto(
                i.getId(),
                i.getStudentId(),
                i.getCourseId(),
                i.getType().name(),
                i.getStatus().name(),
                i.getNotes(),
                i.getCreatedAt(),
                i.getUpdatedAt(),
                i.getCreatedBy()
        );
    }
}
