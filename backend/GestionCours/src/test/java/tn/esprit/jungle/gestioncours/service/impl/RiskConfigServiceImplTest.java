package tn.esprit.jungle.gestioncours.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.jungle.gestioncours.dto.RiskConfigRequestDto;
import tn.esprit.jungle.gestioncours.dto.RiskConfigResponseDto;
import tn.esprit.jungle.gestioncours.entites.RiskConfig;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.repositorie.RiskConfigRepository;

import java.util.HashMap;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RiskConfigServiceImplTest {

    @Mock
    private RiskConfigRepository repository;

    @InjectMocks
    private RiskConfigServiceImpl service;

    @Test
    @DisplayName("returns default config when no db config exists")
    void getByCourseId_returnsDefault() {
        when(repository.findByCourseId(10L)).thenReturn(Optional.empty());

        RiskConfigResponseDto dto = service.getByCourseId(10L);

        assertThat(dto.isDefaultConfig()).isTrue();
        assertThat(dto.getHighThreshold()).isEqualTo(60.0);
        assertThat(dto.getMediumThreshold()).isEqualTo(75.0);
    }

    @Test
    @DisplayName("updates config and triggers recalculation")
    void updateByCourseId_updatesAndRecalculates() {
        RiskConfigRequestDto requestDto = new RiskConfigRequestDto();
        requestDto.setHighThreshold(55.0);
        requestDto.setMediumThreshold(72.0);
        requestDto.setSessionOverrides(new HashMap<>());

        when(repository.findByCourseId(10L)).thenReturn(Optional.empty());
        when(repository.save(any(RiskConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RiskConfigResponseDto dto = service.updateByCourseId(10L, requestDto);

        assertThat(dto.getHighThreshold()).isEqualTo(55.0);
        assertThat(dto.getMediumThreshold()).isEqualTo(72.0);
    }

    @Test
    @DisplayName("fails when thresholds are invalid")
    void updateByCourseId_failsOnInvalidThresholds() {
        RiskConfigRequestDto requestDto = new RiskConfigRequestDto();
        requestDto.setHighThreshold(80.0);
        requestDto.setMediumThreshold(70.0);

        assertThatThrownBy(() -> service.updateByCourseId(10L, requestDto))
                .isInstanceOf(InvalidInputException.class)
                .hasMessageContaining("highThreshold");
    }
}
