package tn.esprit.jungledraft.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungledraft.DTO.CreateSessionDTO;
import tn.esprit.jungledraft.Entities.BuddyPair;
import tn.esprit.jungledraft.Entities.BuddySession;
import tn.esprit.jungledraft.Entities.SatisfactionLevel;
import tn.esprit.jungledraft.Entities.SessionStatus;
import tn.esprit.jungledraft.Repositories.BuddyPairRep;
import tn.esprit.jungledraft.Services.BuddySessionService;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import java.util.List;

@RestController
@RequestMapping("/api/buddySessions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BuddySessionController {

    private final BuddySessionService buddySessionService;
    private final BuddyPairRep buddyPairRepository;  // ← AJOUTER CETTE LIGNE


    @PostMapping
    public ResponseEntity<BuddySession> create(@RequestBody CreateSessionDTO sessionDTO) {  // ← CHANGER ICI
        try {
            System.out.println("========== CRÉATION DE SESSION ==========");
            System.out.println("📝 DTO reçu: " + sessionDTO);

            // Extraire l'ID du buddy pair
            Long buddyPairId = sessionDTO.getBuddyPair().getIdPair();
            System.out.println("✅ buddyPairId extrait: " + buddyPairId);

            // Récupérer le BuddyPair depuis la base
            BuddyPair buddyPair = buddyPairRepository.findById(buddyPairId)
                    .orElseThrow(() -> new RuntimeException("BuddyPair non trouvé avec id: " + buddyPairId));

            // Créer la nouvelle session
            BuddySession session = new BuddySession();
            session.setBuddyPair(buddyPair);

            // Formater la date
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            LocalDateTime dateTime = LocalDateTime.parse(sessionDTO.getDate(), formatter);
            session.setDate(dateTime);

            session.setDuree(sessionDTO.getDuree());
            session.setSujet(sessionDTO.getSujet());
            session.setNotes(sessionDTO.getNotes());
            session.setLieu(sessionDTO.getLieu());

            // Gérer le statut
            if (sessionDTO.getStatus() != null) {
                session.setStatus(SessionStatus.valueOf(sessionDTO.getStatus()));
            } else {
                session.setStatus(SessionStatus.PLANIFIEE);
            }

            session.setConfirmeParUtilisateur1(false);
            session.setConfirmeParUtilisateur2(false);

            System.out.println("📝 Entité BuddySession créée avec buddyPairId: " + session.getBuddyPair().getIdPair());

            // Sauvegarder
            BuddySession saved = buddySessionService.create(session);
            System.out.println("✅ Session sauvegardée avec id: " + saved.getIdSession());
            System.out.println("==========================================");

            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la création de la session:");
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<BuddySession>> getAll() {
        return ResponseEntity.ok(buddySessionService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BuddySession> getById(@PathVariable Long id) {
        return buddySessionService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<BuddySession> update(@PathVariable Long id, @RequestBody BuddySession session) {
        session.setIdSession(id);
        try {
            return ResponseEntity.ok(buddySessionService.update(session));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            buddySessionService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Endpoints métier
    @GetMapping("/buddyPair/{buddyPairId}")
    public ResponseEntity<List<BuddySession>> getByBuddyPair(@PathVariable Long buddyPairId) {
        return ResponseEntity.ok(buddySessionService.getSessionsByBuddyPair(buddyPairId));
    }

    @GetMapping("/buddyPair/{buddyPairId}/avenir")
    public ResponseEntity<List<BuddySession>> getSessionsAVenir(@PathVariable Long buddyPairId) {
        return ResponseEntity.ok(buddySessionService.getSessionsAVenir(buddyPairId));
    }

    @GetMapping("/buddyPair/{buddyPairId}/historique")
    public ResponseEntity<List<BuddySession>> getHistorique(@PathVariable Long buddyPairId) {
        return ResponseEntity.ok(buddySessionService.getHistoriqueSessions(buddyPairId));
    }

    @PostMapping("/{id}/confirm/{userId}")
    public ResponseEntity<BuddySession> confirmSession(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestParam SatisfactionLevel satisfaction) {
        return ResponseEntity.ok(buddySessionService.confirmerSession(id, userId, satisfaction));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<BuddySession>> getUpcomingSessions(@RequestParam Long buddyPairId) {
        return ResponseEntity.ok(buddySessionService.getUpcomingSessions(buddyPairId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<BuddySession>> getSessionHistory(@RequestParam Long buddyPairId) {
        return ResponseEntity.ok(buddySessionService.getSessionHistory(buddyPairId));
    }
}