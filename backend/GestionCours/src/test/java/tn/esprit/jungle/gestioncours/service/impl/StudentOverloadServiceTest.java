package tn.esprit.jungle.gestioncours.service.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import tn.esprit.jungle.gestioncours.entites.OnlineBooking;
import tn.esprit.jungle.gestioncours.entites.OnlineSession;
import tn.esprit.jungle.gestioncours.exception.BookingConflictException;
import tn.esprit.jungle.gestioncours.repositorie.OnSiteBookingRepository;
import tn.esprit.jungle.gestioncours.repositorie.OnlineBookingRepository;
import tn.esprit.jungle.gestioncours.service.model.StudentOverloadCheckResult;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentOverloadServiceTest {

    @Mock
    private OnlineBookingRepository onlineBookingRepository;

    @Mock
    private OnSiteBookingRepository onSiteBookingRepository;

    @InjectMocks
    private StudentOverloadService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "weeklyLimitHours", 20d);
        ReflectionTestUtils.setField(service, "dailyWarningHours", 6d);
        ReflectionTestUtils.setField(service, "defaultSessionDurationHours", 2d);
    }

    @Test
    @DisplayName("checkStudentOverload blocks when schedules overlap")
    void checkStudentOverload_blocksOnOverlap() {
        Long studentId = 1L;

        when(onlineBookingRepository.findByStudentId(studentId)).thenReturn(List.of(
                onlineBookingAt(utcDate(2026, 1, 10, 10, 0))));
        when(onSiteBookingRepository.findByStudentId(studentId)).thenReturn(Collections.emptyList());

        Date newSession = utcDate(2026, 1, 10, 11, 0);

        assertThatThrownBy(() -> service.checkStudentOverload(studentId, newSession))
                .isInstanceOf(BookingConflictException.class)
                .hasMessageContaining("Conflit d'horaire");
    }

    @Test
    @DisplayName("checkStudentOverload blocks when weekly load exceeds 20h")
    void checkStudentOverload_blocksOnWeeklyOverload() {
        Long studentId = 7L;

        List<OnlineBooking> weeklyBookings = List.of(
                onlineBookingAt(utcDate(2026, 1, 7, 8, 0)),
                onlineBookingAt(utcDate(2026, 1, 7, 11, 0)),
                onlineBookingAt(utcDate(2026, 1, 8, 8, 0)),
                onlineBookingAt(utcDate(2026, 1, 8, 11, 0)),
                onlineBookingAt(utcDate(2026, 1, 9, 8, 0)),
                onlineBookingAt(utcDate(2026, 1, 9, 11, 0)),
                onlineBookingAt(utcDate(2026, 1, 11, 8, 0)),
                onlineBookingAt(utcDate(2026, 1, 11, 11, 0)),
                onlineBookingAt(utcDate(2026, 1, 12, 8, 0)),
                onlineBookingAt(utcDate(2026, 1, 12, 11, 0))
        );

        when(onlineBookingRepository.findByStudentId(studentId)).thenReturn(weeklyBookings);
        when(onSiteBookingRepository.findByStudentId(studentId)).thenReturn(Collections.emptyList());

        Date newSession = utcDate(2026, 1, 10, 18, 0);

        assertThatThrownBy(() -> service.checkStudentOverload(studentId, newSession))
                .isInstanceOf(BookingConflictException.class)
                .hasMessageContaining("Surcharge detectee");
    }

    @Test
    @DisplayName("checkStudentOverload returns warning when daily load exceeds 6h")
    void checkStudentOverload_warnsOnDailyOverload() {
        Long studentId = 9L;

        when(onlineBookingRepository.findByStudentId(studentId)).thenReturn(List.of(
                onlineBookingAt(utcDate(2026, 1, 10, 8, 0)),
                onlineBookingAt(utcDate(2026, 1, 10, 11, 0)),
                onlineBookingAt(utcDate(2026, 1, 10, 14, 0))));
        when(onSiteBookingRepository.findByStudentId(studentId)).thenReturn(Collections.emptyList());

        Date newSession = utcDate(2026, 1, 10, 17, 0);

        StudentOverloadCheckResult result = service.checkStudentOverload(studentId, newSession);

        assertThat(result).isNotNull();
        assertThat(result.hasDailyWarning()).isTrue();
        assertThat(result.getDailyWarningMessage()).contains("Attention");
    }

    private OnlineBooking onlineBookingAt(Date date) {
        OnlineSession session = new OnlineSession();
        session.setDate(date);

        OnlineBooking booking = new OnlineBooking();
        booking.setSession(session);
        booking.setStudentId(1L);
        return booking;
    }

    private Date utcDate(int year, int month, int day, int hour, int minute) {
        LocalDateTime dateTime = LocalDateTime.of(year, month, day, hour, minute);
        return Date.from(dateTime.toInstant(ZoneOffset.UTC));
    }
}
