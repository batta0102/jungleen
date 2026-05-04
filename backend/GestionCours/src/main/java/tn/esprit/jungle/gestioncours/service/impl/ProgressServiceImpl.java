package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.jungle.gestioncours.dto.ProgressResponse;
import tn.esprit.jungle.gestioncours.entites.AttendanceStatus;
import tn.esprit.jungle.gestioncours.entites.SessionType;
import tn.esprit.jungle.gestioncours.repositorie.AttendanceRepository;
import tn.esprit.jungle.gestioncours.repositorie.OnSiteSessionRepository;
import tn.esprit.jungle.gestioncours.repositorie.OnlineSessionRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.ProgressService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgressServiceImpl implements ProgressService {

    private final OnlineSessionRepository onlineSessionRepository;
    private final OnSiteSessionRepository onSiteSessionRepository;
    private final AttendanceRepository attendanceRepository;

    private static final List<AttendanceStatus> PRESENT_OR_EXCUSED = List.of(AttendanceStatus.PRESENT, AttendanceStatus.EXCUSED);

    @Override
    public ProgressResponse calcProgress(SessionType courseType, Long courseId, Long studentId, int minRateDefault) {
        List<Long> ids = courseType == SessionType.ONLINE
                ? onlineSessionRepository.findIdsByCourseId(courseId)
                : onSiteSessionRepository.findIdsByCourseId(courseId);

        int totalSessions = ids.size();
        long presentOrExcused = totalSessions == 0
                ? 0
                : attendanceRepository.countByStudentIdAndSessionTypeAndSessionIdInAndStatusIn(
                studentId, courseType, ids, PRESENT_OR_EXCUSED);

        double attendanceRate = totalSessions == 0
                ? 0.0
                : (presentOrExcused * 100.0) / totalSessions;
        boolean eligible = attendanceRate >= minRateDefault;

        return new ProgressResponse(
                courseType,
                courseId,
                studentId,
                totalSessions,
                presentOrExcused,
                attendanceRate,
                eligible
        );
    }
}
