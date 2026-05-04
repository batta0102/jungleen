package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.jungle.gestioncours.dto.RiskConfigRequestDto;
import tn.esprit.jungle.gestioncours.dto.RiskConfigResponseDto;
import tn.esprit.jungle.gestioncours.entites.RiskConfig;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.repositorie.RiskConfigRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.RiskConfigService;

import java.time.LocalDateTime;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class RiskConfigServiceImpl implements RiskConfigService {

    private final RiskConfigRepository repository;

    @Override
    public RiskConfigResponseDto getByCourseId(Long courseId) {
        validateCourseId(courseId);
        return repository.findByCourseId(courseId)
                .map(c -> toDto(c, false))
                .orElseGet(() -> toDto(defaultConfig(courseId), true));
    }

    @Override
    public RiskConfigResponseDto updateByCourseId(Long courseId, RiskConfigRequestDto requestDto) {
        validateCourseId(courseId);
        if (requestDto == null) {
            throw new InvalidInputException("Configuration de risque invalide");
        }
        validateThresholds(requestDto.getHighThreshold(), requestDto.getMediumThreshold());

        RiskConfig config = repository.findByCourseId(courseId).orElseGet(() -> {
            RiskConfig created = new RiskConfig();
            created.setCourseId(courseId);
            return created;
        });

        config.setHighThreshold(requestDto.getHighThreshold());
        config.setMediumThreshold(requestDto.getMediumThreshold());
        config.setSessionOverrides(requestDto.getSessionOverrides() == null ? new HashMap<>() : requestDto.getSessionOverrides());
        config.setUpdatedAt(LocalDateTime.now());

        RiskConfig saved = repository.save(config);
        return toDto(saved, false);
    }

    @Override
    public RiskConfig getConfigOrDefault(Long courseId) {
        validateCourseId(courseId);
        return repository.findByCourseId(courseId).orElseGet(() -> defaultConfig(courseId));
    }

    private RiskConfig defaultConfig(Long courseId) {
        RiskConfig config = new RiskConfig();
        config.setCourseId(courseId);
        config.setHighThreshold(60.0);
        config.setMediumThreshold(75.0);
        config.setSessionOverrides(new HashMap<>());
        config.setUpdatedAt(LocalDateTime.now());
        return config;
    }

    private RiskConfigResponseDto toDto(RiskConfig config, boolean defaultConfig) {
        return new RiskConfigResponseDto(
                config.getId(),
                config.getCourseId(),
                config.getHighThreshold(),
                config.getMediumThreshold(),
                config.getSessionOverrides(),
                config.getUpdatedAt(),
                defaultConfig
        );
    }

    private void validateCourseId(Long courseId) {
        if (courseId == null || courseId <= 0) {
            throw new InvalidInputException("courseId doit etre un entier positif");
        }
    }

    private void validateThresholds(Double highThreshold, Double mediumThreshold) {
        if (highThreshold == null || mediumThreshold == null) {
            throw new InvalidInputException("Les seuils highThreshold et mediumThreshold sont obligatoires");
        }
        if (highThreshold < 0 || highThreshold > 100 || mediumThreshold < 0 || mediumThreshold > 100) {
            throw new InvalidInputException("Les seuils doivent etre compris entre 0 et 100");
        }
        if (highThreshold >= mediumThreshold) {
            throw new InvalidInputException("highThreshold doit etre strictement inferieur a mediumThreshold");
        }
    }
}
