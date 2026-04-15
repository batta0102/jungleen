package tn.esprit.event.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import tn.esprit.event.model.OnsiteEvent;
import tn.esprit.event.model.Venue;
import tn.esprit.event.model.enums.EventStatus;
import tn.esprit.event.repository.EventRepository;
import tn.esprit.event.repository.OnsiteEventRepository;
import tn.esprit.event.repository.VenueRepository;
import tn.esprit.event.web.dto.OptimizedEventDto;
import tn.esprit.event.web.dto.ScheduleOptimizationRequest;
import tn.esprit.event.web.dto.TimeSlotDto;
import tn.esprit.event.web.dto.VenueSuggestionDto;
import tn.esprit.event.web.exception.BadRequestException;
import tn.esprit.event.web.exception.ResourceNotFoundException;

@Service
public class EventSchedulingService {

    private final VenueRepository venueRepository;
    private final OnsiteEventRepository onsiteEventRepository;
    private final EventRepository eventRepository;

    public EventSchedulingService(
            VenueRepository venueRepository,
            OnsiteEventRepository onsiteEventRepository,
            EventRepository eventRepository
    ) {
        this.venueRepository = venueRepository;
        this.onsiteEventRepository = onsiteEventRepository;
        this.eventRepository = eventRepository;
    }

