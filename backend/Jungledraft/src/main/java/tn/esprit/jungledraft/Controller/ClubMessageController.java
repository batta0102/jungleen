package tn.esprit.jungledraft.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungledraft.DTO.CreateMessageDTO;
import tn.esprit.jungledraft.Entities.ClubMessage;
import tn.esprit.jungledraft.Services.ClubMessageService;
import tn.esprit.jungledraft.Services.MessageEpingleService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/clubMessages")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ClubMessageController {

    private final ClubMessageService clubMessageService;
    private final MessageEpingleService messageEpingleService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateMessageDTO request) {
        try {
            System.out.println("📥 Requête reçue: " + request);
            ClubMessage message = clubMessageService.createFromRequest(request);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<ClubMessage>> getAll() {
        return ResponseEntity.ok(clubMessageService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClubMessage> getById(@PathVariable Long id) {
        Optional<ClubMessage> message = clubMessageService.getById(id);
        return message.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all/By-Club/{id}")
    public List<ClubMessage> getAllByClub(@PathVariable Long id){
        return clubMessageService.getAllByClub(id);
    }

    @PutMapping("/like/{id}")
    public Integer likePost(@PathVariable Long id){
        return clubMessageService.likePost(id);
    }

    @PutMapping
    public ResponseEntity<ClubMessage> update(@RequestBody ClubMessage message) {
        try {
            return ResponseEntity.ok(clubMessageService.update(message));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            ClubMessage message = clubMessageService.getById(id)
                    .orElseThrow(() -> new RuntimeException("Message non trouvé"));

            // Dissocier le club avant suppression
            message.setClub(null);
            clubMessageService.update(message); // Sauvegarder la dissociation

            // Maintenant supprimer
            clubMessageService.delete(id);

            return ResponseEntity.ok("Message supprimé");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur: " + e.getMessage());
        }
    }


    @PostMapping("/{id}/epinger")
    public ResponseEntity<?> epinglerMessage(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        try {
            String raison = body != null ? body.get("raison") : null;
            ClubMessage message = messageEpingleService.epinglerManuellement(id, raison);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body("Erreur: " + e.getMessage());
        }
    }


    @DeleteMapping("/{id}/desepingler")
    public ResponseEntity<?> desepinglerMessage(@PathVariable Long id) {
        try {
            ClubMessage message = messageEpingleService.desepingler(id);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body("Erreur: " + e.getMessage());
        }
    }


    @GetMapping("/club/{clubId}/epingles")
    public ResponseEntity<List<ClubMessage>> getMessagesEpingle(@PathVariable Long clubId) {
        return ResponseEntity.ok(messageEpingleService.getMessagesEpingle(clubId));
    }


    @GetMapping("/club/{clubId}/peut-epinger")
    public ResponseEntity<Map<String, Object>> peutEpinger(@PathVariable Long clubId) {
        Map<String, Object> response = new HashMap<>();
        response.put("peutEpinger", messageEpingleService.peutEpingle(clubId));
        response.put("restantes", messageEpingleService.getEpingleRestantes(clubId));
        response.put("max", 3);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/test-auto-epingle/{clubId}")
    public ResponseEntity<String> testAutoEpinglage(@PathVariable Long clubId) {
        messageEpingleService.autoEpinglerMessagesViraux();
        return ResponseEntity.ok("✅ Auto-épinglage déclenché manuellement");
    }
}