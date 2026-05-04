package tn.esprit.jungledraft.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.jungledraft.Entities.*;
import tn.esprit.jungledraft.Repositories.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class CalendrierService {

    private final DisponibiliteRepository disponibiliteRepository;
    private final EvenementCalendrierRepository evenementRepository;
    private final BuddyPairRep buddyPairRepository;
    private final BuddySessionService sessionService;
    private final BuddySessionRep buddySessionRep;


    public List<Disponibilite> getDisponibilites(Long buddyPairId) {
        System.out.println("📅 Récupération des disponibilités pour buddyPairId: " + buddyPairId);
        return disponibiliteRepository.findByBuddyPairId(buddyPairId);
    }


    @Transactional
    public Disponibilite ajouterDisponibilite(Long buddyPairId, Long userId, LocalDateTime debut, LocalDateTime fin) {
        BuddyPair buddyPair = buddyPairRepository.findById(buddyPairId)
                .orElseThrow(() -> new RuntimeException("BuddyPair non trouvé"));

        Disponibilite dispo = new Disponibilite();
        dispo.setBuddyPair(buddyPair);
        dispo.setUserId(userId);
        dispo.setDebut(debut);
        dispo.setFin(fin);
        dispo.setRecurrent(false);

        return disponibiliteRepository.save(dispo);
    }


    @Transactional
    public void supprimerDisponibilite(Long id) {
        System.out.println("🗑️ Suppression de la disponibilité id: " + id);

        if (!disponibiliteRepository.existsById(id)) {
            throw new RuntimeException("Disponibilité non trouvée avec id: " + id);
        }
        disponibiliteRepository.deleteById(id);
        System.out.println("✅ Disponibilité supprimée");
    }


    public List<Disponibilite> getDisponibilitesParPeriode(Long buddyPairId, LocalDateTime debut, LocalDateTime fin) {
        System.out.println("📅 Récupération des disponibilités pour période - buddyPairId: " + buddyPairId);
        return disponibiliteRepository.findByBuddyPairIdAndDebutBetween(buddyPairId, debut, fin);
    }


    public List<Disponibilite> getDisponibilitesUtilisateur(Long buddyPairId, Long userId) {
        System.out.println("📅 Récupération des disponibilités de l'utilisateur " + userId + " pour buddyPairId: " + buddyPairId);
        return disponibiliteRepository.findByBuddyPairIdAndUserId(buddyPairId, userId);
    }


    public List<LocalDateTime[]> getDisponibilitesCommunes(Long buddyPairId, int dureeMinutes) {
        System.out.println("🔍 RECHERCHE DES DISPONIBILITÉS COMMUNES");
        System.out.println("BuddyPairId: " + buddyPairId);
        System.out.println("Durée souhaitée: " + dureeMinutes + " minutes");

        BuddyPair buddyPair = buddyPairRepository.findById(buddyPairId)
                .orElseThrow(() -> new RuntimeException("BuddyPair non trouvé"));

        System.out.println("UserID_1: " + buddyPair.getUserID_1());
        System.out.println("UserID_2: " + buddyPair.getUserID_2());

        // Vérifiez d'abord toutes les disponibilités
        List<Disponibilite> toutes = disponibiliteRepository.findAll();
        System.out.println("📊 TOTAL DISPONIBILITÉS EN BASE: " + toutes.size());

        for (Disponibilite d : toutes) {
            System.out.println("  Dispo ID " + d.getId() +
                    " - User " + d.getUserId() +
                    " - BuddyPair " + d.getBuddyPair().getIdPair() +
                    " - " + d.getDebut() + " -> " + d.getFin());
        }


        List<Disponibilite> dispoUser1 = disponibiliteRepository
                .findByBuddyPairIdAndUserId(buddyPairId, buddyPair.getUserID_1());
        List<Disponibilite> dispoUser2 = disponibiliteRepository
                .findByBuddyPairIdAndUserId(buddyPairId, buddyPair.getUserID_2());

        System.out.println("📊 Disponibilités user1 trouvées: " + dispoUser1.size());
        System.out.println("📊 Disponibilités user2 trouvées: " + dispoUser2.size());


        for (Disponibilite d : dispoUser1) {
            System.out.println("  User1 dispo: " + d.getDebut() + " -> " + d.getFin());
        }
        for (Disponibilite d : dispoUser2) {
            System.out.println("  User2 dispo: " + d.getDebut() + " -> " + d.getFin());
        }

        List<LocalDateTime[]> creneauxCommuns = new ArrayList<>();

        for (Disponibilite d1 : dispoUser1) {
            for (Disponibilite d2 : dispoUser2) {
                LocalDateTime debutCommun = d1.getDebut().isAfter(d2.getDebut()) ? d1.getDebut() : d2.getDebut();
                LocalDateTime finCommun = d1.getFin().isBefore(d2.getFin()) ? d1.getFin() : d2.getFin();

                long dureeDispo = java.time.Duration.between(debutCommun, finCommun).toMinutes();
                System.out.println("Test intersection: " + debutCommun + " - " + finCommun + " (" + dureeDispo + " min)");

                if (dureeDispo >= dureeMinutes) {
                    creneauxCommuns.add(new LocalDateTime[]{debutCommun, finCommun});
                    System.out.println("✅ Créneau VALIDE trouvé!");
                }
            }
        }

        System.out.println("🎯 TOTAL CRÉNEAUX TROUVÉS: " + creneauxCommuns.size());
        return creneauxCommuns;
    }


    public List<LocalDateTime> suggererCreneaux(Long buddyPairId, int dureeMinutes) {
        System.out.println("💡 Génération de suggestions pour buddyPairId: " + buddyPairId + ", durée: " + dureeMinutes + "min");

        List<LocalDateTime[]> dispoCommunes = getDisponibilitesCommunes(buddyPairId, dureeMinutes);

        List<LocalDateTime> suggestions = dispoCommunes.stream()
                .map(interval -> interval[0]) // Prend le début de chaque interval
                .limit(5) // Limite à 5 suggestions
                .collect(Collectors.toList());

        System.out.println("💡 Suggestions générées: " + suggestions.size());
        return suggestions;
    }


    @Transactional
    public List<EvenementCalendrier> getRappelsAEnvoyer() {
        System.out.println("🔔 Vérification des rappels à envoyer");
        LocalDateTime maintenant = LocalDateTime.now();
        LocalDateTime limite = maintenant.plusMonths(1); // Rappels pour le mois à venir

        List<EvenementCalendrier> rappels = evenementRepository
                .findByRappelEnvoyeFalseAndDateDebutBetween(maintenant, limite);

        System.out.println("🔔 Rappels trouvés: " + rappels.size());
        return rappels;
    }


    @Transactional
    public void marquerRappelEnvoye(Long evenementId) {
        System.out.println("📨 Marquage du rappel " + evenementId + " comme envoyé");

        EvenementCalendrier evenement = evenementRepository.findById(evenementId)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé avec id: " + evenementId));

        evenement.setRappelEnvoye(true);
        evenementRepository.save(evenement);
        System.out.println("✅ Rappel marqué comme envoyé");
    }


    @Transactional
    public EvenementCalendrier creerEvenementPourSession(BuddySession session) {
        System.out.println("📅 Création d'un événement pour la session " + session.getIdSession());

        EvenementCalendrier evenement = new EvenementCalendrier();
        evenement.setBuddyPair(session.getBuddyPair());
        evenement.setTitre("Session avec l'utilisateur " + session.getBuddyPair().getUserID_2());
        evenement.setDescription(session.getSujet());

        // ✅ Si session.getDate() est déjà LocalDateTime
        LocalDateTime dateDebut = session.getDate();  // ← Conversion automatique

        evenement.setDateDebut(dateDebut);
        evenement.setDateFin(dateDebut.plusMinutes(session.getDuree()));
        evenement.setType(TypeEvenement.SESSION);
        evenement.setSessionId(session.getIdSession());
        evenement.setRappelEnvoye(false);

        EvenementCalendrier saved = evenementRepository.save(evenement);
        System.out.println("✅ Événement créé avec id: " + saved.getId());
        return saved;
    }

    public List<EvenementCalendrier> getEvenementsEntre(LocalDateTime debut, LocalDateTime fin) {
        System.out.println("📅 Recherche des événements entre " + debut + " et " + fin);
        return evenementRepository.findByDateDebutBetween(debut, fin);
    }
    @Transactional
    public EvenementCalendrier mettreAJourEvenement(EvenementCalendrier evenement) {
        System.out.println("📝 Mise à jour de l'événement " + evenement.getId());
        return evenementRepository.save(evenement);
    }
}