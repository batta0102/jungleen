package tn.esprit.jungledraft.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungledraft.Entities.BuddyPair;
import tn.esprit.jungledraft.Services.BuddyService;

import java.util.List;

@RestController
@RequestMapping("/api/buddyPairs")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BuddyPairController {

    private final BuddyService buddyService;

    @PostMapping
    public ResponseEntity<BuddyPair> create(@RequestBody BuddyPair buddyPair) {
        return ResponseEntity.ok(buddyService.create(buddyPair));
    }

    @GetMapping
    public ResponseEntity<List<BuddyPair>> getAll() {
        return ResponseEntity.ok(buddyService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BuddyPair> getById(@PathVariable Long id) {
        return buddyService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<BuddyPair> update(@PathVariable Long id, @RequestBody BuddyPair buddyPair) {
        buddyPair.setIdPair(id);
        try {
            return ResponseEntity.ok(buddyService.update(buddyPair));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            buddyService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Endpoints métier
    @GetMapping("/club/{clubId}")
    public ResponseEntity<List<BuddyPair>> getByClub(@PathVariable Long clubId) {
        return ResponseEntity.ok(buddyService.getBuddiesByClub(clubId));
    }

    @GetMapping("/club/{clubId}/active")
    public ResponseEntity<List<BuddyPair>> getActiveByClub(@PathVariable Long clubId) {
        return ResponseEntity.ok(buddyService.getActiveBuddiesByClub(clubId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BuddyPair>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(buddyService.getBuddiesForUser(userId));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<Void> acceptDemande(@PathVariable Long id) {
        buddyService.accepterDemande(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> rejectDemande(@PathVariable Long id) {
        buddyService.refuserDemande(id);
        return ResponseEntity.ok().build();
    }
    @PutMapping("/{id}/terminate")
    public ResponseEntity<Void> terminateBuddyPair(@PathVariable Long id) {
        try {
            buddyService.terminateBuddyPair(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}