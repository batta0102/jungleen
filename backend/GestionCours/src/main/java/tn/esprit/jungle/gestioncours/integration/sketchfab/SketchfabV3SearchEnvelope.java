package tn.esprit.jungle.gestioncours.integration.sketchfab;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import java.util.List;

/**
 * Enveloppe JSON minimale pour {@code GET /v3/search?type=models}.
 * Champs inconnus ignorés (évolution API Sketchfab).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SketchfabV3SearchEnvelope {

    private List<SketchfabV3ModelHit> results;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SketchfabV3ModelHit {
        private String uid;
        private String name;
        private String viewerUrl;
        private String embedUrl;
        private Thumbnails thumbnails;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Thumbnails {
        private List<ThumbnailImage> images;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ThumbnailImage {
        private String url;
        private Integer width;
    }
}
