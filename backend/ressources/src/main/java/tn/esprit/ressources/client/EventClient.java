package tn.esprit.ressources.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.Map;

/**
 * Feign client for communicating with the Event Service.
 * This client is used by the Resources service to fetch event information.
 */
@FeignClient(name = "event-service", path = "/api/events")
public interface EventClient {

    /**
     * Get event details by event ID.
     * This is a public endpoint for fetching event information.
     *
     * @param eventId the unique identifier of the event
     * @return event details
     */
    @GetMapping("/{eventId}")
    Map<String, Object> getEventById(@PathVariable("eventId") Long eventId);

    /**
     * Get total number of registrations for an event.
     * This can be called by other services to get registration statistics.
     *
     * @param eventId the unique identifier of the event
     * @return event statistics including registration count
     */
    @GetMapping("/{eventId}/stats")
    Map<String, Object> getEventStats(@PathVariable("eventId") Long eventId);
}
