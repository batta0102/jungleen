package tn.esprit.jungledraft.Services;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.jungledraft.Entities.BuddyPair;
import tn.esprit.jungledraft.Entities.BuddyMatchStatus;
import tn.esprit.jungledraft.Repositories.BuddyPairRep;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class BuddyService {

    private final BuddyPairRep buddyPairRepository;

    public BuddyPair create(BuddyPair buddyPair) {
        if (buddyPair.getUserID_1().equals(buddyPair.getUserID_2())) {
            throw new RuntimeException("userID_1 and userID_2 must be different");
        }
        buddyPair.setDateCreation(Date.valueOf(LocalDate.now()));
        buddyPair.setStatus(BuddyMatchStatus.PENDING);
        buddyPair.setActif(false);
        buddyPair.setSessionsPlanifiees(0);
        buddyPair.setSessionsRealisees(0);
        return buddyPairRepository.save(buddyPair);
    }

    public List<BuddyPair> getAll() {
        return buddyPairRepository.findAll();
    }

    public Optional<BuddyPair> getById(Long id) {
        return buddyPairRepository.findById(id);
    }

    public BuddyPair update(BuddyPair buddyPair) {
        Optional<BuddyPair> existing = buddyPairRepository.findById(buddyPair.getIdPair());
        if (existing.isPresent()) {
            BuddyPair toUpdate = existing.get();
            toUpdate.setUserID_1(buddyPair.getUserID_1());
            toUpdate.setUserID_2(buddyPair.getUserID_2());
            toUpdate.setClub(buddyPair.getClub());
            toUpdate.setNiveauCible(buddyPair.getNiveauCible());
            toUpdate.setActif(buddyPair.isActif());
            toUpdate.setStatus(buddyPair.getStatus());
            toUpdate.setDateDebut(buddyPair.getDateDebut());
            toUpdate.setDateFin(buddyPair.getDateFin());
            return buddyPairRepository.save(toUpdate);
        } else {
            throw new RuntimeException("BuddyPair not found with id " + buddyPair.getIdPair());
        }
    }

    public void delete(Long id) {
        Optional<BuddyPair> existing = buddyPairRepository.findById(id);
        if (existing.isPresent()) {
            buddyPairRepository.deleteById(id);
        } else {
            throw new RuntimeException("BuddyPair not found with id " + id);
        }
    }

    // === MÉTHODES MÉTIER SIMPLES ===

    public List<BuddyPair> getBuddiesByClub(Long clubId) {
        return buddyPairRepository.findAll().stream()
                .filter(bp -> bp.getClub() != null && bp.getClub().getIdClub().equals(clubId))
                .collect(Collectors.toList());
    }

    public List<BuddyPair> getActiveBuddiesByClub(Long clubId) {
        return getBuddiesByClub(clubId).stream()
                .filter(BuddyPair::isActif)
                .collect(Collectors.toList());
    }

    public List<BuddyPair> getPendingBuddiesByClub(Long clubId) {
        return getBuddiesByClub(clubId).stream()
                .filter(bp -> bp.getStatus() == BuddyMatchStatus.PENDING)
                .collect(Collectors.toList());
    }

    public List<BuddyPair> getBuddiesForUser(Long userId) {
        return buddyPairRepository.findAll().stream()
                .filter(bp -> bp.getUserID_1().equals(userId) || bp.getUserID_2().equals(userId))
                .collect(Collectors.toList());
    }

    public List<BuddyPair> getActiveBuddiesForUser(Long userId, Long clubId) {
        return getBuddiesByClub(clubId).stream()
                .filter(bp -> bp.isActif() && (bp.getUserID_1().equals(userId) || bp.getUserID_2().equals(userId)))
                .collect(Collectors.toList());
    }

    public void accepterDemande(Long buddyPairId) {
        BuddyPair bp = getById(buddyPairId).orElseThrow(() -> new RuntimeException("BuddyPair not found"));
        bp.setActif(true);
        bp.setStatus(BuddyMatchStatus.ACTIVE);
        bp.setDateDebut(Date.valueOf(LocalDate.now()));
        buddyPairRepository.save(bp);
    }

    public void refuserDemande(Long buddyPairId) {
        BuddyPair bp = getById(buddyPairId).orElseThrow(() -> new RuntimeException("BuddyPair not found"));
        bp.setStatus(BuddyMatchStatus.CANCELLED);
        buddyPairRepository.save(bp);
    }

    public boolean canBeBuddies(Long user1Id, Long user2Id, Long clubId) {
        return getActiveBuddiesByClub(clubId).stream()
                .noneMatch(bp -> (bp.getUserID_1().equals(user1Id) && bp.getUserID_2().equals(user2Id)) ||
                        (bp.getUserID_1().equals(user2Id) && bp.getUserID_2().equals(user1Id)));
    }

    @Transactional
    public void terminateBuddyPair(Long id) {
        BuddyPair buddyPair = buddyPairRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("BuddyPair not found with id " + id));

        // Vérifier que le buddy est actif
        if (buddyPair.getStatus() != BuddyMatchStatus.ACTIVE) {
            throw new RuntimeException("Cannot terminate a buddy pair that is not active");
        }

        buddyPair.setStatus(BuddyMatchStatus.COMPLETED);
        buddyPair.setActif(false);
        buddyPair.setDateFin(new Date(System.currentTimeMillis()));

        buddyPairRepository.save(buddyPair);
    }
}