package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.jungle.gestioncours.dto.*;
import tn.esprit.jungle.gestioncours.entites.*;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.repositorie.AttendanceRepository;
import tn.esprit.jungle.gestioncours.repositorie.OnSiteSessionRepository;
import tn.esprit.jungle.gestioncours.repositorie.OnlineSessionRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.RiskAnalyticsService;
import tn.esprit.jungle.gestioncours.service.interfaces.RiskConfigService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RiskAnalyticsServiceImpl implements RiskAnalyticsService {

    private final AttendanceRepository attendanceRepository;
    private final OnlineSessionRepository onlineSessionRepository;
    private final OnSiteSessionRepository onSiteSessionRepository;
    private final RiskConfigService riskConfigService;

    @Override
    public String calculateRiskLevel(Long studentId, Long courseId) {
        RiskConfig config = riskConfigService.getConfigOrDefault(courseId);
        double score = computeStudentRate(studentId, courseId);

        if (score < config.getHighThreshold()) {
            return "HIGH";
        }
        if (score < config.getMediumThreshold()) {
            return "MEDIUM";
        }
        return "LOW";
    }

    @Override
    public RiskExplanationResponseDto getRiskExplanation(Long studentId, Long courseId) {
        validatePositive(studentId, "studentId");
        validatePositive(courseId, "courseId");

        CourseData courseData = loadCourseData(courseId);
        List<Attendance> studentAttendance = courseData.byStudent().getOrDefault(studentId, List.of());

        double score = rateFromAttendances(studentAttendance);
        String riskLevel = calculateRiskLevel(studentId, courseId);

        List<RiskReasonDto> reasons = buildReasons(studentId, courseData, studentAttendance);
        List<RiskTimelineItemDto> timeline = studentAttendance.stream()
                .sorted(Comparator.comparing(a -> courseData.sessionDate(a).orElse(LocalDateTime.MIN)))
                .map(a -> new RiskTimelineItemDto(
                        courseData.sessionDate(a).orElse(LocalDateTime.now()).toLocalDate(),
                        a.getStatus().name(),
                        courseData.sessionName(a).orElse("Session " + a.getSessionId())))
                .toList();

        return new RiskExplanationResponseDto(studentId, riskLevel, round(score), reasons, timeline);
    }

    @Override
    public List<EarlyWarningDto> getEarlyWarnings(Long courseId) {
        validatePositive(courseId, "courseId");
        CourseData courseData = loadCourseData(courseId);
        RiskConfig config = riskConfigService.getConfigOrDefault(courseId);

        List<EarlyWarningDto> warnings = new ArrayList<>();
        for (Map.Entry<Long, List<Attendance>> entry : courseData.byStudent().entrySet()) {
            Long studentId = entry.getKey();
            List<Attendance> sorted = entry.getValue().stream()
                    .sorted(Comparator.comparing(a -> courseData.sessionDate(a).orElse(LocalDateTime.MIN)))
                    .toList();

            List<Attendance> last4 = sorted.stream().skip(Math.max(0, sorted.size() - 4)).toList();
            if (last4.size() < 2) {
                continue;
            }

            List<Double> y = last4.stream().map(a -> scoreForStatus(a.getStatus()) * 100.0).toList();
            double currentRate = average(y);
            double slope = regressionSlope(y);
            double predicted = currentRate + (2 * slope);
            String warningLevel;
            if (predicted < config.getHighThreshold()) {
                warningLevel = "URGENT";
            } else if (slope <= -7.0) {
                warningLevel = "CONCERN";
            } else if (slope < 0) {
                warningLevel = "WATCH";
            } else {
                warningLevel = "WATCH";
            }

            warnings.add(new EarlyWarningDto(
                    studentId,
                    "Etudiant " + studentId,
                    round(currentRate),
                    round(slope),
                    round(predicted),
                    warningLevel
            ));
        }

        return warnings.stream()
                .sorted(Comparator.comparing(EarlyWarningDto::getWarningLevel).reversed())
                .toList();
    }

    @Override
    public List<AttendanceAnomalyDto> getAnomaliesByCourse(Long courseId) {
        validatePositive(courseId, "courseId");
        CourseData courseData = loadCourseData(courseId);
        List<AttendanceAnomalyDto> anomalies = new ArrayList<>();

        // SPIKE: >50% absents dans une session
        for (Map.Entry<SessionKey, List<Attendance>> entry : courseData.bySession().entrySet()) {
            List<Attendance> list = entry.getValue();
            if (list.isEmpty()) {
                continue;
            }
            long absent = list.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
            double ratio = absent * 1.0 / list.size();
            if (ratio > 0.5) {
                anomalies.add(new AttendanceAnomalyDto(
                        AnomalyType.SPIKE.name(),
                        entry.getKey().sessionId,
                        null,
                        ratio > 0.7 ? SeverityLevel.HIGH.name() : SeverityLevel.MEDIUM.name(),
                        "Spike detecte: " + absent + " absents sur " + list.size() + " etudiants",
                        LocalDateTime.now()
                ));
            }
        }

        // CONSECUTIVE + LATE_PATTERN: 3 fois de suite
        for (Map.Entry<Long, List<Attendance>> entry : courseData.byStudent().entrySet()) {
            Long studentId = entry.getKey();
            List<Attendance> sorted = entry.getValue().stream()
                    .sorted(Comparator.comparing(a -> courseData.sessionDate(a).orElse(LocalDateTime.MIN)))
                    .toList();

            int absStreak = 0;
            int lateStreak = 0;
            for (Attendance a : sorted) {
                if (a.getStatus() == AttendanceStatus.ABSENT) {
                    absStreak++;
                } else {
                    absStreak = 0;
                }
                if (a.getStatus() == AttendanceStatus.LATE) {
                    lateStreak++;
                } else {
                    lateStreak = 0;
                }

                if (absStreak == 3) {
                    anomalies.add(new AttendanceAnomalyDto(
                            AnomalyType.CONSECUTIVE.name(),
                            a.getSessionId(),
                            studentId,
                            SeverityLevel.HIGH.name(),
                            "Etudiant absent 3 fois consecutives",
                            LocalDateTime.now()
                    ));
                }
                if (lateStreak == 3) {
                    anomalies.add(new AttendanceAnomalyDto(
                            AnomalyType.LATE_PATTERN.name(),
                            a.getSessionId(),
                            studentId,
                            SeverityLevel.MEDIUM.name(),
                            "Etudiant en retard 3 fois consecutives",
                            LocalDateTime.now()
                    ));
                }
            }
        }

        return anomalies;
    }

    @Override
    public List<AttendanceAnomalyDto> getAnomaliesBySession(Long sessionId) {
        validatePositive(sessionId, "sessionId");
        List<AttendanceAnomalyDto> online = getAnomaliesForSingleSession(SessionType.ONLINE, sessionId);
        List<AttendanceAnomalyDto> onsite = getAnomaliesForSingleSession(SessionType.ONSITE, sessionId);
        List<AttendanceAnomalyDto> all = new ArrayList<>();
        all.addAll(online);
        all.addAll(onsite);
        return all;
    }

    @Override
    public BenchmarkResponseDto getBenchmark(Long courseId) {
        validatePositive(courseId, "courseId");
        CourseData courseData = loadCourseData(courseId);

        List<StudentRate> rates = courseData.byStudent().entrySet().stream()
                .map(e -> new StudentRate(e.getKey(), rateFromAttendances(e.getValue())))
                .sorted(Comparator.comparing(StudentRate::rate).reversed())
                .toList();

        double avg = rates.stream().mapToDouble(StudentRate::rate).average().orElse(0.0);
        int size = rates.size();
        List<BenchmarkStudentDto> students = new ArrayList<>();

        for (int i = 0; i < rates.size(); i++) {
            StudentRate r = rates.get(i);
            double percentile = size == 1 ? 100.0 : ((size - i - 1) * 100.0 / (size - 1));
            String badge = percentile >= 90.0 ? "TOP_PERFORMER" : percentile <= 20.0 ? "NEEDS_HELP" : "AVERAGE";
            students.add(new BenchmarkStudentDto(
                    r.studentId(),
                    "Etudiant " + r.studentId(),
                    round(r.rate()),
                    round(percentile),
                    round(r.rate() - avg),
                    badge
            ));
        }

        List<StudentSummaryDto> top = students.stream().filter(s -> "TOP_PERFORMER".equals(s.getBadge()))
                .map(s -> new StudentSummaryDto(s.getStudentId(), s.getStudentName(), s.getAttendanceRate())).toList();
        List<StudentSummaryDto> bottom = students.stream().filter(s -> "NEEDS_HELP".equals(s.getBadge()))
                .map(s -> new StudentSummaryDto(s.getStudentId(), s.getStudentName(), s.getAttendanceRate())).toList();

        return new BenchmarkResponseDto(courseId, round(avg), top, bottom, students);
    }

    @Override
    public void recalculateCourseRiskLevels(Long courseId) {
        CourseData data = loadCourseData(courseId);
        data.byStudent().keySet().forEach(studentId -> calculateRiskLevel(studentId, courseId));
    }

    private List<AttendanceAnomalyDto> getAnomaliesForSingleSession(SessionType type, Long sessionId) {
        List<Attendance> attendances = attendanceRepository.findBySessionTypeAndSessionId(type, sessionId);
        if (attendances.isEmpty()) {
            return List.of();
        }
        long absent = attendances.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        double ratio = absent * 1.0 / attendances.size();
        if (ratio <= 0.5) {
            return List.of();
        }

        return List.of(new AttendanceAnomalyDto(
                AnomalyType.SPIKE.name(),
                sessionId,
                null,
                ratio > 0.7 ? SeverityLevel.HIGH.name() : SeverityLevel.MEDIUM.name(),
                "Spike detecte: " + absent + " absents sur " + attendances.size() + " etudiants",
                LocalDateTime.now()));
    }

    private List<RiskReasonDto> buildReasons(Long studentId, CourseData courseData, List<Attendance> studentAttendance) {
        List<RiskReasonDto> reasons = new ArrayList<>();

        List<Attendance> sorted = studentAttendance.stream()
                .sorted(Comparator.comparing(a -> courseData.sessionDate(a).orElse(LocalDateTime.MIN)))
                .toList();

        List<Attendance> last = sorted.stream().skip(Math.max(0, sorted.size() - 5)).toList();
        long absences = last.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        reasons.add(new RiskReasonDto(
                "X absences sur Y dernieres seances",
                (double) absences,
                0.40,
                absences > 0 ? "NEGATIVE" : "POSITIVE",
                absences + " absences sur " + last.size() + " dernieres seances"
        ));

        double trend = trendDelta(sorted);
        reasons.add(new RiskReasonDto(
                "Tendance baisse depuis X semaines",
                round(trend),
                0.25,
                trend < 0 ? "NEGATIVE" : "POSITIVE",
                trend < 0 ? "Tendance a la baisse sur les dernieres semaines" : "Tendance stable ou en hausse"
        ));

        double studentRate = rateFromAttendances(sorted);
        double groupAvg = courseData.byStudent().values().stream().mapToDouble(this::rateFromAttendances).average().orElse(0.0);
        double diff = studentRate - groupAvg;
        reasons.add(new RiskReasonDto(
                "Sous la moyenne du groupe de X%",
                round(diff),
                0.20,
                diff < 0 ? "NEGATIVE" : "POSITIVE",
                "Ecart a la moyenne du groupe: " + round(diff) + "%"
        ));

        long lateCount = sorted.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
        reasons.add(new RiskReasonDto(
                "X retards repetes",
                (double) lateCount,
                0.15,
                lateCount >= 3 ? "NEGATIVE" : "POSITIVE",
                lateCount + " retards detectes"
        ));

        return reasons;
    }

    private CourseData loadCourseData(Long courseId) {
        List<SessionRef> sessions = new ArrayList<>();

        onlineSessionRepository.findByCourseId(courseId).forEach(s -> sessions.add(new SessionRef(
                SessionType.ONLINE,
                s.getId(),
                toLocalDateTime(s.getDate()),
                s.getCourse() != null ? s.getCourse().getTitle() : "Online session " + s.getId()
        )));

        onSiteSessionRepository.findByCourseId(courseId).forEach(s -> sessions.add(new SessionRef(
                SessionType.ONSITE,
                s.getId(),
                toLocalDateTime(s.getDate()),
                s.getCourse() != null ? s.getCourse().getTitle() : "On-site session " + s.getId()
        )));

        List<Long> onlineIds = sessions.stream().filter(s -> s.type == SessionType.ONLINE).map(s -> s.sessionId).toList();
        List<Long> onsiteIds = sessions.stream().filter(s -> s.type == SessionType.ONSITE).map(s -> s.sessionId).toList();

        List<Attendance> all = new ArrayList<>();
        if (!onlineIds.isEmpty()) {
            all.addAll(attendanceRepository.findBySessionTypeAndSessionIdIn(SessionType.ONLINE, onlineIds));
        }
        if (!onsiteIds.isEmpty()) {
            all.addAll(attendanceRepository.findBySessionTypeAndSessionIdIn(SessionType.ONSITE, onsiteIds));
        }

        Map<SessionKey, SessionRef> bySessionKey = sessions.stream()
                .collect(Collectors.toMap(s -> new SessionKey(s.type, s.sessionId), s -> s));

        Map<Long, List<Attendance>> byStudent = all.stream().collect(Collectors.groupingBy(Attendance::getStudentId));
        Map<SessionKey, List<Attendance>> bySession = all.stream().collect(Collectors.groupingBy(a -> new SessionKey(a.getSessionType(), a.getSessionId())));

        return new CourseData(bySessionKey, byStudent, bySession);
    }

    private double computeStudentRate(Long studentId, Long courseId) {
        CourseData courseData = loadCourseData(courseId);
        return rateFromAttendances(courseData.byStudent().getOrDefault(studentId, List.of()));
    }

    private double rateFromAttendances(List<Attendance> list) {
        if (list == null || list.isEmpty()) {
            return 0.0;
        }
        double sum = list.stream().mapToDouble(a -> scoreForStatus(a.getStatus()) * 100.0).sum();
        return sum / list.size();
    }

    private double scoreForStatus(AttendanceStatus status) {
        if (status == AttendanceStatus.PRESENT || status == AttendanceStatus.EXCUSED) {
            return 1.0;
        }
        if (status == AttendanceStatus.LATE) {
            return 0.5;
        }
        return 0.0;
    }

    private double trendDelta(List<Attendance> sorted) {
        if (sorted.size() < 4) {
            return 0.0;
        }
        List<Attendance> last4 = sorted.stream().skip(Math.max(0, sorted.size() - 4)).toList();
        double firstHalf = (scoreForStatus(last4.get(0).getStatus()) + scoreForStatus(last4.get(1).getStatus())) * 50;
        double secondHalf = (scoreForStatus(last4.get(2).getStatus()) + scoreForStatus(last4.get(3).getStatus())) * 50;
        return secondHalf - firstHalf;
    }

    private double regressionSlope(List<Double> y) {
        int n = y.size();
        if (n < 2) {
            return 0.0;
        }
        double sumX = 0;
        double sumY = 0;
        double sumXY = 0;
        double sumX2 = 0;
        for (int i = 0; i < n; i++) {
            double x = i + 1;
            double v = y.get(i);
            sumX += x;
            sumY += v;
            sumXY += x * v;
            sumX2 += x * x;
        }
        double denominator = (n * sumX2) - (sumX * sumX);
        if (denominator == 0) {
            return 0.0;
        }
        return ((n * sumXY) - (sumX * sumY)) / denominator;
    }

    private double average(List<Double> values) {
        return values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private LocalDateTime toLocalDateTime(Date date) {
        if (date == null) {
            return LocalDate.now().atStartOfDay();
        }
        return LocalDateTime.ofInstant(date.toInstant(), ZoneOffset.UTC);
    }

    private void validatePositive(Long value, String fieldName) {
        if (value == null || value <= 0) {
            throw new InvalidInputException(fieldName + " doit etre un entier positif");
        }
    }

    private record SessionRef(SessionType type, Long sessionId, LocalDateTime date, String name) {
    }

    private record SessionKey(SessionType type, Long sessionId) {
    }

    private record CourseData(Map<SessionKey, SessionRef> sessions, Map<Long, List<Attendance>> byStudent,
                              Map<SessionKey, List<Attendance>> bySession) {
        Optional<LocalDateTime> sessionDate(Attendance attendance) {
            SessionRef ref = sessions.get(new SessionKey(attendance.getSessionType(), attendance.getSessionId()));
            return ref == null ? Optional.empty() : Optional.ofNullable(ref.date());
        }

        Optional<String> sessionName(Attendance attendance) {
            SessionRef ref = sessions.get(new SessionKey(attendance.getSessionType(), attendance.getSessionId()));
            return ref == null ? Optional.empty() : Optional.ofNullable(ref.name());
        }
    }

    private record StudentRate(Long studentId, double rate) {
    }
}
