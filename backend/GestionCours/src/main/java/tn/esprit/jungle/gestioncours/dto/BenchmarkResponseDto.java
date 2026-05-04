package tn.esprit.jungle.gestioncours.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BenchmarkResponseDto {
    private Long courseId;
    private Double averageAttendanceRate;
    private List<StudentSummaryDto> topPerformers;
    private List<StudentSummaryDto> bottomPerformers;
    private List<BenchmarkStudentDto> students;
}
