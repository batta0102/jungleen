package tn.esprit.jungle.gestioncours.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungle.gestioncours.dto.InterventionRequestDto;
import tn.esprit.jungle.gestioncours.dto.InterventionResponseDto;
import tn.esprit.jungle.gestioncours.dto.InterventionStatusUpdateDto;
import tn.esprit.jungle.gestioncours.service.interfaces.InterventionService;

import java.util.List;

@RestController
@RequestMapping("/api/interventions")
@RequiredArgsConstructor
@Tag(name = "Interventions", description = "Gestion des interventions intelligentes")
public class InterventionController {

    private final InterventionService interventionService;

    @PostMapping
    @Operation(summary = "Creer une intervention")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Intervention creee"),
            @ApiResponse(responseCode = "409", description = "Doublon OPEN detecte")
    })
    public ResponseEntity<InterventionResponseDto> create(@Valid @RequestBody InterventionRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(interventionService.create(requestDto));
    }

    @GetMapping("/{studentId}")
    @Operation(summary = "Historique des interventions d'un etudiant")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Historique retourne")
    })
    public ResponseEntity<List<InterventionResponseDto>> getByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(interventionService.getByStudent(studentId));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Mettre a jour le statut d'une intervention")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Statut mis a jour"),
            @ApiResponse(responseCode = "404", description = "Intervention introuvable"),
            @ApiResponse(responseCode = "409", description = "Transition invalide")
    })
    public ResponseEntity<InterventionResponseDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody InterventionStatusUpdateDto requestDto) {
        return ResponseEntity.ok(interventionService.updateStatus(id, requestDto.getStatus()));
    }

    @GetMapping("/course/{courseId}")
    @Operation(summary = "Lister les interventions d'un cours")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste retournee")
    })
    public ResponseEntity<List<InterventionResponseDto>> getByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(interventionService.getByCourse(courseId));
    }
}
