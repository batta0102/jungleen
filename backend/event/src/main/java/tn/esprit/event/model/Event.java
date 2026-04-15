package tn.esprit.event.model;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tn.esprit.event.model.enums.EventStatus;
import tn.esprit.event.model.enums.EventType;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "events")
public abstract class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    @Column(nullable = false)
    private EventStatus status = EventStatus.ACTIVE;

    @Column(nullable = false)
    private EventType type;

    @Column(name = "event_discriminator", nullable = false)
    private String eventDiscriminator;

    @Lob
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(columnDefinition = "DOUBLE DEFAULT 0.0")
    private Double price = 0.0;

    @Column(nullable = false, length = 10)
    private String currency = "TND";

    // New fields for enhanced event creation
    @Column(length = 100)
    private String category;

    @Column
    private Integer maxParticipants;

    @Column
    private Boolean enableWaitlist = false;

    @Column
    private Boolean allowComments = true;

    @Column
    private Boolean reminderEmails = true;

    // Recurring event fields
    @Column
    private Boolean repeatEvent = false;

    @Column(length = 20)
    private String repeatFrequency; // WEEKLY, MONTHLY

    @ElementCollection(fetch = FetchType.EAGER)
    @Column(name = "repeat_day")
    private List<Integer> repeatDays = new ArrayList<>(); // 0=Sunday, 1=Monday, etc.

    @PrePersist
    @PreUpdate
    private void ensureDefaults() {
        if (price == null) {
            price = 0.0;
        }
        if (currency == null || currency.isBlank()) {
            currency = "TND";
        }
        if (enableWaitlist == null) {
            enableWaitlist = false;
        }
        if (allowComments == null) {
            allowComments = true;
        }
        if (reminderEmails == null) {
            reminderEmails = true;
        }
        if (repeatEvent == null) {
            repeatEvent = false;
        }
    }

}
