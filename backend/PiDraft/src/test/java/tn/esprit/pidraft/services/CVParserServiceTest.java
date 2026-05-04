package tn.esprit.pidraft.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import tn.esprit.pidraft.Services.CVParserService;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("CVParserService - Tests parsing CV")
class CVParserServiceTest {

    private CVParserService cvParserService;

    @BeforeEach
    void setUp() {
        cvParserService = new CVParserService();
    }

    // ==================== TESTS EXTRACTION EXPÉRIENCE ====================

    @Test
    @DisplayName("Doit extraire 5 années d'expérience")
    void testExtractExperienceYears5() {
        String cv = "Professional Experience: 5 years in teaching";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertEquals(5, result.experienceYears);
    }

    @Test
    @DisplayName("Doit extraire 10+ années d'expérience")
    void testExtractExperiencePlus() {
        String cv = "Experience: 10+ years of professional work";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertEquals(10, result.experienceYears);
    }

    @Test
    @DisplayName("Doit extraire l'expérience en français")
    void testExtractExperienceFrench() {
        String cv = "Expérience: 7 ans dans l'enseignement";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertEquals(7, result.experienceYears);
    }

    @Test
    @DisplayName("Doit retourner 0 sans expérience")
    void testNoExperienceFound() {
        String cv = "Junior developer with no work experience";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertEquals(0, result.experienceYears);
    }

    @Test
    @DisplayName("Doit extraire la plus haute expérience mentionnée")
    void testExtractMaxExperience() {
        String cv = "First role: 2 years. Current role: 8 years experience";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertEquals(8, result.experienceYears);
    }

    // ==================== TESTS EXTRACTION ÉDUCATION ====================

    @Test
    @DisplayName("Doit identifier PhD")
    void testExtractPhD() {
        String cv = "Education: PhD in Computer Science from MIT";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertEquals("PhD", result.educationLevel);
    }

    @Test
    @DisplayName("Doit identifier Master")
    void testExtractMaster() {
        String cv = "Master's degree in Teaching and Learning";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertEquals("Master", result.educationLevel);
    }

    @Test
    @DisplayName("Doit identifier Bachelor")
    void testExtractBachelor() {
        String cv = "B.A. in English Literature";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertEquals("Bachelor", result.educationLevel);
    }

    @Test
    @DisplayName("Doit identifier Diploma")
    void testExtractDiploma() {
        String cv = "High school diploma and secondary education";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertEquals("Diploma", result.educationLevel);
    }

    @Test
    @DisplayName("Doit retourner Unknown si aucune éducation")
    void testUnknownEducation() {
        String cv = "No formal education mentioned";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertEquals("Unknown", result.educationLevel);
    }

    // ==================== TESTS EXTRACTION COMPÉTENCES ====================

    @Test
    @DisplayName("Doit extraire les compétences Java, Python, JavaScript")
    void testExtractTechSkills() {
        String cv = "Skills: Java, Python, JavaScript, React, SQL";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertTrue(result.skills.stream().anyMatch(s -> s.toLowerCase().contains("java")));
        assertTrue(result.skills.stream().anyMatch(s -> s.toLowerCase().contains("python")));
    }

    @Test
    @DisplayName("Doit extraire les compétences métier (Teaching)")
    void testExtractTeachingSkills() {
        String cv = "Experienced in classroom management and teaching";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertTrue(result.skills.stream().anyMatch(s -> s.toLowerCase().contains("teaching")));
    }

    @Test
    @DisplayName("Doit extraire les compétences soft")
    void testExtractSoftSkills() {
        String cv = "Excellent communication and leadership skills";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertTrue(result.skills.stream().anyMatch(s -> s.toLowerCase().contains("communication")));
    }

    @Test
    @DisplayName("Doit extraire les langues")
    void testExtractLanguages() {
        String cv = "Languages: English (fluent), French, Spanish";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertTrue(result.skills.stream().anyMatch(s -> s.toLowerCase().contains("english")));
    }

    @Test
    @DisplayName("Doit retourner ensemble vide sans compétences")
    void testNoSkillsFound() {
        String cv = "Generic CV without specific skills mentioned";
        CVParserService.CVData result = cvParserService.parseCV(cv);
        
        assertTrue(result.skills.isEmpty() || result.skills.size() == 0);
    }

    // ==================== TESTS DONNÉES NULL/VIDES ====================

    @Test
    @DisplayName("Doit gérer CV NULL")
    void testParseNullCV() {
        CVParserService.CVData result = cvParserService.parseCV(null);
        
        assertNotNull(result);
        assertEquals(0, result.experienceYears);
        assertEquals(true, result.educationLevel == null || result.educationLevel.equals("Unknown"));
        assertTrue(result.skills.isEmpty());
    }

    @Test
    @DisplayName("Doit gérer CV vide")
    void testParseEmptyCV() {
        CVParserService.CVData result = cvParserService.parseCV("");
        
        assertNotNull(result);
        assertEquals(0, result.experienceYears);
        assertTrue(result.skills.isEmpty());
    }

    @Test
    @DisplayName("Doit gérer CV avec seulement whitespace")
    void testParseWhitespaceCV() {
        CVParserService.CVData result = cvParserService.parseCV("   \n\t  ");
        
        assertNotNull(result);
        assertEquals(0, result.experienceYears);
    }
}
