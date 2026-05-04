package tn.esprit.jungledraft.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungledraft.Entities.*;
import tn.esprit.jungledraft.Repositories.BuddyPairRep;
import tn.esprit.jungledraft.Repositories.EvenementCalendrierRepository;
import tn.esprit.jungledraft.Services.BuddyService;
import tn.esprit.jungledraft.Services.CalendrierService;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calendrier")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class CalendrierController {

    private final CalendrierService calendrierService;
    private final BuddyService buddyService;
    private final BuddyPairRep buddyPairRepository;  // ← Ajouté
    private final EvenementCalendrierRepository evenementRepository;  // ← Ajouté

    @GetMapping("/disponibilites/{buddyPairId}")
    public ResponseEntity<List<Disponibilite>> getDisponibilites(@PathVariable Long buddyPairId) {
        return ResponseEntity.ok(calendrierService.getDisponibilites(buddyPairId));
    }

    @PostMapping("/disponibilites/{buddyPairId}")
    public ResponseEntity<Disponibilite> ajouterDisponibilite(
            @PathVariable Long buddyPairId,
            @RequestParam Long userId,
            @RequestParam String debut,
            @RequestParam String fin) {
        try {
            System.out.println("📥 Date reçue - debut: " + debut);
            System.out.println("📥 Date reçue - fin: " + fin);

            // ✅ Solution robuste avec Instant
            Instant debutInstant = Instant.parse(debut);
            Instant finInstant = Instant.parse(fin);

            LocalDateTime debutDateTime = debutInstant.atZone(ZoneId.systemDefault()).toLocalDateTime();
            LocalDateTime finDateTime = finInstant.atZone(ZoneId.systemDefault()).toLocalDateTime();

            Disponibilite dispo = calendrierService.ajouterDisponibilite(
                    buddyPairId, userId, debutDateTime, finDateTime);

            return ResponseEntity.ok(dispo);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/suggestions/{buddyPairId}")
    public ResponseEntity<List<LocalDateTime>> getSuggestions(
            @PathVariable Long buddyPairId,
            @RequestParam int dureeMinutes) {
        return ResponseEntity.ok(calendrierService.suggererCreneaux(buddyPairId, dureeMinutes));
    }

    @GetMapping("/rappels")
    public ResponseEntity<List<EvenementCalendrier>> getRappels() {
        return ResponseEntity.ok(calendrierService.getRappelsAEnvoyer());
    }

    @PostMapping("/rappels/{evenementId}/envoyer")
    public ResponseEntity<Void> marquerRappelEnvoye(@PathVariable Long evenementId) {
        calendrierService.marquerRappelEnvoye(evenementId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/disponibilites/{id}")
    public ResponseEntity<Void> supprimerDisponibilite(@PathVariable Long id) {
        try {
            calendrierService.supprimerDisponibilite(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/rappels")
    public ResponseEntity<EvenementCalendrier> creerRappel(@RequestBody Map<String, Object> payload) {
        try {
            Long buddyPairId = Long.valueOf(payload.get("buddyPairId").toString());
            String titre = payload.get("titre").toString();
            String description = payload.get("description").toString();
            LocalDateTime dateDebut = LocalDateTime.parse(payload.get("dateDebut").toString());
            String type = payload.get("type").toString();

            BuddyPair buddyPair = buddyPairRepository.findById(buddyPairId)
                    .orElseThrow(() -> new RuntimeException("BuddyPair non trouvé"));

            EvenementCalendrier evenement = new EvenementCalendrier();
            evenement.setBuddyPair(buddyPair);
            evenement.setTitre(titre);
            evenement.setDescription(description);
            evenement.setDateDebut(dateDebut);
            evenement.setDateFin(dateDebut.plusHours(1)); // Durée par défaut 1h
            evenement.setType(TypeEvenement.valueOf(type));
            evenement.setRappelEnvoye(false);

            EvenementCalendrier saved = evenementRepository.save(evenement);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

}