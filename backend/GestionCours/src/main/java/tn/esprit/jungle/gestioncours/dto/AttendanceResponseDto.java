package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.jungle.gestioncours.entites.AttendanceStatus;
import tn.esprit.jungle.gestioncours.entites.SessionType;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponseDto {

    private Long id;
    private SessionType sessionType;
    private Long sessionId;
    private Long studentId;
    private AttendanceStatus status;
    private LocalDateTime markedAt;
    private String note;
}
