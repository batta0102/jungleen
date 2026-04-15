package tn.esprit.event.web.dto;

import java.util.List;
import java.util.Set;

public record VenueSuggestionDto(
        Long venueId,
        String venueName,
        Integer capacity,
        Set<String> equipment,
        List<TimeSlotDto> availableTimeSlots,
        double score
) {
}
