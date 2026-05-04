package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceAnomalyDto {
    private String type;
    private Long sessionId;
    private Long studentId;
    private String severity;
    private String description;
    private LocalDateTime detectedAt;
}
