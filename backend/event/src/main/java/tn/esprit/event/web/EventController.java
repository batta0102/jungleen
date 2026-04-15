package tn.esprit.event.web;

import java.util.List;
import java.util.Set;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import tn.esprit.event.model.Event;
import tn.esprit.event.model.OnlineEvent;
import tn.esprit.event.model.OnsiteEvent;
import tn.esprit.event.model.enums.EventStatus;
import tn.esprit.event.model.enums.EventType;
import tn.esprit.event.service.EventSchedulingService;
import tn.esprit.event.service.EventService;
import tn.esprit.event.web.dto.CreateOnlineEventRequest;
import tn.esprit.event.web.dto.CreateOnsiteEventRequest;
import tn.esprit.event.web.dto.EventRegistrationRequest;
import tn.esprit.event.web.dto.OptimizedEventDto;
import tn.esprit.event.web.dto.ScheduleOptimizationRequest;
import tn.esprit.event.web.dto.VenueSuggestionDto;
import tn.esprit.event.web.exception.BadRequestException;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final EventSchedulingService schedulingService;

    @PreAuthorize("hasAnyRole('admin','ADMIN','teacher','TEACHER','tutor','TUTOR','tuteur')")
    @PostMapping("/online")
    public OnlineEvent createOnlineEvent(@RequestBody CreateOnlineEventRequest request) {
        return eventService.createOnlineEvent(request);
    }

    @PreAuthorize("hasAnyRole('admin','ADMIN','teacher','TEACHER','tutor','TUTOR','tuteur')")
    @PutMapping("/online/{id}")
    public OnlineEvent updateOnlineEvent(@PathVariable Long id, @RequestBody CreateOnlineEventRequest request) {
        return eventService.updateOnlineEvent(id, request);
    }

    @PreAuthorize("hasAnyRole('admin','ADMIN','teacher','TEACHER','tutor','TUTOR','tuteur')")
    @PutMapping("/onsite/{id}")
    public OnsiteEvent updateOnsiteEvent(@PathVariable Long id, @RequestBody CreateOnsiteEventRequest request) {
        return eventService.updateOnsiteEvent(id, request);
    }

    @PreAuthorize("hasAnyRole('admin','ADMIN','teacher','TEACHER','tutor','TUTOR','tuteur')")
    @PostMapping("/onsite")
    public OnsiteEvent createOnsiteEvent(@RequestBody CreateOnsiteEventRequest request) {
        return eventService.createOnsiteEvent(request);
    }

    @GetMapping("/{id}")
    public Event getById(@PathVariable Long id) {
        return eventService.getEventById(id);
    }

    @PreAuthorize("hasAnyRole('admin','ADMIN','teacher','TEACHER','tutor','TUTOR','tuteur')")
    @PutMapping("/{eventId}/cancel")
    public Event cancelEvent(@PathVariable Long eventId) {
        return eventService.cancelEvent(eventId);
    }

    @PreAuthorize("hasAnyRole('admin','ADMIN','teacher','TEACHER','tutor','TUTOR','tuteur')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        eventService.deleteEvent(id);
    }

    @PreAuthorize("hasAnyRole('admin','ADMIN','teacher','TEACHER','tutor','TUTOR','tuteur')")
    @PutMapping("/{eventId}/status/{status}")
    public Event updateStatus(@PathVariable Long eventId, @PathVariable EventStatus status) {
        return eventService.updateStatus(eventId, status);
    }

    @GetMapping
    public List<Event> listEvents(
            @RequestParam(required = false) EventStatus status,
            @RequestParam(required = false) EventType type
    ) {
        if (status != null) {
            return eventService.getEventsByStatus(status);
        }
        if (type != null) {
            return eventService.getEventsByType(type);
        }
        return eventService.getAllEvents();
    }

    @GetMapping("/suggestions")
    public List<VenueSuggestionDto> getVenueSuggestions(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String equipmentNeeded,
            @RequestParam(required = false) Integer participants,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        Set<String> equipment = parseEquipment(equipmentNeeded);
        LocalDateTime parsedFrom = parseDateTimeParam(from, "from");
        LocalDateTime parsedTo = parseDateTimeParam(to, "to");
        return schedulingService.suggestVenues(eventType, equipment, participants, parsedFrom, parsedTo);
    }

    @PostMapping("/optimize-schedule")
    public List<OptimizedEventDto> optimizeSchedule(@RequestBody ScheduleOptimizationRequest request) {
        return schedulingService.optimizeSchedule(request);
    }

    @GetMapping(value = "/{id}/attendees/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportAttendees(@PathVariable Long id) {
        byte[] csv = eventService.exportAttendeesCsv(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=event-" + id + "-attendees.csv")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv);
    }

    @GetMapping("/registrations/mine")
    public List<Long> myRegisteredEventIds(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String email
    ) {
        return eventService.getRegisteredEventIds(userId, email);
    }

    @PostMapping("/{id}/registrations")
    public ResponseEntity<String> registerForEvent(@PathVariable Long id, @RequestBody EventRegistrationRequest request) {
        // Parse name into firstName and lastName
        String firstName = "";
        String lastName = "";
        
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            String[] nameParts = request.getName().trim().split("\\s+", 2);
            firstName = nameParts[0];
            if (nameParts.length > 1) {
                lastName = nameParts[1];
            }
        }
        
        // Fallback: if no firstName, extract from email or userId
        if (firstName == null || firstName.isEmpty()) {
            if (request.getUserId() != null && !request.getUserId().trim().isEmpty()) {
                firstName = request.getUserId();
            } else if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
                // Extract username from email (part before @)
                String emailPart = request.getEmail().split("@")[0];
                firstName = emailPart;
            } else {
                firstName = "Student";
            }
        }
        
        try {
            eventService.registerForEvent(id, firstName, lastName, request.getEmail(), request.getUserId());
            return ResponseEntity.ok("Registration successful");
        } catch (BadRequestException e) {
            // If error message indicates duplicate registration, return 409 Conflict
            if (e.getMessage() != null && e.getMessage().contains("already registered")) {
                return ResponseEntity.status(409).body(e.getMessage());
            }
            throw e;
        }
    }

    private Set<String> parseEquipment(String equipmentNeeded) {
        if (equipmentNeeded == null || equipmentNeeded.isBlank()) {
            return Set.of();
        }
        java.util.LinkedHashSet<String> equipment = new java.util.LinkedHashSet<>();
        for (String part : equipmentNeeded.split(",")) {
            if (part != null && !part.isBlank()) {
                equipment.add(part.trim());
            }
        }
        return equipment;
    }

    private LocalDateTime parseDateTimeParam(String value, String paramName) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            try {
                return LocalDateTime.parse(value);
            } catch (DateTimeParseException ex) {
                throw new BadRequestException("Invalid datetime for '" + paramName + "': " + value);
            }
        }
    }

}
