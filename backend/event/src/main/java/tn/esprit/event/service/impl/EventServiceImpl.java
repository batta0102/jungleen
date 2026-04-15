package tn.esprit.event.service.impl;

import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.event.model.Event;
import tn.esprit.event.model.OnlineEvent;
import tn.esprit.event.model.OnsiteEvent;
import tn.esprit.event.model.Venue;
import tn.esprit.event.model.User;
import tn.esprit.event.model.enums.EventStatus;
import tn.esprit.event.model.enums.EventType;
import tn.esprit.event.repository.EventRepository;
import tn.esprit.event.repository.OnsiteEventRepository;
import tn.esprit.event.repository.VenueRepository;
import tn.esprit.event.repository.EventRegistrationRepository;
import tn.esprit.event.repository.UserRepository;
import tn.esprit.event.model.EventRegistration;
import tn.esprit.event.service.EventSchedulingService;
import tn.esprit.event.service.EventService;
import tn.esprit.event.web.dto.CreateOnlineEventRequest;
import tn.esprit.event.web.dto.CreateOnsiteEventRequest;
import tn.esprit.event.web.exception.BadRequestException;
import tn.esprit.event.web.exception.ResourceNotFoundException;

@Service
public class EventServiceImpl implements EventService {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private OnsiteEventRepository onsiteEventRepository;

    @Autowired
    private EventRegistrationRepository eventRegistrationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EventSchedulingService schedulingService;

    @Override
    public OnlineEvent createOnlineEvent(CreateOnlineEventRequest request) {
        validateDates(request.getStartDate(), request.getEndDate());

        OnlineEvent event = new OnlineEvent();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setMeetingUrl(request.getMeetingUrl());
        event.setImageUrl(request.getImageUrl());
        event.setPrice(request.getPrice() != null ? request.getPrice() : 0.0);
        event.setStatus(EventStatus.ACTIVE);
        event.setType(EventType.ONLINE);
        event.setEventDiscriminator(OnlineEvent.class.getSimpleName());

        // Set new fields
        event.setCategory(request.getCategory());
        event.setMaxParticipants(request.getMaxParticipants());
        event.setEnableWaitlist(request.getEnableWaitlist() != null ? request.getEnableWaitlist() : false);
        event.setAllowComments(request.getAllowComments() != null ? request.getAllowComments() : true);
        event.setReminderEmails(request.getReminderEmails() != null ? request.getReminderEmails() : true);
        event.setRepeatEvent(request.getRepeatEvent() != null ? request.getRepeatEvent() : false);
        event.setRepeatFrequency(request.getRepeatFrequency());
        if (request.getRepeatDays() != null) {
            event.setRepeatDays(new ArrayList<>(request.getRepeatDays()));
        }

        return eventRepository.save(event);
    }

    @Override
    public OnlineEvent updateOnlineEvent(Long id, CreateOnlineEventRequest request) {
        Event baseEvent = getEventById(id);
        if (!(baseEvent instanceof OnlineEvent)) {
            throw new ResourceNotFoundException("Event is not an online event");
        }
        OnlineEvent event = (OnlineEvent) baseEvent;
        validateDates(request.getStartDate(), request.getEndDate());

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setMeetingUrl(request.getMeetingUrl());
        event.setImageUrl(request.getImageUrl());
        event.setPrice(request.getPrice() != null ? request.getPrice() : 0.0);
        event.setType(EventType.ONLINE);
        event.setEventDiscriminator(OnlineEvent.class.getSimpleName());

        // Set new fields
        event.setCategory(request.getCategory());
        event.setMaxParticipants(request.getMaxParticipants());
        event.setEnableWaitlist(request.getEnableWaitlist() != null ? request.getEnableWaitlist() : false);
        event.setAllowComments(request.getAllowComments() != null ? request.getAllowComments() : true);
        event.setReminderEmails(request.getReminderEmails() != null ? request.getReminderEmails() : true);
        event.setRepeatEvent(request.getRepeatEvent() != null ? request.getRepeatEvent() : false);
        event.setRepeatFrequency(request.getRepeatFrequency());
        if (request.getRepeatDays() != null) {
            event.setRepeatDays(new ArrayList<>(request.getRepeatDays()));
        }

        return eventRepository.save(event);
    }

