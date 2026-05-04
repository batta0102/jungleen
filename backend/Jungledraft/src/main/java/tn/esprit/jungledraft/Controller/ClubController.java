package tn.esprit.jungledraft.Controller;


import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungledraft.Entities.Club;
import tn.esprit.jungledraft.Services.ClubService;

import java.util.Map;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/clubs")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;


    @PostMapping
    public ResponseEntity<?> create(@RequestBody Club club) {
        try {
            return ResponseEntity.ok(clubService.create(club));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }


    @GetMapping
    public ResponseEntity<List<Club>> getAll() {
        return ResponseEntity.ok(clubService.getAll());
    }


    @GetMapping("/{id}")
    public ResponseEntity<Club> getById(@PathVariable Long id) {
        Optional<Club> club = clubService.getById(id);
        return club.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @GetMapping("/all/By-Owner/{id}")
    public List<Club> getAllClubsByOwner(@PathVariable("id") String ownerId){
        return clubService.getAllClubsByOwner(ownerId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Club club) {
        try {
            club.setIdClub(id);
            return ResponseEntity.ok(clubService.update(club));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
            clubService.delete(id);
            return ResponseEntity.ok().build();
    }
}
