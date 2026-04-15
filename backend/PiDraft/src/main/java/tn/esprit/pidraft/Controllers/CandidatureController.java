package tn.esprit.pidraft.Controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.pidraft.Services.CandidatureService;
import tn.esprit.pidraft.entities.Candidature;
import tn.esprit.pidraft.entities.StatutCandidature;

import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping({"/candidature", "/api/candidature"})
@RequiredArgsConstructor
public class CandidatureController {

    private final CandidatureService service;

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
}