    @Override
    public OnsiteEvent createOnsiteEvent(CreateOnsiteEventRequest request) {
        validateDates(request.getStartDate(), request.getEndDate());

        if (request.getVenueId() == null) {
            throw new BadRequestException("venueId is required for onsite events");
        }

        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));

        validateVenueCapacity(request.getCapacity(), venue.getCapacity(), request);
        validateVenueEquipment(venue, request.getRequiredEquipment());
        validateVenueAvailability(venue.getId(), request.getStartDate(), request.getEndDate(), null, request);

        OnsiteEvent event = new OnsiteEvent();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setVenueName(venue.getName());
        event.setVenueAddress(venue.getAddress());
        event.setCapacity(request.getCapacity());
        event.setImageUrl(request.getImageUrl());
        event.setPrice(request.getPrice() != null ? request.getPrice() : 0.0);
        event.setStatus(EventStatus.ACTIVE);
        event.setType(EventType.ONSITE);
        event.setEventDiscriminator(OnsiteEvent.class.getSimpleName());
        event.setVenue(venue);
        if (request.getRequiredEquipment() != null) {
            event.setRequiredEquipment(new LinkedHashSet<>(request.getRequiredEquipment()));
        }

        // Set new fields
        event.setCategory(request.getCategory());
        event.setMaxParticipants(request.getMaxParticipants());
        event.setEnableWaitlist(request.getEnableWaitlist() != null ? request.getEnableWaitlist() : false);
        event.setAllowComments(request.getAllowComments() != null ? request.getAllowComments() : true);
        event.setReminderEmails(request.getReminderEmails() != null ? request.getReminderEmails() : true);
        event.setRepeatEvent(request.getRepeatEvent() != null ? request.getRepeatEvent() : false);
        event.setRepeatFrequency(request.getRepeatFrequency());
        if (request.getRepeatDays() != null) {
            event.setRepeatDays(new ArrayList<>(request.getRepeatDays()));
        }

        return eventRepository.save(event);
    }

    @Override
    public OnsiteEvent updateOnsiteEvent(Long id, CreateOnsiteEventRequest request) {
        Event baseEvent = getEventById(id);
        if (!(baseEvent instanceof OnsiteEvent)) {
            throw new ResourceNotFoundException("Event is not an onsite event");
        }
        if (request.getVenueId() == null) {
            throw new BadRequestException("venueId is required for onsite events");
        }
        OnsiteEvent event = (OnsiteEvent) baseEvent;
        validateDates(request.getStartDate(), request.getEndDate());

        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));

        validateVenueCapacity(request.getCapacity(), venue.getCapacity(), request);
        validateVenueEquipment(venue, request.getRequiredEquipment());
        validateVenueAvailability(venue.getId(), request.getStartDate(), request.getEndDate(), id, request);

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setStartDate(request.getStartDate());
        event.setEndDate(request.getEndDate());
        event.setVenueName(venue.getName());
        event.setVenueAddress(venue.getAddress());
        event.setCapacity(request.getCapacity());
        event.setImageUrl(request.getImageUrl());
        event.setPrice(request.getPrice() != null ? request.getPrice() : 0.0);
        event.setType(EventType.ONSITE);
        event.setEventDiscriminator(OnsiteEvent.class.getSimpleName());
        event.setVenue(venue);
        if (request.getRequiredEquipment() != null) {
            event.setRequiredEquipment(new LinkedHashSet<>(request.getRequiredEquipment()));
        }

        // Set new fields
        event.setCategory(request.getCategory());
        event.setMaxParticipants(request.getMaxParticipants());
        event.setEnableWaitlist(request.getEnableWaitlist() != null ? request.getEnableWaitlist() : false);
        event.setAllowComments(request.getAllowComments() != null ? request.getAllowComments() : true);
        event.setReminderEmails(request.getReminderEmails() != null ? request.getReminderEmails() : true);
        event.setRepeatEvent(request.getRepeatEvent() != null ? request.getRepeatEvent() : false);
        event.setRepeatFrequency(request.getRepeatFrequency());
        if (request.getRepeatDays() != null) {
            event.setRepeatDays(new ArrayList<>(request.getRepeatDays()));
        }

        return eventRepository.save(event);
    }

    @Override
    public Event getEventById(Long id) {
        return eventRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
    }

    @Override
    public void deleteEvent(Long id) {
        if (!eventRepository.existsById(id)) {
            throw new ResourceNotFoundException("Event not found");
        }

        deleteEventDependencies(id);

        try {
            eventRepository.deleteById(id);
        } catch (DataIntegrityViolationException ex) {
            throw new BadRequestException("Cannot delete event because it is referenced by other records");
        }
    }

    @Override
    public Event cancelEvent(Long eventId) {
        return updateStatus(eventId, EventStatus.CANCELED);
    }

    @Override
    public Event updateStatus(Long eventId, EventStatus status) {
        Event event = getEventById(eventId);
        event.setStatus(status);
        return eventRepository.save(event);
    }

    @Override
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    @Override
    public List<Event> getEventsByStatus(EventStatus status) {
        return eventRepository.findByStatus(status);
    }

    @Override
    public List<Event> getEventsByType(EventType type) {
        return eventRepository.findByType(type);
    }

    @Override
    public byte[] exportAttendeesCsv(Long eventId) {
        getEventById(eventId);

        String tableName = "event_registrations";
        List<String> columns = jdbcTemplate.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
                String.class,
                tableName
        );

        if (columns == null || columns.isEmpty()) {
            return "firstName,lastName,email\n".getBytes(StandardCharsets.UTF_8);
        }

        String eventIdColumn = firstMatch(columns, "event_id", "eventid", "eventId");
        if (eventIdColumn == null) {
            throw new BadRequestException("Cannot export attendees: event_id column not found");
        }

        String emailColumn = firstMatch(columns, "email", "user_email", "participant_email");
        if (emailColumn == null) {
            throw new BadRequestException("Cannot export attendees: email column not found");
        }

        String firstNameColumn = firstMatch(columns, "first_name", "firstname", "firstName", "name");
        String lastNameColumn = firstMatch(columns, "last_name", "lastname", "lastName", "surname");

        String selectFirst = firstNameColumn != null ? "`" + firstNameColumn + "`" : "''";
        String selectLast = lastNameColumn != null ? "`" + lastNameColumn + "`" : "''";

        String sql = "SELECT " + selectFirst + " AS firstName, " + selectLast + " AS lastName, `" + emailColumn
                + "` AS email FROM `" + tableName + "` WHERE `" + eventIdColumn + "` = ?";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, eventId);

        StringBuilder csv = new StringBuilder("firstName,lastName,email\n");
        for (Map<String, Object> row : rows) {
            String first = toCsvSafe(row.get("firstName"));
            String last = toCsvSafe(row.get("lastName"));
            String email = toCsvSafe(row.get("email"));
            csv.append(first).append(',').append(last).append(',').append(email).append('\n');
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private void validateDates(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("startDate and endDate are required");
        }
        if (!endDate.isAfter(startDate)) {
            throw new IllegalArgumentException("endDate must be after startDate");
        }
    }

        private void validateVenueAvailability(Long venueId, LocalDateTime startDate, LocalDateTime endDate, Long excludeEventId, CreateOnsiteEventRequest request) {
        boolean overlap = onsiteEventRepository.existsVenueOverlap(venueId, startDate, endDate, EventStatus.ACTIVE, excludeEventId);
        if (overlap) {
            LocalDateTime nextStart = schedulingService.suggestNextAvailableStart(
                venueId,
                startDate,
                java.time.Duration.between(startDate, endDate)
            );

            String suggestion = nextStart == null
                ? "No free slot found in the next 7 days."
                : "Suggested next slot starts at " + nextStart + ".";

            throw new BadRequestException("Selected venue is not available for the specified time range. " + suggestion);
        }
    }

    private void validateVenueEquipment(Venue venue, Set<String> requiredEquipment) {
        if (requiredEquipment == null || requiredEquipment.isEmpty()) {
            return;
        }

        Set<String> normalizedVenueEquipment = new LinkedHashSet<>();
        if (venue.getEquipment() != null) {
            for (String equipment : venue.getEquipment()) {
                if (equipment != null && !equipment.isBlank()) {
                    normalizedVenueEquipment.add(equipment.trim().toLowerCase(Locale.ROOT));
                }
            }
        }

        List<String> missing = new ArrayList<>();
        for (String req : requiredEquipment) {
            if (req == null || req.isBlank()) {
                continue;
            }
            String normalized = req.trim().toLowerCase(Locale.ROOT);
            if (!normalizedVenueEquipment.contains(normalized)) {
                missing.add(req);
            }
        }

        if (!missing.isEmpty()) {
            throw new BadRequestException("Selected venue is missing required equipment: " + String.join(", ", missing));
        }
    }

    private void validateVenueCapacity(Integer requestedCapacity, Integer venueCapacity, CreateOnsiteEventRequest request) {
        if (requestedCapacity == null || venueCapacity == null) {
            return;
        }
        if (requestedCapacity > venueCapacity) {
            var suggestions = schedulingService.suggestVenues(
                    request.getEventType(),
                    request.getRequiredEquipment(),
                    requestedCapacity,
                    request.getStartDate(),
                    request.getEndDate() == null ? null : request.getEndDate().plusDays(3)
            );

            String hint = suggestions.isEmpty()
                    ? "No larger venue suggestion found."
                    : "Suggested venue: " + suggestions.get(0).venueName() + " (id=" + suggestions.get(0).venueId() + ").";

            throw new BadRequestException("Event capacity cannot exceed venue capacity. " + hint);
        }
    }

    private String firstMatch(List<String> columns, String... candidates) {
        List<String> lowered = new ArrayList<>();
        for (String c : columns) {
            lowered.add(c == null ? "" : c.toLowerCase(Locale.ROOT));
        }
        for (String candidate : candidates) {
            int idx = lowered.indexOf(candidate.toLowerCase(Locale.ROOT));
            if (idx >= 0) {
                return columns.get(idx);
            }
        }
        return null;
    }

    private String toCsvSafe(Object value) {
        String text = Objects.toString(value, "");
        String escaped = text.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\"") || escaped.contains("\n") || escaped.contains("\r")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    private void deleteEventDependencies(Long eventId) {
        deleteJoinTableRows("event_registrations", eventId);
        deleteJoinTableRows("events_attendees", eventId);
    }

    private void deleteJoinTableRows(String tableName, Long eventId) {
        try {
            jdbcTemplate.update("DELETE FROM " + tableName + " WHERE event_id = ?", eventId);
        } catch (DataAccessException ignored) {
            // table may not exist in this environment; ignore and continue
        }
    }

    @Override
    @Transactional
    public void registerForEvent(Long eventId, String firstName, String lastName, String email, String userId) {
        // Verify event exists
        Event event = getEventById(eventId);
        
        // Check if already registered
        if (eventRegistrationRepository.existsByEventIdAndEmail(eventId, email)) {
            throw new BadRequestException("User with email " + email + " is already registered for this event");
        }
        
        // Create registration
        EventRegistration registration = new EventRegistration();
        registration.setEventId(eventId);
        String normalizedFirst = firstName == null ? "" : firstName.trim();
        String normalizedLast = lastName == null ? "" : lastName.trim();
        String fullName = (normalizedFirst + " " + normalizedLast).trim();
        if (fullName.isEmpty()) {
            fullName = email != null && email.contains("@") ? email.substring(0, email.indexOf('@')) : "Student";
        }

        registration.setFirstName(firstName);
        registration.setName(fullName);
        registration.setEmail(email);
        registration.setCreatedAt(LocalDateTime.now());
        registration.setRegistrationStatus("CONFIRMED");
        registration.setPaymentRequired(0);
        
        eventRegistrationRepository.save(registration);

        User attendee = findOrCreateAttendee(firstName, lastName, email);
        linkAttendeeToEvent(event.getId(), attendee.getId());
    }

        @Override
        public List<Long> getRegisteredEventIds(String userId, String email) {
            Set<Long> eventIds = new LinkedHashSet<>();

            if (email != null && !email.isBlank()) {
                eventRegistrationRepository.findByEmail(email)
                        .stream()
                        .map(EventRegistration::getEventId)
                        .filter(Objects::nonNull)
                        .forEach(eventIds::add);
            }

            return List.copyOf(eventIds);
        }

    private User findOrCreateAttendee(String firstName, String lastName, String email) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            String normalizedFirst = firstName == null ? "" : firstName.trim();
            String normalizedLast = lastName == null ? "" : lastName.trim();

            String fullName = (normalizedFirst + " " + normalizedLast).trim();
            if (fullName.isEmpty()) {
                fullName = email != null && email.contains("@") ? email.substring(0, email.indexOf('@')) : "Student";
            }

            user.setName(fullName);
            user.setEmail(email);
            return userRepository.save(user);
        });
    }

    private void linkAttendeeToEvent(Long eventId, Long attendeeId) {
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
                String.class
        );

        if (!tables.contains("events_attendees")) {
            return;
        }

        List<String> columns = jdbcTemplate.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
                String.class,
                "events_attendees"
        );

        String eventIdColumn = firstMatch(columns, "event_id", "events_id", "eventid", "eventId");
        String attendeeIdColumn = firstMatch(columns, "attendees_id", "attendee_id", "user_id", "users_id", "userid", "userId");

        if (eventIdColumn == null || attendeeIdColumn == null) {
            return;
        }

        String existsSql = "SELECT COUNT(*) FROM `events_attendees` WHERE `" + eventIdColumn + "` = ? AND `" + attendeeIdColumn + "` = ?";
        Integer count = jdbcTemplate.queryForObject(existsSql, Integer.class, eventId, attendeeId);
        if (count != null && count > 0) {
            return;
        }

        String insertSql = "INSERT INTO `events_attendees` (`" + eventIdColumn + "`, `" + attendeeIdColumn + "`) VALUES (?, ?)";
        jdbcTemplate.update(insertSql, eventId, attendeeId);
    }
}
