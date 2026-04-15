package tn.esprit.pidraft.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CVAnalysisResultDto {
    private double score;
    private String decision; // ACCEPT, REJECT, REVIEW
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private List<String> explanation;
    private int experienceYears;
    private String educationLevel;
    private double experienceScore;
    private double skillsScore;
    private double educationScore;
}
