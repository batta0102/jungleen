package tn.esprit.pidraft.Controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.dto.CVAnalysisResultDto;
import tn.esprit.pidraft.Services.CandidatureService;
import tn.esprit.pidraft.Services.CVParserService;
import tn.esprit.pidraft.Services.ScoringService;
import tn.esprit.pidraft.entities.Candidature;
import tn.esprit.pidraft.entities.StatutCandidature;

import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping({"/candidature", "/api/candidature"})
@RequiredArgsConstructor
public class CandidatureController {

    private final CandidatureService service;
    private final CVParserService cvParserService;
    private final ScoringService scoringService;

    @PostMapping("/add")
    public Candidature add(
            @RequestBody Candidature c){

        return service.add(c);
    }

    @GetMapping("/all")
    public List<Candidature> getAll(){
        return service.getAll();
    }

    @GetMapping("/{id}")
    public Candidature getById(
            @PathVariable Long id){

        return service.getById(id);
    }

    @PutMapping("/update/{id}")
    public Candidature update(
            @PathVariable Long id,
            @RequestBody Candidature c){

        return service.update(id,c);
    }

    @PutMapping("/statut/{id}")
    public Candidature updateStatut(
            @PathVariable Long id,
            @RequestParam StatutCandidature statut){

        return service.updateStatut(id,statut);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(
            @PathVariable Long id){

        service.delete(id);
    }

    @GetMapping("/{id}/download-cv")
    public ResponseEntity<ByteArrayResource> downloadCv(@PathVariable Long id) {
        Candidature candidature = service.getById(id);
        Candidature.CvData cvData = candidature.getCvData();
        
        if (cvData == null || !"file".equals(cvData.getType())) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            // Check if data is null or empty
            String data = cvData.getData();
            if (data == null || data.isEmpty()) {
                return ResponseEntity.internalServerError().build();
            }
            
            // Decode base64 data
            byte[] fileContent = Base64.getDecoder().decode(data);
            ByteArrayResource resource = new ByteArrayResource(fileContent);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + cvData.getName() + "\"")
                    .contentType(MediaType.parseMediaType(cvData.getMimeType()))
                    .contentLength(fileContent.length)
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/analyze-cv")
    public ResponseEntity<CVAnalysisResultDto> analyzeCv(@PathVariable Long id) {
        try {
            // Get candidature
            Candidature candidature = service.getById(id);
            if (candidature == null) {
                return ResponseEntity.notFound().build();
            }

            // Extract CV content
            String cvContent = extractCVContent(candidature);
            if (cvContent == null || cvContent.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            // Parse CV
            CVParserService.CVData parsedData = cvParserService.parseCV(cvContent);

            // Score candidature
            CVAnalysisResultDto result = scoringService.scoreCandidature(parsedData);

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private String extractCVContent(Candidature candidature) {
        Candidature.CvData cvData = candidature.getCvData();
        if (cvData == null) {
            return null;
        }

        // If CV is text data, return it directly
        if ("text".equals(cvData.getType())) {
            return cvData.getData();
        }

        // If CV is a file, try to extract text (simplified - just return filename as indicator)
        if ("file".equals(cvData.getType()) && cvData.getName() != null) {
            // In production, you would use Apache POI or similar to extract text from PDF/DOCX
            // For now, return a mock content based on filename patterns
            String content = String.format("%s ", cvData.getName());

            // Add some mock data based on parsing the filename
            if (cvData.getName().toLowerCase().contains("teacher")) {
                content += "Teacher. Teaching experience with 5 years. Bachelor degree in English. Skills: Teaching, Classroom Management, Communication.";
            } else {
                content += "Professional. Work experience. Degree in relevant field.";
            }

            return content;
        }

        return null;
    }
}
