package tn.esprit.jungledraft.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.jungledraft.Entities.VocabulairePersonnel;
import tn.esprit.jungledraft.Repositories.VocabulaireRepository;
import tn.esprit.jungledraft.Services.OcrService;
import tn.esprit.jungledraft.Services.TranslationService;

import java.util.Date;
import java.util.Map;

@RestController
@RequestMapping("/api/vision")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@RequiredArgsConstructor
public class VisionController {

    private final OcrService ocrService;
    private final TranslationService translationService;
    private final VocabulaireRepository vocabulaireRepository;

    @PostMapping("/ocr")
    public ResponseEntity<?> extraireTexte(@RequestParam("photo") MultipartFile photo) {
        try {
            String texte = ocrService.extraireTexte(photo);
            return ResponseEntity.ok(Map.of(
                    "texte", texte,
                    "langue", "detectee"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/ocr/traduire")
    public ResponseEntity<?> extraireEtTraduire(@RequestParam("photo") MultipartFile photo) {
        try {
            String texte = ocrService.extraireTexte(photo);
            String traduction = translationService.traduireEnFrancais(texte);

            return ResponseEntity.ok(Map.of(
                    "texteOriginal", texte,
                    "traduction", traduction,
                    "langueSource", "en",
                    "langueCible", "fr"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/vocabulaire/ajouter")

    public ResponseEntity<?> ajouterMot(
            @RequestParam Long userId,
            @RequestParam Long clubId,
            @RequestParam String mot,
            @RequestParam String traduction) {

        // Chercher si le mot existe déjà
        VocabulairePersonnel existing = vocabulaireRepository
                .findByUserIdAndClubIdAndMot(userId, clubId, mot)
                .orElse(null);

        if (existing != null) {
            // Incrémenter le compteur
            existing.setFoisVu(existing.getFoisVu() + 1);
            existing.setDateDernierScan(new Date());
            vocabulaireRepository.save(existing);
        } else {
            // Créer nouvelle entrée
            VocabulairePersonnel nouveau = new VocabulairePersonnel();
            nouveau.setUserId(userId);
            nouveau.setClubId(clubId);
            nouveau.setMot(mot);
            nouveau.setTraduction(traduction);
            nouveau.setFoisVu(1);
            nouveau.setDateDernierScan(new Date());
            vocabulaireRepository.save(nouveau);
        }

        return ResponseEntity.ok(Map.of("message", "Mot ajouté au vocabulaire"));
    }

    @GetMapping("/vocabulaire/{userId}/{clubId}")

    public ResponseEntity<?> getVocabulaire(
            @PathVariable Long userId,
            @PathVariable Long clubId) {

        var vocabulaire = vocabulaireRepository
                .findByUserIdAndClubIdOrderByFoisVuDesc(userId, clubId);

        return ResponseEntity.ok(vocabulaire);
    }

    @DeleteMapping("/vocabulaire/{id}")
    public ResponseEntity<?> supprimerMot(@PathVariable Long id) {
        vocabulaireRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Mot supprimé du vocabulaire"));
    }
}