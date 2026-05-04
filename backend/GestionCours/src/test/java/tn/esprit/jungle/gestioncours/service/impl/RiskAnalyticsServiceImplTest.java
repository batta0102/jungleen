package tn.esprit.jungle.gestioncours.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.esprit.jungle.gestioncours.dto.AttendanceAnomalyDto;
import tn.esprit.jungle.gestioncours.dto.BenchmarkResponseDto;
import tn.esprit.jungle.gestioncours.dto.EarlyWarningDto;
import tn.esprit.jungle.gestioncours.dto.RiskExplanationResponseDto;
import tn.esprit.jungle.gestioncours.entites.*;
import tn.esprit.jungle.gestioncours.repositorie.AttendanceRepository;
import tn.esprit.jungle.gestioncours.repositorie.OnSiteSessionRepository;
import tn.esprit.jungle.gestioncours.repositorie.OnlineSessionRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.RiskConfigService;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RiskAnalyticsServiceImplTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private OnlineSessionRepository onlineSessionRepository;

    @Mock
    private OnSiteSessionRepository onSiteSessionRepository;

    @Mock
    private RiskConfigService riskConfigService;

    @InjectMocks
    private RiskAnalyticsServiceImpl service;

    @Test
    @DisplayName("calculateRiskLevel uses course thresholds")
    void calculateRiskLevel_usesConfig() {
        RiskConfig config = new RiskConfig();
        config.setCourseId(1L);
        config.setHighThreshold(60.0);
        config.setMediumThreshold(75.0);
        config.setSessionOverrides(new HashMap<>());

        OnlineSession session = new OnlineSession();
        session.setId(100L);
        session.setDate(toDate(2026, 3, 1, 10));
        OnlineCourse course = new OnlineCourse();
        course.setTitle("Course");
        session.setCourse(course);

        Attendance att = attendance(1L, 100L, AttendanceStatus.ABSENT);

        when(riskConfigService.getConfigOrDefault(1L)).thenReturn(config);
        when(onlineSessionRepository.findByCourseId(1L)).thenReturn(List.of(session));
        when(onSiteSessionRepository.findByCourseId(1L)).thenReturn(List.of());
        when(attendanceRepository.findBySessionTypeAndSessionIdIn(SessionType.ONLINE, List.of(100L))).thenReturn(List.of(att));

        String level = service.calculateRiskLevel(1L, 1L);

        assertThat(level).isEqualTo("HIGH");
    }

    @Test
    @DisplayName("risk explanation returns reasons and timeline")
    void getRiskExplanation_returnsDetails() {
        RiskConfig config = new RiskConfig();
        config.setCourseId(1L);
        config.setHighThreshold(60.0);
        config.setMediumThreshold(75.0);

        OnlineSession s1 = new OnlineSession();
        s1.setId(100L);
        s1.setDate(toDate(2026, 3, 1, 10));
        OnlineCourse c = new OnlineCourse();
        c.setTitle("Java");
        s1.setCourse(c);

        OnlineSession s2 = new OnlineSession();
        s2.setId(101L);
        s2.setDate(toDate(2026, 3, 8, 10));
        s2.setCourse(c);

        List<Attendance> atts = List.of(
                attendance(5L, 100L, AttendanceStatus.ABSENT),
                attendance(5L, 101L, AttendanceStatus.LATE)
        );

        when(riskConfigService.getConfigOrDefault(1L)).thenReturn(config);
        when(onlineSessionRepository.findByCourseId(1L)).thenReturn(List.of(s1, s2));
        when(onSiteSessionRepository.findByCourseId(1L)).thenReturn(List.of());
        when(attendanceRepository.findBySessionTypeAndSessionIdIn(SessionType.ONLINE, List.of(100L, 101L))).thenReturn(atts);

        RiskExplanationResponseDto response = service.getRiskExplanation(5L, 1L);

        assertThat(response.getReasons()).isNotEmpty();
        assertThat(response.getTimeline()).hasSize(2);
    }

    @Test
    @DisplayName("anomalies detect consecutive absences")
    void getAnomaliesByCourse_detectsConsecutive() {
        OnlineSession s1 = onlineSession(100L, 2026, 3, 1);
        OnlineSession s2 = onlineSession(101L, 2026, 3, 8);
        OnlineSession s3 = onlineSession(102L, 2026, 3, 15);

        List<Attendance> all = List.of(
                attendance(9L, 100L, AttendanceStatus.ABSENT),
                attendance(9L, 101L, AttendanceStatus.ABSENT),
                attendance(9L, 102L, AttendanceStatus.ABSENT)
        );

        when(onlineSessionRepository.findByCourseId(1L)).thenReturn(List.of(s1, s2, s3));
        when(onSiteSessionRepository.findByCourseId(1L)).thenReturn(List.of());
        when(attendanceRepository.findBySessionTypeAndSessionIdIn(SessionType.ONLINE, List.of(100L, 101L, 102L))).thenReturn(all);

        List<AttendanceAnomalyDto> anomalies = service.getAnomaliesByCourse(1L);

        assertThat(anomalies.stream().anyMatch(a -> "CONSECUTIVE".equals(a.getType()))).isTrue();
    }

    @Test
    @DisplayName("early warning returns watch/concern/urgent candidates")
    void getEarlyWarnings_returnsList() {
        RiskConfig config = new RiskConfig();
        config.setCourseId(1L);
        config.setHighThreshold(60.0);
        config.setMediumThreshold(75.0);

        OnlineSession s1 = onlineSession(100L, 2026, 3, 1);
        OnlineSession s2 = onlineSession(101L, 2026, 3, 8);
        OnlineSession s3 = onlineSession(102L, 2026, 3, 15);
        OnlineSession s4 = onlineSession(103L, 2026, 3, 22);

        List<Attendance> all = List.of(
                attendance(3L, 100L, AttendanceStatus.PRESENT),
                attendance(3L, 101L, AttendanceStatus.LATE),
                attendance(3L, 102L, AttendanceStatus.ABSENT),
                attendance(3L, 103L, AttendanceStatus.ABSENT)
        );

        when(riskConfigService.getConfigOrDefault(1L)).thenReturn(config);
        when(onlineSessionRepository.findByCourseId(1L)).thenReturn(List.of(s1, s2, s3, s4));
        when(onSiteSessionRepository.findByCourseId(1L)).thenReturn(List.of());
        when(attendanceRepository.findBySessionTypeAndSessionIdIn(SessionType.ONLINE, List.of(100L, 101L, 102L, 103L))).thenReturn(all);

        List<EarlyWarningDto> warnings = service.getEarlyWarnings(1L);

        assertThat(warnings).isNotEmpty();
    }

    @Test
    @DisplayName("benchmark computes average and students")
    void getBenchmark_returnsBenchmark() {
        OnlineSession s1 = onlineSession(100L, 2026, 3, 1);
        OnlineSession s2 = onlineSession(101L, 2026, 3, 8);

        List<Attendance> all = List.of(
                attendance(1L, 100L, AttendanceStatus.PRESENT),
                attendance(1L, 101L, AttendanceStatus.PRESENT),
                attendance(2L, 100L, AttendanceStatus.ABSENT),
                attendance(2L, 101L, AttendanceStatus.LATE)
        );

        when(onlineSessionRepository.findByCourseId(1L)).thenReturn(List.of(s1, s2));
        when(onSiteSessionRepository.findByCourseId(1L)).thenReturn(List.of());
        when(attendanceRepository.findBySessionTypeAndSessionIdIn(SessionType.ONLINE, List.of(100L, 101L))).thenReturn(all);

        BenchmarkResponseDto benchmark = service.getBenchmark(1L);

        assertThat(benchmark.getStudents()).hasSize(2);
        assertThat(benchmark.getAverageAttendanceRate()).isNotNull();
    }

    private Attendance attendance(Long studentId, Long sessionId, AttendanceStatus status) {
        Attendance a = new Attendance();
        a.setStudentId(studentId);
        a.setSessionId(sessionId);
        a.setSessionType(SessionType.ONLINE);
        a.setStatus(status);
        a.setMarkedAt(LocalDateTime.now());
        return a;
    }

    private OnlineSession onlineSession(Long id, int year, int month, int day) {
        OnlineSession s = new OnlineSession();
        s.setId(id);
        s.setDate(toDate(year, month, day, 10));
        OnlineCourse c = new OnlineCourse();
        c.setTitle("Course");
        s.setCourse(c);
        return s;
    }

    private Date toDate(int year, int month, int day, int hour) {
        LocalDateTime dt = LocalDateTime.of(year, month, day, hour, 0);
        return Date.from(dt.toInstant(ZoneOffset.UTC));
    }
}
