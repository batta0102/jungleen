package tn.esprit.pidraft.Services;

import org.springframework.stereotype.Service;
import tn.esprit.pidraft.dto.CVAnalysisResultDto;

import java.util.*;

@Service
public class ScoringService {

    // Weights for scoring
    private static final double EXPERIENCE_WEIGHT = 0.40;
    private static final double SKILLS_WEIGHT = 0.40;
    private static final double EDUCATION_WEIGHT = 0.20;

    // Thresholds
    private static final double ACCEPT_THRESHOLD = 70.0;
    private static final double REJECT_THRESHOLD = 40.0;

    // Expected requirements
    private static final int EXPECTED_EXPERIENCE_YEARS = 3;
    private static final String[] EXPECTED_SKILLS = {
        "Teaching", "Classroom Management", "Communication", "English"
    };
    private static final Set<String> EXPECTED_EDUCATION = new HashSet<>(
        Arrays.asList("Bachelor", "Master", "PhD")
    );

    public CVAnalysisResultDto scoreCandidature(CVParserService.CVData parsedData) {
        CVAnalysisResultDto result = new CVAnalysisResultDto();

        // Calculate individual scores
        double experienceScore = scoreExperience(parsedData.experienceYears);
        double educationScore = scoreEducation(parsedData.educationLevel);
        double skillsScore = scoreSkills(parsedData.skills);

        // Calculate weighted total score
        double finalScore = (experienceScore * EXPERIENCE_WEIGHT) +
                           (skillsScore * SKILLS_WEIGHT) +
                           (educationScore * EDUCATION_WEIGHT);

        // Round to 2 decimals
        finalScore = Math.round(finalScore * 100.0) / 100.0;

        // Set scores
        result.setExperienceScore(experienceScore);
        result.setEducationScore(educationScore);
        result.setSkillsScore(skillsScore);
        result.setScore(finalScore);

        // Determine decision
        String decision = determineDecision(finalScore);
        result.setDecision(decision);

        // Extract matched and missing skills
        Set<String> matched = findMatchedSkills(parsedData.skills);
        Set<String> missing = findMissingSkills(parsedData.skills);
        result.setMatchedSkills(new ArrayList<>(matched));
        result.setMissingSkills(new ArrayList<>(missing));

        // Generate explanation
        result.setExplanation(generateExplanation(parsedData, result));

        // Set parsed data summaries
        result.setExperienceYears(parsedData.experienceYears);
        result.setEducationLevel(parsedData.educationLevel);

        return result;
    }

    private double scoreExperience(int yearsOfExperience) {
        if (yearsOfExperience >= EXPECTED_EXPERIENCE_YEARS) {
            return 100.0;
        } else if (yearsOfExperience >= 1) {
            return (yearsOfExperience / (double) EXPECTED_EXPERIENCE_YEARS) * 100.0;
        } else if (yearsOfExperience > 0) {
            return 50.0;
        }
        return 0.0;
    }

    private double scoreEducation(String educationLevel) {
        if ("PhD".equals(educationLevel)) {
            return 100.0;
        } else if ("Master".equals(educationLevel)) {
            return 90.0;
        } else if ("Bachelor".equals(educationLevel)) {
            return 80.0;
        } else if ("Diploma".equals(educationLevel)) {
            return 60.0;
        }
        return 20.0;
    }

    private double scoreSkills(Set<String> extractedSkills) {
        if (extractedSkills.isEmpty()) {
            return 0.0;
        }

        Set<String> matched = findMatchedSkills(extractedSkills);
        double matchPercentage = (matched.size() / (double) EXPECTED_SKILLS.length) * 100.0;

        // Cap at 100
        return Math.min(matchPercentage, 100.0);
    }

    private String determineDecision(double score) {
        if (score >= ACCEPT_THRESHOLD) {
            return "ACCEPT";
        } else if (score < REJECT_THRESHOLD) {
            return "REJECT";
        }
        return "REVIEW";
    }

    private Set<String> findMatchedSkills(Set<String> extractedSkills) {
        Set<String> matched = new HashSet<>();
        for (String expectedSkill : EXPECTED_SKILLS) {
            for (String extracted : extractedSkills) {
                if (extracted.equalsIgnoreCase(expectedSkill) ||
                    extracted.toLowerCase().contains(expectedSkill.toLowerCase())) {
                    matched.add(expectedSkill);
                    break;
                }
            }
        }
        return matched;
    }

    private Set<String> findMissingSkills(Set<String> extractedSkills) {
        Set<String> missing = new HashSet<>(Arrays.asList(EXPECTED_SKILLS));
        missing.removeAll(findMatchedSkills(extractedSkills));
        return missing;
    }

    private List<String> generateExplanation(CVParserService.CVData data, CVAnalysisResultDto result) {
        List<String> explanation = new ArrayList<>();

        // Experience explanation
        if (data.experienceYears > 0) {
            explanation.add(String.format("• %d years of professional experience", data.experienceYears));
        } else {
            explanation.add("• No clear experience years found in CV");
        }

        // Education explanation
        explanation.add(String.format("• Education level: %s", data.educationLevel));

        // Skills explanation
        if (!result.getMatchedSkills().isEmpty()) {
            explanation.add(String.format("• Matched skills: %s", String.join(", ", result.getMatchedSkills())));
        }

        if (!result.getMissingSkills().isEmpty()) {
            explanation.add(String.format("• Missing skills: %s", String.join(", ", result.getMissingSkills())));
        }

        // Overall score explanation
        explanation.add(String.format("• Overall score: %.1f/100", result.getScore()));

        // Relevant experience roles
        if (!data.experiences.isEmpty()) {
            explanation.add(String.format("• Career history includes: %s", String.join(", ", data.experiences)));
        }

        return explanation;
    }
}
