package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.jungle.gestioncours.event.AttendanceMarkedEvent;
import tn.esprit.jungle.gestioncours.dto.AttendanceRequestDto;
import tn.esprit.jungle.gestioncours.dto.AttendanceResponseDto;
import tn.esprit.jungle.gestioncours.entites.Attendance;
import tn.esprit.jungle.gestioncours.entites.SessionType;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.mapper.AttendanceMapper;
import tn.esprit.jungle.gestioncours.repositorie.AttendanceRepository;
import tn.esprit.jungle.gestioncours.service.interfaces.AttendanceService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository repository;
    private final AttendanceMapper mapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public AttendanceResponseDto markAttendance(AttendanceRequestDto request) {
        validateRequest(request);

        SessionType sessionType = request.getSessionType();
        Long sessionId = request.getSessionId();
        Long studentId = request.getStudentId();

        LocalDateTime now = LocalDateTime.now();
        Attendance saved;

        try {
            Optional<Attendance> existing = repository.findBySessionTypeAndSessionIdAndStudentId(
                    sessionType,
                    sessionId,
                    studentId
            );

            if (existing.isPresent()) {
                Attendance att = existing.get();
                att.setStatus(request.getStatus());
                att.setNote(request.getNote());
                att.setMarkedAt(now);
                saved = repository.save(att);
                log.info("Updated attendance id={} for sessionType={}, sessionId={}, studentId={}",
                        saved.getId(), sessionType, sessionId, studentId);
            } else {
                Attendance att = mapper.toEntity(request, now);
                saved = repository.save(att);
                log.info("Created attendance id={} for sessionType={}, sessionId={}, studentId={}",
                        saved.getId(), sessionType, sessionId, studentId);
            }
        } catch (DataIntegrityViolationException ex) {
            log.warn("Concurrent attendance creation detected for sessionType={}, sessionId={}, studentId={}. " +
                            "Retrying by re-fetching and updating existing record.",
                    sessionType, sessionId, studentId, ex);

            Optional<Attendance> concurrent = repository.findBySessionTypeAndSessionIdAndStudentId(
                    sessionType,
                    sessionId,
                    studentId
            );

            if (concurrent.isEmpty()) {
                log.error("Attendance not found after DataIntegrityViolationException for " +
                                "sessionType={}, sessionId={}, studentId={}. Rethrowing exception.",
                        sessionType, sessionId, studentId, ex);
                throw ex;
            }

            Attendance att = concurrent.get();
            att.setStatus(request.getStatus());
            att.setNote(request.getNote());
            att.setMarkedAt(now);
            saved = repository.save(att);
            log.info("Resolved concurrent attendance write by updating existing record id={} for " +
                            "sessionType={}, sessionId={}, studentId={}",
                    saved.getId(), sessionType, sessionId, studentId);
        }

        AttendanceResponseDto response = mapper.toResponseDto(saved);
        eventPublisher.publishEvent(new AttendanceMarkedEvent(response));
        return response;
    }

    @Override
    public List<AttendanceResponseDto> getBySession(SessionType type, Long sessionId) {
        return repository.findBySessionTypeAndSessionId(type, sessionId).stream()
                .map(mapper::toResponseDto)
                .collect(Collectors.toList());
    }

    private void validateRequest(AttendanceRequestDto request) {
        if (request == null) {
            throw new InvalidInputException("Attendance request cannot be null");
        }
        if (request.getSessionId() == null) {
            throw new InvalidInputException("Session ID is required");
        }
        if (request.getStudentId() == null) {
            throw new InvalidInputException("Student ID is required");
        }
        if (request.getSessionId() <= 0) {
            throw new InvalidInputException("Session ID must be positive");
        }
        if (request.getStudentId() <= 0) {
            throw new InvalidInputException("Student ID must be positive");
        }
        if (request.getSessionType() == null) {
            throw new InvalidInputException("Session type is required");
        }
        if (request.getStatus() == null) {
            throw new InvalidInputException("Status is required");
        }
    }
}
