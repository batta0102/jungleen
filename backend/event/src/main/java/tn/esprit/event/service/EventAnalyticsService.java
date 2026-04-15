package tn.esprit.event.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import tn.esprit.event.model.Event;
import tn.esprit.event.model.OnsiteEvent;
import tn.esprit.event.model.Venue;
import tn.esprit.event.repository.EventRepository;
import tn.esprit.event.repository.VenueRepository;
import tn.esprit.event.web.exception.ResourceNotFoundException;

@Service
public class EventAnalyticsService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final JdbcTemplate jdbcTemplate;

    public EventAnalyticsService(EventRepository eventRepository, VenueRepository venueRepository, JdbcTemplate jdbcTemplate) {
        this.eventRepository = eventRepository;
        this.venueRepository = venueRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> getParticipantsAnalytics() {
        List<Event> events = eventRepository.findAll();
        Map<Long, Integer> participantsByEvent = getParticipantsByEvent();

        List<Map<String, Object>> rows = new ArrayList<>();
        int totalParticipants = 0;
        int paidParticipants = 0;
        int rsvpParticipants = 0;

        for (Event event : events) {
            int participants = participantsByEvent.getOrDefault(event.getId(), 0);
            totalParticipants += participants;
            if ((event.getPrice() != null ? event.getPrice() : 0.0) > 0) {
                paidParticipants += participants;
            } else {
                rsvpParticipants += participants;
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("eventId", event.getId());
            row.put("eventTitle", event.getTitle());
            row.put("eventType", event.getType());
            row.put("participants", participants);
            rows.add(row);
        }

        rows.sort((a, b) -> Integer.compare((int) b.get("participants"), (int) a.get("participants")));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("totalEvents", events.size());
        payload.put("totalParticipants", totalParticipants);
        payload.put("averageParticipantsPerEvent", events.isEmpty() ? 0.0 : round2((double) totalParticipants / events.size()));
        payload.put("rsvpVsPaid", Map.of(
                "rsvpParticipants", rsvpParticipants,
                "paidParticipants", paidParticipants
        ));
        payload.put("events", rows);
        return payload;
    }

    public Map<String, Object> getAttendanceRate() {
        List<Event> events = eventRepository.findAll();
        Map<Long, Integer> participantsByEvent = getParticipantsByEvent();

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Event event : events) {
            int participants = participantsByEvent.getOrDefault(event.getId(), 0);
            Integer capacity = null;
            if (event instanceof OnsiteEvent onsite) {
                capacity = onsite.getCapacity();
            }

            Double rate = null;
            if (capacity != null && capacity > 0) {
                rate = round2((participants * 100.0) / capacity);
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("eventId", event.getId());
            row.put("eventTitle", event.getTitle());
            row.put("participants", participants);
            row.put("capacity", capacity);
            row.put("attendanceRate", rate);
            rows.add(row);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("events", rows);
        return payload;
    }

    public Map<String, Object> getPopularEvents() {
        Map<String, Object> participants = getParticipantsAnalytics();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> events = (List<Map<String, Object>>) participants.get("events");
        List<Map<String, Object>> top = events.stream().limit(10).toList();
        return Map.of("topEvents", top);
    }

    public Map<String, Object> getVenueUtilization() {
        LocalDateTime now = LocalDate.now().atStartOfDay();
        LocalDateTime from = now.minusDays(30);
        LocalDateTime to = now.plusDays(30);
        double totalWindowHours = ChronoUnit.MINUTES.between(from, to) / 60.0;

        List<Venue> venues = venueRepository.findAll();
        List<Event> events = eventRepository.findAll();

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Venue venue : venues) {
            double bookedHours = 0.0;
            for (Event event : events) {
                if (!(event instanceof OnsiteEvent onsite)) {
                    continue;
                }

                boolean sameVenueById = onsite.getVenue() != null
                        && Objects.equals(onsite.getVenue().getId(), venue.getId());
                boolean sameVenueByName = onsite.getVenue() == null
                        && onsite.getVenueName() != null
                        && venue.getName() != null
                        && onsite.getVenueName().trim().equalsIgnoreCase(venue.getName().trim());

                if (!sameVenueById && !sameVenueByName) {
                    continue;
                }

                LocalDateTime start = maxDateTime(event.getStartDate(), from);
                LocalDateTime end = minDateTime(event.getEndDate(), to);
                if (end.isAfter(start)) {
                    bookedHours += ChronoUnit.MINUTES.between(start, end) / 60.0;
                }
            }

            double utilization = totalWindowHours <= 0 ? 0.0 : round2((bookedHours * 100.0) / totalWindowHours);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("venueId", venue.getId());
            row.put("venueName", venue.getName());
            row.put("bookedHours", round2(bookedHours));
            row.put("windowHours", round2(totalWindowHours));
            row.put("utilizationRate", utilization);
            rows.add(row);
        }

        rows.sort((a, b) -> Double.compare((double) b.get("utilizationRate"), (double) a.get("utilizationRate")));

        return Map.of(
                "from", from,
                "to", to,
                "venues", rows
        );
    }

    public Map<String, Object> getEngagementAnalytics() {
        Map<Long, Integer> participantsByEvent = getParticipantsByEvent();
        List<Event> events = eventRepository.findAll();

        List<Map<String, Object>> highestEngagement = new ArrayList<>();
        for (Event event : events) {
            highestEngagement.add(Map.of(
                    "eventId", event.getId(),
                    "eventTitle", event.getTitle(),
                    "eventType", event.getType(),
                    "participants", participantsByEvent.getOrDefault(event.getId(), 0)
            ));
        }
        highestEngagement.sort((a, b) -> Integer.compare((int) b.get("participants"), (int) a.get("participants")));

        List<Map<String, Object>> repeatParticipants = getUsersAttendingMultipleEvents();
        List<Map<String, Object>> byType = getEngagementByType(events, participantsByEvent);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("highestEngagementEvents", highestEngagement.stream().limit(10).toList());
        payload.put("repeatParticipants", repeatParticipants);
        payload.put("engagementByType", byType);
        return payload;
    }

    public Map<String, Object> getTrendsAnalytics() {
        List<Event> events = eventRepository.findAll();
        Map<Long, Integer> participantsByEvent = getParticipantsByEvent();

        Map<YearMonth, Integer> monthParticipants = new HashMap<>();
        Map<YearMonth, Integer> monthEventCount = new HashMap<>();

        for (Event event : events) {
            if (event.getStartDate() == null) {
                continue;
            }
            YearMonth month = YearMonth.from(event.getStartDate());
            monthParticipants.merge(month, participantsByEvent.getOrDefault(event.getId(), 0), Integer::sum);
            monthEventCount.merge(month, 1, Integer::sum);
        }

        List<YearMonth> sorted = monthParticipants.keySet().stream().sorted().toList();
        List<Map<String, Object>> monthly = new ArrayList<>();
        for (YearMonth month : sorted) {
            monthly.add(Map.of(
                    "period", month.toString(),
                    "participants", monthParticipants.getOrDefault(month, 0),
                    "eventCount", monthEventCount.getOrDefault(month, 0)
            ));
        }

        return Map.of(
                "monthlyTrends", monthly,
                "engagementByType", getEngagementByType(events, participantsByEvent)
        );
    }

    public Map<String, Object> predictAttendance(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

        List<Event> allEvents = eventRepository.findAll();
        Map<Long, Integer> participantsByEvent = getParticipantsByEvent();

        // Get registrations for THIS event (actual data if exists)
        int currentRegistrations = participantsByEvent.getOrDefault(eventId, 0);

        // Collect attendance from similar events (same type) with actual registrations
        List<Integer> similarAttendance = new ArrayList<>();
        List<Integer> nonZeroAttendance = new ArrayList<>();
        for (Event e : allEvents) {
            if (Objects.equals(e.getId(), eventId)) {
                continue;
            }
            if (e.getType() == event.getType()) {
                int attendance = participantsByEvent.getOrDefault(e.getId(), 0);
                similarAttendance.add(attendance);
                if (attendance > 0) {
                    nonZeroAttendance.add(attendance);
                }
            }
        }

        // Calculate base prediction using non-zero attendance or defaults
        double defaultAttendance = event.getType().name().equals("ONLINE") ? 35.0 : 20.0;
        double similarAvg;
        boolean hasRealData = !nonZeroAttendance.isEmpty();
        
        if (hasRealData) {
            // Use average of events with actual registrations
            similarAvg = nonZeroAttendance.stream().mapToInt(Integer::intValue).average().orElse(defaultAttendance);
        } else {
            // No real data - estimate based on event characteristics
            similarAvg = defaultAttendance;
        }

        // Apply category boost based on title keywords
        double categoryBoost = categoryBoost(event.getTitle());
        
        // Apply price factor - paid events may have different attendance patterns
        double priceFactor = 1.0;
        if (event.getPrice() != null && event.getPrice() > 0) {
            // Paid events tend to have more committed but fewer attendees
            if (event.getPrice() > 100) {
                priceFactor = 0.70; // Higher price = fewer but committed
            } else if (event.getPrice() > 50) {
                priceFactor = 0.85;
            } else if (event.getPrice() > 20) {
                priceFactor = 0.95;
            }
        } else {
            // Free events may have higher signup but lower attendance
            priceFactor = 1.15;
        }

        // Apply time-based factor if event is in the future
        double timeFactor = 1.0;
        if (event.getStartDate() != null) {
            long daysUntilEvent = java.time.temporal.ChronoUnit.DAYS.between(
                    java.time.LocalDate.now(), event.getStartDate().toLocalDate());
            if (daysUntilEvent > 30) {
                timeFactor = 1.2; // Further out = more time for registrations
            } else if (daysUntilEvent > 14) {
                timeFactor = 1.1;
            } else if (daysUntilEvent < 3) {
                timeFactor = 0.9; // Last minute = less likely to gain more
            }
        }

        double predicted = similarAvg * categoryBoost * priceFactor * timeFactor;

        // If event already has registrations, factor them in with growth estimate
        if (currentRegistrations > 0) {
            // Weight existing registrations heavily + expected growth
            predicted = (currentRegistrations * 1.3) * 0.7 + predicted * 0.3;
        }

        // Apply venue capacity limit for onsite events
        Integer venueCapacity = null;
        if (event instanceof OnsiteEvent onsite) {
            venueCapacity = onsite.getCapacity();
            if (venueCapacity != null && venueCapacity > 0) {
                predicted = Math.min(predicted, venueCapacity * 0.85); // Target 85% capacity
            }
        }

        int predictedParticipants = Math.max(1, (int) Math.round(predicted));
        
        // Confidence is higher when we have real registration data
        double confidence = hasRealData 
                ? confidenceScore(nonZeroAttendance.size()) 
                : confidenceScore(0) * (currentRegistrations > 0 ? 1.2 : 0.8);
        confidence = Math.min(0.95, Math.max(0.30, confidence));

        Map<String, Object> factors = new LinkedHashMap<>();
        factors.put("eventType", event.getType());
        factors.put("venueCapacity", venueCapacity);
        factors.put("currentRegistrations", currentRegistrations);
        factors.put("similarEventsCount", similarAttendance.size());
        factors.put("eventsWithDataCount", nonZeroAttendance.size());
        factors.put("similarEventsAverage", round2(similarAvg));
        factors.put("categoryBoost", round2(categoryBoost));
        factors.put("priceFactor", round2(priceFactor));
        factors.put("timeFactor", round2(timeFactor));
        factors.put("hasRealData", hasRealData);

        return Map.of(
                "eventId", eventId,
                "predictedParticipants", predictedParticipants,
                "confidenceScore", round2(confidence),
                "factors", factors
        );
    }

    public Map<String, Object> getEventsPerformanceReport() {
        List<Event> events = eventRepository.findAll();
        Map<Long, Integer> participantsByEvent = getParticipantsByEvent();

        List<Map<String, Object>> ranking = new ArrayList<>();
        double revenue = 0.0;
        int participants = 0;

        for (Event event : events) {
            int eventParticipants = participantsByEvent.getOrDefault(event.getId(), 0);
            participants += eventParticipants;
            double price = event.getPrice() == null ? 0.0 : event.getPrice();
            revenue += price * eventParticipants;

            ranking.add(Map.of(
                    "eventId", event.getId(),
                    "eventTitle", event.getTitle(),
                    "eventType", event.getType(),
                    "participants", eventParticipants,
                    "price", price,
                    "estimatedRevenue", round2(price * eventParticipants)
            ));
        }

        ranking.sort((a, b) -> Integer.compare((int) b.get("participants"), (int) a.get("participants")));

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalEvents", events.size());
        summary.put("totalParticipants", participants);
        summary.put("averageParticipantsPerEvent", events.isEmpty() ? 0.0 : round2((double) participants / events.size()));
        summary.put("estimatedRevenue", round2(revenue));

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("generatedAt", LocalDateTime.now());
        report.put("summary", summary);
        report.put("popularityRanking", ranking);
        report.put("engagement", getEngagementAnalytics());
        return report;
    }

    public byte[] getEventsPerformanceReportCsv() {
        Map<String, Object> report = getEventsPerformanceReport();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> ranking = (List<Map<String, Object>>) report.get("popularityRanking");

        StringBuilder csv = new StringBuilder("eventId,eventTitle,eventType,participants,price,estimatedRevenue\n");
        for (Map<String, Object> row : ranking) {
            csv.append(row.get("eventId")).append(',')
                    .append(csvSafe(row.get("eventTitle"))).append(',')
                    .append(row.get("eventType")).append(',')
                    .append(row.get("participants")).append(',')
                    .append(row.get("price")).append(',')
                    .append(row.get("estimatedRevenue")).append('\n');
        }
        return csv.toString().getBytes();
    }

    private Map<Long, Integer> getParticipantsByEvent() {
        String table = resolveParticipantTable();
        if (table == null) {
            return new HashMap<>();
        }

        List<String> columns = jdbcTemplate.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
                String.class,
                table
        );

        String eventIdColumn = firstMatch(columns, "event_id", "events_id", "eventid", "eventId");
        if (eventIdColumn == null) {
            return new HashMap<>();
        }

        String sql = "SELECT `" + eventIdColumn + "` AS event_id, COUNT(*) AS c FROM `" + table + "` GROUP BY `" + eventIdColumn + "`";
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        Map<Long, Integer> result = new HashMap<>();
        for (Map<String, Object> row : rows) {
            Number eventId = (Number) row.get("event_id");
            Number count = (Number) row.get("c");
            if (eventId != null && count != null) {
                result.put(eventId.longValue(), count.intValue());
            }
        }
        return result;
    }

    private List<Map<String, Object>> getUsersAttendingMultipleEvents() {
        String table = resolveParticipantTable();
        if (table == null) {
            return List.of();
        }

        List<String> columns = jdbcTemplate.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?",
                String.class,
                table
        );

        String emailColumn = firstMatch(columns, "email", "user_email", "participant_email");
        String eventIdColumn = firstMatch(columns, "event_id", "events_id", "eventid", "eventId");
        if (emailColumn == null) {
            return List.of();
        }
        if (eventIdColumn == null) {
            return List.of();
        }

        String sql = "SELECT `" + emailColumn + "` as email, COUNT(DISTINCT `" + eventIdColumn + "`) as eventsAttended FROM `" + table
                + "` GROUP BY `" + emailColumn + "` HAVING COUNT(DISTINCT `" + eventIdColumn + "`) > 1 ORDER BY eventsAttended DESC";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            result.add(Map.of(
                    "email", Objects.toString(row.get("email"), ""),
                    "eventsAttended", ((Number) row.get("eventsAttended")).intValue()
            ));
        }
        return result;
    }

    private List<Map<String, Object>> getEngagementByType(List<Event> events, Map<Long, Integer> participantsByEvent) {
        Map<String, Integer> participantsByType = new LinkedHashMap<>();
        Map<String, Integer> eventsByType = new LinkedHashMap<>();

        for (Event event : events) {
            String key = event.getType().name();
            participantsByType.merge(key, participantsByEvent.getOrDefault(event.getId(), 0), Integer::sum);
            eventsByType.merge(key, 1, Integer::sum);
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (String type : participantsByType.keySet()) {
            int participants = participantsByType.getOrDefault(type, 0);
            int count = eventsByType.getOrDefault(type, 0);
            rows.add(Map.of(
                    "eventType", type,
                    "totalParticipants", participants,
                    "eventCount", count,
                    "avgParticipants", count == 0 ? 0.0 : round2((double) participants / count)
            ));
        }

        rows.sort(Comparator.comparing((Map<String, Object> r) -> (double) r.get("avgParticipants")).reversed());
        return rows;
    }

    private String resolveParticipantTable() {
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()",
                String.class
        );

        if (tables.contains("event_registrations")) {
            return "event_registrations";
        }
        if (tables.contains("events_attendees")) {
            return "events_attendees";
        }
        return null;
    }

    private String firstMatch(List<String> columns, String... candidates) {
        for (String candidate : candidates) {
            for (String c : columns) {
                if (c != null && c.equalsIgnoreCase(candidate)) {
                    return c;
                }
            }
        }
        return null;
    }

    private double categoryBoost(String title) {
        String t = Objects.toString(title, "").toLowerCase(Locale.ROOT);
        if (t.contains("workshop")) return 1.10;
        if (t.contains("webinar")) return 1.05;
        if (t.contains("bootcamp")) return 1.20;
        if (t.contains("seminar")) return 0.95;
        return 1.0;
    }

    private double confidenceScore(int similarEventsCount) {
        if (similarEventsCount <= 0) return 0.45;
        if (similarEventsCount <= 2) return 0.60;
        if (similarEventsCount <= 5) return 0.74;
        if (similarEventsCount <= 10) return 0.82;
        return 0.90;
    }

    private LocalDateTime maxDateTime(LocalDateTime a, LocalDateTime b) {
        return a.isAfter(b) ? a : b;
    }

    private LocalDateTime minDateTime(LocalDateTime a, LocalDateTime b) {
        return a.isBefore(b) ? a : b;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String csvSafe(Object value) {
        String text = Objects.toString(value, "").replace("\"", "\"\"");
        if (text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
            return "\"" + text + "\"";
        }
        return text;
    }
}
