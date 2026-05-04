package tn.esprit.jungledraft.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.esprit.jungledraft.DTO.ClubMembershipDTO;
import tn.esprit.jungledraft.Entities.ClubMembership;
import tn.esprit.jungledraft.Services.ClubMembershipService;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/memberships")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ClubMembershipController {

    private final ClubMembershipService clubMembershipService;

    @PostMapping
    public ResponseEntity<ClubMembershipDTO> create(@RequestBody ClubMembershipDTO dto) {
        ClubMembership membership = clubMembershipService.createFromDTO(dto);
        return ResponseEntity.ok(convertToDTO(membership));
    }

    @GetMapping
    public ResponseEntity<List<ClubMembershipDTO>> getAll() {
        List<ClubMembership> memberships = clubMembershipService.getAll();
        List<ClubMembershipDTO> dtos = memberships.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClubMembershipDTO> getById(@PathVariable Long id) {
        Optional<ClubMembership> membership = clubMembershipService.getById(id);
        return membership.map(m -> ResponseEntity.ok(convertToDTO(m)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-club/{idClub}")
    public ResponseEntity<List<ClubMembershipDTO>> getAllByIdClub(@PathVariable Long idClub){
        List<ClubMembership> memberships = clubMembershipService.getAllByIdClub(idClub);
        List<ClubMembershipDTO> dtos = memberships.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClubMembershipDTO> update(@PathVariable Long id, @RequestBody ClubMembershipDTO dto) {
        try {
            // Mettre à jour le statut uniquement
            ClubMembership membership = clubMembershipService.getById(id)
                    .orElseThrow(() -> new RuntimeException("Membership not found"));
            membership.setStatus(dto.getStatus());
            ClubMembership updated = clubMembershipService.update(membership);
            return ResponseEntity.ok(convertToDTO(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            clubMembershipService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Méthode utilitaire pour convertir Entity → DTO
    private ClubMembershipDTO convertToDTO(ClubMembership membership) {
        ClubMembershipDTO dto = new ClubMembershipDTO();
        dto.setIdInscription(membership.getIdInscription());
        dto.setDateInscription(membership.getDateInscription());
        dto.setStatus(membership.getStatus());
        dto.setUserId(membership.getUserId());

        if (membership.getClub() != null) {
            ClubMembershipDTO.ClubDTO clubDTO = new ClubMembershipDTO.ClubDTO();
            clubDTO.setIdClub(membership.getClub().getIdClub());
            clubDTO.setNom(membership.getClub().getNom());
            dto.setClub(clubDTO);
        }

        return dto;
    }
}