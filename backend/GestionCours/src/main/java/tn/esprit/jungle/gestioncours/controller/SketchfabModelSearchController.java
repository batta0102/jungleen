package tn.esprit.jungle.gestioncours.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.jungle.gestioncours.dto.SketchfabModelSearchItemDto;
import tn.esprit.jungle.gestioncours.response.ApiResponse;
import tn.esprit.jungle.gestioncours.service.interfaces.SketchfabSearchService;

import java.util.List;

/**
 * Passerelle légère vers Sketchfab Data API v3 (recherche de modèles).
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/3d-models", "/v1/3d-models"})
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
@Tag(name = "3D models", description = "Recherche de modeles Sketchfab (API externe)")
public class SketchfabModelSearchController {

    private final SketchfabSearchService sketchfabSearchService;

    @GetMapping("/search")
    @Operation(summary = "Rechercher des modeles 3D (Sketchfab v3)")
    public ResponseEntity<ApiResponse<List<SketchfabModelSearchItemDto>>> search(
            @RequestParam("query") String query,
            @RequestParam(value = "limit", required = false, defaultValue = "12") int limit) {
        int safeLimit = Math.min(24, Math.max(1, limit));
        log.info("[GET /api/v1/3d-models/search] query='{}', limit={}", query, safeLimit);
        List<SketchfabModelSearchItemDto> items = sketchfabSearchService.searchModels(query, safeLimit);
        return ResponseEntity.ok(ApiResponse.success(items, "Sketchfab search completed"));
    }
}
