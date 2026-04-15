package tn.esprit.pidraft.Services;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class CVParserService {

    public static class CVData {
        public int experienceYears;
        public String educationLevel;
        public Set<String> skills;
        public List<String> experiences;

        public CVData() {
            this.skills = new HashSet<>();
            this.experiences = new ArrayList<>();
        }
    }

    /**
     * Parse CV content and extract structured data
     */
    public CVData parseCV(String cvContent) {
        CVData data = new CVData();

        if (cvContent == null || cvContent.trim().isEmpty()) {
            return data;
        }

        String contentLower = cvContent.toLowerCase();

        // Extract experience years
        data.experienceYears = extractExperienceYears(contentLower);

        // Extract education level
        data.educationLevel = extractEducationLevel(contentLower);

        // Extract skills
        data.skills = extractSkills(contentLower);

        // Extract experiences
        data.experiences = extractExperiences(contentLower);

        return data;
    }

    private int extractExperienceYears(String content) {
        // Look for patterns like "5 years", "5+", "5 year", etc.
        List<Integer> years = new ArrayList<>();

        // Pattern: number + (years|year|ans|an|+)
        String[] tokens = content.split("\\s+");
        for (int i = 0; i < tokens.length - 1; i++) {
            try {
                int num = Integer.parseInt(tokens[i].replaceAll("[^0-9]", ""));
                String next = tokens[i + 1];
                if (next.matches("(year|years|an|ans|\\+).*")) {
                    years.add(num);
                }
            } catch (NumberFormatException ignored) {
            }
        }

        return years.stream().mapToInt(Integer::intValue).max().orElse(0);
    }

    private String extractEducationLevel(String content) {
        // Check for education keywords
        Map<String, String> educationPatterns = new LinkedHashMap<>();
        educationPatterns.put("phd|doctorate|doctoral", "PhD");
        educationPatterns.put("master|m\\.s|m\\.a", "Master");
        educationPatterns.put("bachelor|b\\.s|b\\.a|degree", "Bachelor");
        educationPatterns.put("diploma|secondary|high school", "Diploma");

        for (Map.Entry<String, String> entry : educationPatterns.entrySet()) {
            if (content.matches(".*\\b(" + entry.getKey() + ")\\b.*")) {
                return entry.getValue();
            }
        }

        return "Unknown";
    }

    private Set<String> extractSkills(String content) {
        Set<String> foundSkills = new HashSet<>();

        // Predefined skill list (common teaching and tech skills)
        String[] commonSkills = {
            "java", "python", "javascript", "typescript", "c#", "cpp", "go", "rust", "kotlin",
            "html", "css", "react", "angular", "vue", "nodejs", "express", "spring boot",
            "django", "flask", "fastapi", "sql", "mysql", "postgresql", "mongodb", "redis",
            "docker", "kubernetes", "aws", "azure", "gcp", "oop", "design patterns",
            "teaching", "classroom management", "curriculum development", "mentoring",
            "communication", "leadership", "problem solving", "critical thinking",
            "english", "french", "spanish", "german", "chinese",
            "agile", "scrum", "git", "rest api", "graphql", "microservices"
        };

        for (String skill : commonSkills) {
            if (content.contains(skill)) {
                foundSkills.add(formatSkill(skill));
            }
        }

        return foundSkills;
    }

    private List<String> extractExperiences(String content) {
        List<String> experiences = new ArrayList<>();

        // Look for job titles and roles
        String[] jobKeywords = {
            "teacher", "instructor", "professor", "lecturer", "developer", "engineer",
            "manager", "lead", "senior", "junior", "administrator", "coordinator",
            "specialist", "analyst", "consultant", "architect"
        };

        Set<String> foundExperiences = new HashSet<>();
        for (String keyword : jobKeywords) {
            if (content.contains(keyword)) {
                foundExperiences.add(capitalizeWords(keyword));
            }
        }

        experiences.addAll(foundExperiences);
        return experiences;
    }

    private String formatSkill(String skill) {
        return capitalizeWords(skill);
    }

    private String capitalizeWords(String text) {
        StringBuilder result = new StringBuilder();
        boolean capitalizeNext = true;

        for (char c : text.toCharArray()) {
            if (Character.isWhitespace(c)) {
                capitalizeNext = true;
                result.append(c);
            } else if (capitalizeNext) {
                result.append(Character.toUpperCase(c));
                capitalizeNext = false;
            } else {
                result.append(c);
            }
        }

        return result.toString();
    }
}
