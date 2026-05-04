package tn.esprit.pidraft.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import jakarta.persistence.Id;

import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Entity

@Getter
@Setter
public class Candidature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate dateSoumission;
    
    @Column(length = 255)
    private String nom;
    
    @Column(length = 255)
    private String email;
    
    @Column(columnDefinition = "LONGTEXT")
    private String cv; // JSON string containing either file info or text content

    @Transient
    private CvData cvData; // Transient field for parsed CV data

    @Enumerated(EnumType.STRING)
    @Column(length = 50) // Ensure enough space for enum values
    private StatutCandidature statut;
    
    @Column(length = 1000)
    private String commentaireAdmin;
    @OneToOne
    private Resultat resultat;

    @ManyToOne
    @JoinColumn(name = "poste_id")
    @JsonIgnoreProperties({"candidatures"})
    private Poste poste;
    
    private Long userId; // Link to user-service

    // Helper method to get parsed CV data
    public CvData getCvData() {
        if (cvData != null) {
            return cvData;
        }
        if (cv != null && !cv.isEmpty()) {
            try {
                // Simple JSON parsing - in production, use proper JSON library
                cvData = parseCvData(cv);
            } catch (Exception e) {
                // Legacy format - treat as plain text
                cvData = new CvData("text", null, null, null, cv);
            }
        }
        return cvData;
    }

    private CvData parseCvData(String json) {
        // Simple JSON parser - in production, use Jackson or similar
        if (json.contains("\"type\":\"file\"")) {
            String name = extractJsonValue(json, "name");
            String mimeType = extractJsonValue(json, "mimeType");
            String sizeStr = extractJsonValue(json, "size");
            String data = extractJsonValue(json, "data");
            Long size = sizeStr != null ? Long.parseLong(sizeStr) : null;
            return new CvData("file", name, mimeType, size, data);
        } else {
            String content = extractJsonValue(json, "content");
            return new CvData("text", null, null, null, content);
        }
    }

    private String extractJsonValue(String json, String key) {
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);
        if (start == -1) return null;
        start += pattern.length();
        int end = json.indexOf("\"", start);
        return end == -1 ? null : json.substring(start, end);
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CvData {
        private String type; // "file" or "text"
        private String name;
        private String mimeType;
        private Long size;
        private String data; // base64 for files, content for text
    }
}
