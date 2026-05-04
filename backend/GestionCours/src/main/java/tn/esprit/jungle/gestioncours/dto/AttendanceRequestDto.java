package tn.esprit.jungle.gestioncours.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.jungle.gestioncours.entites.AttendanceStatus;
import tn.esprit.jungle.gestioncours.entites.SessionType;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRequestDto {

    @NotNull(message = "Session type is required")
    private SessionType sessionType;

    @NotNull(message = "Session ID is required")
    @Positive(message = "Session ID must be positive")
    private Long sessionId;

    @NotNull(message = "Student ID is required")
    @Positive(message = "Student ID must be positive")
    private Long studentId;

    @NotNull(message = "Status is required")
    private AttendanceStatus status;

    private String note;
}
