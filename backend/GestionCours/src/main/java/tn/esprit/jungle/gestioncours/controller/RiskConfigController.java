package tn.esprit.jungle.gestioncours.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungle.gestioncours.dto.RiskConfigRequestDto;
import tn.esprit.jungle.gestioncours.dto.RiskConfigResponseDto;
import tn.esprit.jungle.gestioncours.service.interfaces.RiskAnalyticsService;
import tn.esprit.jungle.gestioncours.service.interfaces.RiskConfigService;

@RestController
@RequestMapping("/api/risk-config")
@RequiredArgsConstructor
@Tag(name = "Risk Config", description = "Configuration dynamique du moteur de risque")
public class RiskConfigController {

    private final RiskConfigService riskConfigService;
    private final RiskAnalyticsService riskAnalyticsService;

    @GetMapping("/{courseId}")
    @Operation(summary = "Recuperer la configuration de risque d'un cours")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Configuration retournee")
    })
    public ResponseEntity<RiskConfigResponseDto> getByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(riskConfigService.getByCourseId(courseId));
    }

    @PutMapping("/{courseId}")
    @Operation(summary = "Mettre a jour la configuration de risque d'un cours")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Configuration mise a jour")
    })
    public ResponseEntity<RiskConfigResponseDto> updateByCourse(
            @PathVariable Long courseId,
            @Valid @RequestBody RiskConfigRequestDto requestDto) {
        RiskConfigResponseDto response = riskConfigService.updateByCourseId(courseId, requestDto);
        riskAnalyticsService.recalculateCourseRiskLevels(courseId);
        return ResponseEntity.ok(response);
    }
}
