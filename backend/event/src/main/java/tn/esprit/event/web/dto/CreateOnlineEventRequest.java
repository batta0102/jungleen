package tn.esprit.event.web.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateOnlineEventRequest {

    private String title;

    private String description;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private String meetingUrl;

    private String imageUrl;

    private Double price;

    // New fields for enhanced event creation
    private String category;

    private Integer maxParticipants;

    private Boolean enableWaitlist;

    private Boolean allowComments;

    private Boolean reminderEmails;

    // Recurring event fields
    private Boolean repeatEvent;

    private String repeatFrequency; // WEEKLY, MONTHLY

    private List<Integer> repeatDays; // 0=Sunday, 1=Monday, etc.
}
