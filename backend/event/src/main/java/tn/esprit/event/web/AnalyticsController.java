package tn.esprit.event.web;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tn.esprit.event.service.EventAnalyticsService;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final EventAnalyticsService analyticsService;

    @GetMapping("/events/popular")
    public Map<String, Object> popularEvents() {
        return analyticsService.getPopularEvents();
    }

    @GetMapping("/events/attendance-rate")
    public Map<String, Object> attendanceRate() {
        return analyticsService.getAttendanceRate();
    }

    @GetMapping("/events/participants")
    public Map<String, Object> participants() {
        return analyticsService.getParticipantsAnalytics();
    }

    @GetMapping("/venues/utilization")
    public Map<String, Object> venueUtilization() {
        return analyticsService.getVenueUtilization();
    }

    @GetMapping("/engagement")
    public Map<String, Object> engagement() {
        return analyticsService.getEngagementAnalytics();
    }

    @GetMapping("/trends")
    public Map<String, Object> trends() {
        return analyticsService.getTrendsAnalytics();
    }

    @GetMapping("/predict-attendance/{eventId}")
    public Map<String, Object> predictAttendance(@PathVariable Long eventId) {
        return analyticsService.predictAttendance(eventId);
    }

    @GetMapping("/report/events")
    public ResponseEntity<?> eventReport(@RequestParam(defaultValue = "json") String format) {
        if ("csv".equalsIgnoreCase(format)) {
            byte[] csv = analyticsService.getEventsPerformanceReportCsv();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=events-analytics-report.csv")
                    .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                    .body(csv);
        }
        return ResponseEntity.ok(analyticsService.getEventsPerformanceReport());
    }
}
