package tn.esprit.jungle.gestioncours.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungle.gestioncours.dto.*;
import tn.esprit.jungle.gestioncours.service.interfaces.RiskAnalyticsService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Risk Analytics", description = "Explicabilite, alertes precoces, anomalies et benchmark")
public class RiskAnalyticsController {

    private final RiskAnalyticsService riskAnalyticsService;

    @GetMapping("/risk-explanation/{studentId}/{courseId}")
    @Operation(summary = "Explication detaillee du niveau de risque")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Explication retournee")
    })
    public ResponseEntity<RiskExplanationResponseDto> getRiskExplanation(
            @PathVariable Long studentId,
            @PathVariable Long courseId) {
        return ResponseEntity.ok(riskAnalyticsService.getRiskExplanation(studentId, courseId));
    }

    @GetMapping("/early-warning/{courseId}")
    @Operation(summary = "Early warning par cours")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des alertes retournee")
    })
    public ResponseEntity<List<EarlyWarningDto>> getEarlyWarning(@PathVariable Long courseId) {
        return ResponseEntity.ok(riskAnalyticsService.getEarlyWarnings(courseId));
    }

    @GetMapping("/anomalies/session/{sessionId}")
    @Operation(summary = "Anomalies d'assiduite pour une session")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des anomalies retournee")
    })
    public ResponseEntity<List<AttendanceAnomalyDto>> getAnomaliesBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(riskAnalyticsService.getAnomaliesBySession(sessionId));
    }

    @GetMapping("/anomalies/course/{courseId}")
    @Operation(summary = "Anomalies d'assiduite pour un cours")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des anomalies retournee")
    })
    public ResponseEntity<List<AttendanceAnomalyDto>> getAnomaliesByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(riskAnalyticsService.getAnomaliesByCourse(courseId));
    }

    @GetMapping("/benchmark/{courseId}")
    @Operation(summary = "Benchmark de cohorte par cours")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Benchmark retourne")
    })
    public ResponseEntity<BenchmarkResponseDto> getBenchmark(@PathVariable Long courseId) {
        return ResponseEntity.ok(riskAnalyticsService.getBenchmark(courseId));
    }
}
