package tn.esprit.jungle.gestioncours.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;
import tn.esprit.jungle.gestioncours.dto.SketchfabModelSearchItemDto;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.integration.sketchfab.SketchfabV3SearchEnvelope;
import tn.esprit.jungle.gestioncours.service.interfaces.SketchfabSearchService;

import java.net.URI;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SketchfabSearchServiceImpl implements SketchfabSearchService {

    private final ObjectMapper objectMapper;

    @Value("${sketchfab.data-api.base-url:https://api.sketchfab.com}")
    private String baseUrl;

    /** Optionnel : {@code Authorization: Token …} — augmente les quotas / accès selon compte Sketchfab. */
    @Value("${sketchfab.data-api.token:}")
    private String apiToken;

    private final RestClient restClient = RestClient.create();

    @Override
    public List<SketchfabModelSearchItemDto> searchModels(String query, int limit) {
        if (query == null || query.isBlank()) {
            throw new InvalidInputException("Query parameter is required");
        }
        String trimmed = query.trim();
        if (trimmed.length() > 200) {
            throw new InvalidInputException("Query is too long");
        }

        int count = Math.min(24, Math.max(1, limit));

        URI uri = UriComponentsBuilder
                .fromUriString(baseUrl + "/v3/search")
                .queryParam("type", "models")
                .queryParam("q", trimmed)
                .queryParam("count", count)
                .encode()
                .build()
                .toUri();

        try {
            RestClient.RequestHeadersSpec<?> spec = restClient.get().uri(uri);
            if (apiToken != null && !apiToken.isBlank()) {
                spec = spec.header("Authorization", "Token " + apiToken.trim());
            }
            String json = spec.retrieve().body(String.class);
            if (json == null || json.isBlank()) {
                return Collections.emptyList();
            }

            SketchfabV3SearchEnvelope envelope = objectMapper.readValue(json, SketchfabV3SearchEnvelope.class);
            if (envelope.getResults() == null) {
                return Collections.emptyList();
            }

            return envelope.getResults().stream()
                    .filter(Objects::nonNull)
                    .map(this::toDto)
                    .collect(Collectors.toList());
        } catch (InvalidInputException e) {
            throw e;
        } catch (RestClientException e) {
            log.warn("Sketchfab API call failed: {}", e.getMessage());
            throw new InvalidInputException("Sketchfab API unavailable: " + e.getMessage());
        } catch (Exception e) {
            log.warn("Sketchfab response parse failed: {}", e.getMessage());
            throw new InvalidInputException("Invalid response from Sketchfab API");
        }
    }

    private SketchfabModelSearchItemDto toDto(SketchfabV3SearchEnvelope.SketchfabV3ModelHit hit) {
        String thumb = pickThumbnailUrl(hit.getThumbnails());
        return SketchfabModelSearchItemDto.builder()
                .uid(hit.getUid())
                .name(hit.getName())
                .thumbnailUrl(thumb)
                .viewerUrl(hit.getViewerUrl())
                .embedUrl(hit.getEmbedUrl())
                .build();
    }

    private String pickThumbnailUrl(SketchfabV3SearchEnvelope.Thumbnails thumbnails) {
        if (thumbnails == null || thumbnails.getImages() == null || thumbnails.getImages().isEmpty()) {
            return null;
        }
        return thumbnails.getImages().stream()
                .filter(img -> img != null && img.getUrl() != null && !img.getUrl().isBlank())
                .max(Comparator.comparing(img -> img.getWidth() != null ? img.getWidth() : 0))
                .map(SketchfabV3SearchEnvelope.ThumbnailImage::getUrl)
                .orElse(null);
    }
}
