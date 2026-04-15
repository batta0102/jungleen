package tn.esprit.event.web.dto;

import java.time.LocalDateTime;

public record OptimizedEventDto(
        Long id,
        String title,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Long venueId,
        String venueName,
        String reason
) {
}
