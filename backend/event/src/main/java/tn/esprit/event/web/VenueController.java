package tn.esprit.event.web;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.event.model.OnsiteEvent;
import tn.esprit.event.model.Venue;
import tn.esprit.event.model.enums.EventStatus;
import tn.esprit.event.repository.OnsiteEventRepository;
import tn.esprit.event.repository.VenueRepository;
import tn.esprit.event.service.EventSchedulingService;
import tn.esprit.event.web.dto.TimeSlotDto;
import tn.esprit.event.web.exception.BadRequestException;
import tn.esprit.event.web.exception.ResourceNotFoundException;

@RestController
@RequestMapping("/api/venues")
@RequiredArgsConstructor
public class VenueController {

    private final VenueRepository venueRepository;
    private final OnsiteEventRepository onsiteEventRepository;
    private final EventSchedulingService schedulingService;

    @PreAuthorize("hasAnyRole('admin','ADMIN','teacher','TEACHER','tutor','TUTOR','tuteur')")
    @PostMapping
    public Venue create(@RequestBody Venue venue) {
        venue.setId(null);
        return venueRepository.save(venue);
    }

    @GetMapping
    public List<Venue> list() {
        return venueRepository.findAll();
    }

    @GetMapping("/{id}")
    public Venue getById(@PathVariable Long id) {
        return venueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));
    }

    @PreAuthorize("hasAnyRole('admin','ADMIN','teacher','TEACHER','tutor','TUTOR','tuteur')")
    @PutMapping("/{id}")
    public Venue update(@PathVariable Long id, @RequestBody Venue venue) {
        Venue existing = venueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));

        existing.setName(venue.getName());
        existing.setAddress(venue.getAddress());
        existing.setCity(venue.getCity());
        existing.setCountry(venue.getCountry());
        existing.setPostalCode(venue.getPostalCode());
        existing.setCapacity(venue.getCapacity());
        existing.setImageUrl(venue.getImageUrl());
        existing.setEquipment(venue.getEquipment());
        existing.setVenueType(venue.getVenueType());
        existing.setMaxParticipants(venue.getMaxParticipants());
        existing.setLatitude(venue.getLatitude());
        existing.setLongitude(venue.getLongitude());

        return venueRepository.save(existing);
    }

    @GetMapping("/{id}/availability")
    public Map<String, Object> getAvailability(
            @PathVariable Long id,
            @RequestParam String from,
            @RequestParam String to
    ) {
        LocalDateTime parsedFrom = parseDateTimeParam(from, "from");
        LocalDateTime parsedTo = parseDateTimeParam(to, "to");

        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));

        if (parsedTo == null || parsedFrom == null || !parsedTo.isAfter(parsedFrom)) {
            throw new BadRequestException("Invalid date range: 'to' must be after 'from'");
        }

        List<OnsiteEvent> bookings = onsiteEventRepository.findVenueBookingsInRange(id, parsedFrom, parsedTo, EventStatus.ACTIVE);
        bookings.sort(Comparator.comparing(OnsiteEvent::getStartDate));

        List<Map<String, Object>> bookedIntervals = new ArrayList<>();
        for (OnsiteEvent e : bookings) {
            Map<String, Object> b = new LinkedHashMap<>();
            b.put("start", e.getStartDate());
            b.put("end", e.getEndDate());
            b.put("eventTitle", e.getTitle());
            b.put("eventId", e.getId());
            bookedIntervals.add(b);
        }

        List<Map<String, Object>> freeIntervals = new ArrayList<>();
        LocalDateTime cursor = parsedFrom;
        for (OnsiteEvent e : bookings) {
            LocalDateTime start = e.getStartDate().isBefore(parsedFrom) ? parsedFrom : e.getStartDate();
            LocalDateTime end = e.getEndDate().isAfter(parsedTo) ? parsedTo : e.getEndDate();
            if (start.isAfter(cursor)) {
                Map<String, Object> free = new LinkedHashMap<>();
                free.put("start", cursor);
                free.put("end", start);
                freeIntervals.add(free);
            }
            if (end.isAfter(cursor)) {
                cursor = end;
            }
        }
        if (cursor.isBefore(parsedTo)) {
            Map<String, Object> free = new LinkedHashMap<>();
            free.put("start", cursor);
            free.put("end", parsedTo);
            freeIntervals.add(free);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("venueId", venue.getId());
        result.put("from", parsedFrom);
        result.put("to", parsedTo);
        result.put("bookedIntervals", bookedIntervals);
        result.put("freeIntervals", freeIntervals);
        return result;
    }

    @GetMapping("/available-times")
    public List<TimeSlotDto> getAvailableTimes(
            @RequestParam Long venueId,
            @RequestParam String from,
            @RequestParam String to
    ) {
        LocalDateTime parsedFrom = parseDateTimeParam(from, "from");
        LocalDateTime parsedTo = parseDateTimeParam(to, "to");
        return schedulingService.getAvailableTimeSlots(venueId, parsedFrom, parsedTo);
    }

    private LocalDateTime parseDateTimeParam(String value, String paramName) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("Missing required datetime parameter: " + paramName);
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

    @PreAuthorize("hasAnyRole('admin','ADMIN','teacher','TEACHER','tutor','TUTOR','tuteur')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        if (!venueRepository.existsById(id)) {
            throw new ResourceNotFoundException("Venue not found");
        }

        onsiteEventRepository.deleteByVenueId(id);
        venueRepository.deleteById(id);
    }
}
