package tn.esprit.event.service;

import java.time.LocalDateTime;
import java.util.List;
import tn.esprit.event.model.Event;
import tn.esprit.event.model.OnlineEvent;
import tn.esprit.event.model.OnsiteEvent;
import tn.esprit.event.model.enums.EventStatus;
import tn.esprit.event.model.enums.EventType;
import tn.esprit.event.web.dto.CreateOnlineEventRequest;
import tn.esprit.event.web.dto.CreateOnsiteEventRequest;

public interface EventService {

    OnlineEvent createOnlineEvent(CreateOnlineEventRequest request);

    OnlineEvent updateOnlineEvent(Long id, CreateOnlineEventRequest request);

    OnsiteEvent createOnsiteEvent(CreateOnsiteEventRequest request);

    OnsiteEvent updateOnsiteEvent(Long id, CreateOnsiteEventRequest request);

    Event getEventById(Long id);

    void deleteEvent(Long id);

    Event cancelEvent(Long eventId);

    Event updateStatus(Long eventId, EventStatus status);

    List<Event> getAllEvents();

    List<Event> getEventsByStatus(EventStatus status);

    List<Event> getEventsByType(EventType type);

    byte[] exportAttendeesCsv(Long eventId);

    void registerForEvent(Long eventId, String firstName, String lastName, String email, String userId);

    List<Long> getRegisteredEventIds(String userId, String email);
}
