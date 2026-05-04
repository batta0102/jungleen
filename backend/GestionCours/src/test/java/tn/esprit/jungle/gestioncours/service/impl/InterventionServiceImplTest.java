package tn.esprit.jungle.gestioncours.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.jungle.gestioncours.dto.InterventionRequestDto;
import tn.esprit.jungle.gestioncours.dto.InterventionResponseDto;
import tn.esprit.jungle.gestioncours.entites.*;
import tn.esprit.jungle.gestioncours.exception.BusinessConflictException;
import tn.esprit.jungle.gestioncours.exception.ResourceNotFoundException;
import tn.esprit.jungle.gestioncours.repositorie.InterventionRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InterventionServiceImplTest {

    @Mock
    private InterventionRepository repository;

    @InjectMocks
    private InterventionServiceImpl service;

    @Test
    @DisplayName("create fails when open duplicate exists")
    void create_failsOnDuplicateOpen() {
        InterventionRequestDto request = new InterventionRequestDto();
        request.setStudentId(1L);
        request.setCourseId(2L);
        request.setType(InterventionType.REMINDER);
        request.setCreatedBy("admin");

        when(repository.existsByStudentIdAndCourseIdAndStatus(1L, 2L, InterventionStatus.OPEN)).thenReturn(true);

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(BusinessConflictException.class)
                .hasMessageContaining("OPEN");
    }

    @Test
    @DisplayName("updateStatus fails for invalid transition")
    void updateStatus_failsForInvalidTransition() {
        Intervention entity = new Intervention();
        entity.setId(5L);
        entity.setStatus(InterventionStatus.OPEN);
        entity.setStudentId(1L);
        entity.setCourseId(2L);
        entity.setType(InterventionType.REMINDER);
        entity.setCreatedBy("admin");

        when(repository.findById(5L)).thenReturn(Optional.of(entity));

        assertThatThrownBy(() -> service.updateStatus(5L, InterventionStatus.CLOSED))
                .isInstanceOf(BusinessConflictException.class)
                .hasMessageContaining("Transition");
    }

    @Test
    @DisplayName("getByStudent returns interventions")
    void getByStudent_returnsHistory() {
        Intervention entity = new Intervention();
        entity.setId(7L);
        entity.setStudentId(1L);
        entity.setCourseId(2L);
        entity.setType(InterventionType.REMINDER);
        entity.setStatus(InterventionStatus.OPEN);
        entity.setCreatedBy("admin");

        when(repository.findByStudentIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(entity));

        List<InterventionResponseDto> result = service.getByStudent(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(7L);
    }

    @Test
    @DisplayName("updateStatus throws 404 when not found")
    void updateStatus_notFound() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateStatus(99L, InterventionStatus.IN_PROGRESS))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("introuvable");
    }
}
