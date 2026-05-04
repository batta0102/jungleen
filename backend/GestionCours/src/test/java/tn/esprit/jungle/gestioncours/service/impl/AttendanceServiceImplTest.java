package tn.esprit.jungle.gestioncours.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import tn.esprit.jungle.gestioncours.event.AttendanceMarkedEvent;
import tn.esprit.jungle.gestioncours.dto.AttendanceRequestDto;
import tn.esprit.jungle.gestioncours.dto.AttendanceResponseDto;
import tn.esprit.jungle.gestioncours.entites.Attendance;
import tn.esprit.jungle.gestioncours.entites.AttendanceStatus;
import tn.esprit.jungle.gestioncours.entites.SessionType;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.mapper.AttendanceMapper;
import tn.esprit.jungle.gestioncours.repositorie.AttendanceRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceImplTest {

    @Mock
    private AttendanceRepository repository;

    @Mock
    private AttendanceMapper mapper;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AttendanceServiceImpl service;

    private AttendanceRequestDto validRequest;
    private Attendance existingEntity;
    private AttendanceResponseDto responseDto;

    @BeforeEach
    void setUp() {
        validRequest = new AttendanceRequestDto();
        validRequest.setSessionType(SessionType.ONLINE);
        validRequest.setSessionId(100L);
        validRequest.setStudentId(1L);
        validRequest.setStatus(AttendanceStatus.PRESENT);
        validRequest.setNote("OK");

        existingEntity = new Attendance();
        existingEntity.setId(50L);
        existingEntity.setSessionType(SessionType.ONLINE);
        existingEntity.setSessionId(100L);
        existingEntity.setStudentId(1L);
        existingEntity.setStatus(AttendanceStatus.ABSENT);
        existingEntity.setMarkedAt(LocalDateTime.now().minusHours(1));
        existingEntity.setNote("old");

        responseDto = new AttendanceResponseDto();
        responseDto.setId(50L);
        responseDto.setSessionType(SessionType.ONLINE);
        responseDto.setSessionId(100L);
        responseDto.setStudentId(1L);
        responseDto.setStatus(AttendanceStatus.PRESENT);
        responseDto.setMarkedAt(LocalDateTime.now());
        responseDto.setNote("OK");
    }

    @Test
    @DisplayName("markAttendance creates new record when none exists")
    void markAttendance_createsNewWhenNotExists() {
        when(repository.findBySessionTypeAndSessionIdAndStudentId(
                SessionType.ONLINE, 100L, 1L)).thenReturn(Optional.empty());
        Attendance newEntity = new Attendance();
        newEntity.setSessionType(SessionType.ONLINE);
        newEntity.setSessionId(100L);
        newEntity.setStudentId(1L);
        newEntity.setStatus(AttendanceStatus.PRESENT);
        newEntity.setNote("OK");
        when(mapper.toEntity(eq(validRequest), any(LocalDateTime.class))).thenReturn(newEntity);
        when(repository.save(any(Attendance.class))).thenAnswer(inv -> {
            Attendance a = inv.getArgument(0);
            a.setId(99L);
            a.setMarkedAt(LocalDateTime.now());
            return a;
        });
        when(mapper.toResponseDto(any(Attendance.class))).thenReturn(responseDto);

        AttendanceResponseDto result = service.markAttendance(validRequest);

        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(AttendanceStatus.PRESENT);
        verify(repository).save(any(Attendance.class));
        verify(mapper).toEntity(eq(validRequest), any(LocalDateTime.class));
        verify(eventPublisher).publishEvent(any(AttendanceMarkedEvent.class));
    }

    @Test
    @DisplayName("markAttendance updates existing record when triplet matches")
    void markAttendance_updatesWhenExists() {
        when(repository.findBySessionTypeAndSessionIdAndStudentId(
                SessionType.ONLINE, 100L, 1L)).thenReturn(Optional.of(existingEntity));
        when(repository.save(any(Attendance.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mapper.toResponseDto(any(Attendance.class))).thenReturn(responseDto);

        AttendanceResponseDto result = service.markAttendance(validRequest);

        assertThat(result).isNotNull();
        assertThat(existingEntity.getStatus()).isEqualTo(AttendanceStatus.PRESENT);
        assertThat(existingEntity.getNote()).isEqualTo("OK");
        verify(repository).save(existingEntity);
        verify(mapper, never()).toEntity(any(), any());
        verify(eventPublisher).publishEvent(any(AttendanceMarkedEvent.class));
    }

    @Test
    @DisplayName("markAttendance throws when request is null")
    void markAttendance_throwsWhenRequestNull() {
        assertThatThrownBy(() -> service.markAttendance(null))
                .isInstanceOf(InvalidInputException.class)
                .hasMessageContaining("cannot be null");
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("getBySession returns list of DTOs")
    void getBySession_returnsList() {
        List<Attendance> entities = List.of(existingEntity);
        when(repository.findBySessionTypeAndSessionId(SessionType.ONLINE, 100L)).thenReturn(entities);
        when(mapper.toResponseDto(existingEntity)).thenReturn(responseDto);

        List<AttendanceResponseDto> result = service.getBySession(SessionType.ONLINE, 100L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSessionId()).isEqualTo(100L);
        verify(repository).findBySessionTypeAndSessionId(SessionType.ONLINE, 100L);
    }
}
