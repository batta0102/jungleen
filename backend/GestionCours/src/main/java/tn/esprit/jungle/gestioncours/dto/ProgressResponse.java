package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.esprit.jungle.gestioncours.entites.SessionType;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgressResponse {

    private SessionType courseType;
    private Long courseId;
    private Long studentId;
    private int totalSessions;
    private long presentOrExcused;
    private double attendanceRate;
    private boolean eligible;
}
