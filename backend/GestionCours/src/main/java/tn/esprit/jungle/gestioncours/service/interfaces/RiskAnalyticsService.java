package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.dto.*;

import java.util.List;

public interface RiskAnalyticsService {
    String calculateRiskLevel(Long studentId, Long courseId);

    RiskExplanationResponseDto getRiskExplanation(Long studentId, Long courseId);

    List<EarlyWarningDto> getEarlyWarnings(Long courseId);

    List<AttendanceAnomalyDto> getAnomaliesByCourse(Long courseId);

    List<AttendanceAnomalyDto> getAnomaliesBySession(Long sessionId);

    BenchmarkResponseDto getBenchmark(Long courseId);

    void recalculateCourseRiskLevels(Long courseId);
}
