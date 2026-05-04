package tn.esprit.jungledraft.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.jungledraft.DTO.ClubMessageDTO;
import tn.esprit.jungledraft.DTO.CreateMessageDTO;
import tn.esprit.jungledraft.Entities.Club;
import tn.esprit.jungledraft.Entities.ClubMessage;
import tn.esprit.jungledraft.Repositories.ClubMessageRep;
import tn.esprit.jungledraft.Repositories.ClubRep;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClubMessageService {

    private final ClubMessageRep clubMessageRepository;
    private final ClubRep clubRepository;

    // Nouvelle méthode avec DTO
    public ClubMessage createFromDTO(ClubMessageDTO dto) {
        System.out.println("📥 Création message - userId: " + dto.getUserId() + ", clubId: " + dto.getClubId());

        if (dto.getClubId() == null) {
            throw new RuntimeException("ClubId ne peut pas être null");
        }

        Club club = clubRepository.findById(dto.getClubId())
                .orElseThrow(() -> new RuntimeException("Club not found with id: " + dto.getClubId()));

        ClubMessage message = new ClubMessage();
        message.setUserId(dto.getUserId());
        message.setContenu(dto.getContenu());
        message.setLikes(0);
        message.setDateEnvoi(new Date());
        message.setClub(club);

        return clubMessageRepository.save(message);
    }

    public ClubMessage createFromRequest(CreateMessageDTO request) {
        // Récupérer le club
        Club club = clubRepository.findById(request.getClubId())
                .orElseThrow(() -> new RuntimeException("Club non trouvé avec id: " + request.getClubId()));

        ClubMessage message = new ClubMessage();
        message.setContenu(request.getContenu());
        message.setUserId(request.getUserId());
        message.setClub(club);
        message.setLikes(0);
        message.setDateEnvoi(new Date());

        return clubMessageRepository.save(message);
    }

    public List<ClubMessage> getAll() {
        return clubMessageRepository.findAll();
    }

    public List<ClubMessage> getAllByClub(Long id) {
        System.out.println("🔍 Recherche des messages pour club ID: " + id);
        List<ClubMessage> messages = clubMessageRepository.findByClubId(id);
        System.out.println("📊 Messages trouvés: " + messages.size());
        return messages;
    }

    public Optional<ClubMessage> getById(Long id) {
        return clubMessageRepository.findById(id);
    }

    public ClubMessage update(ClubMessage message) {
        Optional<ClubMessage> existing = clubMessageRepository.findById(message.getIdMessage());
        if (existing.isPresent()) {
            ClubMessage toUpdate = existing.get();

            if (message.getContenu() != null && !message.getContenu().trim().isEmpty()) {
                toUpdate.setContenu(message.getContenu().trim());
            }
            if (message.getUserId() != null) {
                toUpdate.setUserId(message.getUserId());
            }
            if (message.getClub() != null && message.getClub().getIdClub() != null) {
                Club club = clubRepository.findById(message.getClub().getIdClub())
                        .orElseThrow(() -> new RuntimeException("Club non trouvé"));
                toUpdate.setClub(club);
            }
            toUpdate.setDateEnvoi(new Date());// Mettre à jour la date

            return clubMessageRepository.save(toUpdate);
        } else {
            throw new RuntimeException("ClubMessage non trouvé avec l'id " + message.getIdMessage());
        }
    }

    public Integer likePost(Long idMessage) {
        ClubMessage message = clubMessageRepository.findById(idMessage)
                .orElseThrow(() -> new RuntimeException("Message non trouvé avec l'id: " + idMessage));
        message.setLikes(message.getLikes() + 1);
        clubMessageRepository.save(message);
        System.out.println("❤️ Like ajouté au message " + idMessage + " - Total likes: " + message.getLikes());
        return message.getLikes();
    }

    public void delete(Long id) {
        if (!clubMessageRepository.existsById(id)) {
            throw new RuntimeException("ClubMessage non trouvé avec l'id " + id);
        }
        clubMessageRepository.deleteById(id);
        System.out.println("🗑️ Message " + id + " supprimé");
    }
}