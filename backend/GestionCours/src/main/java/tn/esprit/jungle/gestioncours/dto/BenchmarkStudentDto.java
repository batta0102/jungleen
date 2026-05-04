package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BenchmarkStudentDto {
    private Long studentId;
    private String studentName;
    private Double attendanceRate;
    private Double percentile;
    private Double deviation;
    private String badge;
}
