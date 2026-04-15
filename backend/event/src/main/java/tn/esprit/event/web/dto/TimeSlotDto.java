package tn.esprit.event.web.dto;

import java.time.LocalDateTime;

public record TimeSlotDto(
        LocalDateTime startTime,
        LocalDateTime endTime
) {
}
