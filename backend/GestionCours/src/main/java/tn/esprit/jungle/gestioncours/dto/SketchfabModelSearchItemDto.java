package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Résultat simplifié d'une recherche Sketchfab Data API v3 pour le front.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SketchfabModelSearchItemDto {

    private String uid;
    private String name;
    /** Première miniature disponible, si présente. */
    private String thumbnailUrl;
    private String viewerUrl;
    private String embedUrl;
}
