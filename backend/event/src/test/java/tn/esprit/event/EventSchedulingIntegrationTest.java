package tn.esprit.event;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.event.model.OnsiteEvent;
import tn.esprit.event.model.Venue;
import tn.esprit.event.model.enums.EventStatus;
import tn.esprit.event.model.enums.EventType;
import tn.esprit.event.repository.EventRepository;
import tn.esprit.event.repository.VenueRepository;
import tn.esprit.event.service.EventSchedulingService;
import tn.esprit.event.service.EventService;
import tn.esprit.event.web.dto.CreateOnsiteEventRequest;
import tn.esprit.event.web.dto.OptimizedEventDto;
import tn.esprit.event.web.dto.ScheduleOptimizationRequest;
import tn.esprit.event.web.exception.BadRequestException;

@SpringBootTest
@Transactional
@Import(MockJwtDecoderConfig.class)
class EventSchedulingIntegrationTest {

    @Autowired
    private EventService eventService;

    @Autowired
    private EventSchedulingService schedulingService;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private EventRepository eventRepository;

    @Test
    void createOnsiteEvent_shouldRejectOverlapOnSameVenue() {
        Venue venue = saveVenue("Hall A", 40, "projector", "chairs", "microphone");

        eventService.createOnsiteEvent(buildOnsiteRequest(
                "Workshop A",
                venue,
                LocalDateTime.of(2026, 6, 15, 10, 0),
                LocalDateTime.of(2026, 6, 15, 12, 0),
                20,
                SetHelper.of("projector")
        ));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                eventService.createOnsiteEvent(buildOnsiteRequest(
                        "Workshop B",
                        venue,
                        LocalDateTime.of(2026, 6, 15, 11, 0),
                        LocalDateTime.of(2026, 6, 15, 13, 0),
                        15,
                        SetHelper.of("chairs")
                ))
        );

        assertTrue(ex.getMessage().toLowerCase().contains("not available"));
    }

    @Test
    void createOnsiteEvent_shouldRejectWhenRequiredEquipmentMissing() {
        Venue venue = saveVenue("Hall B", 50, "chairs", "whiteboard");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                eventService.createOnsiteEvent(buildOnsiteRequest(
                        "Conference",
                        venue,
                        LocalDateTime.of(2026, 6, 20, 9, 0),
                        LocalDateTime.of(2026, 6, 20, 11, 0),
                        30,
                        SetHelper.of("projector", "chairs")
                ))
        );

        assertTrue(ex.getMessage().toLowerCase().contains("missing required equipment"));
        assertTrue(ex.getMessage().toLowerCase().contains("projector"));
    }

    @Test
    void optimizeSchedule_shouldUseHistoricalCategoryHourWhenFeasible() {
        Venue venue = saveVenue("Hall C", 80, "projector", "chairs", "microphone");

        // Historical workshop events mostly around 09:00
        saveHistoricalOnsiteEvent("Past Workshop 1", venue, LocalDateTime.of(2026, 1, 10, 9, 0));
        saveHistoricalOnsiteEvent("Past Workshop 2", venue, LocalDateTime.of(2026, 2, 14, 9, 0));
        saveHistoricalOnsiteEvent("Past Workshop 3", venue, LocalDateTime.of(2026, 3, 3, 14, 0));

        ScheduleOptimizationRequest request = new ScheduleOptimizationRequest();
        ScheduleOptimizationRequest.Item item = new ScheduleOptimizationRequest.Item();
        item.setId(1L);
        item.setTitle("New Workshop");
        item.setEventType("onsite");
        item.setCategory("Workshop");
        item.setStartDate(LocalDateTime.of(2026, 7, 1, 8, 0));
        item.setEndDate(LocalDateTime.of(2026, 7, 1, 10, 0));
        item.setVenueId(venue.getId());
        item.setParticipants(25);
        item.setEquipmentNeeded(SetHelper.of("projector"));
        request.setEvents(List.of(item));

        List<OptimizedEventDto> optimized = schedulingService.optimizeSchedule(request);

        assertEquals(1, optimized.size());
        OptimizedEventDto dto = optimized.get(0);
        assertNotNull(dto.startDate());
        assertEquals(9, dto.startDate().getHour(), "Expected optimization to prefer historical 09:00 hour");
    }

    private Venue saveVenue(String name, int capacity, String... equipment) {
        Venue v = new Venue();
        v.setName(name);
        v.setAddress("Street 1");
        v.setCity("Tunis");
        v.setCountry("TN");
        v.setCapacity(capacity);
        v.setMaxParticipants(capacity);
        v.setEquipment(new LinkedHashSet<>(List.of(equipment)));
        return venueRepository.save(v);
    }

    private CreateOnsiteEventRequest buildOnsiteRequest(
            String title,
            Venue venue,
            LocalDateTime start,
            LocalDateTime end,
            Integer participants,
            java.util.Set<String> requiredEquipment
    ) {
        CreateOnsiteEventRequest req = new CreateOnsiteEventRequest();
        req.setTitle(title);
        req.setDescription("desc");
        req.setStartDate(start);
        req.setEndDate(end);
        req.setVenueId(venue.getId());
        req.setCapacity(participants);
        req.setEventType("workshop");
        req.setCategory("Workshop");
        req.setRequiredEquipment(requiredEquipment);
        return req;
    }

    private void saveHistoricalOnsiteEvent(String title, Venue venue, LocalDateTime start) {
        OnsiteEvent e = new OnsiteEvent();
        e.setTitle(title);
        e.setDescription("history");
        e.setStartDate(start);
        e.setEndDate(start.plusHours(2));
        e.setVenue(venue);
        e.setVenueName(venue.getName());
        e.setVenueAddress(venue.getAddress());
        e.setCapacity(20);
        e.setStatus(EventStatus.COMPLETED);
        e.setType(EventType.ONSITE);
        e.setEventDiscriminator(OnsiteEvent.class.getSimpleName());
        e.setCategory("Workshop");
        eventRepository.save(e);
    }

    private static final class SetHelper {
        private SetHelper() {}

        static java.util.Set<String> of(String... values) {
            return new LinkedHashSet<>(List.of(values));
        }
    }
}
