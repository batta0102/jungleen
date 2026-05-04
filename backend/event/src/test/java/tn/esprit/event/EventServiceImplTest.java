package tn.esprit.event;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import tn.esprit.event.model.Event;
import tn.esprit.event.model.OnlineEvent;
import tn.esprit.event.model.Venue;
import tn.esprit.event.model.enums.EventStatus;
import tn.esprit.event.repository.EventRegistrationRepository;
import tn.esprit.event.repository.EventRepository;
import tn.esprit.event.repository.OnsiteEventRepository;
import tn.esprit.event.repository.UserRepository;
import tn.esprit.event.repository.VenueRepository;
import tn.esprit.event.service.EventSchedulingService;
import tn.esprit.event.service.impl.EventServiceImpl;
import tn.esprit.event.web.dto.CreateOnlineEventRequest;
import tn.esprit.event.web.dto.CreateOnsiteEventRequest;
import tn.esprit.event.web.dto.VenueSuggestionDto;
import tn.esprit.event.web.exception.BadRequestException;
import tn.esprit.event.web.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private VenueRepository venueRepository;
    @Mock
    private OnsiteEventRepository onsiteEventRepository;
    @Mock
    private EventRegistrationRepository eventRegistrationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private JdbcTemplate jdbcTemplate;
    @Mock
    private EventSchedulingService schedulingService;

    @InjectMocks
    private EventServiceImpl eventService;

    @Test
    void createOnlineEvent_shouldPersistWithDefaults() {
        CreateOnlineEventRequest request = new CreateOnlineEventRequest();
        request.setTitle("Spring Boot Deep Dive");
        request.setDescription("Advanced session");
        request.setStartDate(LocalDateTime.of(2026, 5, 20, 10, 0));
        request.setEndDate(LocalDateTime.of(2026, 5, 20, 12, 0));
        request.setMeetingUrl("https://meet.example.com/boot");

        when(eventRepository.save(any(OnlineEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OnlineEvent saved = eventService.createOnlineEvent(request);

        assertEquals("Spring Boot Deep Dive", saved.getTitle());
        assertEquals(EventStatus.ACTIVE, saved.getStatus());
        assertEquals("OnlineEvent", saved.getEventDiscriminator());
        assertEquals(0.0, saved.getPrice());
        verify(eventRepository).save(any(OnlineEvent.class));
    }

    @Test
    void getEventById_shouldThrowWhenMissing() {
        when(eventRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> eventService.getEventById(99L));
    }

    @Test
    void deleteEvent_shouldDeleteDependenciesAndEntity() {
        when(eventRepository.existsById(42L)).thenReturn(true);

        eventService.deleteEvent(42L);

        verify(jdbcTemplate).update(eq("DELETE FROM event_registrations WHERE event_id = ?"), eq(42L));
        verify(jdbcTemplate).update(eq("DELETE FROM events_attendees WHERE event_id = ?"), eq(42L));
        verify(eventRepository).deleteById(42L);
    }

    @Test
    void createOnsiteEvent_shouldRejectMissingVenueAndCapacityOverflow() {
        CreateOnsiteEventRequest missingVenue = new CreateOnsiteEventRequest();
        missingVenue.setTitle("Onsite");
        missingVenue.setStartDate(LocalDateTime.of(2026, 6, 1, 9, 0));
        missingVenue.setEndDate(LocalDateTime.of(2026, 6, 1, 11, 0));

        BadRequestException missingVenueEx = assertThrows(BadRequestException.class,
                () -> eventService.createOnsiteEvent(missingVenue));
        assertTrue(missingVenueEx.getMessage().toLowerCase().contains("venueid"));

        Venue venue = new Venue();
        venue.setId(7L);
        venue.setName("Room A");
        venue.setAddress("Main Street");
        venue.setCapacity(20);
        venue.setEquipment(new LinkedHashSet<>(List.of("projector")));
        when(venueRepository.findById(7L)).thenReturn(Optional.of(venue));
        when(schedulingService.suggestVenues(any(), any(), any(), any(), any()))
                .thenReturn(List.of(new VenueSuggestionDto(11L, "Big Hall", 120, new LinkedHashSet<>(), List.of(), 0.91)));

        CreateOnsiteEventRequest overflow = new CreateOnsiteEventRequest();
        overflow.setTitle("Big Event");
        overflow.setStartDate(LocalDateTime.of(2026, 6, 2, 9, 0));
        overflow.setEndDate(LocalDateTime.of(2026, 6, 2, 12, 0));
        overflow.setVenueId(7L);
        overflow.setCapacity(50);

        BadRequestException overflowEx = assertThrows(BadRequestException.class,
                () -> eventService.createOnsiteEvent(overflow));

        assertTrue(overflowEx.getMessage().toLowerCase().contains("capacity"));
        assertTrue(overflowEx.getMessage().contains("Suggested venue"));
        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void createOnsiteEvent_shouldRejectOverlappingBooking() {
        Venue venue = new Venue();
        venue.setId(5L);
        venue.setName("Lab 2");
        venue.setAddress("Campus");
        venue.setCapacity(40);
        venue.setEquipment(new LinkedHashSet<>(List.of("projector", "chairs")));

        when(venueRepository.findById(5L)).thenReturn(Optional.of(venue));
        when(onsiteEventRepository.existsVenueOverlap(eq(5L), any(), any(), eq(EventStatus.ACTIVE), eq(null)))
                .thenReturn(true);
        when(schedulingService.suggestNextAvailableStart(eq(5L), any(), any()))
                .thenReturn(LocalDateTime.of(2026, 7, 10, 14, 0));

        CreateOnsiteEventRequest request = new CreateOnsiteEventRequest();
        request.setTitle("AI Workshop");
        request.setVenueId(5L);
        request.setCapacity(30);
        request.setStartDate(LocalDateTime.of(2026, 7, 10, 10, 0));
        request.setEndDate(LocalDateTime.of(2026, 7, 10, 12, 0));
        request.setRequiredEquipment(new LinkedHashSet<>(List.of("projector")));

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> eventService.createOnsiteEvent(request));

        assertTrue(ex.getMessage().toLowerCase().contains("not available"));
        verify(eventRepository, never()).save(any(Event.class));
    }
}
