package tn.esprit.jungle.gestioncours.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tn.esprit.jungle.gestioncours.entites.OnSiteBooking;
import tn.esprit.jungle.gestioncours.entites.OnlineBooking;
import tn.esprit.jungle.gestioncours.exception.BookingConflictException;
import tn.esprit.jungle.gestioncours.exception.InvalidInputException;
import tn.esprit.jungle.gestioncours.repositorie.OnSiteBookingRepository;
import tn.esprit.jungle.gestioncours.repositorie.OnlineBookingRepository;
import tn.esprit.jungle.gestioncours.service.model.StudentOverloadCheckResult;

import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Shared business rules for student overload detection before booking confirmation.
 */
@Service
@RequiredArgsConstructor
public class StudentOverloadService {

    private static final String OVERLAP_MESSAGE = "Conflit d'horaire : l'etudiant est deja inscrit a une session qui se chevauche";

    private final OnlineBookingRepository onlineBookingRepository;
    private final OnSiteBookingRepository onSiteBookingRepository;

    @Value("${booking.overload.weekly-limit-hours:20}")
    private double weeklyLimitHours;

    @Value("${booking.overload.daily-warning-hours:6}")
    private double dailyWarningHours;

    @Value("${booking.overload.session-duration-hours:2}")
    private double defaultSessionDurationHours;

    public StudentOverloadCheckResult checkStudentOverload(Long studentId, Date newSessionDate) {
        if (studentId == null || studentId <= 0) {
            throw new InvalidInputException("Student ID is required to run overload checks");
        }
        if (newSessionDate == null) {
            throw new InvalidInputException("Session date is required to run overload checks");
        }

        LocalDateTime newStart = toUtcDateTime(newSessionDate);
        LocalDateTime newEnd = newStart.plusMinutes(toDurationMinutes(defaultSessionDurationHours));

        List<TimeSlot> existingSlots = getExistingStudentSlots(studentId);
        for (TimeSlot existingSlot : existingSlots) {
            if (overlaps(newStart, newEnd, existingSlot.start(), existingSlot.end())) {
                throw new BookingConflictException(OVERLAP_MESSAGE);
            }
        }

        LocalDate newDay = newStart.toLocalDate();
        LocalDateTime weeklyStart = newDay.minusDays(3).atStartOfDay();
        LocalDateTime weeklyEnd = newDay.plusDays(3).atTime(LocalTime.MAX);

        double existingWeeklyHours = existingSlots.stream()
                .filter(slot -> !slot.start().isBefore(weeklyStart) && !slot.start().isAfter(weeklyEnd))
                .mapToDouble(TimeSlot::durationHours)
                .sum();

        double projectedWeeklyHours = existingWeeklyHours + defaultSessionDurationHours;
        if (projectedWeeklyHours > weeklyLimitHours) {
            throw new BookingConflictException(String.format(Locale.US,
                    "Surcharge detectee : l'etudiant a deja %s heures de formation cette semaine",
                    formatHours(existingWeeklyHours)));
        }

        LocalDateTime dayStart = newDay.atStartOfDay();
        LocalDateTime dayEnd = newDay.atTime(LocalTime.MAX);

        double existingDailyHours = existingSlots.stream()
                .filter(slot -> !slot.start().isBefore(dayStart) && !slot.start().isAfter(dayEnd))
                .mapToDouble(TimeSlot::durationHours)
                .sum();

        double projectedDailyHours = existingDailyHours + defaultSessionDurationHours;
        if (projectedDailyHours > dailyWarningHours) {
            return new StudentOverloadCheckResult(
                    String.format(Locale.US,
                            "Attention : l'etudiant a deja %sh de formation ce jour",
                            formatHours(projectedDailyHours)));
        }

        return new StudentOverloadCheckResult(null);
    }

    private List<TimeSlot> getExistingStudentSlots(Long studentId) {
        List<TimeSlot> slots = new ArrayList<>();

        List<OnlineBooking> onlineBookings = onlineBookingRepository.findByStudentId(studentId);
        for (OnlineBooking booking : onlineBookings) {
            if (booking.getSession() != null && booking.getSession().getDate() != null) {
                LocalDateTime start = toUtcDateTime(booking.getSession().getDate());
                slots.add(new TimeSlot(start, start.plusMinutes(toDurationMinutes(defaultSessionDurationHours)), defaultSessionDurationHours));
            }
        }

        List<OnSiteBooking> onSiteBookings = onSiteBookingRepository.findByStudentId(studentId);
        for (OnSiteBooking booking : onSiteBookings) {
            if (booking.getSession() != null && booking.getSession().getDate() != null) {
                LocalDateTime start = toUtcDateTime(booking.getSession().getDate());
                slots.add(new TimeSlot(start, start.plusMinutes(toDurationMinutes(defaultSessionDurationHours)), defaultSessionDurationHours));
            }
        }

        return slots;
    }

    private LocalDateTime toUtcDateTime(Date date) {
        return LocalDateTime.ofInstant(date.toInstant(), ZoneOffset.UTC);
    }

    private boolean overlaps(LocalDateTime start1, LocalDateTime end1, LocalDateTime start2, LocalDateTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }

    private long toDurationMinutes(double hours) {
        return Math.round(hours * 60d);
    }

    private String formatHours(double hours) {
        DecimalFormat decimalFormat = new DecimalFormat("0.#");
        return decimalFormat.format(hours);
    }

    private record TimeSlot(LocalDateTime start, LocalDateTime end, double durationHours) {
    }
}