    public List<TimeSlotDto> getAvailableTimeSlots(Long venueId, LocalDateTime from, LocalDateTime to) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));

        if (from == null || to == null || !to.isAfter(from)) {
            throw new BadRequestException("Invalid date range: 'to' must be after 'from'");
        }

        List<OnsiteEvent> bookings = onsiteEventRepository.findVenueBookingsInRange(
                venue.getId(), from, to, EventStatus.ACTIVE
        );

        return buildFreeSlots(from, to, bookings, Duration.ofMinutes(30));
    }

    public List<VenueSuggestionDto> suggestVenues(
            String eventType,
            Set<String> requiredEquipment,
            Integer participants,
            LocalDateTime from,
            LocalDateTime to
    ) {
        if ("online".equalsIgnoreCase(eventType)) {
            return List.of();
        }

        LocalDateTime windowFrom = from != null ? from : LocalDateTime.now();
        LocalDateTime windowTo = to != null ? to : windowFrom.plusDays(7);

        if (!windowTo.isAfter(windowFrom)) {
            throw new BadRequestException("Invalid date range for suggestions");
        }

        List<Venue> venues = venueRepository.findAll();
        List<VenueSuggestionDto> suggestions = new ArrayList<>();

        for (Venue venue : venues) {
            if (!supportsCapacity(venue, participants)) {
                continue;
            }
            if (!supportsEquipment(venue, requiredEquipment)) {
                continue;
            }

            List<OnsiteEvent> bookings = onsiteEventRepository.findVenueBookingsInRange(
                    venue.getId(), windowFrom, windowTo, EventStatus.ACTIVE
            );
            List<TimeSlotDto> freeSlots = buildFreeSlots(windowFrom, windowTo, bookings, Duration.ofMinutes(30));
            if (freeSlots.isEmpty()) {
                continue;
            }

            double score = scoreVenue(venue, freeSlots, participants, requiredEquipment);
            suggestions.add(new VenueSuggestionDto(
                    venue.getId(),
                    venue.getName(),
                    pickCapacity(venue),
                    venue.getEquipment() == null ? Set.of() : venue.getEquipment(),
                    freeSlots.stream().limit(5).toList(),
                    score
            ));
        }

        suggestions.sort(Comparator.comparingDouble(VenueSuggestionDto::score).reversed());
        return suggestions;
    }

    public List<OptimizedEventDto> optimizeSchedule(ScheduleOptimizationRequest request) {
        if (request == null || request.getEvents() == null || request.getEvents().isEmpty()) {
            throw new BadRequestException("events payload is required");
        }

        List<ScheduleOptimizationRequest.Item> items = new ArrayList<>(request.getEvents());
        items.sort((a, b) -> {
            int demandA = isHighDemand(a) ? 1 : 0;
            int demandB = isHighDemand(b) ? 1 : 0;
            if (demandA != demandB) {
                return Integer.compare(demandB, demandA);
            }
            LocalDateTime as = a.getStartDate() == null ? LocalDateTime.now() : a.getStartDate();
            LocalDateTime bs = b.getStartDate() == null ? LocalDateTime.now() : b.getStartDate();
            return as.compareTo(bs);
        });

        List<OptimizedEventDto> optimized = new ArrayList<>();
        Map<String, Integer> preferredHourByCategory = getHistoricalPreferredHours();

        for (ScheduleOptimizationRequest.Item item : items) {
            if ("online".equalsIgnoreCase(item.getEventType())) {
                optimized.add(new OptimizedEventDto(
                        item.getId(),
                        item.getTitle(),
                        item.getStartDate(),
                        item.getEndDate(),
                        null,
                        "ONLINE",
                        "Online event kept without venue assignment"
                ));
                continue;
            }

            LocalDateTime desiredStart = item.getStartDate() == null ? LocalDateTime.now().plusHours(1) : item.getStartDate();
            LocalDateTime desiredEnd = item.getEndDate() == null ? desiredStart.plusHours(2) : item.getEndDate();
            if (!desiredEnd.isAfter(desiredStart)) {
                desiredEnd = desiredStart.plusHours(1);
            }
            Duration duration = Duration.between(desiredStart, desiredEnd);

            List<VenueSuggestionDto> suggestions = suggestVenues(
                    item.getEventType(),
                    item.getEquipmentNeeded(),
                    item.getParticipants(),
                    desiredStart.minusHours(2),
                    desiredStart.plusDays(7)
            );

            if (suggestions.isEmpty()) {
                optimized.add(new OptimizedEventDto(
                        item.getId(),
                        item.getTitle(),
                        desiredStart,
                        desiredEnd,
                        item.getVenueId(),
                        null,
                        "No compatible venue found; kept requested slot"
                ));
                continue;
            }

            TimeSlotDto pickedSlot = null;
            VenueSuggestionDto pickedVenue = null;

            for (VenueSuggestionDto venueSuggestion : suggestions) {
                Integer historicalHour = null;
                if (item.getCategory() != null && !item.getCategory().isBlank()) {
                    historicalHour = preferredHourByCategory.get(item.getCategory().trim().toLowerCase(Locale.ROOT));
                }
                TimeSlotDto candidate = pickBestSlot(
                        venueSuggestion.availableTimeSlots(),
                        duration,
                        isHighDemand(item),
                        item.getParticipantPreference(),
                        historicalHour
                );
                if (candidate != null) {
                    pickedSlot = candidate;
                    pickedVenue = venueSuggestion;
                    break;
                }
            }

            if (pickedSlot == null || pickedVenue == null) {
                optimized.add(new OptimizedEventDto(
                        item.getId(),
                        item.getTitle(),
                        desiredStart,
                        desiredEnd,
                        item.getVenueId(),
                        null,
                        "No slot long enough found; kept requested slot"
                ));
                continue;
            }

            LocalDateTime start = pickedSlot.startTime();
            LocalDateTime end = start.plus(duration);
            optimized.add(new OptimizedEventDto(
                    item.getId(),
                    item.getTitle(),
                    start,
                    end,
                    pickedVenue.venueId(),
                    pickedVenue.venueName(),
                    "Optimized based on availability, capacity, equipment, and demand"
            ));
        }

        return optimized;
    }

    public LocalDateTime suggestNextAvailableStart(Long venueId, LocalDateTime desiredStart, Duration duration) {
        LocalDateTime from = desiredStart;
        LocalDateTime to = desiredStart.plusDays(7);
        List<TimeSlotDto> freeSlots = getAvailableTimeSlots(venueId, from, to);
        for (TimeSlotDto slot : freeSlots) {
            if (!slot.endTime().isBefore(slot.startTime().plus(duration))) {
                return slot.startTime();
            }
        }
        return null;
    }

    private List<TimeSlotDto> buildFreeSlots(
            LocalDateTime from,
            LocalDateTime to,
            List<OnsiteEvent> bookings,
            Duration minimumDuration
    ) {
        List<TimeSlotDto> free = new ArrayList<>();
        LocalDateTime cursor = from;

        for (OnsiteEvent booking : bookings) {
            LocalDateTime bookingStart = booking.getStartDate().isBefore(from) ? from : booking.getStartDate();
            LocalDateTime bookingEnd = booking.getEndDate().isAfter(to) ? to : booking.getEndDate();
            if (bookingStart.isAfter(cursor) && Duration.between(cursor, bookingStart).compareTo(minimumDuration) >= 0) {
                free.add(new TimeSlotDto(cursor, bookingStart));
            }
            if (bookingEnd.isAfter(cursor)) {
                cursor = bookingEnd;
            }
        }

        if (to.isAfter(cursor) && Duration.between(cursor, to).compareTo(minimumDuration) >= 0) {
            free.add(new TimeSlotDto(cursor, to));
        }

        return free;
    }

    private boolean supportsCapacity(Venue venue, Integer participants) {
        if (participants == null || participants <= 0) {
            return true;
        }
        Integer capacity = pickCapacity(venue);
        return capacity != null && capacity >= participants;
    }

    private Integer pickCapacity(Venue venue) {
        if (venue.getMaxParticipants() != null && venue.getMaxParticipants() > 0) {
            return venue.getMaxParticipants();
        }
        return venue.getCapacity();
    }

    private boolean supportsEquipment(Venue venue, Set<String> requiredEquipment) {
        if (requiredEquipment == null || requiredEquipment.isEmpty()) {
            return true;
        }

        Set<String> normalizedAvailable = new LinkedHashSet<>();
        if (venue.getEquipment() != null) {
            for (String equipment : venue.getEquipment()) {
                if (equipment != null && !equipment.isBlank()) {
                    normalizedAvailable.add(equipment.trim().toLowerCase(Locale.ROOT));
                }
            }
        }

        for (String required : requiredEquipment) {
            if (required == null || required.isBlank()) {
                continue;
            }
            if (!normalizedAvailable.contains(required.trim().toLowerCase(Locale.ROOT))) {
                return false;
            }
        }

        return true;
    }

    private double scoreVenue(Venue venue, List<TimeSlotDto> slots, Integer participants, Set<String> requiredEquipment) {
        double score = 0.0;

        Integer capacity = pickCapacity(venue);
        if (participants != null && participants > 0 && capacity != null) {
            int slack = capacity - participants;
            score += Math.max(0, 50 - Math.min(40, slack));
        } else {
            score += 20;
        }

        score += Math.min(30, slots.size() * 3.0);

        int morningSlots = 0;
        for (TimeSlotDto slot : slots) {
            if (slot.startTime().toLocalTime().isBefore(LocalTime.NOON)) {
                morningSlots++;
            }
        }
        score += Math.min(20, morningSlots * 2.0);

        if (requiredEquipment != null && !requiredEquipment.isEmpty()) {
            score += 10;
        }

        return score;
    }

    private boolean isHighDemand(ScheduleOptimizationRequest.Item item) {
        if (Boolean.TRUE.equals(item.getHighDemand())) {
            return true;
        }
        if (item.getParticipants() != null && item.getParticipants() >= 50) {
            return true;
        }
        return item.getCategory() != null && item.getCategory().toLowerCase(Locale.ROOT).contains("workshop");
    }

    private TimeSlotDto pickBestSlot(
            List<TimeSlotDto> slots,
            Duration duration,
            boolean highDemand,
            String participantPreference,
            Integer historicalPreferredHour
    ) {
        if (slots == null || slots.isEmpty()) {
            return null;
        }

        for (TimeSlotDto slot : slots) {
            if (Duration.between(slot.startTime(), slot.endTime()).compareTo(duration) < 0) {
                continue;
            }

            LocalDateTime candidateStart = slot.startTime();

            if (highDemand && candidateStart.toLocalTime().isAfter(LocalTime.NOON)) {
                LocalDateTime morningCandidate = candidateStart.withHour(9).withMinute(0).withSecond(0).withNano(0);
                if (!morningCandidate.isBefore(slot.startTime())
                        && !morningCandidate.plus(duration).isAfter(slot.endTime())) {
                    candidateStart = morningCandidate;
                }
            }

            if (participantPreference != null) {
                String preference = participantPreference.trim().toUpperCase(Locale.ROOT);
                LocalDateTime preferredStart = switch (preference) {
                    case "MORNING" -> candidateStart.withHour(9).withMinute(0).withSecond(0).withNano(0);
                    case "AFTERNOON" -> candidateStart.withHour(14).withMinute(0).withSecond(0).withNano(0);
                    case "EVENING" -> candidateStart.withHour(17).withMinute(30).withSecond(0).withNano(0);
                    default -> candidateStart;
                };
                if (!preferredStart.isBefore(slot.startTime())
                        && !preferredStart.plus(duration).isAfter(slot.endTime())) {
                    candidateStart = preferredStart;
                }
            }

            if (historicalPreferredHour != null) {
                LocalDateTime historicalStart = candidateStart.withHour(historicalPreferredHour).withMinute(0).withSecond(0).withNano(0);
                if (!historicalStart.isBefore(slot.startTime())
                        && !historicalStart.plus(duration).isAfter(slot.endTime())) {
                    candidateStart = historicalStart;
                }
            }

            return new TimeSlotDto(candidateStart, slot.endTime());
        }

        return null;
    }

    private Map<String, Integer> getHistoricalPreferredHours() {
        var pastEvents = eventRepository.findByStartDateBefore(LocalDateTime.now());
        Map<String, Map<Integer, Integer>> counts = new HashMap<>();

        for (var event : pastEvents) {
            if (event.getCategory() == null || event.getCategory().isBlank() || event.getStartDate() == null) {
                continue;
            }
            String category = event.getCategory().trim().toLowerCase(Locale.ROOT);
            int hour = event.getStartDate().getHour();
            counts.computeIfAbsent(category, ignored -> new HashMap<>())
                    .merge(hour, 1, Integer::sum);
        }

        Map<String, Integer> preferredHourByCategory = new HashMap<>();
        for (Map.Entry<String, Map<Integer, Integer>> entry : counts.entrySet()) {
            Integer preferredHour = entry.getValue().entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
            if (preferredHour != null) {
                preferredHourByCategory.put(entry.getKey(), preferredHour);
            }
        }

        return preferredHourByCategory;
    }
}
