package tn.esprit.pidraft.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import tn.esprit.pidraft.Services.ScoringService;
import tn.esprit.pidraft.Services.CVParserService;
import tn.esprit.pidraft.dto.CVAnalysisResultDto;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ScoringService - Tests métier complexes")
class ScoringServiceTest {

    private ScoringService scoringService;

    @BeforeEach
    void setUp() {
        scoringService = new ScoringService();
    }

    // ==================== TESTS LOGIQUE MÉTIER ====================

    @Test
    @DisplayName("Doit scorer correctement un candidat avec 3+ ans d'expérience")
    void testScoreExperienceWithExpectedYears() {
        CVParserService.CVData data = new CVParserService.CVData();
        data.experienceYears = 3;
        data.educationLevel = "Master";
        data.skills = new HashSet<>(Arrays.asList("Teaching", "Communication"));

        CVAnalysisResultDto result = scoringService.scoreCandidature(data);

        assertEquals(100.0, result.getExperienceScore(), 0.01);
    }

    @Test
    @DisplayName("Doit scorer correctement un candidat avec 1-2 ans d'expérience")
    void testScoreExperiencePartial() {
        CVParserService.CVData data = new CVParserService.CVData();
        data.experienceYears = 2;
        data.educationLevel = "Bachelor";
        data.skills = new HashSet<>(Arrays.asList("Teaching"));

        CVAnalysisResultDto result = scoringService.scoreCandidature(data);

        assertTrue(result.getExperienceScore() > 0 && result.getExperienceScore() < 100);
        assertEquals(66.67, result.getExperienceScore(), 0.01);
    }

    @Test
    @DisplayName("Doit scorer correctement sans expérience")
    void testScoreExperienceZero() {
        CVParserService.CVData data = new CVParserService.CVData();
        data.experienceYears = 0;
        data.educationLevel = "Bachelor";
        data.skills = new HashSet<>();

        CVAnalysisResultDto result = scoringService.scoreCandidature(data);

        assertEquals(0.0, result.getExperienceScore());
    }

    @Test
    @DisplayName("Doit scorer correctement les niveaux d'éducation")
    void testScoreEducationLevels() {
        testEducationLevel("PhD", 100.0);
        testEducationLevel("Master", 90.0);
        testEducationLevel("Bachelor", 80.0);
        testEducationLevel("Diploma", 60.0);
        testEducationLevel("Unknown", 20.0);
    }

    private void testEducationLevel(String level, double expectedScore) {
        CVParserService.CVData data = new CVParserService.CVData();
        data.experienceYears = 5;
        data.educationLevel = level;
        data.skills = new HashSet<>(Arrays.asList("Teaching"));

        CVAnalysisResultDto result = scoringService.scoreCandidature(data);

        assertEquals(expectedScore, result.getEducationScore(), 0.01);
    }

    @Test
    @DisplayName("Doit calculer le score pondéré correctement")
    void testWeightedScoreCalculation() {
        CVParserService.CVData data = new CVParserService.CVData();
        data.experienceYears = 5;  // 100.0 * 0.40 = 40.0  
        data.educationLevel = "Bachelor"; // 80.0 * 0.20 = 16.0
        data.skills = new HashSet<>(Arrays.asList("Teaching", "Communication")); // skills score

        CVAnalysisResultDto result = scoringService.scoreCandidature(data);

        // score = 40 + 16 + (skills * 0.40)
        assertTrue(result.getScore() >= 40.0);
        assertTrue(result.getScore() <= 100.0);
    }

    @Test
    @DisplayName("Doit décider ACCEPT pour score >= 70")
    void testDecisionAccept() {
        CVParserService.CVData data = new CVParserService.CVData();
        data.experienceYears = 5;
        data.educationLevel = "Master";
        data.skills = new HashSet<>(Arrays.asList("Teaching", "Communication", "Classroom Management", "English"));

        CVAnalysisResultDto result = scoringService.scoreCandidature(data);

        assertEquals("ACCEPT", result.getDecision());
        assertTrue(result.getScore() >= 70.0);
    }

    @Test
    @DisplayName("Doit décider REJECT pour score < 40")
    void testDecisionReject() {
        CVParserService.CVData data = new CVParserService.CVData();
        data.experienceYears = 0;
        data.educationLevel = "Unknown";
        data.skills = new HashSet<>();

        CVAnalysisResultDto result = scoringService.scoreCandidature(data);

        assertEquals("REJECT", result.getDecision());
        assertTrue(result.getScore() < 40.0);
    }

    @Test
    @DisplayName("Doit décider REVIEW pour score entre 40 et 70")
    void testDecisionReview() {
        CVParserService.CVData data = new CVParserService.CVData();
        data.experienceYears = 2;
        data.educationLevel = "Master";
        data.skills = new HashSet<>(Arrays.asList("Teaching", "Communication"));

        CVAnalysisResultDto result = scoringService.scoreCandidature(data);

        assertEquals("REVIEW", result.getDecision());
        assertTrue(result.getScore() > 40.0 && result.getScore() < 70.0);
    }

    @Test
    @DisplayName("Doit matcher les compétences correctement")
    void testSkillsMatching() {
        CVParserService.CVData data = new CVParserService.CVData();
        data.experienceYears = 3;
        data.educationLevel = "Master";
        data.skills = new HashSet<>(Arrays.asList("teaching", "communication", "ENGLISH"));

        CVAnalysisResultDto result = scoringService.scoreCandidature(data);

        assertTrue(result.getMatchedSkills().size() > 0);
        assertTrue(result.getMatchedSkills().contains("Teaching"));
    }

    @Test
    @DisplayName("Doit identifier les compétences manquantes")
    void testMissingSkills() {
        CVParserService.CVData data = new CVParserService.CVData();
        data.experienceYears = 3;
        data.educationLevel = "Master";
        data.skills = new HashSet<>(Arrays.asList("Teaching"));

        CVAnalysisResultDto result = scoringService.scoreCandidature(data);

        assertTrue(result.getMissingSkills().size() > 0);
        assertTrue(result.getMissingSkills().contains("Classroom Management"));
    }

    @Test
    @DisplayName("Doit générer une explication détaillée")
    void testExplanationGeneration() {
        CVParserService.CVData data = new CVParserService.CVData();
        data.experienceYears = 5;
        data.educationLevel = "Master";
        data.skills = new HashSet<>(Arrays.asList("Teaching", "Communication"));
        data.experiences.add("English Teacher");

        CVAnalysisResultDto result = scoringService.scoreCandidature(data);

        assertNotNull(result.getExplanation());
        assertTrue(result.getExplanation().size() > 0);
        assertTrue(result.getExplanation().stream()
            .anyMatch(exp -> exp.contains("5") && exp.contains("years")));
    }

    @Test
    @DisplayName("Doit gérer les données NULL ou vides")
    void testNullAndEmptyData() {
        CVParserService.CVData data = new CVParserService.CVData();
        data.experienceYears = 0;
        data.educationLevel = "Unknown";
        data.skills = new HashSet<>();
        data.experiences = new ArrayList<>();

        CVAnalysisResultDto result = scoringService.scoreCandidature(data);

        assertNotNull(result);
        assertEquals("REJECT", result.getDecision());
        assertTrue(result.getScore() < 40.0);
    }
}
