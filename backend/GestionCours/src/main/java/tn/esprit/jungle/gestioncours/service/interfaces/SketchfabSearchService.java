package tn.esprit.jungle.gestioncours.service.interfaces;

import tn.esprit.jungle.gestioncours.dto.SketchfabModelSearchItemDto;

import java.util.List;

public interface SketchfabSearchService {

    /**
     * Recherche de modèles 3D publics via Sketchfab Data API v3.
     *
     * @param query  mots-clés (ex. classroom, meeting room)
     * @param limit  nombre max de résultats (1–24)
     */
    List<SketchfabModelSearchItemDto> searchModels(String query, int limit);
}
