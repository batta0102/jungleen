package tn.esprit.jungledraft.Services;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.jungledraft.DTO.ClubMembershipDTO;
import tn.esprit.jungledraft.Entities.Club;
import tn.esprit.jungledraft.Entities.ClubMembership;
import tn.esprit.jungledraft.Entities.InscriptionStatus;
import tn.esprit.jungledraft.Repositories.ClubMembershipRep;
import tn.esprit.jungledraft.Repositories.ClubRep;

import java.util.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClubMembershipService {

    private final ClubMembershipRep clubMembershipRepository;
    private final ClubRep clubRep;



    @Transactional
    public ClubMembership createFromDTO(ClubMembershipDTO dto) {
        // Vérifier que le club n'est pas null et qu'il a un idClub
        if (dto.getClub() == null || dto.getClub().getIdClub() == null) {
            throw new RuntimeException("ClubId cannot be null");
        }

        // Récupérer le club depuis la base de données en utilisant l'idClub du DTO
        Club club = clubRep.findById(dto.getClub().getIdClub())
                .orElseThrow(() -> new RuntimeException("Club not found with id: " + dto.getClub().getIdClub()));

        // Créer la nouvelle adhésion
        ClubMembership membership = new ClubMembership();
        membership.setUserId(dto.getUserId());
        membership.setDateInscription(new Date());
        membership.setStatus(dto.getStatus() != null ? dto.getStatus() : InscriptionStatus.EN_ATTENTE);
        membership.setClub(club);

        // Sauvegarder et retourner
        return clubMembershipRepository.save(membership);
    }

    public List<ClubMembership> getAll() {
        return clubMembershipRepository.findAll();
    }

    public Optional<ClubMembership> getById(Long id) {
        return clubMembershipRepository.findById(id);
    }

    public List<ClubMembership> getAllByIdClub(Long idClub){
        return clubMembershipRepository.findAllByClubIdClub(idClub);
    }

    public ClubMembership update(ClubMembership membership) {
        Optional<ClubMembership> existing = clubMembershipRepository.findById(membership.getIdInscription());
        if (existing.isPresent()) {
            ClubMembership toUpdate = existing.get();

            toUpdate.setStatus(membership.getStatus());
            toUpdate.setClub(membership.getClub());

            return clubMembershipRepository.save(toUpdate);
        } else {
            throw new RuntimeException("ClubMembership not found with id " + membership.getIdInscription());
        }
    }

    public void delete(Long id) {
        Optional<ClubMembership> existing = clubMembershipRepository.findById(id);
        if (existing.isPresent()) {
            clubMembershipRepository.deleteById(id);
        } else {
            throw new RuntimeException("ClubMembership not found with id " + id);
        }
    }
}