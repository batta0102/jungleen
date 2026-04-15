package tn.esprit.event.web.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ScheduleOptimizationRequest {

    private List<Item> events = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    public static class Item {
        private Long id;
        private String title;
        private String eventType;
        private String category;
        private java.time.LocalDateTime startDate;
        private java.time.LocalDateTime endDate;
        private Long venueId;
        private Integer participants;
        private Set<String> equipmentNeeded;
        private Boolean highDemand;
        private String participantPreference; // MORNING | AFTERNOON | EVENING
    }
}
